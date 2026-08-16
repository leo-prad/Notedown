# Styling — `src/index.css`

This single global stylesheet defines the Fluent-like desktop layout, controls,
menus, settings, title chrome, tab strip, popup animation, and application
light/dark CSS-variable palettes. [[theme]] sets `data-theme` and accent values
consumed here.

It also defines the CodeMirror live-preview presentation classes emitted by
[[livepreview]]: heading levels, markers, inline styles, images/links/math,
quotes, code boxes and copy button, bare URLs, autocomplete, and syntax colors.
The editor pane supplies font/line-height/content-width custom properties.

The ribbon is positioned relative and [[toolbar]] is absolutely centered at
50% of the viewport; the menu bar remains in normal flow on the left.

Window-caption controls use the native Windows Segoe Fluent / MDL2 icon-font
glyphs for minimize, maximize, restore, and close.
