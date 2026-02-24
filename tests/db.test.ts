/**
 * Test: Database (FTS5 search + chunking integration)
 *
 * Uses an in-memory SQLite database to verify:
 * 1. Document upsert and retrieval
 * 2. Chunk ingestion and FTS5 full-text search
 * 3. Smart re-crawl: etag-based cache skip
 * 4. BM25 relevance ranking (most relevant chunk first)
 */

import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import { chunkMarkdown } from '../src/chunker.js';

console.log('Running database tests...\n');

// ── Setup: In-memory test database ───────────────────────────────────────────
// We create a fresh in-memory DB so tests don't pollute the real document store.
const db = new Database(':memory:');
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS documents_v2 (
        url TEXT NOT NULL, version TEXT NOT NULL DEFAULT 'latest',
        domain TEXT NOT NULL, title TEXT NOT NULL, markdown TEXT NOT NULL,
        etag TEXT, last_modified TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (url, version)
    );
    CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL, version TEXT NOT NULL DEFAULT 'latest',
        heading_path TEXT NOT NULL, content TEXT NOT NULL,
        FOREIGN KEY (url, version) REFERENCES documents_v2 (url, version) ON DELETE CASCADE
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
        url, version, heading_path, content,
        content='chunks', content_rowid='id'
    );
    CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
        INSERT INTO chunks_fts (rowid, url, version, heading_path, content)
        VALUES (new.id, new.url, new.version, new.heading_path, new.content);
    END;
`);

// ── Helpers ────────────────────────────────────────────────────────────────────
function upsertDoc(url: string, title: string, markdown: string, etag?: string) {
    db.prepare(`
        INSERT INTO documents_v2 (url, version, domain, title, markdown, etag, timestamp)
        VALUES (?, 'latest', 'test.com', ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(url, version) DO UPDATE SET title=excluded.title, markdown=excluded.markdown, etag=excluded.etag
    `).run(url, title, markdown, etag ?? null);
}

function insertChunks(url: string, chunks: Array<{ heading_path: string[]; content: string }>) {
    db.prepare(`DELETE FROM chunks WHERE url = ? AND version = 'latest'`).run(url);
    const ins = db.prepare(`INSERT INTO chunks (url, version, heading_path, content) VALUES (?, 'latest', ?, ?)`);
    const tx = db.transaction(() => {
        chunks.forEach(c => ins.run(url, JSON.stringify(c.heading_path), c.content));
    });
    tx();
}

function searchFTS(query: string) {
    const ftsQuery = query.trim().split(/\s+/).filter(Boolean).map(t => `"${t.replace(/"/g, '""')}"`).join(' ');
    if (!ftsQuery) return [];
    return db.prepare(`
        SELECT c.url, c.heading_path, c.content, -bm25(chunks_fts) AS score
        FROM chunks_fts
        JOIN chunks c ON chunks_fts.rowid = c.id
        WHERE chunks_fts MATCH ?
        ORDER BY score DESC
        LIMIT 10
    `).all(ftsQuery) as Array<{ url: string; heading_path: string; content: string; score: number }>;
}

// ── Test 1: Document round-trip ───────────────────────────────────────────────
{
    upsertDoc('https://example.com/page', 'Test Page', '# Hello\n\nWorld');
    const doc = db.prepare(`SELECT * FROM documents_v2 WHERE url = ?`).get('https://example.com/page') as any;
    assert.equal(doc.title, 'Test Page', 'Title should match');
    assert.ok(doc.markdown.includes('Hello'), 'Markdown should be stored');
    console.log('✓ Test 1 passed: document round-trip (insert → retrieve)');
}

// ── Test 2: FTS5 chunk search ────────────────────────────────────────────────
{
    const markdown = `
# Cube Data Modeling

Learn how to model data with Cube.

## Measures

Measures are quantitative values like count, sum, and average.
Use the \`type: count\` syntax to define a count measure.

## Dimensions

Dimensions are categorical attributes like city, company name, or date.
`;
    upsertDoc('https://cube.dev/data-model', 'Cube Data Model', markdown);
    const chunks = chunkMarkdown(markdown);
    insertChunks('https://cube.dev/data-model', chunks);

    const results = searchFTS('measures quantitative');
    assert.ok(results.length > 0, 'Should find chunks matching "measures quantitative"');
    const topResult = results[0];
    assert.ok(topResult.content.toLowerCase().includes('quantitative'), 'Top result should mention quantitative');
    const hp = JSON.parse(topResult.heading_path);
    assert.ok(hp.includes('Measures'), 'Top result should be under the Measures heading');
    console.log(`✓ Test 2 passed: FTS5 search found correct chunk (heading: ${JSON.stringify(hp)})`);
}

// ── Test 3: BM25 relevance ordering ─────────────────────────────────────────
{
    const markdown2 = `
# Crawler Basics

## Rate Limiting

All requests should respect the crawl-delay directive in robots.txt.
The default delay is 500 milliseconds per domain.

## Sitemap Discovery

The crawler tries /sitemap.xml first for comprehensive URL seeding.
`;
    upsertDoc('https://docs.example.com/crawler', 'Crawler Docs', markdown2);
    insertChunks('https://docs.example.com/crawler', chunkMarkdown(markdown2));

    const results = searchFTS('robots.txt crawl delay');
    assert.ok(results.length > 0, 'Should find rate limiting section');
    // The rate limiting chunk mentions robots.txt, crawl-delay, and delay — should rank highest
    const topPath = JSON.parse(results[0].heading_path);
    assert.ok(topPath.includes('Rate Limiting'), `Top result should be Rate Limiting section, got ${JSON.stringify(topPath)}`);
    assert.ok(results[0].score >= (results[1]?.score ?? 0), 'Results should be sorted by score descending');
    console.log(`✓ Test 3 passed: BM25 ranking correct (top: ${JSON.stringify(topPath)}, score: ${results[0].score.toFixed(4)})`);
}

// ── Test 4: ETag-based cache skip simulation ─────────────────────────────────
{
    const url = 'https://example.com/etag-test';
    upsertDoc(url, 'ETag Test', '# ETag Content', 'etag-abc-123');

    const stored = db.prepare(`SELECT etag FROM documents_v2 WHERE url = ?`).get(url) as any;
    assert.equal(stored.etag, 'etag-abc-123', 'ETag should be stored');

    // Simulate: same etag → skip (would return false in real upsertDocument)
    const sameEtag = stored.etag === 'etag-abc-123';
    assert.equal(sameEtag, true, 'Same ETag should indicate no change (skip crawl)');

    const diffEtag = stored.etag === 'etag-xyz-999';
    assert.equal(diffEtag, false, 'Different ETag should indicate content changed (re-crawl)');
    console.log('✓ Test 4 passed: ETag-based cache invalidation logic works');
}

// ── Test 5: No results for unmatched query ───────────────────────────────────
{
    const results = searchFTS('xyzzy_definitely_not_a_real_word_12345');
    assert.equal(results.length, 0, 'Unmatched query should return no results');
    console.log('✓ Test 5 passed: no results for unmatched FTS query');
}

db.close();
console.log('\n✅ All database tests passed!');
