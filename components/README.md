# Component manifest

`codetracer-components.json` is a machine-readable inventory of **every published component** in the
CodeTracer Design System Figma library (file key `Ytr6Ux4bYZYRUBpgNsSVml`), exported via the Figma
plugin API. It sits alongside the token exports (`brand/`, `alias/`, `mapped/`).

## Contents

- **116 components** — 76 component sets + 40 single components.
- Per component: `name`, `page`, Figma `id`, `kind` (`set` | `single`), `variantProperties`
  (variant axes → allowed values, long lists capped as `…+N more`), `variantCount`, `properties`
  (component properties → type: `VARIANT` | `TEXT` | `BOOLEAN` | `INSTANCE_SWAP`), and a short
  `description`.
- `_meta.counts` and `_meta.knownIssues` summarise totals and outstanding fixes.

## Known issues (fix before publishing)

- **`ui-icons`** (`192:11889`) and **`Tooltip`** (`4203:11656`) report Figma *variant conflicts*
  (duplicate/incompatible variant combinations). Flagged with `"variantError": true`.

## Provenance

Generated after a library audit + consolidation pass:

- Removed 6 superseded/duplicate drafts (instances detached or repointed first — no broken screens).
- Merged the two `session-role-chip` copies into one.
- Consolidated the scattered agent components onto the **Agent Components Library** page; moved
  generic primitives (avatars, loaders, charts, navigation, lists) to their own base-library pages.
- Every component now carries a description; no duplicate component names remain.

The token JSON (`brand`/`alias`/`mapped`) is a separate Figma-native variable export and is
unaffected by component changes.
