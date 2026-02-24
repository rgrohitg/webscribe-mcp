import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
// @ts-ignore - no type declarations for turndown-plugin-gfm
import { gfm } from 'turndown-plugin-gfm';
import type { SiteProfile } from './profiles.js';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
});

// Enable GitHub Flavored Markdown (tables, strikethrough, task lists)
turndownService.use(gfm);

// ── Code block language detection ──────────────────────────────────────────────
// Intercept <pre><code> blocks and extract the language from CSS class names.
// Handles Prism.js (language-*), Highlight.js (hljs + language-*), and plain class patterns.
turndownService.addRule('fencedCodeBlock', {
    filter(node) {
        return (
            node.nodeName === 'PRE' &&
            node.firstChild != null &&
            (node.firstChild as Element).nodeName === 'CODE'
        );
    },
    replacement(_content, node) {
        const codeEl = (node as Element).querySelector('code');
        if (!codeEl) return _content;

        // Detect language from class names (Prism, Highlight.js, GitHub)
        const lang = detectLanguage(codeEl.className);
        const code = codeEl.textContent ?? '';
        return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
    },
});

/**
 * Detects the programming language from a CSS class string.
 * Supports: language-*, lang-*, prism-*, hljs-*, syntax-*
 */
function detectLanguage(className: string): string {
    const patterns = [
        /\blanguage-(\w[\w.-]*)/i,
        /\blang-(\w[\w.-]*)/i,
        /\bprism-(\w[\w.-]*)/i,
        /\bhljs-(\w[\w.-]*)/i,
        /\bsyntax-(\w[\w.-]*)/i,
    ];
    for (const re of patterns) {
        const m = className.match(re);
        if (m) {
            // Normalise common aliases
            const lang = m[1].toLowerCase();
            const aliases: Record<string, string> = {
                js: 'javascript',
                ts: 'typescript',
                py: 'python',
                rb: 'ruby',
                sh: 'bash',
                yml: 'yaml',
                md: 'markdown',
            };
            return aliases[lang] ?? lang;
        }
    }
    return ''; // No language detected — produce ``` without a label
}

// ── Generic selectors (used when no site profile matches) ──────────────────────

/**
 * Ordered list of CSS selectors to find the main content container.
 * Tried top-to-bottom; stops at the first match with sufficient text.
 */
const GENERIC_CONTENT_SELECTORS = [
    'main',
    '[role="main"]',
    'article',
    '.article',
    '.content',
    '.main-content',
    '.doc-content',
    '.docs-content',
    '.page-content',
    '.markdown-body',
    '.prose',
    '#content',
    '#main-content',
    '#main',
    '.docMainContainer',
    '.docPage',
    '.container .row',
    '.rst-content',
    '.document',
    '.md-content',
    '.md-content__inner',
    '[class*="content"]',
    '[class*="Content"]',
    '[class*="article"]',
    '[class*="Article"]',
];

/**
 * CSS selectors for elements to remove before extraction.
 */
const GENERIC_NOISE_SELECTORS = [
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

// ── Main extraction function ───────────────────────────────────────────────────

/**
 * Extracts the main article content from raw HTML and converts it to clean Markdown.
 *
 * Strategy:
 * 1. Remove all noise elements (uses profile-specific selectors + generic fallback).
 * 2. Find the best content container (profile selectors first, then generic list).
 * 3. Fall back to <body> if no container matches.
 * 4. Convert to Markdown via Turndown + GFM + language-detected code blocks.
 *
 * Works with:
 * - Static HTML: MDN, ReadTheDocs, Sphinx
 * - SPAs: Salt DS, Storybook, MUI, Ant Design, Chakra
 * - Frameworks: Docusaurus, VitePress, MkDocs, Nextra
 * - Custom: Cube.dev, Stripe docs, any site using semantic <main>
 *
 * @param html    The raw HTML string (rendered by Playwright).
 * @param url     The absolute URL — used by JSDOM to resolve relative hrefs.
 * @param profile Optional site profile (overrides generic selectors when provided).
 * @returns Clean Markdown ready for LLM consumption.
 */
export function extractMarkdownPristine(html: string, url: string, profile?: SiteProfile): string {
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // ── Step 1: Strip noise elements ────────────────────────────────────────────
    const noiseSelectors = [
        ...(profile?.noise_selectors ?? []),
        ...GENERIC_NOISE_SELECTORS,
    ];
    for (const selector of noiseSelectors) {
        try {
            document.querySelectorAll(selector).forEach(el => el.remove());
        } catch { /* jsdom may reject some selectors */ }
    }

    // ── Step 2: Find the best content container ──────────────────────────────────
    const contentSelectors = [
        ...(profile?.content_selectors ?? []),
        ...GENERIC_CONTENT_SELECTORS,
    ];
    let contentEl: Element | null = null;
    for (const selector of contentSelectors) {
        try {
            const el = document.querySelector(selector);
            if (el && (el.textContent?.trim().length ?? 0) > 100) {
                contentEl = el;
                break;
            }
        } catch { /* invalid selector */ }
    }

    // ── Step 3: Fall back to body ────────────────────────────────────────────────
    const sourceHtml = contentEl
        ? contentEl.innerHTML
        : document.body?.innerHTML ?? html;

    // ── Step 4: Convert to Markdown ──────────────────────────────────────────────
    return turndownService.turndown(sourceHtml);
}
