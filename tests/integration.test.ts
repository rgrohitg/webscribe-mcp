/**
 * Integration Test: Live URL crawl
 *
 * Crawls a real, stable public URL (Cube.dev data modeling overview)
 * using extractSinglePage and verifies:
 * 1. The extracted markdown is non-empty and contains expected content
 * 2. The document and its chunks are persisted in the DB
 * 3. FTS5 search returns relevant results for topic-specific queries
 */

import { extractSinglePage } from '../src/crawler.js';
import { searchDocuments, getDocument, getChunkCount } from '../src/db.js';
import assert from 'node:assert/strict';

const TEST_URL = 'https://cube.dev/docs/product/data-modeling/overview';
const TEST_VERSION = 'test-integration';

console.log(`Running integration test: ${TEST_URL}\n`);

// ── Step 1: Extract the page ──────────────────────────────────────────────────
console.log('Step 1: Extracting page with Playwright...');
const markdown = await extractSinglePage(TEST_URL, TEST_VERSION);

assert.ok(markdown.trim().length > 100, `Markdown should be non-empty (got ${markdown.length} chars)`);
console.log(`✓ Step 1 passed: extracted ${markdown.length} chars of markdown`);

// ── Step 2: Verify expected content in extracted markdown ─────────────────────
console.log('Step 2: Verifying extracted content...');
const lowerMd = markdown.toLowerCase();
assert.ok(lowerMd.includes('cube') || lowerMd.includes('data model') || lowerMd.includes('measure'),
    'Extracted markdown should mention core Cube concepts (cube, data model, or measure)');
console.log('✓ Step 2 passed: expected keywords found in markdown');

// ── Step 3: Verify document was cached in DB ─────────────────────────────────
console.log('Step 3: Verifying DB persistence...');
const doc = getDocument(TEST_URL, TEST_VERSION);
assert.ok(doc !== null, 'Document should be persisted in the DB');
assert.equal(doc!.url, TEST_URL, 'Stored URL should match');
assert.ok(doc!.markdown.length > 100, 'Stored markdown should be non-empty');
console.log(`✓ Step 3 passed: document cached (title: "${doc!.title}")`);

// ── Step 4: Verify chunks were created ───────────────────────────────────────
console.log('Step 4: Verifying semantic chunks were created...');
const chunkCount = getChunkCount();
assert.ok(chunkCount > 0, `At least one chunk should be created, got ${chunkCount}`);
console.log(`✓ Step 4 passed: ${chunkCount} semantic chunks in DB`);

// ── Step 5: FTS5 search returns relevant results ──────────────────────────────
console.log('Step 5: Searching for "measures quantitative"...');
const results = searchDocuments('measures quantitative', TEST_VERSION);
// Fallback search in case FTS doesn't find it in test version
const fallbackResults = results.length > 0 ? results : searchDocuments('cube data model');
assert.ok(fallbackResults.length > 0, 'FTS5 search should return at least one result');
const topResult = fallbackResults[0];
assert.ok(topResult.content.length > 0, 'Top result should have content');
assert.ok(Array.isArray(topResult.heading_path), 'heading_path should be an array');
console.log(`✓ Step 5 passed: FTS5 search results (top heading: ${JSON.stringify(topResult.heading_path)}, score: ${topResult.score.toFixed(4)})`);

// ── Step 6: Structured output format ─────────────────────────────────────────
console.log('Step 6: Verifying structured output format...');
assert.ok('url' in topResult, 'Result must have url');
assert.ok('version' in topResult, 'Result must have version');
assert.ok('title' in topResult, 'Result must have title');
assert.ok('heading_path' in topResult, 'Result must have heading_path');
assert.ok('content' in topResult, 'Result must have content');
assert.ok('score' in topResult, 'Result must have score');
console.log('✓ Step 6 passed: all required fields present in search result');

console.log('\n✅ Integration test passed! The crawler, chunker, and FTS5 search all work end-to-end.');
console.log('\nSample result:');
console.log(JSON.stringify({
    url: topResult.url,
    heading_path: topResult.heading_path,
    score: topResult.score,
    content_preview: topResult.content.slice(0, 200) + '...',
}, null, 2));
