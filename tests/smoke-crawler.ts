/**
 * Smoke test: BFS crawler
 *
 * Manually run to verify the BFS crawler visits and indexes pages.
 * Crawls a small, stable public site (max 3 pages).
 *
 * Usage: tsx tests/smoke-crawler.ts
 */
import { runCrawler } from '../src/crawler.js';

async function test() {
    console.log('Crawling https://turndown.js.org/ (max 3 pages)...');
    try {
        const urls = await runCrawler('https://turndown.js.org/', 'latest', 3);
        console.log('Crawled URLs:', urls);
    } catch (e) {
        console.error('Test failed', e);
        process.exit(1);
    }
    process.exit(0);
}

test();
