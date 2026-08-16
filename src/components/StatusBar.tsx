import { useStore } from "../store";
import { isDarkTheme } from "../lib/theme";
import type { ThemeName } from "../types";

function oppositeTheme(theme: ThemeName): ThemeName {
  if (theme === "system") {
    return isDarkTheme(theme) ? "classic" : "classic-dark";
  }
  const pairs: Record<Exclude<ThemeName, "system">, Exclude<ThemeName, "system">> = {
    classic: "classic-dark",
    "classic-dark": "classic",
    frame: "frame-dark",
    "frame-dark": "frame",
    nord: "nord-dark",
    "nord-dark": "nord",
  };
  return pairs[theme];
}

export function StatusBar() {
  const active = useStore((s) => s.tabs.find((t) => t.id === s.activeId));
  const toggleUI = useStore((s) => s.toggleUI);
  const toggleSourceMode = useStore((s) => s.toggleSourceMode);
  const setFormat = useStore((s) => s.setFormat);
  const setSettings = useStore((s) => s.setSettings);
  const settings = useStore((s) => s.settings);

  const content = active?.content ?? "";
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const dark = isDarkTheme(settings.theme);

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
            className="nd-status-btn nd-theme-toggle"
            title={dark ? "Switch to light theme" : "Switch to dark theme"}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setSettings({ theme: oppositeTheme(settings.theme) })}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
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

function MoonIcon() {
  return (
    <svg className="nd-status-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="nd-status-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
