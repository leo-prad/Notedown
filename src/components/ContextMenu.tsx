import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { editorCmd } from "../lib/editor";

export interface CtxState {
  x: number;
  y: number;
}

function exec(cmd: string) {
  try {
    document.execCommand(cmd);
  } catch {
    /* noop */
  }
}

async function paste() {
  try {
    document.execCommand("paste");
  } catch {
    /* noop */
  }
  try {
    const text = await navigator.clipboard.readText();
    if (text) document.execCommand("insertText", false, text);
  } catch {
    /* clipboard blocked */
  }
}

export function ContextMenu({ x, y, onClose }: CtxState & { onClose: () => void }) {
  const active = useStore((s) => s.tabs.find((t) => t.id === s.activeId));
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = Math.min(x, window.innerWidth - r.width - 8);
    const ny = Math.min(y, window.innerHeight - r.height - 8);
    setPos({ x: Math.max(8, nx), y: Math.max(8, ny) });
  }, [x, y]);

  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("mousedown", close);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const Item = ({ label, shortcut, onClick }: { label: string; shortcut?: string; onClick: () => void }) => (
    <button className="nd-ctx-item" onMouseDown={(e) => e.stopPropagation()} onClick={onClick}>
      <span className="nd-ctx-label">{label}</span>
      {shortcut && <span className="nd-ctx-shortcut">{shortcut}</span>}
    </button>
  );

  return (
    <div
      ref={ref}
      className="nd-ctx"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="nd-ctx-format">
        <button className="nd-ctx-fmt" title="Bold" onMouseDown={(e) => e.stopPropagation()} onClick={act(editorCmd.bold)}><b>B</b></button>
        <button className="nd-ctx-fmt" title="Italic" onMouseDown={(e) => e.stopPropagation()} onClick={act(editorCmd.italic)}><i>I</i></button>
        <button className="nd-ctx-fmt" title="Underline" onMouseDown={(e) => e.stopPropagation()} onClick={act(editorCmd.underline)}><u>U</u></button>
        <button className="nd-ctx-fmt" title="Strikethrough" onMouseDown={(e) => e.stopPropagation()} onClick={act(editorCmd.strike)}><s>S</s></button>
        <button className="nd-ctx-fmt" title="Inline code" onMouseDown={(e) => e.stopPropagation()} onClick={act(editorCmd.inlineCode)}><span style={{ fontFamily: "monospace" }}>{"<>"}</span></button>
      </div>
      <div className="nd-ctx-sep" />
      <Item label="Undo" shortcut="Ctrl+Z" onClick={act(editorCmd.undo)} />
      <Item label="Redo" shortcut="Ctrl+Y" onClick={act(editorCmd.redo)} />
      <div className="nd-ctx-sep" />
      <Item label="Cut" shortcut="Ctrl+X" onClick={act(() => exec("cut"))} />
      <Item label="Copy" shortcut="Ctrl+C" onClick={act(() => exec("copy"))} />
      <Item label="Paste" shortcut="Ctrl+V" onClick={act(() => void paste())} />
      {active && (
        <Item
          label="Copy as Markdown"
          shortcut="Ctrl+Shift+C"
          onClick={act(() => navigator.clipboard.writeText(active.content))}
        />
      )}
      <div className="nd-ctx-sep" />
      <Item label="Insert table" onClick={act(editorCmd.table)} />
      <Item label="Select All" shortcut="Ctrl+A" onClick={act(() => exec("selectAll"))} />
    </div>
  );
}
