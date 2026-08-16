import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useStore } from "./store";
import { applyTheme } from "./lib/theme";
import { saveSession } from "./lib/tauri";
import { editorCmd } from "./lib/editor";
import { TitleBar } from "./components/TitleBar";
import { MenuBar } from "./components/MenuBar";
import { Toolbar } from "./components/Toolbar";
import { EditorPane } from "./components/EditorPane";
import { SourceView } from "./components/SourceView";
import { StatusBar } from "./components/StatusBar";
import { Sidebar } from "./components/Sidebar";
import { FindReplace } from "./components/FindReplace";
import { Settings } from "./components/Settings";
import { ContextMenu, type CtxState } from "./components/ContextMenu";
import { ConfirmClose } from "./components/ConfirmClose";
import { printDocument } from "./lib/export";
import "./index.css";

function snapshot() {
  const s = useStore.getState();
  return {
    tabs: s.settings.restoreSession ? s.tabs : [],
    activeId: s.settings.restoreSession ? s.activeId : null,
    settings: s.settings,
  };
}

export default function App() {
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);
  const theme = useStore((s) => s.settings.theme);
  const accent = useStore((s) => s.settings.accent);
  const ui = useStore((s) => s.ui);
  const active = useStore((s) => s.tabs.find((t) => t.id === s.activeId));
  const [ctx, setCtx] = useState<CtxState | null>(null);

  // Boot
  useEffect(() => {
    init();
  }, [init]);

  // Theme
  useEffect(() => {
    applyTheme(theme, accent);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system", accent);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, accent]);

  // Debounced session autosave
  useEffect(() => {
    let timer: number | undefined;
    const unsub = useStore.subscribe(() => {
      clearTimeout(timer);
      timer = window.setTimeout(() => saveSession(snapshot()), 400);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  // Save on window close
  useEffect(() => {
    const w = getCurrentWindow();
    let unlisten: (() => void) | undefined;
    w.onCloseRequested(async (e) => {
      e.preventDefault();
      await saveSession(snapshot());
      await w.destroy();
    }).then((u) => (unlisten = u));
    return () => unlisten?.();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      const a = s.tabs.find((t) => t.id === s.activeId);
      const ctrl = e.ctrlKey || e.metaKey;

      if (
        ctrl &&
        !e.shiftKey &&
        (e.key.toLowerCase() === "n" || e.key.toLowerCase() === "t")
      ) {
        e.preventDefault();
        s.newTab();
      } else if (ctrl && e.key.toLowerCase() === "o") {
        e.preventDefault();
        s.openDialog();
      } else if (ctrl && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (a) s.saveTabAs(a.id);
      } else if (ctrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        s.saveActive();
      } else if (ctrl && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (a) s.attemptCloseTab(a.id);
      } else if (ctrl && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (a) printDocument(a.title);
      } else if (ctrl && e.key === ",") {
        e.preventDefault();
        s.setUI("settingsOpen", true);
      } else if (ctrl && e.key.toLowerCase() === "f") {
        e.preventDefault();
        s.setUI("findOpen", true);
      } else if (ctrl && e.key === "/") {
        e.preventDefault();
        s.toggleSourceMode();
      } else if (ctrl && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        s.toggleUI("sidebarOpen");
      } else if (e.key === "F8") {
        e.preventDefault();
        s.toggleUI("focusMode");
      } else if (e.key === "F9") {
        e.preventDefault();
        s.toggleUI("typewriterMode");
      } else if (ctrl && e.key === "Tab") {
        e.preventDefault();
        const i = s.tabs.findIndex((t) => t.id === s.activeId);
        if (i !== -1 && s.tabs.length > 1) {
          const nextI = e.shiftKey
            ? (i - 1 + s.tabs.length) % s.tabs.length
            : (i + 1) % s.tabs.length;
          s.setActive(s.tabs[nextI].id);
        }
      } else if (ctrl && e.key >= "1" && e.key <= "6" && a && !a.sourceMode) {
        e.preventDefault();
        editorCmd.heading(Number(e.key));
      } else if (ctrl && e.key === "0" && a && !a.sourceMode) {
        e.preventDefault();
        editorCmd.paragraph();
      } else if (e.key === "Escape" && s.ui.findOpen) {
        s.setUI("findOpen", false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Custom right-click action menu (replaces the browser context menu),
  // except inside real text inputs where the native menu is more useful.
  useEffect(() => {
    const onCtx = (e: MouseEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      setCtx({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("contextmenu", onCtx);
    return () => window.removeEventListener("contextmenu", onCtx);
  }, []);

  // Focus mode: dim non-active blocks
  useEffect(() => {
    if (!ui.focusMode) return;
    const onSel = () => {
      const root = document.querySelector(".nd-editor-host .cm-content");
      if (!root) return;
      root.querySelectorAll(".nd-focus-line").forEach((n) =>
        n.classList.remove("nd-focus-line"),
      );
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      let node: Node | null = sel.anchorNode;
      while (node && node.parentElement !== root) node = node.parentElement;
      if (node && (node as HTMLElement).classList)
        (node as HTMLElement).classList.add("nd-focus-line");
    };
    document.addEventListener("selectionchange", onSel);
    onSel();
    return () => document.removeEventListener("selectionchange", onSel);
  }, [ui.focusMode]);

  if (!ready) return <div className="nd-boot" />;

  const rootClass = [
    "nd-app",
    ui.focusMode ? "focus-mode" : "",
    ui.typewriterMode ? "typewriter" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <TitleBar />
      {ui.settingsOpen ? (
        <Settings />
      ) : (
        <>
          <div className="nd-ribbon">
            <MenuBar />
            <div className="nd-ribbon-spacer" />
            <Toolbar />
          </div>
          <div className="nd-body">
            {ui.sidebarOpen && <Sidebar />}
            <div className="nd-main">
              {ui.findOpen && <FindReplace />}
              {active && active.sourceMode ? (
                <SourceView tab={active} />
              ) : (
                <EditorPane />
              )}
            </div>
          </div>
          {ui.statusBarOn && <StatusBar />}
        </>
      )}
      {ctx && (
        <ContextMenu x={ctx.x} y={ctx.y} onClose={() => setCtx(null)} />
      )}
      <ConfirmClose />
    </div>
  );
}
