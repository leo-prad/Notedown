import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, drawSelection, dropCursor } from "@codemirror/view";
import { history, historyKeymap, defaultKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { HighlightStyle, indentUnit, syntaxHighlighting, syntaxTree } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { openUrl } from "@tauri-apps/plugin-opener";
import "katex/dist/katex.min.css";
import { useStore } from "../store";
import { setCurrentEditor } from "../lib/editor";
import { livePreview, autoPairMarkers, wrapSelection, makeLink } from "../lib/livepreview";
import { codeLangCompletion } from "../lib/codeblock";
import { saveImage } from "../lib/tauri";

const formatKeymap = keymap.of([
  { key: "Mod-b", run: (v) => (wrapSelection(v, "**"), true) },
  { key: "Mod-i", run: (v) => (wrapSelection(v, "*"), true) },
  { key: "Mod-u", run: (v) => (wrapSelection(v, "<u>", "</u>"), true) },
  { key: "Mod-Shift-x", run: (v) => (wrapSelection(v, "~~"), true) },
  { key: "Mod-`", run: (v) => (wrapSelection(v, "`"), true) },
  { key: "Mod-k", run: (v) => (makeLink(v), true) },
]);

const highlight = HighlightStyle.define([
  { tag: t.keyword, class: "cmt-kw" },
  { tag: [t.string, t.special(t.string)], class: "cmt-str" },
  { tag: [t.number, t.bool, t.null], class: "cmt-num" },
  { tag: [t.comment, t.lineComment, t.blockComment], class: "cmt-cmt" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], class: "cmt-fn" },
  { tag: [t.typeName, t.className, t.namespace], class: "cmt-type" },
  { tag: [t.propertyName, t.attributeName], class: "cmt-prop" },
  { tag: [t.operator, t.punctuation], class: "cmt-op" },
  { tag: [t.variableName, t.definition(t.variableName)], class: "cmt-var" },
]);

const baseTheme = EditorView.theme({
  "&": { height: "100%", color: "var(--nd-text)", backgroundColor: "var(--nd-surface)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--nd-font)",
    lineHeight: "var(--nd-line-height, 1.6)",
    overflow: "auto",
  },
  ".cm-content": {
    maxWidth: "var(--nd-content-width, 800px)",
    margin: "0 auto",
    padding: "44px 32px 45vh",
    caretColor: "var(--nd-accent)",
    fontSize: "var(--nd-font-size, 16px)",
  },
  ".cm-line": { padding: "0" },
});

