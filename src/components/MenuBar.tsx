import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { editorCmd, focusEditor } from "../lib/editor";
import { buildHtmlDocument, printDocument } from "../lib/export";
import { saveFileDialog, writeText } from "../lib/tauri";
import { openFileDialog } from "../lib/tauri";

interface MItem {
  label?: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  checked?: boolean;
  sep?: boolean;
  items?: MItem[];
}

const TOP = ["File", "Edit", "Paragraph", "Format", "View"] as const;

export function MenuBar() {
  const [open, setOpen] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === null) return;
    const onDown = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const menus = useMenus();

  return (
    <div className="nd-menus" ref={barRef}>
      {TOP.map((name, i) => (
        <div key={name} className="nd-menu-wrap">
          <button
            className={`nd-menu-top ${open === i ? "active" : ""}`}
            onClick={() => setOpen(open === i ? null : i)}
            onMouseEnter={() => open !== null && setOpen(i)}
          >
            {name}
          </button>
          {open === i && <Dropdown items={menus[i]} onClose={() => setOpen(null)} />}
        </div>
      ))}
    </div>
  );
}

function Dropdown({ items, onClose }: { items: MItem[]; onClose: () => void }) {
  const [openSub, setOpenSub] = useState<number | null>(null);
  return (
    <div className="nd-menu-pop" onMouseLeave={() => setOpenSub(null)}>
      {items.map((it, idx) =>
        it.sep ? (
          <div key={idx} className="nd-menu-sep" />
        ) : it.items ? (
          <div
            key={idx}
            className="nd-menu-item has-sub"
            onMouseEnter={() => setOpenSub(idx)}
          >
            <span className="nd-menu-check" />
            <span className="nd-menu-label">{it.label}</span>
            <span className="nd-menu-arrow">›</span>
            {openSub === idx && (
              <div className="nd-submenu-pop">
                {it.items.map((sub, j) =>
                  sub.sep ? (
                    <div key={j} className="nd-menu-sep" />
                  ) : (
                    <MenuRow
                      key={j}
                      it={sub}
                      onClose={onClose}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        ) : (
          <MenuRow key={idx} it={it} onClose={onClose} />
        ),
      )}
    </div>
  );
}

function MenuRow({ it, onClose }: { it: MItem; onClose: () => void }) {
  return (
    <button
      className={`nd-menu-item ${it.disabled ? "disabled" : ""}`}
      disabled={it.disabled}
      onClick={() => {
        if (it.disabled) return;
        it.action?.();
        onClose();
      }}
    >
      <span className="nd-menu-check">{it.checked ? "✓" : ""}</span>
      <span className="nd-menu-label">{it.label}</span>
      {it.shortcut && <span className="nd-menu-shortcut">{it.shortcut}</span>}
    </button>
  );
}

function exec(cmd: string) {
  try {
    document.execCommand(cmd);
  } catch {
    /* noop */
  }
}

function useMenus(): MItem[][] {
  const s = useStore();
  const active = s.tabs.find((t) => t.id === s.activeId);
  const canEdit = !!active && !active.sourceMode;

  const heading = (level: number) => ({
    label: `Heading ${level}`,
    shortcut: `Ctrl+${level}`,
    disabled: !canEdit,
    action: () => editorCmd.heading(level),
  });

  const file: MItem[] = [
    { label: "New", shortcut: "Ctrl+N", action: () => s.newTab() },
    { sep: true },
    { label: "Open…", shortcut: "Ctrl+O", action: () => s.openDialog() },
    { sep: true },
    { label: "Save", shortcut: "Ctrl+S", action: () => s.saveActive() },
    {
      label: "Save As…",
      shortcut: "Ctrl+Shift+S",
      action: () => active && s.saveTabAs(active.id),
      disabled: !active,
    },
    { sep: true },
    {
      label: "Export",
      items: [
        {
          label: "HTML…",
          disabled: !active,
          action: async () => {
            if (!active) return;
            const path = await saveFileDialog(`${active.title}.html`);
            if (path) await writeText(path, buildHtmlDocument(active.title, active.content));
          },
        },
        {
          label: "PDF… (via Print)",
          disabled: !active,
          action: () => active && printDocument(active.title, active.content),
        },
      ],
    },
    {
      label: "Print…",
      shortcut: "Ctrl+P",
      disabled: !active,
      action: () => active && printDocument(active.title, active.content),
    },
    { sep: true },
    {
      label: "Settings",
      shortcut: "Ctrl+,",
      action: () => s.setUI("settingsOpen", true),
    },
    {
      label: "Close Tab",
      shortcut: "Ctrl+W",
      action: () => active && s.attemptCloseTab(active.id),
      disabled: !active,
    },
  ];

  const edit: MItem[] = [
    { label: "Undo", shortcut: "Ctrl+Z", disabled: !canEdit, action: () => editorCmd.undo() },
    { label: "Redo", shortcut: "Ctrl+Y", disabled: !canEdit, action: () => editorCmd.redo() },
    { sep: true },
    { label: "Cut", shortcut: "Ctrl+X", action: () => exec("cut") },
    { label: "Copy", shortcut: "Ctrl+C", action: () => exec("copy") },
    { label: "Paste", shortcut: "Ctrl+V", action: () => exec("paste") },
    {
      label: "Copy as Markdown",
      shortcut: "Ctrl+Shift+C",
      disabled: !active,
      action: () => active && navigator.clipboard.writeText(active.content),
    },
    { sep: true },
    { label: "Select All", shortcut: "Ctrl+A", action: () => exec("selectAll") },
    {
      label: "Find and Replace",
      items: [
        { label: "Find / Replace…", shortcut: "Ctrl+F", action: () => s.setUI("findOpen", true) },
      ],
    },
  ];

  const paragraph: MItem[] = [
    {
      label: "Heading",
      items: [1, 2, 3, 4, 5, 6].map(heading),
    },
    { label: "Paragraph", shortcut: "Ctrl+0", disabled: !canEdit, action: () => editorCmd.paragraph() },
    { sep: true },
    { label: "Table", shortcut: "Ctrl+Shift+T", disabled: !canEdit, action: () => editorCmd.table() },
    { label: "Code Fences", shortcut: "Ctrl+Shift+K", disabled: !canEdit, action: () => editorCmd.codeBlock() },
    { label: "Quote", shortcut: "Ctrl+Shift+Q", disabled: !canEdit, action: () => editorCmd.blockquote() },
    { sep: true },
    { label: "Ordered List", shortcut: "Ctrl+Shift+[", disabled: !canEdit, action: () => editorCmd.orderedList() },
    { label: "Bullet List", shortcut: "Ctrl+Shift+]", disabled: !canEdit, action: () => editorCmd.bulletList() },
    { sep: true },
    { label: "Horizontal Line", disabled: !canEdit, action: () => editorCmd.hr() },
  ];

  const format: MItem[] = [
    { label: "Bold", shortcut: "Ctrl+B", disabled: !canEdit, action: () => editorCmd.bold() },
    { label: "Italic", shortcut: "Ctrl+I", disabled: !canEdit, action: () => editorCmd.italic() },
    { label: "Strikethrough", shortcut: "Alt+Shift+5", disabled: !canEdit, action: () => editorCmd.strike() },
    { label: "Inline Code", disabled: !canEdit, action: () => editorCmd.inlineCode() },
    { sep: true },
    {
      label: "Hyperlink…",
      shortcut: "Ctrl+K",
      disabled: !canEdit,
      action: () => {
        const url = window.prompt("Link URL:");
        if (url) document.execCommand("createLink", false, url);
        focusEditor();
      },
    },
    {
      label: "Image…",
      shortcut: "Ctrl+Shift+I",
      disabled: !canEdit,
      action: async () => {
        const files = await openFileDialog();
        if (files && files[0]) editorCmd.image(files[0]);
      },
    },
  ];

  const view: MItem[] = [
    { label: "Side Bar", shortcut: "Ctrl+Shift+L", checked: s.ui.sidebarOpen, action: () => s.toggleUI("sidebarOpen") },
    { label: "Source Code Mode", shortcut: "Ctrl+/", checked: !!active?.sourceMode, disabled: !active, action: () => s.toggleSourceMode() },
    { label: "Focus Mode", shortcut: "F8", checked: s.ui.focusMode, action: () => s.toggleUI("focusMode") },
    { label: "Typewriter Mode", shortcut: "F9", checked: s.ui.typewriterMode, action: () => s.toggleUI("typewriterMode") },
    { sep: true },
    { label: "Status Bar", checked: s.ui.statusBarOn, action: () => s.toggleUI("statusBarOn") },
  ];

  return [file, edit, paragraph, format, view];
}
