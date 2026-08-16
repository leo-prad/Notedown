# Tauri frontend bridge — `src/lib/tauri.ts`

This module is the TypeScript boundary to [[rust-backend]] and Tauri plugins.

- `readText`, `writeText`, `writeBinary`, and `pathExists`
  (`src/lib/tauri.ts:8`) invoke Rust commands.
- `openFileDialog` and `saveFileDialog` use the dialog plugin with Markdown,
  text, and all-files filters.
- `loadSession` / `saveSession` read/write `session.json` in the Tauri
  config directory. Parsing/errors are swallowed on load; save logs its error.
- `saveImage` writes a sanitized, short-hash filename into the saved
  document's configured folder, or app-data `unsaved-images` for untitled
  documents; saved docs receive a relative Markdown path.
- `resolveImageSrc` resolves relative paths against the saved document and
  converts them to Tauri asset URLs for image widgets.

`imageStrategy` is not consulted here, despite being present in [[types]] and
[[settings]].

