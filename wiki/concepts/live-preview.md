# Live preview

The editor keeps real Markdown source in CodeMirror and makes it readable with
decorations. Saving therefore writes the editor source without a rich-text
serialization step.

## Presentation behavior

- ATX headings receive level-specific line classes; the hash marker becomes a
  faint marker only while the caret is over it.
- Strong/emphasis/strikethrough/inline-code markers are hidden outside their
  enclosing syntax range, while their content is styled.
- Links display only their text, images become widgets, blockquotes receive a
  bar, and fenced code gets a boxed visual treatment and copy button.
- Inline and display `$...$` math becomes KaTeX only when the caret is outside
  the math span. Raw math remains editable when entered, including an empty
  multiline `$$\n$$` span; the unfocused empty state shows an intentional
  formula placeholder instead of disappearing.
- Markdown link text opens on normal click; bare URLs require Ctrl/Cmd-click,
  so a normal click can still edit them.

[[livepreview]] implements this as a `StateField<DecorationSet>` because
display math uses block, line-crossing replacement decorations. A defensive
wrapper returns no decorations on an exception, leaving source editable rather
than blanking the editor.

## Editing behavior

`autoPairMarkers` supports the enabled Markdown, quote, and bracket completion
preferences. [[editor-pane]] adds direct
shortcuts for bold, italic, underline, strike, inline code, and links; menus
and the toolbar use [[editor-commands]]. Fenced language completion comes from
[[codeblock]].

This is a source-first experience, not a WYSIWYG DOM. The current renderer is
partial; see [[known-limitations]] for unsupported or inconsistent features.
