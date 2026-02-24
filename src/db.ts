import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

// ── Storage location ───────────────────────────────────────────────────────────
// Stored in the user's home directory so data survives package updates via npx.
const DB_DIR = path.join(os.homedir(), '.universal-docs-mcp');
const DB_PATH = path.join(DB_DIR, 'documents.db');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

// WAL mode for maximum concurrency (required for concurrent Playwright crawls)
db.pragma('journal_mode = WAL');

// ── Schema ─────────────────────────────────────────────────────────────────────

db.exec(`
    -- Main documents table (full page per URL+version)
    CREATE TABLE IF NOT EXISTS documents_v2 (
        url           TEXT NOT NULL,
        version       TEXT NOT NULL DEFAULT 'latest',
        domain        TEXT NOT NULL,
        title         TEXT NOT NULL,
        markdown      TEXT NOT NULL,
        etag          TEXT,
        last_modified TEXT,
        timestamp     DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (url, version)
    );

    -- Semantic chunk table: one row per heading section of a page
    CREATE TABLE IF NOT EXISTS chunks (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        url          TEXT NOT NULL,
        version      TEXT NOT NULL DEFAULT 'latest',
        heading_path TEXT NOT NULL,   -- JSON array, e.g. ["Authentication","OAuth2 Flow"]
        content      TEXT NOT NULL,
        FOREIGN KEY (url, version) REFERENCES documents_v2 (url, version) ON DELETE CASCADE
    );

    -- FTS5 virtual table backed by the chunks table for BM25 relevance search
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
        url,
        version,
        heading_path,
        content,
        content='chunks',
        content_rowid='id'
    );
`);

// ── Legacy data migration ───────────────────────────────────────────────────────
const hasLegacyTable = db.prepare(
    `SELECT 1 FROM sqlite_master WHERE type='table' AND name='documents'`
).get();
if (hasLegacyTable) {
    db.exec(`
        INSERT OR IGNORE INTO documents_v2 (url, domain, title, markdown, timestamp)
        SELECT url, domain, title, markdown, timestamp FROM documents;
        DROP TABLE IF EXISTS documents;
    `);
}

// ── Schema migration: add new columns to existing documents_v2 tables ──────────
// SQLite ALTER TABLE only supports ADD COLUMN (not IF NOT EXISTS), so we check first.
const existingCols = (db.prepare(
    `PRAGMA table_info(documents_v2)`
).all() as Array<{ name: string }>).map(r => r.name);

if (!existingCols.includes('etag')) {
    db.exec(`ALTER TABLE documents_v2 ADD COLUMN etag TEXT;`);
}
if (!existingCols.includes('last_modified')) {
    db.exec(`ALTER TABLE documents_v2 ADD COLUMN last_modified TEXT;`);
}

// ── FTS5 sync triggers ─────────────────────────────────────────────────────────
// Keep chunks_fts in sync with the chunks table automatically.
db.exec(`
    CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
        INSERT INTO chunks_fts (rowid, url, version, heading_path, content)
        VALUES (new.id, new.url, new.version, new.heading_path, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
        INSERT INTO chunks_fts (chunks_fts, rowid, url, version, heading_path, content)
        VALUES ('delete', old.id, old.url, old.version, old.heading_path, old.content);
    END;

    CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
        INSERT INTO chunks_fts (chunks_fts, rowid, url, version, heading_path, content)
        VALUES ('delete', old.id, old.url, old.version, old.heading_path, old.content);
        INSERT INTO chunks_fts (rowid, url, version, heading_path, content)
        VALUES (new.id, new.url, new.version, new.heading_path, new.content);
    END;
`);

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DocumentRow {
    url: string;
    version: string;
    domain: string;
    title: string;
    markdown: string;
    etag: string | null;
    last_modified: string | null;
    timestamp: string;
}

export interface ChunkRow {
    id: number;
    url: string;
    version: string;
    heading_path: string; // JSON array string
    content: string;
}

export interface SearchResult {
    url: string;
    version: string;
    title: string;
    heading_path: string[];
    content: string;
    score: number;
}

// ── Document operations ────────────────────────────────────────────────────────

/**
 * Inserts or overwrites a full page document.
 * Returns true if the page was actually saved (content changed or new).
 */
