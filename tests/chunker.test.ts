/**
 * Test: Semantic Chunker
 *
 * Verifies that chunkMarkdown() correctly splits a markdown document into
 * heading-based chunks with proper breadcrumb heading_paths.
 */

import { chunkMarkdown } from '../src/chunker.js';
import assert from 'node:assert/strict';

console.log('Running chunker tests...\n');

// ── Test 1: Basic heading splitting ──────────────────────────────────────────
{
    const md = `
# Authentication

Intro text about authentication.

## OAuth2 Flow

Step 1: Get a token from the provider.
Step 2: Exchange it for an access token.

## API Keys

Use the X-API-Key header in every request.

### Key Rotation

Keys should be rotated every 90 days.
`;

    const chunks = chunkMarkdown(md);
    assert.ok(chunks.length >= 3, `Expected ≥3 chunks, got ${chunks.length}`);

    // Check heading paths
    const paths = chunks.map(c => c.heading_path);
    assert.ok(
        paths.some(p => p.includes('Authentication') && !p.includes('OAuth2 Flow')),
        'Should have a chunk under just "Authentication"'
    );
    assert.ok(
        paths.some(p => JSON.stringify(p) === JSON.stringify(['Authentication', 'OAuth2 Flow'])),
        'Should have breadcrumb ["Authentication", "OAuth2 Flow"]'
    );
    assert.ok(
        paths.some(p => JSON.stringify(p) === JSON.stringify(['Authentication', 'API Keys', 'Key Rotation'])),
        'Should have breadcrumb ["Authentication", "API Keys", "Key Rotation"]'
    );

    console.log('✓ Test 1 passed: basic heading splitting with breadcrumbs');
}

// ── Test 2: Content before first heading ─────────────────────────────────────
{
    const md = `
This is preamble content before any heading.
It should be collected into a chunk with an empty heading_path.

# First Section

Content of the first section.
`;
    const chunks = chunkMarkdown(md);
    const preamble = chunks.find(c => c.heading_path.length === 0);
    assert.ok(preamble, 'Should have a chunk with empty heading_path for preamble content');
    assert.ok(preamble.content.includes('preamble'), 'Preamble chunk should include preamble text');

    console.log('✓ Test 2 passed: preamble content collected under empty heading_path');
}

// ── Test 3: Minimum content length filter ────────────────────────────────────
{
    const md = `
# Section A

Short.

# Section B

This section has enough content to be worth including as a chunk for LLM agents.
`;
    const chunks = chunkMarkdown(md);
    const shortChunk = chunks.find(c => c.content.trim() === 'Short.');
    assert.ok(!shortChunk, 'Chunks shorter than 10 chars should be filtered out');

    const longChunk = chunks.find(c => c.heading_path.includes('Section B'));
    assert.ok(longChunk, 'Section B with enough content should appear as a chunk');

    console.log('✓ Test 3 passed: minimum content length filtering works');
}

// ── Test 4: Heading level stack correctly resets ──────────────────────────────
{
    const md = `
# Top

## Sub A

Content A.

# Second Top

## Sub B

Content B.
`;
    const chunks = chunkMarkdown(md);
    const subB = chunks.find(c => c.heading_path.includes('Sub B'));
    assert.ok(subB, 'Sub B chunk should exist');
    assert.deepEqual(
        subB!.heading_path,
        ['Second Top', 'Sub B'],
        'Sub B should be under "Second Top", not "Top"'
    );

    console.log('✓ Test 4 passed: heading stack correctly resets when toplevel heading changes');
}

// ── Test 5: Empty or whitespace-only input ───────────────────────────────────
{
    assert.deepEqual(chunkMarkdown(''), [], 'Empty string should produce no chunks');
    assert.deepEqual(chunkMarkdown('   \n\n  '), [], 'Whitespace-only should produce no chunks');
    console.log('✓ Test 5 passed: empty/whitespace-only input produces no chunks');
}

console.log('\n✅ All chunker tests passed!');
