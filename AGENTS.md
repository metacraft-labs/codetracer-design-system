# CodeTracer Design System — agent & human guide

This repo holds the **exported design tokens** for the CodeTracer design system as
W3C DTCG JSON, plus fonts and a shared docs-theme helper. It is a **generated
artifact**: the source of truth is **Figma**, and the JSON here is produced by
reflecting that Figma file. Do not hand-author token values — change them in
Figma and re-export (see below).

## Layout
- `brand/brand.json` — primitives (colour ramps, the numeric `scale`, font families). Variables only.
- `alias/alias.json` — semantic aliases (neutral/brand/error…, fontSize/lineHeight/spacing/icon → `{scale.*}`).
- `mapped/mapped.json` — role/component tokens (`colors/ui/*`, `colors/editor/*`, `colors/ui/role/*`, `type/ui/*`, `type/editor/*`). Colour roles carry **Dark + Light** under `$extensions.modes` (default `$value` = Dark).
- `typography/typography.json` — one composite per Figma text style (titles, headings, body, labels, captions, editor), referencing the `type/*` tokens.
- `space/space.json` — density roles (`padding/*`, `gap/*`, `border/border radius/*`) with **Compact/Comfortable/Spacious** under `$extensions.modes` (default `$value` = Compact). See `scripts/AXES-CAMPAIGN.md`.
- `docs/` — the docs token layer + `DESIGN-DIVERGENCES.md`.
- `nim/metacraft_docs_theme.nim` — the shared docs-theme helper consumed by isonim-docs sites.
- `scripts/` — the export tooling + its conventions (below).
- fonts: `Fira_Mono/`, `SpaceGrotesk_Complete/`.

## Source of truth & the export pipeline
Tokens are authored **directly in Figma** (file `Ytr6Ux4bYZYRUBpgNsSVml`,
"CodeTracer Design System") using the standard Figma UI — native **variables** +
**text styles** are the source of truth. **Tokens Studio is used ONLY to export**
(it reads the Figma variables → JSON); it is not the authoring model. So the MCP
reflection here reads the same source of truth as Tokens Studio, and editing Figma
variables directly is editing the canonical tokens. The repo JSON is a reflection
of that state:

```
Figma variables + text styles
   │  (MCP `use_figma` reflection — works on a Pro plan; no Enterprise, no paid Platform)
   ▼
scripts/figma-dump.js   →   scripts/build-tokens.mjs   →   brand/ alias/ mapped/ (+ typography/)
   (generic reflection)       (pure DTCG transform)          committed JSON
```

Tokens were once exported by hand from the plugin, which drifted; the scripts
above replaced that.

## Updating the tokens

Follow **[`docs/updating-tokens.md`](docs/updating-tokens.md)**: the full
procedure, how to confirm Figma and the repo agree, and how the change reaches
the app. Typography comes from Figma's text styles (`typography/typography.json`);
every token carries the description written in Figma as `$description`.

The conventions that make this **maintainable** — add a variable / collection /
mode / text style in Figma and the scripts need **no edits** — are in
**[`scripts/TOKEN-EXPORT-CONVENTIONS.md`](scripts/TOKEN-EXPORT-CONVENTIONS.md)**.
Read that before touching the scripts.

The Dark/Light × density mode work in
[`scripts/AXES-CAMPAIGN.md`](scripts/AXES-CAMPAIGN.md) has shipped; that file is
history now.

## For coding agents (Claude / Cursor / … with the Figma MCP)
- You can reflect the DS directly: `getLocalVariableCollectionsAsync()` /
  `getLocalTextStylesAsync()` via `use_figma` — see `scripts/figma-dump.js` for the
  exact, generic reflection. Aliases resolve to `{dotted.ref}`, colours to hex.
- To regenerate the repo, follow [`docs/updating-tokens.md`](docs/updating-tokens.md).
  Don't hand-edit `brand`/`alias`/`mapped` JSON except as that page allows.
- Verify drift with `scripts/validate-collection.mjs <file>` (a content hash over
  values, descriptions and every mode; equal hash ⇒ parity).
- **Designer feedback** arrives as Figma **Dev Mode annotations** (readable — they
  ride along in `get_design_context` as `data-annotations`, and via
  `node.annotations`). **Figma comment pins are NOT readable by agents** — ask the
  designer to use annotations, not comments.
- Never treat `use_figma` write access to the production file casually: build demos
  on a disposable, clearly-named page/collection (e.g. `zz-demo/*`) and delete after.

## Who consumes these tokens
- **Desktop app** — `codetracer/scripts/tokens-to-styl.sh` transforms this JSON into
  `codetracer/src/frontend/styles/generated/*.styl`.
- **Docs / web** — isonim-docs' `metacraft_docs_theme.nim` emits CSS custom
  properties from `docs/codetracer-docs.tokens.json`.
- **codetracer-ci WebUI** — `codetracer-ci/scripts/generate-design-tokens.py`
  (+ `scripts/design-tokens.map.json`) resolves `brand`/`alias`/`mapped`/`space`
  into `wwwroot/css/tokens.css` as `--cci-*` CSS custom properties, mode-aware
  (colour-mode `[data-theme]` + density `[data-density]`), plus self-hosted fonts.

Don't change a token **value** here to fix a downstream look — fix it in Figma and
re-export, so every surface stays consistent.

## Policies
This repo follows the Metacraft development guidelines (`metacraft-dev-guidelines`:
`branching-policy.md`, `repo-requirements.md`, `code-quality-guidelines.md`). Token
authoring & export specifics live in
[`scripts/TOKEN-EXPORT-CONVENTIONS.md`](scripts/TOKEN-EXPORT-CONVENTIONS.md).
