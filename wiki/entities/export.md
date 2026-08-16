# Export — `src/lib/export.ts`

This module converts Markdown source into a self-contained HTML document, then
uses it for file export and iframe printing. `markdownToHtml` handles headings,
paragraphs, inline marks, links/images, quotes, ordered/unordered lists, rules,
fenced code, and simple GFM tables. It escapes text and restricts generated
link/image URLs to safe local, fragment, HTTP(S), or mailto targets.

`buildHtmlDocument(title, markdown)` embeds the result with print CSS, while
`printDocument(title, markdown)` writes it into a temporary hidden iframe then
opens the system print workflow. [[menu-bar]] and [[app-shell]] pass active-tab
source explicitly, so export no longer depends on the retired ProseMirror DOM.
