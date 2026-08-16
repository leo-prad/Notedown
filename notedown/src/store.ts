import { create } from "zustand";
import {
  DEFAULT_SETTINGS,
  type FileFormat,
  type Settings,
  type Tab,
} from "./types";
import {
  loadSession,
  openFileDialog,
  readText,
  saveFileDialog,
  writeText,
} from "./lib/tauri";

let idCounter = 0;
const uid = () => `t${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

function basename(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

function formatFromPath(path: string): FileFormat {
  return /\.txt$/i.test(path) ? "txt" : "md";
}

function untitledTitle(tabs: Tab[]): string {
  let n = 1;
  const taken = new Set(tabs.map((t) => t.title));
  while (taken.has(`Untitled-${n}`)) n++;
  return `Untitled-${n}`;
}

function makeTab(partial: Partial<Tab> & { content: string }): Tab {
  return {
    id: uid(),
    path: null,
    title: "Untitled-1",
    savedContent: partial.content,
    format: "md",
    sourceMode: false,
    ...partial,
  };
}

interface UIState {
  sidebarOpen: boolean;
  focusMode: boolean;
  typewriterMode: boolean;
  statusBarOn: boolean;
  settingsOpen: boolean;
  findOpen: boolean;
}

interface Store {
  tabs: Tab[];
  activeId: string | null;
  settings: Settings;
  ui: UIState;
  /** Bumped to force the editor to remount (theme/font/source-mode changes). */
  editorEpoch: number;
  ready: boolean;
  /** Tab id awaiting an unsaved-changes close confirmation, if any. */
  confirmCloseId: string | null;

  init: () => Promise<void>;
  newTab: (format?: FileFormat) => void;
  openDialog: () => Promise<void>;
  openPaths: (paths: string[]) => Promise<void>;
  setActive: (id: string) => void;
  /** Close, but if the tab has unsaved changes, ask first (sets confirmCloseId). */
  attemptCloseTab: (id: string) => void;
  closeTab: (id: string) => void;
  cancelClose: () => void;
  moveTab: (fromId: string, toId: string) => void;
  updateContent: (id: string, content: string) => void;
  setFormat: (id: string, format: FileFormat) => void;
  renameTab: (id: string, title: string) => void;

  saveActive: () => Promise<void>;
  saveTab: (id: string) => Promise<void>;
  saveTabAs: (id: string) => Promise<void>;

  toggleSourceMode: () => void;
  toggleUI: (key: keyof UIState) => void;
  setUI: (key: keyof UIState, value: boolean) => void;
  setSettings: (patch: Partial<Settings>) => void;
  bumpEditor: () => void;

  activeTab: () => Tab | undefined;
}

export const useStore = create<Store>((set, get) => ({
  tabs: [],
  activeId: null,
  settings: DEFAULT_SETTINGS,
  ui: {
    sidebarOpen: false,
    focusMode: false,
    typewriterMode: false,
    statusBarOn: true,
    settingsOpen: false,
    findOpen: false,
  },
  editorEpoch: 0,
  ready: false,
  confirmCloseId: null,

  init: async () => {
    const session = await loadSession();
    if (session && session.tabs.length > 0) {
      set({
        tabs: session.tabs,
        activeId:
          session.activeId && session.tabs.some((t) => t.id === session.activeId)
            ? session.activeId
            : session.tabs[0].id,
        settings: { ...DEFAULT_SETTINGS, ...session.settings },
        ready: true,
      });
    } else {
      const settings = session?.settings
        ? { ...DEFAULT_SETTINGS, ...session.settings }
        : DEFAULT_SETTINGS;
      const tab = makeTab({ content: "", title: "Untitled-1" });
      set({ tabs: [tab], activeId: tab.id, settings, ready: true });
    }
  },

  newTab: (format) => {
    const { tabs, settings } = get();
    const tab = makeTab({
      content: "",
      title: untitledTitle(tabs),
      format: format ?? settings.defaultFormat,
    });
    set({ tabs: [...tabs, tab], activeId: tab.id });
  },

  openDialog: async () => {
    const paths = await openFileDialog();
    if (paths) await get().openPaths(paths);
  },

  openPaths: async (paths) => {
    const { tabs } = get();
    let newTabs = [...tabs];
    let lastId: string | null = null;
    for (const path of paths) {
      const existing = newTabs.find((t) => t.path === path);
      if (existing) {
        lastId = existing.id;
        continue;
      }
      try {
        const content = await readText(path);
        const tab = makeTab({
          content,
          savedContent: content,
          path,
          title: basename(path),
          format: formatFromPath(path),
        });
        newTabs.push(tab);
        lastId = tab.id;
      } catch (e) {
        console.error("Failed to open", path, e);
      }
    }
    set({ tabs: newTabs, activeId: lastId ?? get().activeId });
  },

  setActive: (id) => set({ activeId: id }),

  attemptCloseTab: (id) => {
    const tab = get().tabs.find((t) => t.id === id);
    if (!tab) return;
    if (isDirty(tab)) {
      set({ confirmCloseId: id });
      return;
    }
    get().closeTab(id);
  },

  cancelClose: () => set({ confirmCloseId: null }),

  closeTab: (id) => {
    const { tabs, activeId, confirmCloseId } = get();
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const clearConfirm = confirmCloseId === id ? { confirmCloseId: null } : {};
    const newTabs = tabs.filter((t) => t.id !== id);
    if (newTabs.length === 0) {
      const tab = makeTab({ content: "", title: "Untitled-1" });
      set({ tabs: [tab], activeId: tab.id, ...clearConfirm });
      return;
    }
    let newActive = activeId;
    if (activeId === id) {
      newActive = (newTabs[idx] ?? newTabs[idx - 1] ?? newTabs[0]).id;
    }
    set({ tabs: newTabs, activeId: newActive, ...clearConfirm });
  },

  moveTab: (fromId, toId) => {
    const { tabs } = get();
    const from = tabs.findIndex((t) => t.id === fromId);
    const to = tabs.findIndex((t) => t.id === toId);
    if (from === -1 || to === -1 || from === to) return;
    const next = [...tabs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    set({ tabs: next });
  },

  updateContent: (id, content) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, content } : t)),
    }));
  },

  setFormat: (id, format) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, format } : t)),
    }));
  },

  renameTab: (id, title) => {
    const clean = title.trim();
    if (!clean) return;
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, title: clean } : t)),
    }));
  },

  saveActive: async () => {
    const { activeId } = get();
    if (activeId) await get().saveTab(activeId);
  },

  saveTab: async (id) => {
    const tab = get().tabs.find((t) => t.id === id);
    if (!tab) return;
    if (!tab.path) {
      await get().saveTabAs(id);
      return;
    }
    try {
      await writeText(tab.path, tab.content);
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === id ? { ...t, savedContent: t.content } : t,
        ),
      }));
    } catch (e) {
      console.error("Save failed", e);
    }
  },

  saveTabAs: async (id) => {
    const tab = get().tabs.find((t) => t.id === id);
    if (!tab) return;
    const suggested = tab.path
      ? basename(tab.path)
      : /\.(md|markdown|txt)$/i.test(tab.title)
        ? tab.title
        : `${tab.title}.${tab.format}`;
    const path = await saveFileDialog(suggested);
    if (!path) return;
    try {
      await writeText(path, tab.content);
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === id
            ? {
                ...t,
                path,
                title: basename(path),
                format: formatFromPath(path),
                savedContent: t.content,
              }
            : t,
        ),
      }));
    } catch (e) {
      console.error("Save As failed", e);
    }
  },

  toggleSourceMode: () => {
    const { activeId } = get();
    if (!activeId) return;
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === activeId ? { ...t, sourceMode: !t.sourceMode } : t,
      ),
      editorEpoch: s.editorEpoch + 1,
    }));
  },

  toggleUI: (key) =>
    set((s) => ({ ui: { ...s.ui, [key]: !s.ui[key] } })),

  setUI: (key, value) => set((s) => ({ ui: { ...s.ui, [key]: value } })),

  setSettings: (patch) =>
    set((s) => ({
      settings: { ...s.settings, ...patch },
      editorEpoch: s.editorEpoch + 1,
    })),

  bumpEditor: () => set((s) => ({ editorEpoch: s.editorEpoch + 1 })),

  activeTab: () => {
    const { tabs, activeId } = get();
    return tabs.find((t) => t.id === activeId);
  },
}));

export const isDirty = (t: Tab): boolean => t.content !== t.savedContent;
