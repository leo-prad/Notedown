import {
  EditorView,
  Decoration,
  type DecorationSet,
  WidgetType,
} from "@codemirror/view";
import { StateField, EditorState, type Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { convertFileSrc } from "@tauri-apps/api/core";
import katex from "katex";

/**
 * Typora / Obsidian-style "live preview" for a CodeMirror markdown document,
 * implemented as a StateField so it can use block (line-crossing) decorations
 * for multi-line math and code fences. See wiki concept `live-preview`.
 */

const HEADING_LINE: Record<string, Decoration> = {
  ATXHeading1: Decoration.line({ class: "cm-h cm-h1" }),
  ATXHeading2: Decoration.line({ class: "cm-h cm-h2" }),
  ATXHeading3: Decoration.line({ class: "cm-h cm-h3" }),
  ATXHeading4: Decoration.line({ class: "cm-h cm-h4" }),
  ATXHeading5: Decoration.line({ class: "cm-h cm-h5" }),
  ATXHeading6: Decoration.line({ class: "cm-h cm-h6" }),
};

const CONTENT_MARK: Record<string, Decoration> = {
  StrongEmphasis: Decoration.mark({ class: "cm-strong" }),
  Emphasis: Decoration.mark({ class: "cm-em" }),
  Strikethrough: Decoration.mark({ class: "cm-strike" }),
  InlineCode: Decoration.mark({ class: "cm-code-inline" }),
};

const FAINT = Decoration.mark({ class: "cm-md-mark" });
const HIDE = Decoration.replace({});

const MARK_NODES = new Set([
  "HeaderMark",
  "EmphasisMark",
  "CodeMark",
  "StrikethroughMark",
]);

function overlaps(aFrom: number, aTo: number, bFrom: number, bTo: number) {
  return aFrom <= bTo && bFrom <= aTo;
}

function resolveSrc(src: string, docPath: string | null): string {
  if (/^(https?:|data:|asset:|blob:)/i.test(src)) return src;
  const isAbsolute = /^[a-z]:[\\/]/i.test(src) || src.startsWith("/");
  let abs = src;
  if (!isAbsolute) {
    if (!docPath) return src;
    const dir = docPath.replace(/[\\/][^\\/]*$/, "");
    abs = dir + "/" + src;
  }
  try {
    return convertFileSrc(abs);
  } catch {
    return src;
  }
}

class MathWidget extends WidgetType {
  constructor(
    readonly tex: string,
    readonly display: boolean,
  ) {
    super();
  }
  eq(o: MathWidget) {
    return o.tex === this.tex && o.display === this.display;
  }
  toDOM() {
    const el = document.createElement(this.display ? "div" : "span");
    el.className = "cm-math" + (this.display ? " cm-math-display" : "");
    try {
      el.innerHTML = katex.renderToString(this.tex, {
        throwOnError: false,
        displayMode: this.display,
      });
    } catch {
      el.textContent = this.tex;
    }
    return el;
  }
}

class CopyButtonWidget extends WidgetType {
  constructor(readonly code: string) {
    super();
  }
  eq(o: CopyButtonWidget) {
    return o.code === this.code;
  }
  ignoreEvent() {
    return true;
  }
  toDOM() {
    const btn = document.createElement("button");
    btn.className = "cm-code-copy";
    btn.type = "button";
    btn.title = "Copy code";
    btn.textContent = "Copy";
    btn.setAttribute("contenteditable", "false");
    // Don't let the click move the editor caret.
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(this.code).then(
        () => {
          btn.textContent = "Copied";
          btn.classList.add("cm-code-copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("cm-code-copied");
          }, 1200);
        },
        () => {},
      );
    });
    return btn;
  }
}

class ImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
  ) {
    super();
  }
  eq(o: ImageWidget) {
    return o.src === this.src && o.alt === this.alt;
  }
  toDOM() {
    const img = document.createElement("img");
    img.src = this.src;
    img.alt = this.alt;
    img.className = "cm-img";
    return img;
  }
}

