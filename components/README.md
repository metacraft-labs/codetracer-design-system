# Component manifest

`codetracer-components.json` lists every published component in the Figma file
`Ytr6Ux4bYZYRUBpgNsSVml` (116: 76 sets, 40 single components): name, page,
node id, variant axes and properties. It was exported once from Figma with the
plugin API; no script here rebuilds it.

The core components also carry a hand-written `code` block saying where they
live in the codetracer app: stylesheets, shared mixins, CSS classes, Nim views,
the protected decisions (D-numbers in `codetracer/docs/UI-Design-Decisions.md`)
and their reference page in `../docs/components/`. The panel has no Figma
component yet, so its block sits under `_meta.codeWithoutComponent`.

When you re-export the manifest from Figma, keep the `code` blocks.
