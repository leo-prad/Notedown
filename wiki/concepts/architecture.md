# Architecture

Notedown is a Windows desktop editor built at the repository root with Tauri
v2, React 19, TypeScript, Vite, and CodeMirror 6. Markdown source is the
document model; the editor decorates it into a Typora-style live preview rather
than serializing a rich-text model.

## Layers

- **Rust host** — [[rust-backend]] exposes unrestricted, dialog-selected text
  and binary I/O commands and registers the dialog, opener, and window-state
  plugins.
- **Frontend state** — [[store]] owns tabs, settings, UI flags, and persistence
  semantics. [[types]] is the persisted schema.
- **Application shell** — [[app-shell]] bootstraps the store, theme, close save,
  global keyboard shortcuts, and the component tree.
- **Editor** — [[editor-pane]] creates one CodeMirror view for the active tab;
  [[livepreview]] builds its decorations, and [[editor-commands]] lets
  non-editor UI act on the focused view.

## Data flow

```text
CodeMirror document change
  -> store.updateContent(tabId, source)
  -> app subscription (400 ms debounce)
  -> saveSession({ tabs, activeId, settings })
  -> Tauri app config directory/session.json

Open -> dialog -> Rust read_text -> store.openPaths -> active tab
Save -> store.saveTab -> Rust write_text -> savedContent updated
Paste/drop image -> saveImage -> Rust write_binary -> Markdown image inserted
```

Changing tabs rebuilds the editor. Settings and source-mode changes increment
`editorEpoch` so [[editor-pane]] rebuilds it with a new initial document. This
avoids two competing sources of truth: a live CodeMirror view is authoritative
until it publishes a source-string change to [[store]].

## Window and UI

Tauri disables native decorations in `src-tauri/tauri.conf.json`; [[title-bar]]
provides a draggable title bar, inline [[tab-bar]], and window controls.
[[styling]] supplies the light/dark variable sets and all component styling.

See [[known-limitations]] for incomplete migration work that materially affects
the editor's export, settings, and AI claims.

