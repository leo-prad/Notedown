# Session persistence

Notedown intentionally preserves unsaved tabs across application shutdown.
`src/App.tsx:13` takes a snapshot of the [[store]]: when `restoreSession` is
enabled it includes all tabs and the active tab ID; otherwise it persists an
empty tab list but retains settings.

## Persistence lifecycle

- Every store change schedules `saveSession(snapshot())` after 400 ms
  (`src/App.tsx:55`). The session lives at `appConfigDir()/session.json` through
  [[lib-tauri]].
- During boot, `store.init` (`src/store.ts:108`) merges saved settings with
  `DEFAULT_SETTINGS`, restores valid tabs/active ID, or creates `Untitled-1`.
- On an OS or title-bar close request, the shell prevents the event, saves a
  fresh snapshot, then calls `destroy` (`src/App.tsx:68`). There is deliberately
  no save prompt for quitting the entire application.

## Dirty documents and tab close

`isDirty` (`src/store.ts:321`) is only `content !== savedContent`. Successful
save and Save As calls refresh `savedContent`; raw session restoration keeps
the two values distinct, so reopened unsaved buffers remain dirty.

Most tab-close paths use `attemptCloseTab` (`src/store.ts:168`), setting
`confirmCloseId` for a dirty tab. [[confirm-close]] saves, discards, or cancels
that request. `closeTab` never leaves the application with zero tabs: removing
the final tab immediately creates a blank `Untitled-1`.

File → Close Tab, tab-strip close actions, and Ctrl+W all route through
`attemptCloseTab`, so each destructive tab-close path receives the same dirty
confirmation.
