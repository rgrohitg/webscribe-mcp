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
import { runCrawler, crawlComponentDocs, extractSinglePage, searchLocalDatasets } from "./crawler.js";

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
                            description: "The targeted version of the documentation (e.g., 'latest', 'v1', 'v2'). Defaults to 'latest'.",
                        },
                    },
                    required: ["url"],
                },
            },
            {
                name: "crawl_documentation_site",
                description: [
                    "Starts a queue at the given URL, extracts all links matching the base domain,",
                    "visits up to max_pages, converts each to Markdown, and saves them to a local dataset.",
                    "Automatically expands sub-tabs (/usage, /examples, /accessibility, /api) for every",
                    "component page discovered — works with any SPA or static docs site.",
                    "Use url_glob to restrict crawling to a specific path (e.g. '**/components/**').",
                    "Returns a summary of URLs successfully crawled.",
                ].join(" "),
                inputSchema: {
                    type: "object",
                    properties: {
                        start_url: { type: "string" },
                        max_pages: { type: "number", default: 10 },
                        version: {
                            type: "string",
                            description: "The targeted version of the documentation (e.g., 'latest', 'v1', 'v2'). Defaults to 'latest'.",
                        },
                        url_glob: {
                            type: "string",
                            description: [
                                "Optional glob pattern to restrict which URLs get enqueued.",
                                "Example: '**/components/**' will only crawl pages under /components/.",
                                "Defaults to any page on the same hostname.",
                            ].join(" "),
                        },
                        expand_tabs: {
                            type: "boolean",
                            description: [
                                "When true (default), automatically enqueues common sub-tab variants",
                                "(/usage, /examples, /accessibility, /api, /props, /code) for every",
                                "page URL discovered. Set to false to disable this behaviour.",
                            ].join(" "),
                            default: true,
                        },
                    },
                    required: ["start_url"],
                },
            },
            {
                name: "crawl_component_docs",
                description: [
                    "Smart crawler for component index pages (e.g. /components/ on any design system).",
                    "Opens the index page, discovers all component links one level deep,",
                    "then enqueues every component's sub-tab pages (/usage, /examples, /accessibility, /api).",
                    "Works generically for Salt DS, MUI, Ant Design, Chakra, and any similar docs site.",
                    "Returns a list of all successfully crawled URLs.",
                ].join(" "),
                inputSchema: {
                    type: "object",
                    properties: {
                        index_url: {
                            type: "string",
                            description: "URL of the component listing page, e.g. https://saltdesignsystem.com/salt/components/",
                        },
                        max_pages: { type: "number", default: 200 },
                        version: {
                            type: "string",
                            description: "The targeted version of the documentation (e.g., 'latest', 'v1', 'v2'). Defaults to 'latest'.",
                        },
                    },
                    required: ["index_url"],
                },
            },
            {
                name: "search_crawled_docs",
                description: "Reads the local SQLite dataset and returns the Markdown content of pages that mention the query.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string" },
                        version: {
                            type: "string",
                            description: "Explicitly filter search results to a specific documentation version (e.g., 'v17').",
                        },
                    },
                    required: ["query"],
                },
            },
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        // ── read_and_extract_page ──────────────────────────────────────────────
        if (request.params.name === "read_and_extract_page") {
            const url = request.params.arguments?.url as string;
            const version = (request.params.arguments?.version as string) || "latest";
            if (!url) throw new Error("url is required");

            const markdown = await extractSinglePage(url, version);
            return {
                content: [{ type: "text", text: markdown }],
            };
        }

        // ── crawl_documentation_site ──────────────────────────────────────────
        if (request.params.name === "crawl_documentation_site") {
            const startUrl = request.params.arguments?.start_url as string;
            const maxPages = (request.params.arguments?.max_pages as number) || 10;
            const version = (request.params.arguments?.version as string) || "latest";
            const urlGlob = request.params.arguments?.url_glob as string | undefined;
            const expandTabs = request.params.arguments?.expand_tabs !== false; // default true
            if (!startUrl) throw new Error("start_url is required");

            const crawledUrls = await runCrawler(startUrl, version, maxPages, urlGlob, expandTabs);
            return {
                content: [{
                    type: "text",
                    text: `Successfully crawled ${crawledUrls.length} pages:\n${crawledUrls.join('\n')}`,
                }],
            };
        }

        // ── crawl_component_docs ───────────────────────────────────────────────
        if (request.params.name === "crawl_component_docs") {
            const indexUrl = request.params.arguments?.index_url as string;
            const maxPages = (request.params.arguments?.max_pages as number) || 200;
            const version = (request.params.arguments?.version as string) || "latest";
            if (!indexUrl) throw new Error("index_url is required");

            const crawledUrls = await crawlComponentDocs(indexUrl, version, maxPages);
            return {
                content: [{
                    type: "text",
                    text: `Successfully crawled ${crawledUrls.length} component pages:\n${crawledUrls.join('\n')}`,
                }],
            };
        }

        // ── search_crawled_docs ────────────────────────────────────────────────
        if (request.params.name === "search_crawled_docs") {
            const query = request.params.arguments?.query as string;
            const version = request.params.arguments?.version as string | undefined;
            if (!query) throw new Error("query is required");

            const results = await searchLocalDatasets(query, version);

            if (results.length === 0) {
                return { content: [{ type: "text", text: "No results found." }] };
            }

            const formattedResults = results
                .map(r => `## ${r.title} (Version: ${r.version}) - ${r.url}\n\n${r.content}`)
                .join('\n\n---\n\n');

            return {
                content: [{ type: "text", text: formattedResults }],
            };
        }

        throw new Error(`Tool not found: ${request.params.name}`);
    } catch (err: unknown) {
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
