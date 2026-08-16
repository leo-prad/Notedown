# Theme — `src/lib/theme.ts`

`resolveTheme` maps `system` to classic light/dark using
`matchMedia`; `isDarkTheme` identifies the effective dark variants.
`applyTheme` (`src/lib/theme.ts:45`) always updates
`document.documentElement.dataset.theme` and `--nd-accent`, which [[styling]]
uses for application and CodeMirror colors.

It also loads Milkdown/Crepe theme URLs and injects a `.milkdown` override
style. CodeMirror has replaced Milkdown and the current DOM contains no
`.milkdown`, so those injected stylesheet/override effects are dormant
legacy work. The selected theme's light/dark status and accent still work.
See [[known-limitations]].

