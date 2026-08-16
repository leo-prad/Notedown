# Status bar — `src/components/StatusBar.tsx`

The status bar computes words and characters from the active source each render.
It also offers sidebar visibility, a light/dark theme toggle, a display-format
toggle between `md` and `txt`, and preview/source mode toggling. The theme
button shows a moon in light mode and a sun in dark mode; it preserves the
selected classic/frame/nord family when switching its light/dark variant and
turns a system theme into an explicit classic light/dark choice.

The format button changes only `Tab.format`; it does not convert content or
rename/change the saved file extension. Visibility is controlled by
`ui.statusBarOn` in [[store]].
