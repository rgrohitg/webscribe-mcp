/**
 * Smoke test: Salt Design System Card component extraction
 *
 * Manually run to verify a specific component page extracts correctly.
 * Writes the result to card-usage.md for manual inspection.
 *
 * Usage: tsx tests/smoke-card.ts
 */
import { extractSinglePage } from '../src/crawler.js';
import fs from 'fs';

async function run() {
    const url = 'https://www.saltdesignsystem.com/salt/components/card/usage';
    console.log(`Extracting: ${url}`);
    try {
        const markdown = await extractSinglePage(url);
        const outFile = 'card-usage.md';
        fs.writeFileSync(outFile, markdown);
        console.log(`Extraction complete! Written to ${outFile} (${markdown.length} chars)`);
    } catch (e) {
        console.error('Extraction failed:', e);
        process.exit(1);
    }
    process.exit(0);
}

run();
