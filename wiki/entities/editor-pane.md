# Editor pane — `src/components/EditorPane.tsx`

[[editor-pane]] constructs and owns the active CodeMirror `EditorView`.

## Lifecycle

Its effect is keyed only by active tab ID and `editorEpoch`
(`src/components/EditorPane.tsx:63`). It reads the selected tab from the
store, constructs a view with the tab source, publishes changes through
`updateContent`, registers that view with [[editor-commands]], then destroys
and clears it during cleanup. Settings changes increment the epoch, which
rebuilds the editor and also resets its undo history/selection.

## Extensions and events

The view uses Markdown/GFM parsing, history, selection/drop cursor, wrapping,
custom highlighting, [[livepreview]], [[codeblock]], marker pairing, formatting
keys, default/history keys, and Tab indentation. Font size, line height, and
content width are CSS variables supplied to the scrolling host.

The DOM handler opens rendered links on click and bare URLs on Ctrl/Cmd-click.
Paste/drop detects image files, calls `saveImage` from [[lib-tauri]], and
inserts image Markdown when saving resolves. Multiple dropped images insert at
the same original cursor position, so asynchronous completion can reverse their
apparent order.

