import { useEffect, useRef, useState } from "react";
import { useStore, isDirty } from "../store";

export function TabBar() {
  const tabs = useStore((s) => s.tabs);
  const activeId = useStore((s) => s.activeId);
  const setActive = useStore((s) => s.setActive);
  const closeTab = useStore((s) => s.attemptCloseTab);
  const newTab = useStore((s) => s.newTab);
  const moveTab = useStore((s) => s.moveTab);
  const renameTab = useStore((s) => s.renameTab);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingId]);

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setDraft(title.replace(/\.(md|markdown|txt)$/i, ""));
  };
  const commitRename = () => {
    if (editingId) renameTab(editingId, draft);
    setEditingId(null);
  };

  return (
    <div className="nd-tabstrip">
      {tabs.map((t) => {
        const dirty = isDirty(t);
        const active = t.id === activeId;
        return (
          <div
            key={t.id}
            className={`nd-tab ${active ? "active" : ""}`}
            draggable={editingId !== t.id}
            onDragStart={() => setDragId(t.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId && dragId !== t.id) moveTab(dragId, t.id);
              setDragId(null);
            }}
            onMouseDown={(e) => {
              if (editingId === t.id) return;
              if (e.button === 1) {
                e.preventDefault();
                closeTab(t.id);
              } else {
                setActive(t.id);
              }
            }}
            onDoubleClick={() => startRename(t.id, t.title)}
            title={t.path ?? t.title}
          >
            {editingId === t.id ? (
              <input
                ref={inputRef}
                className="nd-tab-rename"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditingId(null);
                  e.stopPropagation();
                }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="nd-tab-title">{t.title}</span>
                <button
                  className="nd-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.id);
                  }}
                  title="Close"
                >
                  {dirty ? (
                    <span className="nd-tab-dot" />
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <path d="M0,0 L10,10 M10,0 L0,10" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        );
      })}
      <button className="nd-tab-new" onClick={() => newTab()} title="New tab (Ctrl+N)">
        +
      </button>
    </div>
  );
}
