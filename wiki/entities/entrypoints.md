# Entry points

`src/main.tsx` is the browser/WebView frontend entry point: it creates a React
root for `#root` and renders [[app-shell]]. `index.html` supplies that root and
loads the Vite module.

`src-tauri/src/main.rs` is the native entry point. In release builds it hides
the extra Windows console window, then delegates to `notedown_lib::run()` in
[[rust-backend]]. `src-tauri/build.rs` runs the standard Tauri build helper to
generate application context and capability artifacts.
