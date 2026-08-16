# Configuration

- `package.json` provides `npm run dev` (Vite), `npm run build` (TypeScript
  check then Vite build), `npm run preview`, and `npm run tauri`.
- `vite.config.ts` fixes Tauri dev server port 1420, supports
  `TAURI_DEV_HOST` HMR, prevents Vite from clearing Rust errors, and excludes
  `src-tauri` from its file watcher.
- `src-tauri/tauri.conf.json` sets product identity, Tauri build hooks,
  1100×760 custom-decorated window sizing, disabled CSP, asset-protocol access,
  and bundle icons.
- `src-tauri/capabilities/default.json` grants the main window controls,
  events/path operations, URL opener, and dialogs. `allow-destroy` is needed
  by [[app-shell]]'s close-save handler.
- `src-tauri/Cargo.toml` declares Tauri plus opener, dialog, and window-state
  plugins. `src-tauri/src/main.rs` is the small entry point that calls the
  library `run` function.

