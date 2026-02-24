/**
 * Semantic Markdown Chunker
 *
 * Splits a full-page Markdown document into heading-based semantic chunks.
 * Each chunk carries the full heading breadcrumb path so LLM agents always
 * know the context of the content they are reading.
 *
 * Example input:
 *   # Authentication
 *   Some intro text.
 *   ## OAuth2 Flow
 *   Step 1: Get a token...
 *   ## API Keys
 *   Use the X-API-Key header...
 *
 * Produces 3 chunks:
 *   { heading_path: ["Authentication"], content: "Some intro text." }
 *   { heading_path: ["Authentication", "OAuth2 Flow"], content: "Step 1: Get a token..." }
 *   { heading_path: ["Authentication", "API Keys"], content: "Use the X-API-Key header..." }
 */

export interface Chunk {
    /** Full breadcrumb path from the document root, e.g. ["Authentication", "OAuth2 Flow"] */
    heading_path: string[];
    /** The markdown content of this section (excluding the heading line itself) */
    content: string;
}

/**
 * Splits markdown into semantic chunks based on ATX-style headings (# ## ###).
 * Content before any heading is collected under an empty heading_path.
 * Minimum content length to emit a chunk: 10 characters (excludes whitespace-only chunks).
 */
export function chunkMarkdown(markdown: string): Chunk[] {
    const lines = markdown.split('\n');
    const chunks: Chunk[] = [];

    // heading_stack tracks the current heading hierarchy at each level (1-6)
    const headingStack: string[] = [];

    let currentContent: string[] = [];
    let currentDepth = 0; // depth of the last heading that opened the current section

    function flush() {
        const text = currentContent.join('\n').trim();
        if (text.length >= 10) {
            chunks.push({
                heading_path: [...headingStack],
                content: text,
            });
        }
        currentContent = [];
    }

    for (const line of lines) {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            flush();
            const level = headingMatch[1].length; // 1 = H1, 2 = H2, …
            const title = headingMatch[2].trim()
                // Strip inline markdown: **bold**, _italic_, `code`, [text](url)
                .replace(/\*\*(.+?)\*\*/g, '$1')
                .replace(/\*(.+?)\*/g, '$1')
                .replace(/_(.+?)_/g, '$1')
                .replace(/`(.+?)`/g, '$1')
                .replace(/\[(.+?)\]\(.+?\)/g, '$1')
                .trim();

            // Trim the stack to be one level above the current heading,
            // then push the new heading at its level.
            headingStack.splice(level - 1, headingStack.length - (level - 1), title);
            currentDepth = level;
        } else {
            currentContent.push(line);
        }
    }

    flush();
    return chunks;
}
