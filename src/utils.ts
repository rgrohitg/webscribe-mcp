import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
// @ts-ignore - no type declarations for turndown-plugin-gfm
import { gfm } from 'turndown-plugin-gfm';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
});

// Enable GitHub Flavored Markdown (tables, strikethrough, etc.)
turndownService.use(gfm);

/**
 * A set of CSS selectors, tried in order, to find the main content element.
 * Works generically across docs sites, design systems, and SPAs.
 * The list is ordered from most-specific (ideal) to least-specific (fallback).
 */
const CONTENT_SELECTORS = [
    // Semantic role selectors (most reliable across all frameworks)
    'main',
    '[role="main"]',
    // Common docs frameworks
    'article',
    '.article',
    '.content',
    '.main-content',
    '.doc-content',
    '.docs-content',
    '.page-content',
    '.markdown-body',       // GitHub / many static doc sites
    '.prose',               // Tailwind Prose
    '#content',
    '#main-content',
    '#main',
    // Docusaurus
    '.docMainContainer',
    '.docPage',
    '.container .row',
    // ReadTheDocs / Sphinx
    '.rst-content',
    '.document',
    // Material for MkDocs
    '.md-content',
    '.md-content__inner',
    // Salt DS / custom React doc sites
    '[class*="content"]',
    '[class*="Content"]',
    '[class*="article"]',
    '[class*="Article"]',
];

/**
 * Selectors for elements to REMOVE from the page before extraction.
 * Works generically — removes nav, headers, sidebars, footers, cookie banners, ads.
 */
const NOISE_SELECTORS = [
    'header', 'nav', 'footer',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '.sidebar', '.side-nav', '.side-bar', '.toc', '.table-of-contents',
    '#sidebar', '#side-nav', '#toc',
    '.nav', '.navigation', '.navbar', '.breadcrumb', '.breadcrumbs',
    '.cookie-banner', '.cookie-consent', '#onetrust-consent-sdk',
    '[class*="cookie"]', '[id*="cookie"]',
    '.overlay', '.modal', '.dialog',
    '.ads', '.advertisement', '.ad-banner',
    'script', 'style', 'noscript',
    '[aria-hidden="true"]',
    '.skip-nav', '.skip-link',
];

/**
 * Extracts the main article content from raw HTML and converts it to clean Markdown.
 *
 * Strategy (in priority order):
 * 1. Remove all known noise elements (nav, footer, sidebars, cookie banners, etc.)
 * 2. Find the best content container using a prioritized list of CSS selectors
 * 3. Fall back to <body> if no container matches
 * 4. Convert to Markdown using Turndown with GFM tables support
 *
 * This approach works generically for:
 * - Static HTML sites (MDN, ReadTheDocs, Sphinx)
 * - React/Vue/Angular SPAs (Salt DS, Storybook, MUI)
 * - Docusaurus, VitePress, MkDocs, Nextra
 * - Any site that uses semantic <main> or role="main"
 *
 * @param html The raw HTML string (already rendered by Playwright).
 * @param url The absolute URL — used by JSDOM to resolve relative hrefs.
 * @returns Clean Markdown string ready for LLM consumption.
 */
export function extractMarkdownPristine(html: string, url: string): string {
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // ── Step 1: Strip noise elements ──────────────────────────────────────────
    for (const selector of NOISE_SELECTORS) {
        try {
            document.querySelectorAll(selector).forEach(el => el.remove());
        } catch {
            // Some selectors may be invalid in jsdom — silently skip
        }
    }

    // ── Step 2: Find the best content container ────────────────────────────────
    let contentEl: Element | null = null;
    for (const selector of CONTENT_SELECTORS) {
        try {
            const el = document.querySelector(selector);
            if (el && (el.textContent?.trim().length ?? 0) > 100) {
                contentEl = el;
                break;
            }
        } catch {
            // Invalid selector in jsdom — skip
        }
    }

    // ── Step 3: Fall back to body ──────────────────────────────────────────────
    const sourceHtml = contentEl
        ? contentEl.innerHTML
        : document.body?.innerHTML ?? html;

    // ── Step 4: Convert to Markdown ────────────────────────────────────────────
    return turndownService.turndown(sourceHtml);
}
