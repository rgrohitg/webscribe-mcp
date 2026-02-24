/**
 * robots.txt compliance helper.
 *
 * Fetches and caches robots.txt for each crawled domain (one fetch per domain
 * per crawler run). Uses the `robots-parser` package (MIT) to evaluate
 * allow/disallow rules and crawl-delay directives.
 */

// Local type for the parsed robots instance (mirrors robots-parser's Robot interface)
interface RobotsInstance {
    isAllowed(url: string, ua?: string): boolean | undefined;
    isDisallowed(url: string, ua?: string): boolean | undefined;
    getCrawlDelay(ua?: string): number | undefined;
    getSitemaps(): string[];
}

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const robotsParser: (url: string, content: string) => RobotsInstance = require('robots-parser');

const USER_AGENT = 'universal-docs-mcp/2.0';
const DEFAULT_CRAWL_DELAY_MS = 500;

// In-memory cache: hostname → parsed robots instance (null = fetch failed / robots.txt missing)
const robotsCache = new Map<string, RobotsInstance | null>();
// Crawl delay per hostname (ms)
const delayCache = new Map<string, number>();
// Timestamps of last request per hostname (for rate limiting)
const lastRequestTime = new Map<string, number>();

/**
 * Fetches and parses robots.txt for the given URL's hostname.
 * Caches the result so each domain is only fetched once per process lifetime.
 */
async function getRobots(url: string): Promise<RobotsInstance | null> {
    const { hostname, protocol, port } = new URL(url);
    const origin = `${protocol}//${hostname}${port ? ':' + port : ''}`;

    if (robotsCache.has(hostname)) {
        return robotsCache.get(hostname) ?? null;
    }

    const robotsUrl = `${origin}/robots.txt`;
    try {
        const res = await fetch(robotsUrl, {
            headers: { 'User-Agent': USER_AGENT },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
            robotsCache.set(hostname, null);
            delayCache.set(hostname, DEFAULT_CRAWL_DELAY_MS);
            return null;
        }
        const text = await res.text();
        const robots = robotsParser(robotsUrl, text);
        robotsCache.set(hostname, robots);

        // Extract crawl-delay for our user agent or wildcard
        const crawlDelay = robots.getCrawlDelay(USER_AGENT)
            ?? robots.getCrawlDelay('*')
            ?? DEFAULT_CRAWL_DELAY_MS / 1000;
        delayCache.set(hostname, Math.max(crawlDelay * 1000, DEFAULT_CRAWL_DELAY_MS));

        return robots;
    } catch {
        // If robots.txt is unreachable, treat as "allow all"
        robotsCache.set(hostname, null);
        delayCache.set(hostname, DEFAULT_CRAWL_DELAY_MS);
        return null;
    }
}

/**
 * Returns true if the given URL is allowed to be crawled according to robots.txt.
 * If robots.txt cannot be fetched, defaults to allowing the URL.
 */
export async function isAllowed(url: string): Promise<boolean> {
    const robots = await getRobots(url);
    if (!robots) return true;
    return robots.isAllowed(url, USER_AGENT) !== false;
}

/**
 * Enforces the per-domain crawl delay by sleeping until enough time has elapsed
 * since the last request to that domain.
 */
export async function enforceCrawlDelay(url: string): Promise<void> {
    const { hostname } = new URL(url);

    // Lazily ensure robots is loaded (so delay is set)
    await getRobots(url);

    const delay = delayCache.get(hostname) ?? DEFAULT_CRAWL_DELAY_MS;
    const last = lastRequestTime.get(hostname) ?? 0;
    const elapsed = Date.now() - last;
    if (elapsed < delay) {
        await sleep(delay - elapsed);
    }
    lastRequestTime.set(hostname, Date.now());
}

/**
 * Clears the in-memory robots cache. Useful for tests.
 */
export function clearRobotsCache(): void {
    robotsCache.clear();
    delayCache.clear();
    lastRequestTime.clear();
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
