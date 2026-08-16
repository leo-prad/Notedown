import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";

// window.find is a non-standard but WebView2/Chromium-supported API.
declare global {
  interface Window {
    find?: (
      text: string,
      caseSensitive?: boolean,
      backwards?: boolean,
      wrapAround?: boolean,
    ) => boolean;
  }
}

export function FindReplace() {
  const setUI = useStore((s) => s.setUI);
  const active = useStore((s) => s.tabs.find((t) => t.id === s.activeId));
  const updateContent = useStore((s) => s.updateContent);
  const bumpEditor = useStore((s) => s.bumpEditor);
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const next = (backwards = false) => {
    if (find) window.find?.(find, matchCase, backwards, true);
  };

  const doReplaceOne = () => {
    if (!find) return;
    const sel = window.getSelection()?.toString() ?? "";
    const matches = matchCase
      ? sel === find
      : sel.toLowerCase() === find.toLowerCase();
    if (matches) document.execCommand("insertText", false, replace);
    next();
  };

  const doReplaceAll = () => {
    if (!find || !active) return;
    const flags = matchCase ? "g" : "gi";
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const updated = active.content.replace(new RegExp(escaped, flags), replace);
    updateContent(active.id, updated);
    bumpEditor();
  };

  return (
    <div className="nd-find">
      <input
        ref={inputRef}
        className="nd-find-input"
        placeholder="Find"
        value={find}
        onChange={(e) => setFind(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") next(e.shiftKey);
          if (e.key === "Escape") setUI("findOpen", false);
        }}
      />
      <input
        className="nd-find-input"
        placeholder="Replace"
        value={replace}
        onChange={(e) => setReplace(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") doReplaceOne();
          if (e.key === "Escape") setUI("findOpen", false);
        }}
      />
      <button
        className={`nd-find-btn ${matchCase ? "on" : ""}`}
        title="Match case"
        onClick={() => setMatchCase((v) => !v)}
      >
        Aa
      </button>
      <button className="nd-find-btn" onClick={() => next(true)} title="Previous">
        ↑
      </button>
      <button className="nd-find-btn" onClick={() => next(false)} title="Next">
        ↓
      </button>
      <button className="nd-find-btn" onClick={doReplaceOne}>
        Replace
      </button>
      <button className="nd-find-btn" onClick={doReplaceAll}>
        All
      </button>
      <button
        className="nd-find-btn"
        onClick={() => setUI("findOpen", false)}
        title="Close"
      >
        ✕
      </button>
    </div>
  );
}
