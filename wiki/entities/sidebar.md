# Sidebar — `src/components/Sidebar.tsx`

The sidebar builds an outline from the active tab's Markdown with a memoized
line parser. It recognizes only ATX `#` headings and ignores content inside
triple-backtick fences. Indentation reflects heading level.

Clicking a heading searches the current [[editor-commands]] view line-by-line,
sets selection at the first matching text, scrolls it into view, and focuses it.
Duplicate heading text is therefore ambiguous; [[source-view]] has no current
editor view to navigate. See [[known-limitations]].

