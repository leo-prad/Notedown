import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useStore, isDirty } from "../store";

const appWindow = getCurrentWindow();

export function TitleBar() {
  const active = useStore((s) => s.tabs.find((t) => t.id === s.activeId));
  const toggleUI = useStore((s) => s.toggleUI);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    appWindow.isMaximized().then(setMaximized);
    appWindow
      .onResized(async () => setMaximized(await appWindow.isMaximized()))
      .then((u) => (unlisten = u));
    return () => unlisten?.();
  }, []);

  const title = active
    ? `${isDirty(active) ? "• " : ""}${active.title}`
    : "Notedown";

  return (
    <div className="nd-titlebar" data-tauri-drag-region>
      <div className="nd-title-left" data-tauri-drag-region>
        <div className="nd-appicon">N</div>
        <span className="nd-title-text" data-tauri-drag-region>
          {title} <span className="nd-title-app">— Notedown</span>
        </span>
      </div>
      <div className="nd-title-spacer" data-tauri-drag-region />
      <div className="nd-title-actions">
        <button
          className="nd-icon-btn"
          title="Settings"
          onClick={() => toggleUI("settingsOpen")}
        >
          <GearIcon />
        </button>
        <div className="nd-win-controls">
          <button
            className="nd-win-btn"
            title="Minimize"
            onClick={() => appWindow.minimize()}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
            </svg>
          </button>
          <button
            className="nd-win-btn"
            title={maximized ? "Restore" : "Maximize"}
            onClick={() => appWindow.toggleMaximize()}
          >
            {maximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect x="0" y="2" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
                <rect x="2" y="0" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            )}
          </button>
          <button
            className="nd-win-btn nd-win-close"
            title="Close"
            onClick={() => appWindow.close()}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0,0 L10,10 M10,0 L0,10" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
