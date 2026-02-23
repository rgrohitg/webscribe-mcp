import { chromium, Browser, Page } from 'playwright';
import { extractMarkdownPristine } from './utils.js';
import { upsertDocument, searchDocuments } from './db.js';

/**
 * Generic sub-tab suffixes to probe for each discovered component URL.
 * Works for Salt DS, MUI, Ant Design, Chakra and any similar tabbed docs site.
 */
const SUB_TAB_SUFFIXES = ['/usage', '/examples', '/accessibility', '/api', '/props', '/code'];

/**
 * Given a normalised URL (no trailing slash), generate sub-tab variant URLs.
 * Only generates variants if the URL doesn't already end with a known suffix.
 */
function expandSubTabUrls(url: string): string[] {
    const normalised = url.replace(/\/$/, '');
    const alreadyHasSuffix = SUB_TAB_SUFFIXES.some(s => normalised.endsWith(s));
    if (alreadyHasSuffix) return [];
    return SUB_TAB_SUFFIXES.map(s => normalised + s);
}

/**
 * Generically reveals hidden content on any docs page before extraction.
 *
 * Many documentation sites (Salt DS, MUI, Storybook, Ant Design, Chakra …)
 * hide code examples behind toggle buttons like "Show code", "<>" icons,
 * collapsed <details> elements, or accordion panels.
 *
 * This function clicks ALL such interactive disclosure elements so their
 * content is present in the DOM when we call page.content().
 *
 * Strategy:
 *  1. Click <details> elements that are not yet open.
 *  2. Click any button/element whose visible text or aria-label suggests it
 *     expands or reveals content (case-insensitive, works across sites).
 *  3. Small settle delay so async panel animations resolve.
 */
async function revealHiddenContent(page: Page): Promise<void> {
    try {
        // 1. Open all collapsed <details> elements
        await page.$$eval('details:not([open])', (els) =>
            els.forEach((el) => el.setAttribute('open', ''))
        );

        // 2. Click all visible buttons / links that look like "show / expand / view code"
        //    Covers: Salt DS "Show code", MUI "<>", Storybook "Show code",
        //    Ant Design "Show code", Chakra "Show code", generic "Expand"
        const revealSelectors = [
            // Text-based matches (works across most sites)
            'button:not([disabled])',
            '[role="button"]:not([disabled])',
            // Summary elements inside details (already handled above, but belt-and-braces)
            'summary',
        ];

        // Visible text patterns that indicate "reveal" intent
        const revealPattern =
            /^(show\s*(code|source|example|all|more)|expand|view\s*(code|source)|<>|\{\s*\}|toggle\s*code|see\s*(code|example))$/i;

        // Collect all candidate elements and click those matching the pattern
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

        // 3. Short settle: let panel animations and async renders complete
        await page.waitForTimeout(600);
    } catch {
        // Never let content-reveal errors abort the crawl
    }
}

/**
 * Visits a single page with Playwright, waits for SPA hydration,
 * extracts markdown, upserts to DB, and returns the markdown string.
 */
async function visitPage(
    page: Page,
    url: string,
    version: string,
): Promise<string | null> {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {
            // networkidle may time-out on some SPAs — content is usually ready anyway
        });

        // Reveal any hidden/collapsed content (show-code buttons, details, accordions)
        await revealHiddenContent(page);

        const html = await page.content();
        const markdown = extractMarkdownPristine(html, url);

        // Skip near-empty pages (404s, redirects, empty tabs)
        if (markdown.trim().length < 50) return null;

        const title = await page.title();
        const domain = new URL(url).hostname;
        upsertDocument(url, version, domain, title, markdown);
        return markdown;
    } catch (err) {
        process.stderr.write(`[crawler] Failed to visit ${url}: ${err}\n`);
        return null;
    }
}

