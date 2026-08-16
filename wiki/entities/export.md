# Export — `src/lib/export.ts`

This module provides `buildHtmlDocument(title)` and `printDocument(title)`.
It creates a self-contained HTML document with inline print CSS and prints it
through a temporary hidden iframe.

**Current state:** `renderedBody` searches for
`.nd-editor-host .ProseMirror` (`src/lib/export.ts:22`), but the editor is
CodeMirror. Consequently no document content is found and File → Export HTML
and Print operate on an empty body. The module needs a Markdown-to-HTML renderer
or a CodeMirror-compatible rendering source. See [[known-limitations]].

