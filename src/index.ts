#!/usr/bin/env node

import "./setup.js";

// CRITICAL: MCP over stdio requires stdout to be strictly JSON-RPC messages.
// We must redirect all standard console.log output to stderr to prevent corruption.
const originalConsoleLog = console.log;
console.log = function () {
    console.error.apply(console, arguments as any);
};

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { runCrawler, extractSinglePage, searchLocalDatasets } from "./crawler.js";

const server = new Server(
    {
        name: "universal-docs-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Registers the available tools with the MCP SDK.
 * - read_and_extract_page: Fetches and converts a single page to Markdown.
 * - crawl_documentation_site: Crawls a domain breadth-first, converting matching pages.
 * - search_crawled_docs: Performs a local text search across crawled datasets.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "read_and_extract_page",
                description: "Visits a single page, strips nav/footer, converts to Markdown, caches it, and returns the Markdown.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string" },
                        version: {
                            type: "string",
                            description: "The targeted version of the documentation (e.g., 'latest', 'v1', 'v2'). Defaults to 'latest'."
                        }
                    },
                    required: ["url"]
                }
            },
            {
                name: "crawl_documentation_site",
                description: "Starts a queue, extracts all links matching the base domain, visits up to max_pages, converts all to Markdown, and saves them to a local dataset. Returns a summary of URLs successfully crawled.",
                inputSchema: {
                    type: "object",
                    properties: {
                        start_url: { type: "string" },
                        max_pages: { type: "number", default: 10 },
                        version: {
                            type: "string",
                            description: "The targeted version of the documentation (e.g., 'latest', 'v1', 'v2'). Defaults to 'latest'."
                        }
                    },
                    required: ["start_url"]
                }
            },
            {
                name: "search_crawled_docs",
                description: "Reads the Crawlee local datasets and returns the Markdown content of pages that mention the query.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string" },
                        version: {
                            type: "string",
                            description: "Explicitly filter search results to a specific documentation version (e.g., 'v17')."
                        }
                    },
                    required: ["query"]
                }
            }
        ]
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        if (request.params.name === "read_and_extract_page") {
            const url = request.params.arguments?.url as string;
            const version = (request.params.arguments?.version as string) || "latest";
            if (!url) throw new Error("url is required");

            const markdown = await extractSinglePage(url, version);
            return {
                content: [{ type: "text", text: markdown }]
            };
        }

        if (request.params.name === "crawl_documentation_site") {
            const startUrl = request.params.arguments?.start_url as string;
            const maxPages = (request.params.arguments?.max_pages as number) || 10;
            const version = (request.params.arguments?.version as string) || "latest";
            if (!startUrl) throw new Error("start_url is required");

            const crawledUrls = await runCrawler(startUrl, version, maxPages);
            return {
                content: [{ type: "text", text: `Successfully crawled ${crawledUrls.length} pages:\n${crawledUrls.join('\n')}` }]
            };
        }

        if (request.params.name === "search_crawled_docs") {
            const query = request.params.arguments?.query as string;
            const version = request.params.arguments?.version as string | undefined;
            if (!query) throw new Error("query is required");

            const results = await searchLocalDatasets(query, version);

            if (results.length === 0) {
                return { content: [{ type: "text", text: "No results found." }] };
            }

            // Expose the version directly in the LLM response context so the AI knows which version it's reading
            const formattedResults = results.map(r => `## ${r.title} (Version: ${r.version}) - ${r.url}\n\n${r.content}`).join('\n\n---\n\n');
            return {
                content: [{ type: "text", text: formattedResults }]
            };
        }

        throw new Error(`Tool not found: ${request.params.name}`);
    } catch (err: unknown) {
        // Narrow the error type to safely access the message property
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
            content: [{ type: "text", text: `Error executing tool: ${errorMessage}` }],
            isError: true,
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Universal Docs MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
