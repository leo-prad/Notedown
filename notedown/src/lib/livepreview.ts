import {
  EditorView,
  Decoration,
  type DecorationSet,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { EditorState, type Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

/**
 * Typora / Obsidian-style "live preview" for a CodeMirror markdown document.
 *
 * The document is real Markdown source, but we decorate it so that:
 *  - heading lines render at heading size/weight,
 *  - inline **bold**, *italic*, ~~strike~~, `code` render styled,
 *  - the syntax markers (`#`, `*`, `` ` ``, `~`, `>`) are HIDDEN unless the
 *    caret/selection is inside that element, in which case they show faintly.
 *
 * That produces the effect the user wants: type `#`, the line becomes a big
 * header with a faint `#`; move away / press space and the `#` disappears;
 * backspace back in and it returns.
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

// Marker node names whose visibility depends on caret position.
const MARK_NODES = new Set([
  "HeaderMark",
  "EmphasisMark",
  "CodeMark",
  "StrikethroughMark",
]);

function overlaps(aFrom: number, aTo: number, bFrom: number, bTo: number) {
  return aFrom <= bTo && bFrom <= aTo;
}

function buildDecorations(view: EditorView): DecorationSet {
  const decos: Range<Decoration>[] = [];
  const sel = view.state.selection.main;
  const tree = syntaxTree(view.state);

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter: (node) => {
        const name = node.name;

        if (HEADING_LINE[name]) {
          const line = view.state.doc.lineAt(node.from);
          decos.push(HEADING_LINE[name].range(line.from));
          return;
        }

        if (CONTENT_MARK[name]) {
          decos.push(CONTENT_MARK[name].range(node.from, node.to));
          return;
        }

        if (MARK_NODES.has(name)) {
          // Reveal the marker only when the caret is inside its parent element
          // (the whole heading line, or the whole emphasis/code span).
          const parent = node.node.parent;
          const cFrom = parent ? parent.from : node.from;
          const cTo = parent ? parent.to : node.to;
          const reveal = overlaps(sel.from, sel.to, cFrom, cTo);
          if (reveal) {
            decos.push(FAINT.range(node.from, node.to));
          } else if (node.to > node.from) {
            // Hide the marker (and the trailing space after a heading `#`).
            let end = node.to;
            if (name === "HeaderMark") {
              const after = view.state.doc.sliceString(node.to, node.to + 1);
              if (after === " ") end = node.to + 1;
            }
            decos.push(HIDE.range(node.from, end));
          }
        }
      },
    });
  }
  decos.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide);
  return Decoration.set(decos, true);
}

export const livePreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.selectionSet || u.viewportChanged) {
        this.decorations = buildDecorations(u.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

/**
 * Auto-pair Markdown markers, Typora-style:
 *  - no selection: `$`→`$|$`, `` ` ``→`` `|` ``, `(`,`[`,`{`, cursor between,
 *  - with selection: wrap it — `*`,`_` (emphasis), `~`→`~~sel~~`, `` ` ``, `$`.
 */
const PAIR_EMPTY: Record<string, [string, string]> = {
  $: ["$", "$"],
  "`": ["`", "`"],
  "(": ["(", ")"],
  "[": ["[", "]"],
  "{": ["{", "}"],
};
const WRAP: Record<string, [string, string]> = {
  "*": ["*", "*"],
  _: ["_", "_"],
  "`": ["`", "`"],
  "~": ["~~", "~~"],
  $: ["$", "$"],
  "(": ["(", ")"],
  "[": ["[", "]"],
  "{": ["{", "}"],
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
    // No selection: only pair the "safe" markers so we don't hijack "* " lists.
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

/** Toggle a wrapping marker around the current selection (for menu/shortcuts). */
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

/** Set the current line(s) to a heading level (0 = paragraph). */
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

export const editorFontTheme = EditorState.allowMultipleSelections.of(false);
