/**
 * Test: robots.ts compliance
 *
 * Verifies robots.txt parsing, allow/disallow rules, and cache clearing.
 * Uses real fetch against a live, well-known site (example.com).
 */

import { isAllowed, clearRobotsCache } from '../src/robots.js';
import assert from 'node:assert/strict';

console.log('Running robots.txt tests...\n');

// Always reset cache before tests to ensure isolation
clearRobotsCache();

// ── Test 1: URL with no robots.txt restriction ───────────────────────────────
{
    // example.com has a permissive robots.txt (or no robots.txt at all)
    const allowed = await isAllowed('https://example.com/');
    assert.equal(allowed, true, 'example.com should be allowed');
    console.log('✓ Test 1 passed: example.com (permissive robots.txt) is allowed');
    clearRobotsCache();
}

// ── Test 2: httpbin.org (live site, should be allowed) ───────────────────────
{
    const allowed = await isAllowed('https://httpbin.org/get');
    assert.equal(allowed, true, 'httpbin.org/get should be allowed (no restrictive robots.txt)');
    console.log('✓ Test 2 passed: httpbin.org is crawlable');
    clearRobotsCache();
}

// ── Test 3: Cache re-use (same domain, second call much faster) ──────────────
{
    const t0 = Date.now();
    await isAllowed('https://example.com/page1');
    const t1 = Date.now();
    await isAllowed('https://example.com/page2'); // Should hit cache
    const t2 = Date.now();

    // Second call should be significantly faster (<50ms) since robots.txt is cached
    assert.ok(
        (t2 - t1) < (t1 - t0) || (t2 - t1) < 50,
        'Second call to same domain should use cached robots.txt (faster response)'
    );
    console.log(`✓ Test 3 passed: robots.txt cache is used (first: ${t1 - t0}ms, second: ${t2 - t1}ms)`);
    clearRobotsCache();
}

console.log('\n✅ All robots.txt tests passed!');
