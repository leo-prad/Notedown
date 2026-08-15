# Sports Buddies — Code Wiki (read this first)

This repo maintains a self-updating **code wiki** so future sessions don't need to re-read the whole
source tree to get oriented. Three layers:

- **`raw/`** — things the user drops in for you to ingest (notes, specs, screenshots, pasted logs).
  Immutable once dropped; you read from it, never edit files here.
- **`wiki/`** — your knowledge base about this codebase. You own this layer entirely: create pages,
  update them when code changes, keep cross-references correct. The user reads it in Obsidian
  but doesn't write it.
- **`wiki/log.md`** — append-only chronological record of what you did.

## Before doing any non-trivial task

Read `wiki/index.md` first. It links to entity pages (one per source file/module) and concept pages
(architecture, data flow, schema, major subsystems). Use those to figure out which actual source
files you need to open — don't grep/read the whole tree cold if the wiki already tells you where
something lives.

## `wiki/index.md`

Catalog of every wiki page: link, one-line summary, category (`entities/` or `concepts/`). Update it
whenever you add or remove a page.

## `wiki/entities/*.md`

One page per source file or module. Each page:
- What the file/module is responsible for
- Key functions/classes/exports it defines, with `path:line` references
- What it depends on / what depends on it (link with `[[other-page]]`)
- Non-obvious behavior or gotchas (not just a restatement of the code)

Keep these current: when you edit a source file in a way that changes its shape (new function,
renamed type, changed schema), update the corresponding entity page in the same turn.

## `wiki/concepts/*.md`

Cross-cutting topics that span multiple files: architecture overview, API/IPC surface, data schema,
key algorithms, build quirks. Update when a change touches the cross-cutting behavior, not just one
file.

## `wiki/log.md`

Append one entry per work session, most recent last, using this exact prefix format so it stays
greppable:

```
## [YYYY-MM-DD] <ingest|edit|query> | <short title>
Touched: path/to/file.ext, wiki/entities/foo.md
<1-3 sentences: what happened / what was learned>
```

## Ingesting from `raw/`

When the user says to ingest something from `raw/`: read it, summarize the takeaway, update the
relevant entity/concept pages and `wiki/index.md`, then log it. Don't just copy the raw file into the
wiki — extract and integrate.

## Project context

Sports Buddies is a new, not-yet-started project (the directory was empty at wiki setup time, no
git repo, no source files or manifest present yet). This section should be rewritten once the
project's language/framework and architecture are established.
