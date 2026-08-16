import { useStore } from "../store";

export function StatusBar() {
  const active = useStore((s) => s.tabs.find((t) => t.id === s.activeId));
  const toggleUI = useStore((s) => s.toggleUI);
  const toggleSourceMode = useStore((s) => s.toggleSourceMode);
  const setFormat = useStore((s) => s.setFormat);

  const content = active?.content ?? "";
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="nd-statusbar">
      <button
        className="nd-status-btn"
        title="Toggle sidebar (Ctrl+Shift+L)"
        onClick={() => toggleUI("sidebarOpen")}
      >
        ▤
      </button>
      <div className="nd-status-spacer" />
      {active && (
        <>
          <button
            className="nd-status-btn"
            title="Change format"
            onClick={() =>
              setFormat(active.id, active.format === "md" ? "txt" : "md")
            }
          >
            {active.format.toUpperCase()}
          </button>
          <button
            className="nd-status-btn"
            title="Source code mode (Ctrl+/)"
            onClick={() => toggleSourceMode()}
          >
            {active.sourceMode ? "Preview" : "Source"}
          </button>
          <span className="nd-status-text">
            {words} words · {chars} chars
          </span>
        </>
      )}
    </div>
  );
}
