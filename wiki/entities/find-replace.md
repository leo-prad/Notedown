# Find and replace — `src/components/FindReplace.tsx`

This floating overlay uses Chromium/WebView2's non-standard `window.find` for
next/previous searching. It automatically focuses and selects the Find field
on mount and supports match-case, replace-one, replace-all, and Escape close.

Replace-one requires the current browser DOM selection to equal the search text,
then uses `document.execCommand("insertText")`. Replace-all operates on the
active source string with an escaped global regular expression, writes it to
[[store]], and calls `bumpEditor` to rebuild CodeMirror. It offers literal,
not regex, searching.

