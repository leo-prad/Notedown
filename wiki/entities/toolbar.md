# Toolbar — `src/components/Toolbar.tsx`

The ribbon toolbar mirrors a subset of [[menu-bar]] commands: heading,
lists, inline formatting, link, table, quote, and code block. It disables
itself when no tab is active or raw [[source-view]] mode is active.

A document `selectionchange` listener asks [[editor-commands]]
`getActiveFormat` for current inline/heading state. The heading flyout is
closed by an outside mouse-down listener. Its link button uses
`document.execCommand("createLink")`, so it does not share Ctrl+K's
source-aware `makeLink` behavior. The conditional AI button only focuses the
editor; it does not invoke [[ai]].

