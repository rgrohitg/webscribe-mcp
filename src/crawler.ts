import { chromium, Browser, Page } from 'playwright';
import pLimit from 'p-limit';
import { extractMarkdownPristine } from './utils.js';
import { upsertDocument, upsertChunks, getCacheHeaders } from './db.js';
import { chunkMarkdown } from './chunker.js';
import { isAllowed, enforceCrawlDelay } from './robots.js';
import { discoverSitemapUrls } from './sitemap.js';
import { getProfile } from './profiles.js';
import { searchDocuments } from './db.js';

// ── Sub-tab expansion ──────────────────────────────────────────────────────────

const DEFAULT_SUB_TAB_SUFFIXES = ['/usage', '/examples', '/accessibility', '/api', '/props', '/code'];

function expandSubTabUrls(url: string, suffixes: string[] = DEFAULT_SUB_TAB_SUFFIXES): string[] {
    const normalised = url.replace(/\/$/, '');
    const alreadyHasSuffix = suffixes.some(s => normalised.endsWith(s));
    if (alreadyHasSuffix) return [];
    return suffixes.map(s => normalised + s);
}

// ── Hidden content reveal ──────────────────────────────────────────────────────

/**
 * Generically reveals hidden content (show-code buttons, collapsed details,
 * accordions) before extracting the page. Works across Docusaurus, MUI,
 * Salt DS, Storybook, Ant Design, Chakra, etc.
 */
async function revealHiddenContent(page: Page): Promise<void> {
    try {
        await page.$$eval('details:not([open])', (els) =>
            els.forEach((el) => el.setAttribute('open', ''))
        );

        const revealPattern =
            /^(show\s*(code|source|example|all|more)|expand|view\s*(code|source)|<>|\{\s*\}|toggle\s*code|see\s*(code|example))$/i;

        await page.evaluate((patternSrc) => {
            const pattern = new RegExp(patternSrc, 'i');
            const candidates = document.querySelectorAll(
                'button:not([disabled]), [role="button"]:not([disabled]), summary'
            );
            candidates.forEach((el) => {
                const text = (el.textContent ?? '').trim();
                const label = el.getAttribute('aria-label') ?? '';
                const title = el.getAttribute('title') ?? '';
                if (pattern.test(text) || pattern.test(label) || pattern.test(title)) {
                    (el as HTMLElement).click();
                }
            });
        }, revealPattern.source);

        await page.waitForTimeout(600);
    } catch {
        // Never abort the crawl due to content-reveal errors
    }
}

// ── Smart re-crawl check ───────────────────────────────────────────────────────

/**
 * Performs a HEAD request to check whether the remote resource has changed
 * since it was last crawled. Returns true if the page should be (re-)crawled.
 */
async function shouldCrawl(url: string, version: string): Promise<boolean> {
    const cached = getCacheHeaders(url, version);
    if (!cached) return true; // Never crawled before

    // If we have no cache signal, always re-crawl
    if (!cached.etag && !cached.last_modified) return true;

    try {
        const res = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return true;

        const remoteEtag = res.headers.get('etag');
        const remoteLastMod = res.headers.get('last-modified');

        if (remoteEtag && cached.etag) {
            return remoteEtag !== cached.etag;
        }
        if (remoteLastMod && cached.last_modified) {
            return remoteLastMod !== cached.last_modified;
        }
        return true; // Can't determine — re-crawl to be safe
    } catch {
        return true; // Network error — try to crawl anyway
    }
}

// ── Single page visitor ────────────────────────────────────────────────────────

/**
 * Visits a single URL with Playwright, waits for SPA hydration,
 * extracts markdown (using the matching site profile), stores the document
 * and its semantic chunks in the DB, and returns the markdown string.
 */
