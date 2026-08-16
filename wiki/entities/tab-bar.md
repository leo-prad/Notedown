# Tab bar — `src/components/TabBar.tsx`

The tab strip lives inside [[title-bar]]. It renders every [[types]] tab,
selects on primary mouse-down, safely closes through `attemptCloseTab`, and
shows a dirty dot instead of the close glyph until hover. Middle-click also
uses the safe close path.

Native drag events call `moveTab` for reordering. Double-click opens an
inline title editor; committing calls `renameTab`, which only changes display
metadata and does not rename a saved file. A plus button creates a new tab.