interface MathSpan {
  from: number;
  to: number;
  tex: string;
  display: boolean;
}

const MATH_RE = /\$\$([^$]+?)\$\$|\$(?!\s)((?:[^$\n]|\\\$)+?)(?<!\s)\$/g;

// Bare URLs: full http(s) links, or www./domain.tld forms. Trailing punctuation
// is trimmed via the lookahead-friendly char class.
const URL_RE =
  /\b(?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:!?'"]|(?:[a-z0-9-]+\.)+(?:com|org|net|io|dev|co|edu|gov|app|ai)\b(?:\/[^\s<>()]*[^\s<>().,;:!?'"])?/gi;

function findMath(state: EditorState): MathSpan[] {
  const spans: MathSpan[] = [];
  const text = state.doc.toString();
  MATH_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MATH_RE.exec(text))) {
    const display = m[1] !== undefined;
    spans.push({
      from: m.index,
      to: m.index + m[0].length,
      tex: (display ? m[1] : m[2]) ?? "",
      display,
    });
  }
  return spans;
}

function buildDecorations(state: EditorState, docPath: string | null): DecorationSet {
  const decos: Range<Decoration>[] = [];
  const sel = state.selection.main;
  const tree = syntaxTree(state);
  const doc = state.doc;

  // Collect code regions (fenced + inline) up front so math can never straddle
  // or sit inside them — a stray `$` next to a code block must not swallow it.
  const codeRanges: Array<[number, number]> = [];
  tree.iterate({
    from: 0,
    to: doc.length,
    enter: (n) => {
      if (n.name === "FencedCode" || n.name === "InlineCode") {
        codeRanges.push([n.from, n.to]);
      }
    },
  });
  const touchesCode = (from: number, to: number) =>
    codeRanges.some(([cf, ct]) => overlaps(from, to, cf, ct));

  // Math (skip anything overlapping a code region).
  const math = findMath(state).filter((s) => !touchesCode(s.from, s.to));
  const inMath = (pos: number) => math.some((s) => pos >= s.from && pos < s.to);
  for (const s of math) {
    if (overlaps(sel.from, sel.to, s.from, s.to)) continue;
    const multiline = doc.lineAt(s.from).number !== doc.lineAt(s.to).number;
    if (multiline) {
      const from = doc.lineAt(s.from).from;
      const to = doc.lineAt(s.to).to;
      decos.push(
        Decoration.replace({
          widget: new MathWidget(s.tex.trim(), true),
          block: true,
        }).range(from, to),
      );
    } else {
      decos.push(
        Decoration.replace({
          widget: new MathWidget(s.tex, s.display),
        }).range(s.from, s.to),
      );
    }
  }

  // Bare URLs (not inside a markdown link/image/code): make them clickable and
  // exempt from spellcheck. Plain http(s):// or www./domain.tld forms.
  const text = doc.toString();
  URL_RE.lastIndex = 0;
  let um: RegExpExecArray | null;
  while ((um = URL_RE.exec(text))) {
    const from = um.index;
    const to = from + um[0].length;
    if (inMath(from)) continue;
    let inside = false;
    let n: ReturnType<typeof tree.resolveInner> | null = tree.resolveInner(from, 1);
    while (n) {
      if (/Link|Image|Code|URL|Autolink/.test(n.name)) {
        inside = true;
        break;
      }
      n = n.parent;
    }
    if (inside) continue;
    const href = /^https?:\/\//i.test(um[0]) ? um[0] : "https://" + um[0];
    decos.push(
      Decoration.mark({
        class: "cm-url",
        attributes: { "data-href": href, spellcheck: "false" },
      }).range(from, to),
    );
  }

  tree.iterate({
    from: 0,
    to: doc.length,
    enter: (node) => {
      const name = node.name;
      if (inMath(node.from)) return false;

      if (name === "FencedCode") {
        const first = doc.lineAt(node.from).number;
        const last = doc.lineAt(node.to).number;
        const reveal = overlaps(sel.from, sel.to, node.from, node.to);
        for (let ln = first; ln <= last; ln++) {
          const cls =
            "cm-code" +
            (ln === first ? " cm-code-first" : "") +
            (ln === last ? " cm-code-last" : "");
          decos.push(Decoration.line({ class: cls }).range(doc.line(ln).from));
        }
        // Copy button, pinned to the top-right of the box (positioned via CSS).
        const codeText =
          last > first + 1
            ? doc.sliceString(doc.line(first + 1).from, doc.line(last - 1).to)
            : "";
        decos.push(
          Decoration.widget({
            widget: new CopyButtonWidget(codeText),
            side: -1,
          }).range(doc.line(first).from),
        );
        if (!reveal) {
          // Hide the ``` / language text (same-line replaces only — no block).
          const openL = doc.line(first);
          if (openL.length) decos.push(HIDE.range(openL.from, openL.to));
          if (last !== first) {
            const closeL = doc.line(last);
            if (closeL.length) decos.push(HIDE.range(closeL.from, closeL.to));
          }
        }
        return false;
      }

      if (name === "Link") {
        if (!overlaps(sel.from, sel.to, node.from, node.to)) {
          const text = doc.sliceString(node.from, node.to);
          const m = /^\[([^\]]*)\]\(\s*([^)\s]+)/.exec(text);
          if (m) {
            const textStart = node.from + 1;
            const textEnd = textStart + m[1].length;
            if (textStart > node.from) decos.push(HIDE.range(node.from, textStart));
            decos.push(
              Decoration.mark({
                class: "cm-link",
                attributes: { "data-href": m[2], spellcheck: "false" },
              }).range(textStart, textEnd),
            );
            if (textEnd < node.to) decos.push(HIDE.range(textEnd, node.to));
          }
        }
        return false;
      }

      if (name === "Image") {
        if (!overlaps(sel.from, sel.to, node.from, node.to)) {
          const text = doc.sliceString(node.from, node.to);
          const m = /^!\[([^\]]*)\]\(\s*([^)\s]+)/.exec(text);
          if (m) {
            decos.push(
              Decoration.replace({
                widget: new ImageWidget(resolveSrc(m[2], docPath), m[1]),
              }).range(node.from, node.to),
            );
          }
        }
        return false;
      }

      if (name === "Blockquote") {
        const first = doc.lineAt(node.from).number;
        const last = doc.lineAt(node.to > node.from ? node.to - 1 : node.to).number;
        for (let ln = first; ln <= last; ln++) {
          decos.push(Decoration.line({ class: "cm-quote" }).range(doc.line(ln).from));
        }
        return;
      }

      if (name === "QuoteMark") {
        const line = doc.lineAt(node.from);
        const caretOnLine = overlaps(sel.from, sel.to, line.from, line.to);
        if (caretOnLine) {
          decos.push(FAINT.range(node.from, node.to));
        } else {
          let end = node.to;
          if (doc.sliceString(node.to, node.to + 1) === " ") end = node.to + 1;
          decos.push(HIDE.range(node.from, end));
        }
        return;
      }

      if (HEADING_LINE[name]) {
        decos.push(HEADING_LINE[name].range(doc.lineAt(node.from).from));
        return;
      }

      if (CONTENT_MARK[name]) {
        decos.push(CONTENT_MARK[name].range(node.from, node.to));
        return;
      }

      if (MARK_NODES.has(name)) {
        let cFrom: number;
        let cTo: number;
        if (name === "HeaderMark") {
          cFrom = node.from;
          cTo = node.to;
        } else {
          const parent = node.node.parent;
          cFrom = parent ? parent.from : node.from;
          cTo = parent ? parent.to : node.to;
        }
        const reveal = overlaps(sel.from, sel.to, cFrom, cTo);
        if (reveal) {
          decos.push(FAINT.range(node.from, node.to));
        } else if (node.to > node.from) {
          let end = node.to;
          if (name === "HeaderMark") {
            const after = doc.sliceString(node.to, node.to + 1);
            if (after === " ") end = node.to + 1;
          }
          decos.push(HIDE.range(node.from, end));
        }
      }
    },
  });

  decos.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide);
  return Decoration.set(decos, true);
}