async function visitPage(
    page: Page,
    url: string,
    version: string,
): Promise<string | null> {
    try {
        // Check robots.txt compliance
        if (!(await isAllowed(url))) {
            process.stderr.write(`[crawler] Skipping (robots.txt disallows): ${url}\n`);
            return null;
        }

        // Enforce per-domain crawl delay
        await enforceCrawlDelay(url);

        // Smart re-crawl: skip if remote content is unchanged
        if (!(await shouldCrawl(url, version))) {
            process.stderr.write(`[crawler] Skipping (unchanged since last crawl): ${url}\n`);
            // Return the cached markdown content
            const { getDocument } = await import('./db.js');
            const cached = getDocument(url, version);
            return cached?.markdown ?? null;
        }

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => { });

        // Reveal hidden content (show-code buttons, accordions, details)
        await revealHiddenContent(page);

        const html = await page.content();

        // Get site-specific extraction profile
        const profile = getProfile(url);

        const markdown = extractMarkdownPristine(html, url, profile);

        // Skip near-empty pages (404s, redirects, empty tabs)
        if (markdown.trim().length < 50) return null;

        const title = await page.title();
        const domain = new URL(url).hostname;

        // Extract HTTP cache headers for smart re-crawl on future runs
        let etag: string | undefined;
        let lastModified: string | undefined;
        try {
            const headRes = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
            etag = headRes.headers.get('etag') ?? undefined;
            lastModified = headRes.headers.get('last-modified') ?? undefined;
        } catch { /* ignore — cache headers are best-effort */ }

        // Persist full document
        upsertDocument(url, version, domain, title, markdown, etag, lastModified);

        // Persist semantic chunks for FTS5 search
        const chunks = chunkMarkdown(markdown);
        if (chunks.length > 0) {
            upsertChunks(url, version, chunks);
        }

        process.stderr.write(
            `[crawler] ✓ ${url} (profile: ${profile.name}, chunks: ${chunks.length})\n`
        );
        return markdown;
    } catch (err) {
        process.stderr.write(`[crawler] Failed to visit ${url}: ${err}\n`);
        return null;
    }
}

// ── BFS Crawler ────────────────────────────────────────────────────────────────

/**
 * BFS crawler — starts from startUrl, follows same-hostname links up to maxPages.
 *
 * Enhancements:
 * - Tries sitemap.xml discovery first for more comprehensive URL seeding
 * - Respects robots.txt per-domain rules
 * - Enforces configurable crawl-delay between requests (default 500ms)
 * - Concurrent page visits using p-limit (concurrency: 3)
 * - Smart re-crawl: skips pages whose ETag/Last-Modified hasn't changed
 * - Expands sub-tab variants (/usage, /examples, etc.) for SPA docs
 *
 * @param startUrl   Absolute URL to begin from.
 * @param version    Documentation version label (e.g. 'latest', 'v18').
 * @param maxPages   Maximum pages to crawl before stopping.
 * @param urlGlob    Optional path filter (substring match against pathname).
 * @param expandTabs Whether to auto-enqueue sub-tab suffixes for every URL.
 * @returns Array of successfully crawled URLs.
 */
