/**
 * Site Profiles / Recipes
 *
 * Defines per-framework content and noise selectors so the crawler can precisely
 * extract the right content from known documentation frameworks.
 *
 * When a URL matches a profile's hostname_pattern, those selectors override the
 * generic fallback lists in utils.ts.
 *
 * All profiles are bundled in-package — no external config file required.
 */

export interface SiteProfile {
    /** Human-readable name of the profile */
    name: string;
    /** Regex pattern matched against the full URL (protocol + hostname + path) */
    url_pattern: RegExp;
    /** Ordered list of CSS selectors to find the main content container */
    content_selectors: string[];
    /** CSS selectors for noise elements to remove before extraction */
    noise_selectors: string[];
    /** Sub-tab URL suffixes to probe for this site (overrides the global list if set) */
    sub_tab_suffixes?: string[];
}

export const SITE_PROFILES: SiteProfile[] = [
    // ── Docusaurus ──────────────────────────────────────────────────────────────
    {
        name: 'Docusaurus',
        url_pattern: /docusaurus|facebook\.github\.io/i,
        content_selectors: [
            'article.markdown',           // v3
            '.theme-doc-markdown',        // v2 / v3
            'article',
            '.docMainContainer',
            '.docPage',
        ],
        noise_selectors: [
            'nav.navbar', 'nav.theme-doc-sidebar-container',
            '.tableOfContents', '.theme-doc-toc-desktop',
            'footer', '.pagination-nav', '.docusaurus-mt-lg',
            '.theme-admonition-caution img', // noisy icons
        ],
    },

    // ── VitePress (Vue docs, Vite, etc.) ────────────────────────────────────────
    {
        name: 'VitePress',
        url_pattern: /vitepress|vitejs\.dev|vuejs\.org/i,
        content_selectors: [
            '.vp-doc',
            '.content-container .content',
            'main',
        ],
        noise_selectors: [
            '.VPNav', '.VPSidebar', '.VPLocalNav',
            '.VPDocOutlineItem', '.VPFooter',
            'footer', 'aside',
        ],
    },

    // ── Material for MkDocs ─────────────────────────────────────────────────────
    {
        name: 'MkDocs Material',
        url_pattern: /mkdocs|squidfunk\.github\.io/i,
        content_selectors: [
            '.md-content__inner',
            '.md-content',
            'article',
        ],
        noise_selectors: [
            '.md-header', '.md-sidebar', '.md-footer',
            '.md-nav', '.md-search',
            'nav', 'footer',
        ],
    },

    // ── Nextra (Next.js-based docs — Vercel, SWR, etc.) ────────────────────────
    {
        name: 'Nextra',
        url_pattern: /nextra|vercel\.com\/docs|swr\.vercel\.app/i,
        content_selectors: [
            'article',
            '.nextra-content',
            'main article',
        ],
        noise_selectors: [
            'nav', 'aside', 'footer',
            '.nextra-sidebar-container',
            '.nextra-toc',
        ],
    },

    // ── ReadTheDocs / Sphinx ────────────────────────────────────────────────────
    {
        name: 'ReadTheDocs / Sphinx',
        url_pattern: /readthedocs\.io|readthedocs\.org|\.readthedocs\./i,
        content_selectors: [
            '.rst-content',
            'div[role="main"]',
            '.document',
        ],
        noise_selectors: [
            '.wy-side-nav-search', '.wy-nav-side', '.wy-nav-top',
            '.wy-breadcrumbs', '.rst-footer-buttons',
            'footer', 'nav',
        ],
    },

    // ── Cube.dev docs ───────────────────────────────────────────────────────────
    {
        name: 'Cube.dev',
        url_pattern: /cube\.dev/i,
        content_selectors: ['main', 'article', '[class*="content"]'],
        noise_selectors: ['nav', 'header', 'footer', 'aside', '[class*="sidebar"]'],
    },

    // ── Stripe docs ─────────────────────────────────────────────────────────────
    {
        name: 'Stripe',
        url_pattern: /stripe\.com\/docs/i,
        content_selectors: ['.article-body', 'article', 'main'],
        noise_selectors: ['nav', 'header', 'footer', 'aside', '.toc-container'],
    },

    // ── Generic fallback (matches everything) ───────────────────────────────────
    {
        name: 'Generic',
        url_pattern: /.*/,
        content_selectors: [],   // utils.ts will use CONTENT_SELECTORS
        noise_selectors: [],     // utils.ts will use NOISE_SELECTORS
    },
];

/**
 * Returns the most specific matching profile for the given URL,
 * or the Generic fallback if none match.
 */
export function getProfile(url: string): SiteProfile {
    for (const profile of SITE_PROFILES) {
        if (profile.url_pattern.test(url)) {
            return profile;
        }
    }
    return SITE_PROFILES[SITE_PROFILES.length - 1]; // Generic fallback
}
