# Live-preview extension — `src/lib/livepreview.ts`

`livePreview(docPath)` (`src/lib/livepreview.ts:408`) returns a
`StateField<DecorationSet>` and exposes it as CodeMirror view decorations.
It recomputes after source or selection changes. Its safe wrapper returns
`Decoration.none` if decoration construction fails, preserving a usable
plain-source editor.

`buildDecorationsUnsafe` recognizes heading, inline mark, blockquote, fenced
code, link, image, and Markdown syntax-tree nodes. It gathers code ranges
before running regex-based math detection, preventing a dollar sign in code
from becoming KaTeX. Math is omitted from tree decoration only when a node is
fully inside a math range—not merely when it starts there—avoiding earlier
paragraph pruning failures.

Widgets asynchronously resolve images through [[lib-tauri]], render KaTeX, and
provide fenced-code copy feedback. `autoPairMarkers` and `wrapSelection`
implement Markdown marker input; `makeLink` chooses a template based on
whether the selection looks like a URL; `setHeading` replaces or removes the
ATX prefix on the selected line.

CSS classes emitted here (`cm-h*`, `cm-link`, `cm-code*`, etc.) are defined
in [[styling]]. See [[live-preview]] for the behavior model.

