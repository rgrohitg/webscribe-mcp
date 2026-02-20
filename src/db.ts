import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Define the permanent storage location in the user's home directory.
// This prevents the DB from being wiped if the user updates the npm package via npx.
const DB_DIR = path.join(os.homedir(), '.universal-docs-mcp');
const DB_PATH = path.join(DB_DIR, 'documents.db');

// Ensure the target directory exists before initializing SQLite
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

// Enable Write-Ahead Logging for maximum concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize the core caching table with versioning support.
// A composite PRIMARY KEY of (url, version) allows parallel major versions of a framework
// (like React v17 vs React v18) to comfortably coexist on the exact same root URLs.

// We run a safety migration down here to ensure existing databases are seamlessly upgraded.
db.exec(`
    CREATE TABLE IF NOT EXISTS documents_v2 (
        url TEXT NOT NULL,
        version TEXT NOT NULL DEFAULT 'latest',
        domain TEXT NOT NULL,
        title TEXT NOT NULL,
        markdown TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (url, version)
    );

    -- Migrate old data if the legacy 'documents' table exists
    INSERT OR IGNORE INTO documents_v2 (url, domain, title, markdown, timestamp)
    SELECT url, domain, title, markdown, timestamp FROM documents WHERE EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='documents');

    -- Drop the legacy table
    DROP TABLE IF EXISTS documents;
`);

/**
 * Inserts or completely overwrites an existing document cache for a specific version.
 */
export function upsertDocument(url: string, version: string, domain: string, title: string, markdown: string) {
    const stmt = db.prepare(`
        INSERT INTO documents_v2 (url, version, domain, title, markdown, timestamp) 
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(url, version) DO UPDATE SET 
            title=excluded.title, 
            markdown=excluded.markdown,
            timestamp=CURRENT_TIMESTAMP
    `);
    stmt.run(url, version, domain, title, markdown);
}

/**
 * Executes a blazing fast local text search across all cached markdown.
 * Optionally filters the search exclusively to a specific documentation version.
 */
export function searchDocuments(query: string, version?: string): Array<{ url: string, version: string, title: string, markdown: string }> {
    let sql = `
        SELECT url, version, title, markdown 
        FROM documents_v2 
        WHERE (markdown LIKE ? OR title LIKE ?)
    `;
    const params: any[] = [`%${query}%`, `%${query}%`];

    if (version) {
        sql += ` AND version = ?`;
        params.push(version);
    }

    sql += ` LIMIT 50`;

    const stmt = db.prepare(sql);
    return stmt.all(...params) as any;
}

/**
 * Counts how many total documents have been indexed across all versions.
 */
export function getDocumentCount(): number {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM documents_v2`);
    const result = stmt.get() as { count: number };
    return result.count;
}
