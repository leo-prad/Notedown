# Editor commands — `src/lib/editor.ts`

This module holds a module-scoped reference to the active CodeMirror
`EditorView`, avoiding prop drilling through menus and controls.

- `setCurrentEditor`, `getCurrentEditor`, and `focusEditor`
  (`src/lib/editor.ts:9`) manage that reference. [[editor-pane]] clears it on
  unmount.
- `editorCmd` (`src/lib/editor.ts:56`) wraps heading, inline formatting,
  quote/list prefixes, code/table/HR/image insertion, and undo/redo. Each
  operation refocuses the editor afterward.
- `getActiveFormat` (`src/lib/editor.ts:94`) walks syntax-tree parents at
  the caret and drives active states in [[toolbar]].

Ordered-list toggling has a non-obvious limitation: it prefixes selected lines
with increasing numbers and only removes a prefix if it exactly equals the
newly computed number. Existing non-sequential ordered lists therefore do not
toggle cleanly.

