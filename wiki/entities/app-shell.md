# App shell — `src/App.tsx`

The default React component composes the desktop UI and owns application-wide
effects.

## Responsibilities

- Boots [[store]] once (`src/App.tsx:33`), renders a boot placeholder until
  `ready`, and selects settings view versus the editing layout.
- Calls [[theme]] for setting/theme changes; when set to system it subscribes to
  `prefers-color-scheme` changes.
- Subscribes directly to Zustand and debounces a 400 ms session save. Its
  `snapshot` helper intentionally suppresses tab restoration when the setting
  is off.
- Intercepts the Tauri close event to save before `destroy`; this preserves
  unsaved buffers rather than prompting on application quit.
- Installs global shortcuts for document, navigation, view, printing, and
  heading operations. Text-format keybindings live in [[editor-pane]].
- Shows the custom [[context-menu]] outside native inputs and implements focus
  mode by adding `.nd-focus-line` to the selected top-level CodeMirror DOM node.

It renders [[title-bar]], [[menu-bar]], a viewport-centered [[toolbar]], [[sidebar]],
[[editor-pane]] or [[source-view]], [[find-replace]], [[status-bar]],
[[settings]], and [[confirm-close]].
