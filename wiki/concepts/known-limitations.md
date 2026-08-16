# Known limitations

These items describe the checked-in code, not planned behavior.

- [[theme]] imports and injects Milkdown/Crepe CSS and `.milkdown` overrides.
  The current editor has no `.milkdown` element, so only its `data-theme` and
  `--nd-accent` updates affect the CodeMirror application chrome.
- [[ai]] is unused. The Settings UI deliberately reports that the assistant is
  unavailable rather than collecting credentials for a feature that cannot run;
  the dormant setting no longer exposes a non-functional toolbar button.
- Image `keep-absolute` still writes the dropped/pasted asset to Notedown's
  managed image folder; it controls the Markdown reference only. It does not
  preserve an arbitrary original source-file location.
- The outline matches only hash headings and ignores `~~~` fences. It navigates
  by heading text, so duplicate heading text jumps to the first match.
