import type { BundledLanguage, Highlighter } from "shiki";

let highlighter: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

// Supported languages for code blocks
const SUPPORTED_LANGUAGES: BundledLanguage[] = [
  "typescript",
  "javascript",
  "vue",
  "vue-html",
  "css",
  "bash",
  "json",
  "sql",
  "html",
  "shell",
];

/**
 * Composable for syntax highlighting using Shiki
 * Lazy loads the highlighter on first use
 */
export function useShiki() {
  const isLoading = ref(false);

  /**
   * Initialize and get the Shiki highlighter instance
   * Uses singleton pattern with lazy loading
   */
  const getHighlighter = async (): Promise<Highlighter> => {
    if (highlighter) {
      return highlighter;
    }

    if (highlighterPromise) {
      return highlighterPromise;
    }

    isLoading.value = true;

    highlighterPromise = (async () => {
      const { createHighlighter } = await import("shiki");

      const instance = await createHighlighter({
        themes: ["github-light", "github-dark"],
        langs: SUPPORTED_LANGUAGES,
      });

      highlighter = instance;
      isLoading.value = false;

      return instance;
    })();

    return highlighterPromise;
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
      return `<pre class="shiki"><code>${escaped}</code></pre>`;
    }

    const hl = await getHighlighter();

    // Validate language, fallback to shell for unknown languages
    const validLang = SUPPORTED_LANGUAGES.includes(lang as BundledLanguage)
      ? (lang as BundledLanguage)
      : "shell";

    const html = hl.codeToHtml(code, {
      lang: validLang,
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false, // Use CSS variables for theming
    });

    // Remove inline background-color from Shiki output to let our CSS control it
    return html.replace(/style="[^"]*background-color:[^;]*;?[^"]*"/g, (match) => {
      // Remove background-color property but keep other styles
      const cleaned = match
        .replace(/background-color:[^;]*;?\s*/g, "")
        .replace(/style="\s*"/, ""); // Remove empty style attribute
      return cleaned || "";
    });
  };

  return {
    highlight,
    isLoading: readonly(isLoading),
    getHighlighter,
  };
}
