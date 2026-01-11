import type { HLJSApi } from "highlight.js";

let hljs: HLJSApi | null = null;
let hljsPromise: Promise<HLJSApi> | null = null;

// Language mapping for unsupported languages
const LANGUAGE_MAP: Record<string, string> = {
  vue: "xml",
  "vue-html": "xml",
  prisma: "typescript",
  text: "plaintext",
};

// Languages available in highlight.js common bundle
const SUPPORTED_LANGUAGES = [
  "typescript",
  "javascript",
  "css",
  "bash",
  "json",
  "sql",
  "html",
  "shell",
  "xml",
  "plaintext",
];

/**
 * Composable for syntax highlighting using highlight.js
 * Lazy loads the highlighter on first use
 */
export function useHighlight() {
  const isLoading = ref(false);

  /**
   * Initialize and get the highlight.js instance
   * Uses singleton pattern with lazy loading
   */
  const getHighlighter = async (): Promise<HLJSApi> => {
    if (hljs) {
      return hljs;
    }

    if (hljsPromise) {
      return hljsPromise;
    }

    isLoading.value = true;

    hljsPromise = (async () => {
      // Import common languages bundle (includes ~40 popular languages)
      const hljsModule = await import("highlight.js/lib/common");
      hljs = hljsModule.default;
      isLoading.value = false;
      return hljsModule.default;
    })();

    return hljsPromise;
  };

  /**
   * Highlight code with syntax coloring
   * @param code - The code string to highlight
   * @param lang - The language identifier
   * @returns HTML string with syntax highlighting
   */
  const highlight = async (code: string, lang: string): Promise<string> => {
    // Handle plaintext as a special case - return pre-formatted HTML
    if (lang === "plaintext" || lang === "text") {
      const escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<pre class="hljs"><code>${escaped}</code></pre>`;
    }

    const hl = await getHighlighter();

    // Map unsupported languages to fallbacks
    const mappedLang = LANGUAGE_MAP[lang] || lang;
    const validLang = SUPPORTED_LANGUAGES.includes(mappedLang) ? mappedLang : "plaintext";

    try {
      const result = hl.highlight(code, { language: validLang });
      return `<pre class="hljs"><code>${result.value}</code></pre>`;
    } catch {
      // Fallback to plaintext if highlighting fails
      const escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<pre class="hljs"><code>${escaped}</code></pre>`;
    }
  };

  return {
    highlight,
    isLoading: readonly(isLoading),
    getHighlighter,
  };
}