export function upsertDocument(
    url: string,
    version: string,
    domain: string,
    title: string,
    markdown: string,
    etag?: string,
    lastModified?: string,
): boolean {
    // Check if content has actually changed (skip write if identical)
    const existing = db.prepare(
        `SELECT etag, last_modified FROM documents_v2 WHERE url = ? AND version = ?`
    ).get(url, version) as { etag: string | null; last_modified: string | null } | undefined;

    if (existing && etag && existing.etag === etag) {
        // Remote resource unchanged — skip overwrite
        return false;
    }

    const stmt = db.prepare(`
        INSERT INTO documents_v2 (url, version, domain, title, markdown, etag, last_modified, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(url, version) DO UPDATE SET
            title         = excluded.title,
            markdown      = excluded.markdown,
            etag          = excluded.etag,
            last_modified = excluded.last_modified,
            timestamp     = CURRENT_TIMESTAMP
    `);
    stmt.run(url, version, domain, title, markdown, etag ?? null, lastModified ?? null);
    return true;
}

/**
 * Replaces all chunks for a given URL+version.
 * Each chunk is { heading_path: string[], content: string }.
 */
export function upsertChunks(
    url: string,
    version: string,
    chunks: Array<{ heading_path: string[]; content: string }>,
): void {
    // Delete old chunks first (triggers will remove from FTS5 too)
    db.prepare(`DELETE FROM chunks WHERE url = ? AND version = ?`).run(url, version);

    const insert = db.prepare(`
        INSERT INTO chunks (url, version, heading_path, content)
        VALUES (?, ?, ?, ?)
    `);
    const insertMany = db.transaction((rows: typeof chunks) => {
        for (const row of rows) {
            insert.run(url, version, JSON.stringify(row.heading_path), row.content);
        }
    });
    insertMany(chunks);
}

/**
 * FTS5-based search across all cached chunks.
 * Returns results ranked by BM25 relevance (most relevant first).
 */
export function searchDocuments(query: string, version?: string): SearchResult[] {
    // Sanitise the query for FTS5: escape special chars, wrap each term with quotes
    const ftsQuery = query
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(t => `"${t.replace(/"/g, '""')}"`)
        .join(' ');

    if (!ftsQuery) return [];

    let sql: string;
    const params: (string | number)[] = [ftsQuery];

    if (version) {
        sql = `
            SELECT
                c.url,
                c.version,
                COALESCE(d.title, c.url) AS title,
                c.heading_path,
                c.content,
                -bm25(chunks_fts) AS score
            FROM chunks_fts
            JOIN chunks c ON chunks_fts.rowid = c.id
            LEFT JOIN documents_v2 d ON d.url = c.url AND d.version = c.version
            WHERE chunks_fts MATCH ?
              AND c.version = ?
            ORDER BY score DESC
            LIMIT 20
        `;
        params.push(version);
    } else {
        sql = `
            SELECT
                c.url,
                c.version,
                COALESCE(d.title, c.url) AS title,
                c.heading_path,
                c.content,
                -bm25(chunks_fts) AS score
            FROM chunks_fts
            JOIN chunks c ON chunks_fts.rowid = c.id
            LEFT JOIN documents_v2 d ON d.url = c.url AND d.version = c.version
            WHERE chunks_fts MATCH ?
            ORDER BY score DESC
            LIMIT 20
        `;
    }

    const rows = db.prepare(sql).all(...params) as Array<{
        url: string;
        version: string;
        title: string;
        heading_path: string;
        content: string;
        score: number;
    }>;

    return rows.map(r => ({
        url: r.url,
        version: r.version,
        title: r.title,
        heading_path: (() => { try { return JSON.parse(r.heading_path); } catch { return []; } })(),
        content: r.content,
        score: r.score,
    }));
}

/**
 * Fetches the full cached markdown for a specific URL+version.
 */
export function getDocument(url: string, version: string = 'latest'): DocumentRow | null {
    return (db.prepare(
        `SELECT * FROM documents_v2 WHERE url = ? AND version = ?`
    ).get(url, version) as DocumentRow | undefined) ?? null;
}

/**
 * Returns the etag and last_modified for a cached document (for smart re-crawl).
 */
export function getCacheHeaders(url: string, version: string): { etag: string | null; last_modified: string | null } | null {
    const row = db.prepare(
        `SELECT etag, last_modified FROM documents_v2 WHERE url = ? AND version = ?`
    ).get(url, version) as { etag: string | null; last_modified: string | null } | undefined;
    return row ?? null;
}

/**
 * Counts total documents indexed across all versions.
 */
export function getDocumentCount(): number {
    const result = db.prepare(`SELECT COUNT(*) as count FROM documents_v2`).get() as { count: number };
    return result.count;
}

/**
 * Counts total chunks indexed (useful for understanding search corpus size).
 */
export function getChunkCount(): number {
    const result = db.prepare(`SELECT COUNT(*) as count FROM chunks`).get() as { count: number };
    return result.count;
}
