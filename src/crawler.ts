import { PlaywrightCrawler, RequestQueue, log } from 'crawlee';
import { extractMarkdownPristine } from './utils.js';
import { upsertDocument, searchDocuments } from './db.js';

// Shut off all Crawlee logging because MCP relies on a pure JSON STDOUT pipe.
// Any extraneous logs (especially \x1b colored ones) will break the MCP protocol parsing!
log.setLevel(log.LEVELS.OFF);

export interface CrawlerResult {
    url: string;
    title: string;
    markdown: string;
}

/**
 * Runs the crawler on a specific starting URL using a Breadth-First Search strategy.
 * This utilizes Playwright in headless mode to ensure SPAs (React, Vue, Angular) 
 * are fully rendered before their DOM is parsed.
 * 
 * @param startUrl The absolute URL to start crawling from.
 * @param version The targeted version of the documentation (e.g. 'v1', 'latest').
 * @param maxPages The maximum number of pages to crawl before terminating the queue.
 * @returns A Promise resolving to an array of successfully crawled and cached URLs.
 */
export async function runCrawler(startUrl: string, version: string = 'latest', maxPages: number = 10): Promise<string[]> {
    const requestQueue = await RequestQueue.open();
    await requestQueue.addRequest({ url: startUrl });

    const crawledUrls: string[] = [];

    const crawler = new PlaywrightCrawler({
        requestQueue,
        maxRequestsPerCrawl: maxPages,

        // Playwright specific configurations
        headless: true,
        navigationTimeoutSecs: 30,

        // Request handler runs for each page
        async requestHandler({ request, page, enqueueLinks, log }) {
            log.info(`Processing ${request.url}...`);

            // Wait for network idle to ensure SPAs (like Storybook, React) are loaded.
            await page.waitForLoadState('networkidle');

            // Attempt to hide common cookie banners/overlays before extraction
            await page.evaluate(() => {
                const selectors = [
                    '#cookie-banner', '.cookie-banner', '#onetrust-consent-sdk',
                    '.overlay', '.modal', '[id*="cookie"]', '[class*="cookie"]'
                ];
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => (el as HTMLElement).style.display = 'none');
                });
            });

            const title = await page.title();
            const html = await page.content();
            const url = page.url();

            try {
                const markdown = extractMarkdownPristine(html, url);

                // Parse just the domain to uniquely group doc pages visually
                const domain = new URL(url).hostname;

                // Stream directly to the persistent SQLite database, skipping Crawlee's memory datasets
                upsertDocument(url, version, domain, title, markdown);

                crawledUrls.push(url);
            } catch (err) {
                log.error(`Failed to extract markdown from ${url}: ${err}`);
            }

            // Enqueue links that share the same base domain
            // We use strategy 'same-hostname' to prevent wandering to external links.
            await enqueueLinks({
                strategy: 'same-hostname',
                // We only enqueue general 'a' tags, excluding common static assets.
                globs: ['http?(s)://**/*'],
            });
        },

        // Handle failed requests
        failedRequestHandler({ request, log }) {
            log.error(`Request ${request.url} failed completely.`);
        },
    });

    await crawler.run();

    return crawledUrls;
}

/**
 * Extracts a single page without enqueuing links or saving to the global dataset search cache.
 * Useful for targeted extractions where the user provides a direct documentation link.
 * 
 * @param url Document URL to read and extract.
 * @param version The targeted version of the documentation (e.g. 'v1', 'latest').
 * @returns A Promise resolving to the converted Markdown string of the main article content.
 */
export async function extractSinglePage(url: string, version: string = 'latest'): Promise<string> {
    let resultMarkdown = "";

    const crawler = new PlaywrightCrawler({
        // Only process this one request
        maxRequestsPerCrawl: 1,
        headless: true,

        async requestHandler({ request, page, log }) {
            log.info(`Extracting single page ${request.url}...`);
            await page.waitForLoadState('networkidle');

            const html = await page.content();
            resultMarkdown = extractMarkdownPristine(html, page.url());

            const domain = new URL(request.url).hostname;
            upsertDocument(request.url, version, domain, await page.title(), resultMarkdown);
        },
    });

    await crawler.run([url]);
    return resultMarkdown;
}

/**
 * Searches the persistent SQLite database (`~/.universal-docs-mcp/documents.db`) for a specific query string.
 * This runs an instantaneous `LIKE` search across all previously crawled domains.
 * 
 * @param query The text string to search for across all cached markdown documents.
 * @returns A Promise resolving to an array of objects containing the matched URL, title, and full document content.
 */
export async function searchLocalDatasets(query: string, version?: string): Promise<Array<{ url: string, version: string, title: string, content: string }>> {
    // 15ms instantaneous sqlite LIKE query
    const results = searchDocuments(query, version);

    // Map the db response to the legacy Tool return shape
    return results.map(row => ({
        url: row.url,
        version: row.version,
        title: row.title,
        content: row.markdown
    }));
}
