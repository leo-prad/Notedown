import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useStore } from "../store";
import { TabBar } from "./TabBar";

const appWindow = getCurrentWindow();

export function TitleBar() {
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

  return (
    <div className="nd-titlebar" data-tauri-drag-region>
      <div className="nd-appicon">N</div>
      <TabBar />
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
          <button className="nd-win-btn" title="Minimize" onClick={() => appWindow.minimize()}>
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
          <button className="nd-win-btn nd-win-close" title="Close" onClick={() => appWindow.close()}>
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
