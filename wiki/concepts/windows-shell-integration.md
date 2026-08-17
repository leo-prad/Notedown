# Windows shell integration

The NSIS release bundle declares Notedown as an editor for Markdown (`.md`,
`.markdown`, `.mdown`, and `.mkd`) and text (`.txt`) documents. After the user
chooses Notedown as the default app, Windows Explorer uses the Notedown bundle
icon for those file types and opens them in Notedown.

This association is distinct from a content thumbnail. A genuine Explorer
thumbnail requires a separately shipped, signed COM thumbnail handler that
implements `IThumbnailProvider` and is registered under the file type's
`ShellEx` key. It must render a safe miniature of each document without loading
the Tauri/WebView app inside Explorer. This handler is intentionally not
represented as finished until its native DLL, registration/unregistration, and
Explorer-cache tests exist.

See also: [[configuration]] and [[known-limitations]].
