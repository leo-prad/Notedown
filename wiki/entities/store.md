# Store — `src/store.ts`

`useStore` (`src/store.ts:94`) is the Zustand source of truth for documents,
settings, UI state, readiness, editor rebuild epochs, and pending dirty-close
confirmation. The persisted `Tab`, `Settings`, and `SessionState` shapes
come from [[types]].

## Document lifecycle

`init` loads session state; `newTab` creates unique Untitled titles;
`openPaths` deduplicates existing file paths, reads each file, and selects the
last opened tab. `saveTab` writes an existing path or delegates to Save As,
then updates `savedContent`. Errors are logged without user-facing feedback.

`attemptCloseTab` safeguards dirty buffers with `confirmCloseId`;
`closeTab` removes a tab and selects a neighboring one, or creates a blank
tab if it removed the final document. `moveTab` handles drag reorder and
`renameTab` changes only the displayed tab title, never the file path.

Settings and source-mode toggles increment `editorEpoch`, forcing
[[editor-pane]] to recreate. `isDirty` is a direct source-string comparison;
there is no separate dirty flag.

