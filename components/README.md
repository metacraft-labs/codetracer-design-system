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

## Known issues

- None outstanding. The earlier `ui-icons` / `Tooltip` variant conflicts have been resolved.

## Provenance

Generated after a library audit + consolidation pass:

- Removed 6 superseded/duplicate drafts (instances detached or repointed first — no broken screens).
- Merged the two `session-role-chip` copies into one.
- Consolidated the scattered agent components onto the **Agent Components Library** page; moved
  generic primitives (avatars, loaders, charts, navigation, lists) to their own base-library pages.
- Every component now carries a description; no duplicate component names remain.

## Token files

This PR is **purely additive** — it adds only the component manifest. The `brand` / `alias` /
`mapped` token corrections that earlier revisions of this branch carried have since landed on `dev`
independently (via the convention-driven export tooling and the colour-mode × density axes export),
so `dev`'s token files already reflect the live Figma variables and this branch no longer touches
them.

### Known text-style caveat (unchanged by this PR)

- **Typography text styles are not variables**, so they are not covered by the variable export. One
  stale reference remains on `dev`: `brand.json → fontfamilies.2` still reads
  `"Space Grotesk Variable"`. Fixing that (and any other text-style drift) needs a native
  **text-style** export, which the Figma variable API can't produce.
