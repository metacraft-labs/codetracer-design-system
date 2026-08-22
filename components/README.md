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

## Token files — re-exported to match Figma

The `brand` / `alias` / `mapped` token files were **regenerated from the live Figma variables** in
this PR and verified field-by-field: **0 differences across all 512 variables.** What changed:

- **mapped:** 7 value corrections (`text/primary/caption`, `surface/base/card`, two
  `primary/*-hover`, three `surface/alert/*`), 12 tokens added (`colors/ui/role/*`,
  `icon/primary/subtle-hover`, `divider/secondary`, `text/primary/label-subtle`, `caption-subtle`),
  and the `surface/canvas` → `surface/base/canvas` restructure. The 8 `role/*` tokens keep their
  specific Figma scopes.
- **alias:** `padding/*` renamed to `spacing/*`, `font-size/*` added, the `deafult` typo fixed.
- **brand:** `type/fontFamily/Space Grotesk` variable set to `"Space Grotesk"` (static-font
  migration).

### Caveats (please review)

- Rebuilt via the Figma **plugin API**, not Figma's native variable exporter — so some key ordering
  differs from the previous files (values are verified equal). Review the diff before merge.
- **Typography text styles are not variables** and were *not* re-exported. One stale reference
  remains: `brand.json → fontfamilies.2` still reads `"Space Grotesk Variable"`. Updating that (and
  any other text-style drift) needs a native **text-style** export, which the variable API can't
  produce.
