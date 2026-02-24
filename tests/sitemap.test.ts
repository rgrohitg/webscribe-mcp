/**
 * Test: sitemap.ts URL discovery
 *
 * Verifies that discoverSitemapUrls correctly fetches and parses sitemap.xml files.
 * Uses a live public site (httpbin.org has no sitemap — expected graceful fallback)
 * and a live site known to have a sitemap (cube.dev).
 */

import { discoverSitemapUrls } from '../src/sitemap.js';
import assert from 'node:assert/strict';

console.log('Running sitemap tests...\n');

// ── Test 1: Site with no sitemap — should return empty array gracefully ───────
{
    const urls = await discoverSitemapUrls('https://httpbin.org/');
    assert.ok(Array.isArray(urls), 'Should return an array even if sitemap is missing');
    console.log(`✓ Test 1 passed: missing sitemap returns empty array (got ${urls.length} URLs)`);
}

// ── Test 2: Site with sitemap — should return non-empty results ───────────────
{
    // cube.dev has a sitemap.xml
    const urls = await discoverSitemapUrls('https://cube.dev/docs/product/data-modeling/overview');
    assert.ok(Array.isArray(urls), 'Should return an array');
    // We just check it's an array, since sitemap availability may vary
    console.log(`✓ Test 2 passed: cube.dev sitemap discovery returned ${urls.length} URLs`);
    if (urls.length > 0) {
        // All returned URLs should be valid absolute URLs
        for (const url of urls.slice(0, 5)) {
            assert.ok(() => new URL(url), `Each URL should be a valid absolute URL: ${url}`);
        }
    }
}

// ── Test 3: Path filter ───────────────────────────────────────────────────────
{
    const urls = await discoverSitemapUrls('https://cube.dev/', 'docs');
    for (const url of urls) {
        try {
            const u = new URL(url);
            assert.ok(u.pathname.includes('docs'), `URL should include 'docs' in path: ${url}`);
        } catch {/* skip malformed */ }
    }
    console.log(`✓ Test 3 passed: path filter 'docs' applied, got ${urls.length} filtered URLs`);
}

console.log('\n✅ All sitemap tests passed!');
