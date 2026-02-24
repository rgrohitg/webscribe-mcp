/**
 * Smoke test: MCP client — full crawl and search workflow
 *
 * Connects to the built MCP server via stdio and:
 * 1. Crawls playwright.dev/docs/intro (max 3 pages)
 * 2. Searches the indexed results for "playwright"
 * 3. Verifies the structured JSON output format
 *
 * Requires the server to be built first: npm run build
 *
 * Usage: tsx tests/smoke-mcp-crawl.ts
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function runCrawlTest() {
    console.log('Starting MCP crawl + search smoke test...');

    const transport = new StdioClientTransport({
        command: 'node',
        args: ['./build/index.js'],
    });

    const client = new Client(
        { name: 'smoke-crawl-client', version: '2.0.0' },
        { capabilities: {} }
    );

    console.log('Connecting to server...');
    await client.connect(transport);

    const testUrl = 'https://playwright.dev/docs/intro';
    console.log(`\nCrawling ${testUrl} (max 3 pages)...`);

    try {
        const crawlResult = await client.callTool({
            name: 'crawl_documentation_site',
            arguments: { start_url: testUrl, max_pages: 3 },
        });

        const crawlText = (crawlResult.content[0] as any).text;
        const crawlData = JSON.parse(crawlText);
        console.log(`✓ Crawled ${crawlData.crawled_count} pages`);
        console.log('URLs:', crawlData.urls);

        console.log('\nSearching for "playwright"...');
        const searchResult = await client.callTool({
            name: 'search_crawled_docs',
            arguments: { query: 'playwright' },
        });

        const searchText = (searchResult.content[0] as any).text;
        const searchData = JSON.parse(searchText);

        console.log(`✓ Found ${searchData.results.length} results`);
        if (searchData.results.length > 0) {
            const top = searchData.results[0];
            console.log('Top result:');
            console.log(`  URL: ${top.url}`);
            console.log(`  Heading: ${JSON.stringify(top.heading_path)}`);
            console.log(`  Score: ${top.score}`);
            console.log(`  Preview: ${top.content.slice(0, 150)}...`);
        }

        console.log('\n✅ Crawl + search smoke test passed!');
    } catch (e) {
        console.error('❌ Test failed:', e);
        process.exit(1);
    }

    process.exit(0);
}

runCrawlTest().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
