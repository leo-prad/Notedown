# Settings — `src/components/Settings.tsx`

The full-screen settings view edits [[types]] settings through [[store]]. Its
left navigation is a Windows-style, icon-led section list (General, Appearance,
Editor, Image, AI, Export, and About); the active section itself is local
component state and resets on remount. Settings rows use native-style controls
and divider separation rather than independent cards. The active navigation
item intentionally keeps its regular text weight and adds a small rounded
accent bar at the rail edge, following Windows Settings selection decoration.

Every available control calls `setSettings`, so settings are persisted by the
app-wide autosave subscription. Editor typography, indentation, spellcheck,
marker/quote/bracket completion, image path strategy, and image folder name
all affect the live editor. The AI section deliberately presents an unavailable
state instead of accepting credentials for the dormant integration. The About
page uses the current logo and accurately describes the CodeMirror live-preview
architecture.
