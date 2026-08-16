# Settings — `src/components/Settings.tsx`

The full-screen settings view edits [[types]] settings through [[store]].
Sections are General, Appearance, Editor, Image, AI, Export, and About; the
active section itself is local component state and resets on remount.

Every control calls `setSettings`, so settings are persisted by the app-wide
autosave subscription. Only a subset currently affects runtime behavior; see
[[known-limitations]]. Notably, the AI copy still describes Milkdown inline AI,
and the About panel still calls the product WYSIWYG/Milkdown despite the active
CodeMirror editor.

