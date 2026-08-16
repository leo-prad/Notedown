import { EditorView } from "@codemirror/view";
import { undo, redo } from "@codemirror/commands";
import { syntaxTree } from "@codemirror/language";
import { wrapSelection, setHeading } from "./livepreview";

/** The CodeMirror view for the currently-focused editor. */
let current: EditorView | null = null;

export function setCurrentEditor(view: EditorView | null) {
  current = view;
}
export function getCurrentEditor(): EditorView | null {
  return current;
}

export function focusEditor() {
  current?.focus();
}

function run(fn: (v: EditorView) => void) {
  if (current) {
    fn(current);
    current.focus();
  }
}

/** Toggle a line prefix (blockquote, list markers) on the selected lines. */
function toggleLinePrefix(view: EditorView, prefix: string | ((n: number) => string)) {
  const { state } = view;
  const range = state.selection.main;
  const startLine = state.doc.lineAt(range.from).number;
  const endLine = state.doc.lineAt(range.to).number;
  const changes = [];
  let idx = 1;
  for (let n = startLine; n <= endLine; n++) {
    const line = state.doc.line(n);
    const p = typeof prefix === "function" ? prefix(idx++) : prefix;
    const has = line.text.startsWith(p);
    changes.push({
      from: line.from,
      to: line.from + (has ? p.length : 0),
      insert: has ? "" : p,
    });
  }
  view.dispatch({ changes });
}

function insertAtCursor(view: EditorView, text: string, cursorOffset?: number) {
  const pos = view.state.selection.main.from;
  view.dispatch({
    changes: { from: pos, insert: text },
    selection: { anchor: pos + (cursorOffset ?? text.length) },
  });
}

export const editorCmd = {
  heading: (level: number) => run((v) => setHeading(v, level)),
  paragraph: () => run((v) => setHeading(v, 0)),
  bold: () => run((v) => wrapSelection(v, "**")),
  italic: () => run((v) => wrapSelection(v, "*")),
  strike: () => run((v) => wrapSelection(v, "~~")),
  inlineCode: () => run((v) => wrapSelection(v, "`")),
  underline: () => run((v) => wrapSelection(v, "<u>", "</u>")),
  blockquote: () => run((v) => toggleLinePrefix(v, "> ")),
  bulletList: () => run((v) => toggleLinePrefix(v, "- ")),
  orderedList: () => run((v) => toggleLinePrefix(v, (n) => `${n}. `)),
  codeBlock: () =>
    run((v) => insertAtCursor(v, "```\n\n```", 4)),
  hr: () => run((v) => insertAtCursor(v, "\n---\n")),
  table: () =>
    run((v) =>
      insertAtCursor(
        v,
        "\n| Column | Column |\n| --- | --- |\n| Cell | Cell |\n",
      ),
    ),
  image: (src: string, alt = "") =>
    run((v) => insertAtCursor(v, `![${alt}](${src})`)),
  undo: () => run((v) => undo(v)),
  redo: () => run((v) => redo(v)),
};

export interface ActiveFormat {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
  level: number;
}

const EMPTY: ActiveFormat = { bold: false, italic: false, strike: false, code: false, level: 0 };

/** Inspect the syntax tree at the caret to light up the toolbar. */
export function getActiveFormat(): ActiveFormat {
  const view = current;
  if (!view) return EMPTY;
  const a: ActiveFormat = { ...EMPTY };
  const pos = view.state.selection.main.head;
  let node = syntaxTree(view.state).resolve(pos, -1);
  while (node) {
    const n = node.name;
    if (n === "StrongEmphasis") a.bold = true;
    else if (n === "Emphasis") a.italic = true;
    else if (n === "Strikethrough") a.strike = true;
    else if (n === "InlineCode" || n === "FencedCode") a.code = true;
    else if (/^ATXHeading[1-6]$/.test(n)) a.level = Number(n.slice(-1));
    if (!node.parent) break;
    node = node.parent;
  }
  return a;
}

export { EditorView };
