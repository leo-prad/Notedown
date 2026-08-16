# Rust backend — `src-tauri/src/lib.rs`

The native layer intentionally remains thin. It exposes Tauri commands for
UTF-8 reads (`read_text`), directory-creating text and binary writes
(`write_text`, `write_binary`), path existence, and ensuring a directory.
[[lib-tauri]] uses the first four commands.

Using custom commands avoids fs-plugin scope rules for arbitrary user-selected
paths. The builder registers opener, dialog, and window-state plugins, then
installs those commands in `invoke_handler`.

Tauri configuration enables the asset protocol for local images, disables
window decorations, and leaves CSP null. The default capability grants required
window actions including `destroy`, URL opening, dialog, path, and event
permissions. Capability changes require rebuilding/restarting Tauri.