/** The live-preview extension, bound to the doc path (for relative images). */
export function livePreview(docPath: string | null) {
  return StateField.define<DecorationSet>({
    create(state) {
      return buildDecorations(state, docPath);
    },
    update(deco, tr) {
      if (tr.docChanged || tr.selection) {
        return buildDecorations(tr.state, docPath);
      }
      return deco.map(tr.changes);
    },
    provide: (f) => EditorView.decorations.from(f),
  });
}

// ---------- Auto-pairing ----------

const PAIR_EMPTY: Record<string, [string, string]> = {
  $: ["$", "$"],
  "`": ["`", "`"],
  "*": ["*", "*"],
  _: ["_", "_"],
  "~": ["~", "~"],
};
const WRAP: Record<string, [string, string]> = {
  "*": ["*", "*"],
  _: ["_", "_"],
  "`": ["`", "`"],
  "~": ["~~", "~~"],
  $: ["$", "$"],
};

export const autoPairMarkers = EditorView.inputHandler.of(
  (view, from, to, text) => {
    const sel = view.state.selection.main;
    if (sel.from !== sel.to) {
      const w = WRAP[text];
      if (!w) return false;
      const inner = view.state.sliceDoc(sel.from, sel.to);
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: w[0] + inner + w[1] },
        selection: {
          anchor: sel.from + w[0].length,
          head: sel.from + w[0].length + inner.length,
        },
        userEvent: "input.type",
      });
      return true;
    }
    const p = PAIR_EMPTY[text];
    if (!p || from !== to) return false;
    view.dispatch({
      changes: { from, insert: p[0] + p[1] },
      selection: { anchor: from + p[0].length },
      userEvent: "input.type",
    });
    return true;
  },
);