export async function runCrawler(
    startUrl: string,
    version: string = 'latest',
    maxPages: number = 10,
    urlGlob?: string,
    expandTabs: boolean = true,
): Promise<string[]> {
    const browser: Browser = await chromium.launch({ headless: true });
    const crawledUrls: string[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];

    const startHostname = new URL(startUrl).hostname;

    // ── Seed queue from sitemap.xml first ──────────────────────────────────────
    const pathFilter = urlGlob ? urlGlob.replace(/\*\*/g, '').replace(/\//g, '') : undefined;
    const sitemapUrls = await discoverSitemapUrls(startUrl, pathFilter);

    if (sitemapUrls.length > 0) {
        process.stderr.write(`[crawler] Sitemap found: seeding with ${sitemapUrls.length} URLs\n`);
        for (const u of sitemapUrls.slice(0, maxPages * 5)) {
            queue.push(u);
            if (expandTabs) expandSubTabUrls(u).forEach(t => queue.push(t));
        }
    }

    // Always include startUrl
    if (!visited.has(startUrl.replace(/\/$/, ''))) {
        queue.unshift(startUrl);
        if (expandTabs) expandSubTabUrls(startUrl).forEach(u => queue.push(u));
    }

    try {
        const page = await browser.newPage();

        // Process queue — one page at a time to respect sequential Playwright context
        // (concurrency happens at the outer tool level if multiple tools are used)
        while (queue.length > 0 && crawledUrls.length < maxPages) {
            const url = queue.shift()!;
            const normalised = url.replace(/\/$/, '');
            if (visited.has(normalised)) continue;
            visited.add(normalised);

            // Apply URL glob filter
            if (urlGlob) {
                const globPath = urlGlob.replace(/\*\*/g, '');
                if (!new URL(url).pathname.includes(globPath.replace(/\//g, ''))) continue;
            }

            const markdown = await visitPage(page, url, version);
            if (markdown) {
                crawledUrls.push(url);

                if (expandTabs) {
                    expandSubTabUrls(normalised).forEach(u => {
                        if (!visited.has(u)) queue.push(u);
                    });
                }

                // Discover same-hostname links on the page
                try {
                    const links: string[] = await page.$$eval('a[href]', (anchors) =>
                        anchors
                            .map((a) => (a as HTMLAnchorElement).href)
                            .filter((h) => h && !h.startsWith('javascript'))
                    );
                    for (const link of links) {
                        try {
                            const u = new URL(link);
                            if (u.hostname !== startHostname) continue;
                            const norm = u.href.replace(/\/$/, '');
                            if (visited.has(norm)) continue;
                            queue.push(u.href);
                        } catch { /* malformed URL */ }
                    }
                } catch { /* page navigated away */ }
            }
        }

        await page.close();
    } finally {
        await browser.close();
    }

    return crawledUrls;
}

// ── Component docs crawler ─────────────────────────────────────────────────────

/**
 * Smart component-docs crawler.
 *
 * Phase 1 — Opens the index page, discovers all component links one level deep.
 * Phase 2 — Crawls every component URL + all sub-tab variants with concurrency.
 *
 * Works generically for Salt DS, MUI, Ant Design, Chakra, Docusaurus, etc.
 */
export async function crawlComponentDocs(
    indexUrl: string,
    version: string = 'latest',
    maxPages: number = 200,
): Promise<string[]> {
    const browser: Browser = await chromium.launch({ headless: true });
    const crawledUrls: string[] = [];
    const visited = new Set<string>();

    try {
        const page = await browser.newPage();

        // ── Phase 1: Discover component URLs ──────────────────────────────────
        await page.goto(indexUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => { });

        const links: string[] = await page.$$eval('a[href]', (anchors) =>
            anchors
                .map((a) => (a as HTMLAnchorElement).href)
                .filter((h) => h && !h.startsWith('javascript'))
        );

        process.stderr.write(`[Phase 1] Found ${links.length} total links on index page\n`);

        const indexBase = new URL(indexUrl);
        const indexBasePath = indexBase.pathname.replace(/\/$/, '');

        const componentUrls = [...new Set(links.flatMap((href) => {
            try {
                const u = new URL(href);
                if (u.hostname !== indexBase.hostname) return [];
                let p = u.pathname.replace(/\/$/, '');
                if (p.endsWith('/index')) p = p.slice(0, -6);
                if (!p.startsWith(indexBasePath + '/')) return [];
                const remainder = p.slice(indexBasePath.length + 1);
                const segments = remainder.split('/').filter(Boolean);
                if (segments.length === 0 || segments.length > 2) return [];
                return [`${u.origin}${p}`];
            } catch {
                return [];
            }
        }))];

        process.stderr.write(`[Phase 1] Filtered to ${componentUrls.length} component URLs\n`);

        // Build the full crawl queue: component base + all sub-tabs
        const queue: string[] = [];
        for (const componentUrl of componentUrls) {
            if (!visited.has(componentUrl)) {
                queue.push(componentUrl);
            }
            for (const tabUrl of expandSubTabUrls(componentUrl)) {
                if (!visited.has(tabUrl)) queue.push(tabUrl);
            }
        }

        process.stderr.write(`[Phase 2] Crawl queue size: ${queue.length} URLs\n`);

        // ── Phase 2: Concurrent crawl ──────────────────────────────────────────
        // Playwright pages aren't cheaply shareable across concurrent tasks,
        // so we use a small fixed pool of 3 pages for concurrency.
        const CONCURRENCY = 3;
        const limit = pLimit(CONCURRENCY);
        const pages = await Promise.all(
            Array.from({ length: CONCURRENCY }, () => browser.newPage())
        );
        let pageIdx = 0;

        const tasks = queue.slice(0, maxPages * 2).map((url, i) =>
            limit(async () => {
                if (crawledUrls.length >= maxPages) return;
                const normalised = url.replace(/\/$/, '');
                if (visited.has(normalised)) return;
                visited.add(normalised);

                // Round-robin page assignment
                const pageToUse = pages[i % CONCURRENCY];
                const markdown = await visitPage(pageToUse, url, version);
                if (markdown) crawledUrls.push(url);
            })
        );

        await Promise.all(tasks);

        await Promise.all(pages.map(p => p.close()));
    } finally {
        await browser.close();
    }

    return crawledUrls;
}

// ── Single page extractor ──────────────────────────────────────────────────────

/**
 * Extracts and caches a single page without following links.
 * Returns the extracted Markdown string.
 */
export async function extractSinglePage(url: string, version: string = 'latest'): Promise<string> {
    const browser: Browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        const markdown = await visitPage(page, url, version) ?? '';
        await page.close();
        return markdown;
    } finally {
        await browser.close();
    }
}

// ── Local search ───────────────────────────────────────────────────────────────

/**
 * FTS5-powered search across all cached chunks.
 * Returns structured results ranked by BM25 relevance.
 */
export async function searchLocalDatasets(
    query: string,
    version?: string,
): Promise<Array<{ url: string; version: string; title: string; heading_path: string[]; content: string; score: number }>> {
    return searchDocuments(query, version);
}
