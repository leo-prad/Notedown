import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { languages } from "@codemirror/language-data";

/**
 * Language autocomplete for fenced code blocks (Typedown-style): while the caret
 * is on the opening ``` line, typing a language name shows a filtered dropdown
 * with a small icon in the left margin. See wiki concept `live-preview`.
 */

// A small emoji "logo" for the most common languages; everything else gets the
// generic code glyph. (Real vector logos would need a bundled icon set — a
// deliberate v1 shortcut.)
const LANG_ICON: Record<string, string> = {
  javascript: "🟨",
  typescript: "🟦",
  jsx: "⚛️",
  tsx: "⚛️",
  python: "🐍",
  java: "☕",
  c: "🇨",
  cpp: "➕",
  csharp: "🎯",
  go: "🐹",
  rust: "🦀",
  ruby: "💎",
  php: "🐘",
  swift: "🕊️",
  kotlin: "🟪",
  html: "🌐",
  css: "🎨",
  json: "🔧",
  yaml: "📄",
  markdown: "📝",
  sql: "🗃️",
  bash: "🐚",
  shell: "🐚",
  dockerfile: "🐳",
  r: "📊",
  dart: "🎯",
};

interface LangEntry {
  label: string;
  icon: string;
}

// Build the list once: every language name + its aliases, de-duplicated and
// lowercased (matches how Typedown lists them).
const LANG_LIST: LangEntry[] = (() => {
  const seen = new Set<string>();
  const out: LangEntry[] = [];
  for (const desc of languages) {
    const names = [desc.name, ...desc.alias].map((n) => n.toLowerCase());
    for (const n of names) {
      if (!n || seen.has(n)) continue;
      seen.add(n);
      out.push({ label: n, icon: LANG_ICON[n] ?? "‹›" });
    }
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
})();

/** True when `line` (0-based number) is the opening fence of a code block. */
function isOpeningFence(context: CompletionContext, lineFrom: number): boolean {
  const node = syntaxTree(context.state).resolveInner(lineFrom, 1);
  let n: typeof node | null = node;
  while (n) {
    if (n.name === "FencedCode") {
      return context.state.doc.lineAt(n.from).from === lineFrom;
    }
    n = n.parent;
  }
  // Fresh, not-yet-parsed fence: fall back to a text check below.
  return false;
}

function langCompletionSource(context: CompletionContext) {
  const line = context.state.doc.lineAt(context.pos);
  const before = line.text.slice(0, context.pos - line.from);
  const m = /^(```|~~~)([\w+#.-]*)$/.exec(before);
  if (!m) return null;

  // Only on the opening fence — never the closing ``` or lines inside the code.
  const parsedOpen = isOpeningFence(context, line.from);
  const looksOpen = m[2].length > 0 || context.explicit;
  if (!parsedOpen && !looksOpen) return null;

  const word = m[2].toLowerCase();
  const from = line.from + m[1].length;
  const matches = LANG_LIST.filter((l) => l.label.startsWith(word)).slice(0, 50);
  if (!matches.length) return null;

  return {
    from,
    options: matches.map((l) => ({
      label: l.label,
      // Icon on the left, name after it (matching/insertion still use `label`).
      displayLabel: `${l.icon}  ${l.label}`,
      type: "language",
    })),
    validFor: /^[\w+#.-]*$/,
  };
}

export const codeLangCompletion = autocompletion({
  override: [langCompletionSource],
  icons: false,
  activateOnTyping: true,
});