/**
 * BFS crawler — starts from startUrl, follows same-hostname links up to maxPages.
 * Optionally expands sub-tab variants (/usage, /examples, etc.) for every URL found.
 *
 * @param startUrl   Absolute URL to begin from.
 * @param version    Documentation version label (e.g. 'latest', 'v18').
 * @param maxPages   Maximum pages to crawl before stopping.
 * @param urlGlob    Optional glob-like prefix filter (e.g. `*\/components\/**` is treated
 *                   as a simple substring match against the pathname).
 * @param expandTabs Whether to auto-enqueue sub-tab suffixes for every URL found.
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
    const queue: string[] = [startUrl];

    if (expandTabs) {
        expandSubTabUrls(startUrl).forEach(u => queue.push(u));
    }

    const startHostname = new URL(startUrl).hostname;

    try {
        const page = await browser.newPage();

        while (queue.length > 0 && crawledUrls.length < maxPages) {
            const url = queue.shift()!;
            const normalised = url.replace(/\/$/, '');
            if (visited.has(normalised)) continue;
            visited.add(normalised);

            const markdown = await visitPage(page, url, version);
            if (markdown) {
                crawledUrls.push(url);

                if (expandTabs) {
                    expandSubTabUrls(normalised).forEach(u => {
                        if (!visited.has(u)) queue.push(u);
                    });
                }
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
                        if (visited.has(u.href.replace(/\/$/, ''))) continue;
                        // Apply URL glob filter if provided (simple path substring match)
                        if (urlGlob) {
                            const globPath = urlGlob.replace(/\*\*/g, '');
                            if (!u.pathname.includes(globPath.replace(/\//g, ''))) continue;
                        }
                        queue.push(u.href);
                    } catch { /* malformed URL — skip */ }
                }
            } catch { /* page navigated away or errored */ }
        }

        await page.close();
    } finally {
        await browser.close();
    }

    return crawledUrls;
}

/**
 * Smart component-docs crawler.
 *
 * Phase 1 — Opens the index page (e.g. /salt/components/) and discovers all
 *            component links one level deep, stripping trailing /index suffixes.
 * Phase 2 — Crawls every component URL + all sub-tab variants up to maxPages.
 *
 * Works generically for Salt DS, MUI, Ant Design, Chakra, and any similar site.
 *
 * @param indexUrl  Component listing page (e.g. https://saltdesignsystem.com/salt/components/)
 * @param version   Documentation version label.
 * @param maxPages  Maximum pages to crawl.
 * @returns List of successfully crawled URLs.
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

        // ── Phase 1: Discover component URLs from the index page ─────────────
        await page.goto(indexUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => { });

        const visitedUrl = page.url();
        process.stderr.write(`[Phase 1] Visited index page: ${visitedUrl}\n`);

        const links: string[] = await page.$$eval('a[href]', (anchors) =>
            anchors
                .map((a) => (a as HTMLAnchorElement).href)
                .filter((h) => h && !h.startsWith('javascript'))
        );

        process.stderr.write(`[Phase 1] Found ${links.length} total links on index page\n`);

        const indexBase = new URL(indexUrl);
        const indexBasePath = indexBase.pathname.replace(/\/$/, ''); // e.g. /salt/components

        // Discover component base URLs (strip /index suffix, deduplicate)
        const componentUrls = [...new Set(links.flatMap((href) => {
            try {
                const u = new URL(href);
                if (u.hostname !== indexBase.hostname) return [];
                let p = u.pathname.replace(/\/$/, '');
                // Strip trailing /index (e.g. /salt/components/button/index → /salt/components/button)
                if (p.endsWith('/index')) p = p.slice(0, -6);
                if (!p.startsWith(indexBasePath + '/')) return [];
                const remainder = p.slice(indexBasePath.length + 1); // e.g. 'button' or 'layouts/flex-layout'
                const segments = remainder.split('/').filter(Boolean);
                // Accept 1 or 2 path segments (e.g. button, layouts/flex-layout)
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
                visited.add(componentUrl);
            }
            for (const tabUrl of expandSubTabUrls(componentUrl)) {
                if (!visited.has(tabUrl)) {
                    queue.push(tabUrl);
                    visited.add(tabUrl);
                }
            }
        }

        process.stderr.write(`[Phase 2] Crawl queue size: ${queue.length} URLs\n`);

        // ── Phase 2: Crawl all enqueued pages ────────────────────────────────
        let count = 0;
        for (const url of queue) {
            if (count >= maxPages) break;
            const markdown = await visitPage(page, url, version);
            if (markdown) {
                crawledUrls.push(url);
                count++;
            }
        }

        await page.close();
    } finally {
        await browser.close();
    }

    return crawledUrls;
}

/**
 * Extracts and caches a single page without following any links.
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

/**
 * Searches the persistent SQLite database for a query string.
 * Returns matched documents with url, version, title and content.
 */
export async function searchLocalDatasets(
    query: string,
    version?: string,
): Promise<Array<{ url: string; version: string; title: string; content: string }>> {
    const results = searchDocuments(query, version);
    return results.map(row => ({
        url: row.url,
        version: row.version,
        title: row.title,
        content: row.markdown,
    }));
}
