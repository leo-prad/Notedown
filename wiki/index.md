# Notedown Wiki Index

Notedown is a native Windows Markdown and plain-text editor. The app lives at
the **repository root**: Tauri v2 hosts a React 19/Vite frontend whose editing
surface is CodeMirror 6. Start with [[architecture]].

## Concepts

- [[architecture]] — runtime layers, data flow, build layout, and custom chrome.
- [[session-persistence]] — session file, dirty tracking, and close behavior.
- [[live-preview]] — source-first CodeMirror presentation and its boundaries.
- [[known-limitations]] — current migration leftovers and user-visible gaps.

## Core entities

- [[rust-backend]] — `src-tauri/src/lib.rs`: file-system IPC and plugin registration.
- [[types]] — `src/types.ts`: persisted document, settings, and session schema.
- [[store]] — `src/store.ts`: Zustand state and document lifecycle.
- [[app-shell]] — `src/App.tsx`: application composition and global effects.
- [[lib-tauri]] — `src/lib/tauri.ts`: frontend Tauri, dialog, session, and image wrappers.
- [[theme]] — `src/lib/theme.ts`: theme selection and app chrome variables.
- [[editor-pane]] — `src/components/EditorPane.tsx`: CodeMirror construction and DOM handlers.
- [[livepreview]] — `src/lib/livepreview.ts`: live-preview decorations, math, and marker input.
- [[editor-commands]] — `src/lib/editor.ts`: imperative bridge to the focused editor.
- [[codeblock]] — `src/lib/codeblock.ts`: fenced-code language completion.
- [[export]] — `src/lib/export.ts`: HTML/print implementation (currently a legacy path).
- [[ai]] — `src/lib/ai.ts`: dormant streaming Anthropic/OpenAI-compatible providers.

## UI entities

- [[title-bar]] and [[tab-bar]] — custom title chrome, tabs, renaming, and drag reorder.
- [[menu-bar]] and [[toolbar]] — menu/ribbon formatting controls.
- [[sidebar]] — heading outline and editor navigation.
- [[source-view]] — raw Markdown textarea mode.
- [[find-replace]] — browser-find overlay and replacement actions.
- [[status-bar]] — counts and quick format/source/sidebar controls.
- [[context-menu]] — custom editor right-click menu.
- [[confirm-close]] — dirty-tab Save / Don't Save / Cancel dialog.
- [[settings]] — persisted settings UI.
- [[styling]] — `src/index.css` visual system and CodeMirror decoration classes.

## Configuration

- [[configuration]] — package scripts, Vite, Tauri window/capability configuration.
- [[entrypoints]] — React and Rust executable entry points.
- [[log]] — append-only history of documentation and implementation sessions.
