# Source view — `src/components/SourceView.tsx`

The raw-source alternative to [[editor-pane]] is a controlled `textarea`
bound directly to active tab content. Changes call `updateContent`; font
size, line height, and max width are read from settings. Browser spellcheck is
always disabled in this mode, regardless of the setting.

[[app-shell]] selects it when `tab.sourceMode` is true. Toggling that flag in
[[store]] also increments the editor epoch so the CodeMirror view is rebuilt on
return.

