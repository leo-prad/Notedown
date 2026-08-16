# Status bar — `src/components/StatusBar.tsx`

The status bar computes words and characters from the active source each render.
It also offers sidebar visibility, a display-format toggle between `md` and
`txt`, and preview/source mode toggling.

The format button changes only `Tab.format`; it does not convert content or
rename/change the saved file extension. Visibility is controlled by
`ui.statusBarOn` in [[store]].

