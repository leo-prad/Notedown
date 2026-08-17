# Styling — `src/index.css`

This single global stylesheet defines the Fluent-like desktop layout, controls,
menus, settings, title chrome, tab strip, popup animation, and application
light/dark CSS-variable palettes. [[theme]] sets `data-theme` and accent values
consumed here.

It also defines the CodeMirror live-preview presentation classes emitted by
[[livepreview]]: heading levels, markers, inline styles, images/links/math,
quotes, code boxes and copy button, bare URLs, autocomplete, and syntax colors.
The editor pane supplies font/line-height/content-width custom properties.

Editor and settings scrolling uses a narrow, rounded thumb with theme-derived
colors. Image widgets reveal a seven-action contextual ribbon for alt text,
alignment, copy, and removal; alignment is persisted in the Markdown image
title as `notedown-align` metadata.

The ribbon is positioned relative and [[toolbar]] is absolutely centered at
50% of the viewport; the menu bar remains in normal flow on the left.

Window-caption controls use the native Windows Segoe Fluent / MDL2 icon-font
glyphs for minimize, maximize, restore, and close.

The settings shell uses the same icon font for its section navigation, while
setting rows are separated by subtle dividers and controls use compact native
Windows-style select and switch proportions.

At desktop widths the navigation rail scales to the wider Windows Settings
proportion. An active item retains regular-weight text and gains a narrow,
rounded accent indicator on its left edge.
