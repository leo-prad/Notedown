# Known limitations

These items describe the checked-in code, not planned behavior.

- [[export]] still queries `.ProseMirror`, but CodeMirror is the active editor.
  HTML export and printing therefore produce an empty body unless such a DOM
  node happens to exist.
- [[theme]] imports and injects Milkdown/Crepe CSS and `.milkdown` overrides.
  The current editor has no `.milkdown` element, so only its `data-theme` and
  `--nd-accent` updates affect the CodeMirror application chrome.
- [[ai]] is unused. The toolbar only displays a non-functional AI icon when
  enabled, and the settings page still says it adds Milkdown inline AI.
- Image setting `imageStrategy` is persisted and displayed but ignored:
  `saveImage` always copies a pasted/dropped image next to a saved document or
  to the application data scratch directory for an untitled document.
- Several editor settings are UI-only: indentation, auto quotes, auto brackets,
  and auto Markdown do not configure CodeMirror. Spellcheck, font size, line
  height, width, and image folder name do take effect.
- [[menu-bar]] File → Close Tab bypasses the dirty confirmation; tab buttons,
  middle-click, and Ctrl+W use the safe `attemptCloseTab` path.
- The outline matches only hash headings and ignores `~~~` fences. It navigates
  by heading text, so duplicate heading text jumps to the first match.