export function wrapSelection(view: EditorView, left: string, right = left) {
  const sel = view.state.selection.main;
  const inner = view.state.sliceDoc(sel.from, sel.to);
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert: left + inner + right },
    selection: {
      anchor: sel.from + left.length,
      head: sel.from + left.length + inner.length,
    },
    userEvent: "input",
  });
  view.focus();
}

/** Ctrl+K: wrap the selection as a markdown link (or insert an empty one). */
export function makeLink(view: EditorView) {
  const sel = view.state.selection.main;
  const raw = view.state.sliceDoc(sel.from, sel.to).trim();
  const urlLike = /^(https?:\/\/|www\.|(?:[a-z0-9-]+\.)+[a-z]{2,})[^\s]*$/i.test(raw);

  let insert: string;
  let anchor: number;
  let head: number;
  if (!raw) {
    // Empty: [](  ) with caret between the brackets to type the label.
    insert = "[]()";
    anchor = head = sel.from + 1;
  } else if (urlLike) {
    // Selection is a URL: use it as href, select the label text to rename it.
    const url = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
    insert = `[${raw}](${url})`;
    anchor = sel.from + 1;
    head = sel.from + 1 + raw.length;
  } else {
    // Selection is label text: put caret inside the empty () for the URL.
    insert = `[${raw}]()`;
    anchor = head = sel.from + raw.length + 3;
  }
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert },
    selection: { anchor, head },
    userEvent: "input",
  });
  view.focus();
}

export function setHeading(view: EditorView, level: number) {
  const { state } = view;
  const changes = [];
  const range = state.selection.main;
  const startLine = state.doc.lineAt(range.from).number;
  const endLine = state.doc.lineAt(range.to).number;
  for (let n = startLine; n <= endLine; n++) {
    const line = state.doc.line(n);
    const stripped = line.text.replace(/^#{1,6}\s+/, "");
    const prefix = level > 0 ? "#".repeat(level) + " " : "";
    changes.push({ from: line.from, to: line.to, insert: prefix + stripped });
  }
  view.dispatch({ changes });
  view.focus();
}
