# Context menu — `src/components/ContextMenu.tsx`

[[app-shell]] opens this menu for right-clicks outside real inputs and prevents
the browser context menu. The component clamps its fixed position to the window,
then closes on outside mouse-down, blur, resize, or Escape.

It exposes inline [[editor-commands]], undo/redo, clipboard commands, Copy as
Markdown, table insertion, and Select All. Paste first tries deprecated
`document.execCommand("paste")`, then falls back to async clipboard text and
`insertText`; permissions may block either operation.