export function EditorPane() {
  const tabId = useStore((s) => s.activeId);
  const epoch = useStore((s) => s.editorEpoch);
  const settings = useStore((s) => s.settings);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !tabId) return;
    const tab = useStore.getState().tabs.find((t) => t.id === tabId);
    if (!tab || tab.sourceMode) return;
    const docPath = tab.path;
    const folder = settings.imageFolderName || "assets";

    const insertImageMarkdown = (view: EditorView, path: string, alt: string) => {
      const pos = view.state.selection.main.from;
      view.dispatch({ changes: { from: pos, insert: `![${alt}](${path})` } });
    };

    const imageMarkup = (view: EditorView, target: HTMLElement) => {
      const wrap = target.closest<HTMLElement>(".cm-image-wrap");
      if (!wrap) return null;
      let node: ReturnType<ReturnType<typeof syntaxTree>["resolve"]> | null =
        syntaxTree(view.state).resolve(view.posAtDOM(wrap), 1);
      while (node && node.name !== "Image") node = node.parent;
      if (!node) return null;
      const raw = view.state.sliceDoc(node.from, node.to);
      const match = /^!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"notedown-align:(left|center|right|inline)")?\s*\)$/.exec(raw);
      return match
        ? { from: node.from, to: node.to, raw, alt: match[1], src: match[2], align: match[3] ?? "inline" }
        : null;
    };

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: tab.content,
        extensions: [
          history(),
          drawSelection(),
          dropCursor(),
          EditorView.lineWrapping,
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          syntaxHighlighting(highlight),
          livePreview(docPath),
          codeLangCompletion,
          autoPairMarkers({
            quotes: settings.autoQuotes,
            brackets: settings.autoBrackets,
            markdown: settings.autoMarkdown,
          }),
          indentUnit.of(" ".repeat(settings.indentation)),
          formatKeymap,
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          baseTheme,
          EditorView.contentAttributes.of({
            spellcheck: String(settings.spellcheck),
          }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) {
              useStore.getState().updateContent(tabId, u.state.doc.toString());
            }
          }),
          EditorView.domEventHandlers({
            mousemove(e, view) {
              const target = e.target as HTMLElement;
              const line = target.closest<HTMLElement>(".cm-line.cm-code");
              view.dom.querySelectorAll(".cm-code-copy.cm-code-hover").forEach((button) =>
                button.classList.remove("cm-code-hover"),
              );
              if (line) {
                let first = line;
                while (first.previousElementSibling?.classList.contains("cm-code")) {
                  first = first.previousElementSibling as HTMLElement;
                }
                first.querySelector<HTMLElement>(".cm-code-copy")?.classList.add("cm-code-hover");
              }
              return false;
            },
            mousedown(e) {
              const target = e.target as HTMLElement;
              const wrap = target.closest<HTMLElement>(".cm-image-wrap");
              if (wrap) wrap.classList.add("cm-image-selected");
              const el = target.closest?.("[data-href]");
              if (!el) return false;
              // Rendered markdown links open on plain click; bare URLs need
              // Ctrl/Cmd (so their text stays editable with a normal click).
              const isRendered = el.classList.contains("cm-link");
              if (isRendered || e.ctrlKey || e.metaKey) {
                e.preventDefault();
                let href = el.getAttribute("data-href") || "";
                if (href && !/^[a-z]+:/i.test(href)) href = "https://" + href;
                openUrl(href).catch((err) => console.error("openUrl failed", err));
                return true;
              }
              return false;
            },
            click(e, view) {
              const target = e.target as HTMLElement;
              const action = target.closest<HTMLElement>("[data-image-command]")?.dataset.imageCommand;
              if (!action) return false;
              const image = imageMarkup(view, target);
              if (!image) return false;
              e.preventDefault();
              e.stopPropagation();
              if (action === "copy") {
                navigator.clipboard.writeText(image.raw).catch(() => {});
                return true;
              }
              if (action === "delete") {
                view.dispatch({ changes: { from: image.from, to: image.to, insert: "" } });
                return true;
              }
              if (action === "alt") {
                const alt = window.prompt("Image alternative text:", image.alt);
                if (alt === null) return true;
                const title = image.align === "inline" ? "" : ` \"notedown-align:${image.align}\"`;
                view.dispatch({ changes: { from: image.from, to: image.to, insert: `![${alt}](${image.src}${title})` } });
                return true;
              }
              if (["inline", "left", "center", "right"].includes(action)) {
                const title = action === "inline" ? "" : ` \"notedown-align:${action}\"`;
                view.dispatch({ changes: { from: image.from, to: image.to, insert: `![${image.alt}](${image.src}${title})` } });
                return true;
              }
              return false;
            },
            paste(e, view) {
              const items = e.clipboardData?.items;
              if (!items) return false;
              for (const it of items) {
                if (it.type.startsWith("image/")) {
                  const file = it.getAsFile();
                  if (file) {
                    e.preventDefault();
                    saveImage(file, docPath, folder, settings.imageStrategy).then((p) =>
                      insertImageMarkdown(view, p, ""),
                    );
                    return true;
                  }
                }
              }
              return false;
            },
            drop(e, view) {
              const files = e.dataTransfer?.files;
              if (!files || files.length === 0) return false;
              const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
              if (imgs.length === 0) return false;
              e.preventDefault();
              imgs.forEach((f) =>
                saveImage(f, docPath, folder, settings.imageStrategy).then((p) => insertImageMarkdown(view, p, f.name)),
              );
              return true;
            },
          }),
        ],
      }),
    });

    setCurrentEditor(view);
    view.focus();

    return () => {
      setCurrentEditor(null);
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId, epoch]);

  return (
    <div
      className="nd-editor-scroll"
      style={
        {
          "--nd-font-size": `${settings.fontSize}px`,
          "--nd-line-height": String(settings.lineHeight),
          "--nd-content-width": `${settings.contentWidth}px`,
        } as React.CSSProperties
      }
    >
      <div ref={hostRef} className="nd-editor-host" />
    </div>
  );
}
