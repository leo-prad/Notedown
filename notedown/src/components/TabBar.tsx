import { useState } from "react";
import { useStore, isDirty } from "../store";

export function TabBar() {
  const tabs = useStore((s) => s.tabs);
  const activeId = useStore((s) => s.activeId);
  const setActive = useStore((s) => s.setActive);
  const closeTab = useStore((s) => s.closeTab);
  const newTab = useStore((s) => s.newTab);
  const moveTab = useStore((s) => s.moveTab);
  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <div className="nd-tabbar">
      <div className="nd-tabs">
        {tabs.map((t) => {
          const dirty = isDirty(t);
          return (
            <div
              key={t.id}
              className={`nd-tab ${t.id === activeId ? "active" : ""}`}
              draggable
              onDragStart={() => setDragId(t.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId && dragId !== t.id) moveTab(dragId, t.id);
                setDragId(null);
              }}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(t.id);
                } else {
                  setActive(t.id);
                }
              }}
              title={t.path ?? t.title}
            >
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
            </div>
          );
        })}
      </div>
      <button className="nd-tab-new" onClick={() => newTab()} title="New tab (Ctrl+N)">
        +
      </button>
    </div>
  );
}
