#!/usr/bin/env node

import "./setup.js";

// CRITICAL: MCP over stdio requires stdout to be strictly JSON-RPC messages.
// Redirect all console.log output to stderr to prevent protocol corruption.
console.log = function () {
    console.error.apply(console, arguments as any);
};

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { runCrawler, crawlComponentDocs, extractSinglePage, searchLocalDatasets } from "./crawler.js";
import { getDocument, getDocumentCount, getChunkCount } from "./db.js";

const server = new Server(
    { name: "universal-docs-mcp", version: "2.0.0" },
    { capabilities: { tools: {} } }
);

// ── Tool definitions ───────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "read_and_extract_page",
                description: [
                    "Visits a single page, strips nav/footer, converts to Markdown, caches it, and returns the Markdown.",
                    "Automatically detects the site framework (Docusaurus, VitePress, MkDocs, ReadTheDocs, etc.)",
                    "and uses the optimal CSS selectors. Code blocks are returned with explicit language tags.",
                ].join(" "),
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
                    "Tries sitemap.xml discovery first for more comprehensive URL seeding.",
                    "Respects robots.txt rules and enforces crawl-delay between requests.",
                    "Automatically expands sub-tabs (/usage, /examples, /accessibility, /api) for every",
                    "component page discovered — works with any SPA or static docs site.",
                    "Skips pages that haven't changed since the last crawl (ETag/Last-Modified).",
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
                            description: "Optional path filter. Example: '**/components/**' only crawls pages under /components/.",
                        },
                        expand_tabs: {
                            type: "boolean",
                            description: "When true (default), enqueues /usage, /examples, /accessibility, /api, /props, /code sub-tab variants.",
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
                    "then crawls every component + its sub-tab pages concurrently (3 pages at once).",
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
                description: [
                    "Searches the local SQLite dataset using FTS5 full-text search (BM25 ranking).",
                    "Returns a structured JSON array of matching chunks — each with url, title, heading_path,",
                    "content, and relevance score. heading_path gives the full breadcrumb context",
                    "(e.g. [\"Authentication\", \"OAuth2 Flow\"]) so agents know exactly where the content sits.",
                    "Optionally filter results to a specific documentation version.",
                ].join(" "),
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
            {
                name: "get_document",
                description: [
                    "Retrieves the full cached Markdown for a specific URL and version.",
                    "Use this after search_crawled_docs to fetch the complete page content",
                    "when a matched chunk alone is insufficient context.",
                ].join(" "),
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string" },
                        version: {
                            type: "string",
                            description: "Documentation version. Defaults to 'latest'.",
                        },
                    },
                    required: ["url"],
                },
            },
            {
                name: "get_index_stats",
                description: "Returns the total number of pages and chunks in the local documentation index.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
        ],
    };
});

// ── Tool execution ─────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const args = request.params.arguments ?? {};

        // ── read_and_extract_page ────────────────────────────────────────────────
        if (request.params.name === "read_and_extract_page") {
            const url = args.url as string;
            const version = (args.version as string) || "latest";
            if (!url) throw new Error("url is required");

            const markdown = await extractSinglePage(url, version);
            return { content: [{ type: "text", text: markdown }] };
        }

        // ── crawl_documentation_site ─────────────────────────────────────────────
        if (request.params.name === "crawl_documentation_site") {
            const startUrl = args.start_url as string;
            const maxPages = (args.max_pages as number) || 10;
            const version = (args.version as string) || "latest";
            const urlGlob = args.url_glob as string | undefined;
            const expandTabs = args.expand_tabs !== false;
            if (!startUrl) throw new Error("start_url is required");

            const crawledUrls = await runCrawler(startUrl, version, maxPages, urlGlob, expandTabs);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        crawled_count: crawledUrls.length,
                        urls: crawledUrls,
                    }, null, 2),
                }],
            };
        }

        // ── crawl_component_docs ─────────────────────────────────────────────────
        if (request.params.name === "crawl_component_docs") {
            const indexUrl = args.index_url as string;
            const maxPages = (args.max_pages as number) || 200;
            const version = (args.version as string) || "latest";
            if (!indexUrl) throw new Error("index_url is required");

            const crawledUrls = await crawlComponentDocs(indexUrl, version, maxPages);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        crawled_count: crawledUrls.length,
                        urls: crawledUrls,
                    }, null, 2),
                }],
            };
        }

        // ── search_crawled_docs ──────────────────────────────────────────────────
        if (request.params.name === "search_crawled_docs") {
            const query = args.query as string;
            const version = args.version as string | undefined;
            if (!query) throw new Error("query is required");

            const results = await searchLocalDatasets(query, version);

            if (results.length === 0) {
                return { content: [{ type: "text", text: JSON.stringify({ results: [] }) }] };
            }

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ results }, null, 2),
                }],
            };
        }

        // ── get_document ─────────────────────────────────────────────────────────
        if (request.params.name === "get_document") {
            const url = args.url as string;
            const version = (args.version as string) || "latest";
            if (!url) throw new Error("url is required");

            const doc = getDocument(url, version);
            if (!doc) {
                return {
                    content: [{ type: "text", text: `No cached document found for: ${url} (version: ${version})` }],
                };
            }
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        url: doc.url,
                        version: doc.version,
                        title: doc.title,
                        timestamp: doc.timestamp,
                        markdown: doc.markdown,
                    }, null, 2),
                }],
            };
        }

        // ── get_index_stats ──────────────────────────────────────────────────────
        if (request.params.name === "get_index_stats") {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        total_pages: getDocumentCount(),
                        total_chunks: getChunkCount(),
                    }, null, 2),
                }],
            };
        }

        throw new Error(`Tool not found: ${request.params.name}`);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
            content: [{ type: "text", text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
});

// ── Server startup ─────────────────────────────────────────────────────────────

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Universal Docs MCP Server v2.0 running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
