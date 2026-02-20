# Universal Docs Crawler MCP Server

An MCP (Model Context Protocol) server designed to intelligently crawl, extract, and convert web documentation and Single Page Applications (SPAs) into pristine, LLM-ready markdown.

Under the hood, this server uses [Crawlee](https://crawlee.dev/) with **Playwright** to execute JavaScript and await network idle, meaning it effortlessly extracts content from modern React/Vue/SPA documentation hubs that standard HTML scrapers fail on.

## Features
- **Headless Browser Crawling**: Uses Playwright to render JavaScript-heavy sites before extraction.
- **Pristine Markdown Parsing**: Uses Mozilla's Readability to strip headers and footers, combined with Turndown for clean Markdown generation.
- **Persistent SQLite Storage**: Extracted pages are locally cached into a blazing fast `~/.universal-docs-mcp/documents.db` SQLite database to survive npm upgrades and serve instantaneous LLM search queries.
- **Same-Domain Constraint**: Built-in breadth-first crawling constraints specifically locked to the target documentation domain.

## Installation

You do not need to clone this repository to use the MCP Server in your local workflow. You can run it directly using `npx`.

### Connect to Antigravity, Cursor, or Claude Desktop

Add the following to your MCP configuration file (`mcp_config.json` or `claude_desktop_config.json`):

```json
"universal-docs-mcp": {
  "command": "npx",
  "args": ["-y", "universal-docs-mcp"]
}
```

## Available Tools

The server exposes three powerful tools for AI Agents and users:

1. **`read_and_extract_page(url)`**
   Target a specific URL. It visits the page, executes JS, extracts the main article, converts it to Markdown, and caches the result locally.

2. **`crawl_documentation_site(start_url, max_pages=10)`**
   Points the crawler at a root documentation URL. It discovers links matching the root domain and executes a breadth-first search up to the `max_pages` limit. Highly effective for archiving entire API sets.

3. **`search_crawled_docs(query)`**
   A blazing fast local search. Scans the local dataset cache and returns the exact Markdown bodies of any documentation that mentions your query.


## Local Development & Contributing

If you wish to modify the crawler logic or add new tools:

1. Clone the repository and install dependencies:
```bash
npm install
```

2. The server must be transcompiled before execution. Build the TypeScript source:
```bash
npm run build
```

3. (Optional) Run the development test clients to isolate extraction testing without an MCP host:
```bash
npx tsx test-client.ts
npx tsx test-extraction.ts
```

## License
MIT License. See [LICENSE](LICENSE) for details.
