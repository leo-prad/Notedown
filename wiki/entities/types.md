# Types — `src/types.ts`

This file defines the serializable application schema.

- `FileFormat` is `"md" | "txt"`.
- `ThemeName` names system/classic/frame/nord light and dark options.
- `Tab` contains an ID, optional absolute disk path, displayed title, current
  source, last saved source, format, and source-mode flag.
- `Settings` collects appearance, editor, restoration, image, and AI values.
  `DEFAULT_SETTINGS` (`src/types.ts:54`) supplies initial values.
- `SessionState` is the session JSON payload: tabs, active ID, and settings.

The schema is persisted as plain JSON by [[lib-tauri]] and is consumed by
[[store]] and [[settings]]. It has no version field or migration mechanism:
unknown future data is simply spread into the current settings object.

