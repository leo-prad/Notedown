# Code-block completion — `src/lib/codeblock.ts`

`codeLangCompletion` (`src/lib/codeblock.ts:107`) is a CodeMirror
autocomplete extension installed by [[editor-pane]]. It detects a partial
opening ```` or `~~~` line, confirms the line is the first line of a
`FencedCode` syntax node when parsing is available, and offers filtered
languages.

`LANG_LIST` is built once from CodeMirror language data: names and aliases are
lowercased, deduplicated, sorted, and paired with a small emoji or a generic
Every completion has a leading language symbol. Completion inserts the plain
language label; `displayLabel` adds the icon for the dropdown. Styling is in
[[styling]].

The code-copy button is revealed when the pointer is anywhere over a fenced
code block, not only over its opening line.

The fallback text check exists for a newly typed fence before the syntax tree
has caught up. This extension only supplies completion; it does not render the
code block—that is [[livepreview]]'s responsibility.
