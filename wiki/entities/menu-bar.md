# Menu bar — `src/components/MenuBar.tsx`

[[menu-bar]] renders File, Edit, Paragraph, Format, and View dropdowns from
state-derived descriptors. `useMenus` (`src/components/MenuBar.tsx:119`)
recreates enabled and checked state from [[store]] so source mode disables
CodeMirror-only operations.

It dispatches store document/UI actions, [[editor-commands]], standard browser
clipboard commands, [[export]], and Tauri dialogs. It supports one submenu
level, outside-click closing, and hover-to-switch while a menu is open.

The Format hyperlink actions use `document.execCommand("createLink")`, which
targets DOM selection rather than the CodeMirror command path and differs from
the direct Ctrl+K shortcut. File → Close Tab routes through `attemptCloseTab`,
so dirty buffers receive [[confirm-close]] just like the tab strip and Ctrl+W.
