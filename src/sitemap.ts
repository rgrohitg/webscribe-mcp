/**
 * Sitemap.xml discovery and parsing.
 *
 * Attempts to fetch /sitemap.xml (and /sitemap_index.xml) from a site's origin.
 * Handles both <urlset> (standard sitemaps) and <sitemapindex> (multi-file index).
 * Applies optional path-prefix filtering (url_glob) before returning URLs.
 *
 * Falls back gracefully (returns empty array) if sitemap is unreachable or malformed.
 */

const SITEMAP_PATHS = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap/sitemap.xml'];
const MAX_SITEMAP_URLS = 5000;

/**
 * Discovers all page URLs from a site's sitemap, starting from the given base URL.
 *
 * @param startUrl   Any URL on the site (only the origin is used).
 * @param pathFilter Optional string that must appear in the URL path (e.g. '/docs/').
 * @returns          Deduplicated list of page URLs from the sitemap.
 */
export async function discoverSitemapUrls(
    startUrl: string,
    pathFilter?: string,
): Promise<string[]> {
    const { origin } = new URL(startUrl);
    const collected = new Set<string>();

    for (const sitemapPath of SITEMAP_PATHS) {
        const sitemapUrl = origin + sitemapPath;
        await fetchAndParseSitemap(sitemapUrl, collected, pathFilter);
        if (collected.size > 0) break; // Stop after first successful sitemap
    }

    return [...collected].slice(0, MAX_SITEMAP_URLS);
}

/**
 * Recursively fetches and parses a sitemap (or sitemapindex).
 */
async function fetchAndParseSitemap(
    url: string,
    collected: Set<string>,
    pathFilter?: string,
    depth: number = 0,
): Promise<void> {
    if (depth > 3 || collected.size >= MAX_SITEMAP_URLS) return;

    let text: string;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return;
        text = await res.text();
    } catch {
        return;
    }

    // Parse with a simple regex-based approach (no external XML parser needed)
    if (text.includes('<sitemapindex')) {
        // It's a sitemap index — recurse into each child sitemap
        const childUrls = extractTagValues(text, 'loc');
        for (const childUrl of childUrls) {
            await fetchAndParseSitemap(childUrl, collected, pathFilter, depth + 1);
        }
    } else if (text.includes('<urlset')) {
        // Standard sitemap — extract all <loc> values
        const pageUrls = extractTagValues(text, 'loc');
        for (const pageUrl of pageUrls) {
            try {
                const u = new URL(pageUrl);
                if (pathFilter && !u.pathname.includes(pathFilter)) continue;
                collected.add(pageUrl);
            } catch { /* malformed URL */ }
        }
    }
}

/**
 * Extracts all innerText values for a given XML tag name using regex.
 */
function extractTagValues(xml: string, tag: string): string[] {
    const pattern = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'gi');
    const results: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(xml)) !== null) {
        const value = (match[1] ?? match[2] ?? '').trim();
        if (value) results.push(value);
    }
    return results;
}
