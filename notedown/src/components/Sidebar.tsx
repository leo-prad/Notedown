import { useMemo } from "react";
import { useStore } from "../store";

interface Heading {
  level: number;
  text: string;
}

function extractHeadings(md: string): Heading[] {
  const out: Heading[] = [];
  let inFence = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2].replace(/#+\s*$/, "").trim() });
  }
  return out;
}

export function Sidebar() {
  const active = useStore((s) => s.tabs.find((t) => t.id === s.activeId));
  const headings = useMemo(
    () => extractHeadings(active?.content ?? ""),
    [active?.content],
  );

  const jump = (text: string) => {
    const nodes = document.querySelectorAll(
      ".nd-editor-host .ProseMirror h1, .nd-editor-host .ProseMirror h2, .nd-editor-host .ProseMirror h3, .nd-editor-host .ProseMirror h4, .nd-editor-host .ProseMirror h5, .nd-editor-host .ProseMirror h6",
    );
    for (const n of Array.from(nodes)) {
      if ((n.textContent ?? "").trim() === text) {
        n.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
    }
  };

  return (
    <div className="nd-sidebar">
      <div className="nd-sidebar-title">Outline</div>
      {headings.length === 0 && (
        <div className="nd-sidebar-empty">No headings yet</div>
      )}
      {headings.map((h, i) => (
        <button
          key={i}
          className="nd-outline-item"
          style={{ paddingLeft: `${8 + (h.level - 1) * 14}px` }}
          onClick={() => jump(h.text)}
        >
          {h.text || "(untitled)"}
        </button>
      ))}
    </div>
  );
}
