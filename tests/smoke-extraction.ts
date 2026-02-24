/**
 * Smoke test: single page extraction
 *
 * Manually run to verify Playwright extraction works end-to-end.
 * Not a unit test — exits with process.exit(0) on success.
 *
 * Usage: tsx tests/smoke-extraction.ts
 */
import { extractSinglePage } from '../src/crawler.js';

async function test() {
    console.log('Testing single page extraction...');
    const url = 'https://example.com';
    try {
        const md = await extractSinglePage(url);
        console.log('Extraction successful!');
        console.log('---');
        console.log(md);
        console.log('---');
    } catch (e) {
        console.error('Error during extraction:', e);
        process.exit(1);
    }
    // Explicitly exit since Playwright keeps the process alive
    process.exit(0);
}

test();
