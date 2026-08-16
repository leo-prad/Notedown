import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { editorCmd, focusEditor, getActiveFormat, type ActiveFormat } from "../lib/editor";

const EMPTY: ActiveFormat = { bold: false, italic: false, strike: false, code: false, level: 0 };

export function Toolbar() {
  const active = useStore((s) => s.tabs.find((t) => t.id === s.activeId));
  const settings = useStore((s) => s.settings);
  const disabled = !active || active.sourceMode;
  const [headingOpen, setHeadingOpen] = useState(false);
  const [fmt, setFmt] = useState<ActiveFormat>(EMPTY);
  const hRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setFmt(getActiveFormat());
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  useEffect(() => {
    if (!headingOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!hRef.current?.contains(e.target as Node)) setHeadingOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [headingOpen]);

  const btn = (title: string, on: boolean, onClick: () => void, node: React.ReactNode) => (
    <button
      className={`nd-tool ${on ? "active" : ""}`}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {node}
    </button>
  );

  return (
    <div className="nd-toolbar">
      <div className="nd-tool-group" ref={hRef}>
        <button
          className="nd-tool nd-tool-heading"
          disabled={disabled}
          onClick={() => setHeadingOpen((v) => !v)}
          title="Paragraph style"
        >
          {fmt.level ? `H${fmt.level}` : "H"}
          <span className="nd-tool-caret">▾</span>
        </button>
        {headingOpen && (
          <div className="nd-heading-pop">
            <button
              className={`nd-heading-item ${fmt.level === 0 ? "active" : ""}`}
              onClick={() => {
                editorCmd.paragraph();
                setHeadingOpen(false);
              }}
            >
              Paragraph
            </button>
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <button
                key={l}
                className={`nd-heading-item ${fmt.level === l ? "active" : ""}`}
                onClick={() => {
                  editorCmd.heading(l);
                  setHeadingOpen(false);
                }}
              >
                <span style={{ fontSize: `${20 - l}px`, fontWeight: 600 }}>Heading {l}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="nd-tool-sep" />
      {btn("Bullet list", false, () => editorCmd.bulletList(), <ListIcon />)}
      {btn("Ordered list", false, () => editorCmd.orderedList(), <OrderedIcon />)}
      <span className="nd-tool-sep" />
      {btn("Bold (Ctrl+B)", fmt.bold, () => editorCmd.bold(), <b>B</b>)}
      {btn("Italic (Ctrl+I)", fmt.italic, () => editorCmd.italic(), <i>I</i>)}
      {btn("Strikethrough", fmt.strike, () => editorCmd.strike(), <s>S</s>)}
      {btn("Inline code", fmt.code, () => editorCmd.inlineCode(), <span style={{ fontFamily: "monospace" }}>{"</>"}</span>)}
      <span className="nd-tool-sep" />
      {btn("Hyperlink (Ctrl+K)", false, () => {
        const url = window.prompt("Link URL:");
        if (url) document.execCommand("createLink", false, url);
        focusEditor();
      }, <LinkIcon />)}
      {btn("Table", false, () => editorCmd.table(), <TableIcon />)}
      {btn("Blockquote", false, () => editorCmd.blockquote(), <span>"</span>)}
      {btn("Code block", false, () => editorCmd.codeBlock(), <CodeIcon />)}
      {settings.aiEnabled && (
        <>
          <span className="nd-tool-sep" />
          {btn("AI", false, () => focusEditor(), <span className="nd-tool-ai">✦</span>)}
        </>
      )}
    </div>
  );
}

const s = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ListIcon = () => (<svg {...s}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>);
const OrderedIcon = () => (<svg {...s}><path d="M10 6h11M10 12h11M10 18h11M4 4v4M3 8h2M3 16h2v-2H3v-.5h2" /></svg>);
const LinkIcon = () => (<svg {...s}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>);
const TableIcon = () => (<svg {...s}><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 10h18M3 15h18M9 4v16M15 4v16" /></svg>);
const CodeIcon = () => (<svg {...s}><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>);
