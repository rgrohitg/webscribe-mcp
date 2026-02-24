/**
 * Smoke test: MCP client — tool listing and basic extraction
 *
 * Connects to the built MCP server via stdio and:
 * 1. Lists all available tools
 * 2. Calls read_and_extract_page on example.com
 *
 * Requires the server to be built first: npm run build
 *
 * Usage: tsx tests/smoke-mcp-client.ts
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function runTest() {
    console.log('Starting MCP Client smoke test...');

    const transport = new StdioClientTransport({
        command: 'node',
        args: ['./build/index.js'],
    });

    const client = new Client(
        { name: 'smoke-test-client', version: '2.0.0' },
        { capabilities: {} }
    );

    console.log('Connecting to server...');
    await client.connect(transport);

    console.log('Listing tools...');
    const tools = await client.listTools();
    const toolNames = tools.tools.map(t => t.name);
    console.log('Tools available:', toolNames);

    const expected = ['read_and_extract_page', 'crawl_documentation_site', 'crawl_component_docs', 'search_crawled_docs', 'get_document', 'get_index_stats'];
    for (const toolName of expected) {
        if (!toolNames.includes(toolName)) {
            console.error(`❌ Missing expected tool: ${toolName}`);
            process.exit(1);
        }
    }
    console.log('✓ All expected tools are present');

    console.log('\nTesting read_and_extract_page on https://example.com...');
    try {
        const result = await client.callTool({
            name: 'read_and_extract_page',
            arguments: { url: 'https://example.com' },
        });

        const content = result.content as Array<{ type: string; text: string }>;
        const text = content[0]?.text ?? '';
        if (!text || text.length < 50) {
            console.error('❌ Extraction returned empty content');
            process.exit(1);
        }
        console.log('✓ Extraction successful!');
        console.log('Content preview:', text.slice(0, 150) + '...');
    } catch (e) {
        console.error('❌ Tool execution failed:', e);
        process.exit(1);
    }

    console.log('\n✅ MCP client smoke test passed!');
    process.exit(0);
}

runTest().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
