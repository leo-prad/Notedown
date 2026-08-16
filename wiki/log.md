# Sports Buddies — Work Log

Append-only. One entry per work session, most recent last.

## [2026-08-15] setup | librarian system installed
Touched: CLAUDE.md, wiki/index.md, wiki/log.md
Set up the raw/ + wiki/ code-wiki system via librarian-setup. Project directory was empty at setup time (no source files yet, not a git repo).

## [2026-08-15] edit | Scaffold Notedown (Tauri + React + Milkdown Crepe)
Touched: notedown/ (new app), wiki/concepts/*, wiki/entities/*, wiki/index.md
Decided stack (Tauri v2 + React 19 + Milkdown Crepe over WinUI 3 — no .NET SDK, WinUI would embed a
WebView anyway). Built full shell: custom chrome, File/Edit/Paragraph/Format/View menus, drag-reorder
tabs with dirty dots, WYSIWYG editor, source mode, find/replace, outline sidebar, settings page
(incl. AI), session persistence (keeps unsaved tabs on close). Frontend builds clean; cargo check
passes. Next: run tauri dev, smoke-test, wire Milkdown AI provider.

## [2026-08-16] edit | Swap editor to CodeMirror 6 live preview
Touched: notedown/src/lib/livepreview.ts (new), src/components/EditorPane.tsx, src/lib/editor.ts, src/components/{Toolbar,Sidebar,ContextMenu}.tsx, src/index.css, wiki/concepts/{architecture,live-preview}.md, wiki/entities/{editor-pane,editor-commands,livepreview}.md
Replaced Milkdown/Crepe (pure WYSIWYG) with a CodeMirror 6 Typora/Obsidian-style live-preview editor: markdown markers hide/reveal by caret, headings + inline marks style live, auto-pairing ($->$$, wrap selection), GFM + code highlighting, image paste/drop. Fixes the marker-toggle (#3) and auto-complete (#6) asks and removes Crepe's selection popup (#7). Verified via PrintWindow screenshot. Deferred: KaTeX math render, inline image widgets, pretty code-block chrome + language picker + block "Turn Into" menu, settings polish, AI re-add.

## [2026-08-16] edit | Live preview: math, links, code boxes, blockquotes, shortcuts
Touched: notedown/src/lib/livepreview.ts, src/components/EditorPane.tsx, src/index.css, src/lib/tauri.ts, wiki/entities/livepreview.md, wiki/concepts/live-preview.md
Rewrote the live-preview extension as a StateField (a ViewPlugin doing line-crossing replaces had blanked the app). Added KaTeX math (inline + block), clickable links, fenced-code boxes with hidden fences, blockquote bars, image widgets, Ctrl+B/I/U shortcuts, and tightened heading-marker reveal to the markers themselves. Auto-pair limited to formatting markers.

## [2026-08-16] edit | Code-block picker/copy, link fixes, blank+close fixes, tab-close warning, app icon
Touched: notedown/src/lib/livepreview.ts, notedown/src/lib/codeblock.ts (new), notedown/src/components/EditorPane.tsx, notedown/src/components/ConfirmClose.tsx (new), notedown/src/components/TabBar.tsx, notedown/src/components/TitleBar.tsx, notedown/src/App.tsx, notedown/src/store.ts, notedown/src-tauri/capabilities/default.json, notedown/src-tauri/icons/*, notedown/src/index.css
Added fenced-code language autocomplete (codeblock.ts) + an icon copy button. Fixed external links not opening (opener capability lacked URL scope) and added Ctrl+K makeLink, spellcheck-off + clickable bare URLs. Fixed a $-adjacent-to-code box glitch, and a blank-app regression (paragraph pruned when it started at a math span) — now prunes only fully-in-math nodes and wraps buildDecorations in try/catch. Fixed can't-close-app (missing core:window:allow-destroy). Added unsaved-tab close warning (ConfirmClose + store.attemptCloseTab), Ctrl+T new tab, arrow cursors on buttons, and the Notedown logo as app icon. NOTE: capability + icon changes need a full tauri dev restart.

## [2026-08-16] edit | Rebuild code wiki against repository root
Touched: wiki/index.md, wiki/concepts/*, wiki/entities/*, wiki/log.md
Reconciled every wiki page with the current root-level Tauri + React + CodeMirror codebase and added pages for every active UI, library, type, styling, and configuration module. Documented checked-in migration gaps (legacy Crepe theme/AI/export paths, inactive settings, and the File-menu dirty-close bypass) as limitations rather than treating them as implemented features.

## [2026-08-16] edit | Center ribbon toolbar
Touched: src/App.tsx, src/index.css, wiki/entities/{app-shell,styling}.md, wiki/log.md
Removed the flex spacer and positioned the formatting toolbar at the ribbon's viewport midpoint, leaving the menu bar anchored to the left.

## [2026-08-16] edit | Refresh application logo assets
Touched: Notedown Logo.png, public/logo.png, src-tauri/icons/*, wiki/entities/title-bar.md, wiki/log.md
Copied the updated logo into the title-bar asset and regenerated the Tauri Windows, macOS, iOS, and Android bundle icons from it.

## [2026-08-16] edit | Use Windows-native caption glyphs
Touched: src/components/TitleBar.tsx, src/index.css, wiki/entities/{title-bar,styling}.md, wiki/log.md
Replaced the custom SVG window-control icons with the Windows ChromeMinimize, ChromeMaximize, ChromeRestore, and ChromeClose glyphs from the Segoe Fluent/MDL2 icon font.
