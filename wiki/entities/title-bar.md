# Title bar — `src/components/TitleBar.tsx`

The custom chrome component is used because Tauri window decorations are off.
It places the public logo, [[tab-bar]], an expandable drag region, a settings
toggle, and native minimize/maximize/close controls in the top 40-pixel row.

A resize listener keeps local `maximized` state synchronized with Tauri so the
maximize button shows the proper restore glyph. Close invokes
`appWindow.close()`; [[app-shell]] receives and intercepts the subsequent
close request to persist the session.

The app icon is `public/logo.png`; operating-system bundle icons live under
`src-tauri/icons/`.

