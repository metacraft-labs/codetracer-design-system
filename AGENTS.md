# CodeTracer Design System — agent & human guide

This repo holds the **exported design tokens** for the CodeTracer design system as
W3C DTCG JSON, plus fonts and a shared docs-theme helper. It is a **generated
artifact**: the source of truth is **Figma**, and the JSON here is produced by
reflecting that Figma file. Do not hand-author token values — change them in
Figma and re-export (see below).

## Layout
- `brand/brand.json` — primitives (colour ramps, the numeric `scale`, font families).
- `alias/alias.json` — semantic aliases (neutral/brand/error…, fontSize/lineHeight/spacing/icon → `{scale.*}`).
- `mapped/mapped.json` — role/component tokens (`colors/ui/*`, `colors/editor/*`, `colors/ui/role/*`, `type/ui/*`, `type/editor/*`). Colour roles carry **Dark + Light** under `$extensions.modes` (default `$value` = Dark).
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

Historically this was a **manual** "export from the plugin, drag files into GitHub"
step, which drifts: as of this writing the committed `mapped.json` was **17 tokens
out of sync** with Figma (12 added, 5 renamed). The scripts automate the export off
a developer's own Figma login so the repo stays faithful.

## Updating the tokens (developer workflow — no CI required)
1. Edit tokens in Figma / Tokens Studio; **push to Figma variables + text styles**.
2. Produce a dump — run `scripts/figma-dump.js` through your **Figma MCP client**
   (e.g. Claude Code / Cursor with the Figma MCP, using your own Figma login) and
   save the JSON as `dump.json`. (For large files, dump per collection — prepend
   `const ONLY=["mapped"];` — to stay under the MCP response cap.)
3. `node scripts/export-tokens.mjs --dump dump.json` → **review the diff** vs the
   committed files.
4. **Safety gate (mandatory):** if the diff *removes or renames* any token, run the
   breakage check against every consumer before writing — it exits non-zero
   (`file:line`) if a consumer still references a removed token:
   ```
   node scripts/check-token-refs.mjs --removed <removed-var-names> \
        --src ../codetracer/src/frontend/styles   # + any other consumer roots
   ```
   (The downstream lane below runs this check against codetracer for every
   candidate, but only over codetracer's stylesheets: name any other consumer
   root here.) A failure means you must **migrate those references in the consumer repo in the
   same change** (renames here are usually value-preserving, so it's a pure rename)
   — or keep the token in Figma. Never land a token removal that breaks a consumer.
5. `node scripts/export-tokens.mjs --dump dump.json --write` → apply, then commit
   (design-system + any consumer ref-migrations together).

The conventions that make this **maintainable** — add a variable / collection /
mode / text style in Figma and the scripts need **no edits** — are in
**[`scripts/TOKEN-EXPORT-CONVENTIONS.md`](scripts/TOKEN-EXPORT-CONVENTIONS.md)**.
Read that before touching the scripts.

The in-flight plan to add **colour-mode (Dark/Light) × density
(Compact/Comfortable/Spacious)** mode axes — the prototype, the additive
migration procedure, the consumer opt-in, and the designer sign-off gate — is in
**[`scripts/AXES-CAMPAIGN.md`](scripts/AXES-CAMPAIGN.md)**.

## For coding agents (Claude / Cursor / … with the Figma MCP)
- You can reflect the DS directly: `getLocalVariableCollectionsAsync()` /
  `getLocalTextStylesAsync()` via `use_figma` — see `scripts/figma-dump.js` for the
  exact, generic reflection. Aliases resolve to `{dotted.ref}`, colours to hex.
- To regenerate the repo, run `figma-dump.js` → `build-tokens.mjs` → diff/`--write`.
  **Never hand-edit `brand`/`alias`/`mapped` JSON** — regenerate from Figma.
- Verify drift with `scripts/validate-collection.mjs <file>` (a content hash that
  ignores `$extensions`; equal hash ⇒ parity).
- **Designer feedback** arrives as Figma **Dev Mode annotations** (readable — they
  ride along in `get_design_context` as `data-annotations`, and via
  `node.annotations`). **Figma comment pins are NOT readable by agents** — ask the
  designer to use annotations, not comments.
- Never treat `use_figma` write access to the production file casually: build demos
  on a disposable, clearly-named page/collection (e.g. `zz-demo/*`) and delete after.

## Tests and CI
Run every test with **`node scripts/run-tests.mjs`** (Node.js 22 or later, from
anywhere; nothing else is needed). It is `node --test` from the repository root
with the spec reporter, and it closes the log with a
`TEST-COUNTS: executed=N passed=N failed=N skipped=N` line. It exits non-zero
when a test fails, a test file fails to load, or no test ran.

- `scripts/build-tokens.test.mjs` — fixture tests of the dump→DTCG transform,
  one per convention in `TOKEN-EXPORT-CONVENTIONS.md`.
- `scripts/collections.test.mjs` — every committed collection
  (`<name>/<name>.json`: `brand`, `alias`, `mapped`, `space`, and any collection
  added later) parses and normalises, as `validate-collection.mjs` does, to a
  non-zero token count.
- `scripts/downstream-lane.test.mjs` — the downstream lane (below) is triggered
  on `dev`, clones the consumers it reads, and fails rather than skips without
  them; `check-token-refs.mjs` reports removed variables in use and refuses a
  scan of nothing.

`.github/workflows/ci.yml` runs the same command on every push to `dev` and every
pull request into `dev`. `agents` runs no CI, so run it locally before landing
there. Name a new test file `*.test.mjs` and the runner picks it up.

`check-token-refs.mjs` is not part of this run: it checks consumer sources,
which this repository does not contain. It runs by hand during an export
(step 4 above) and in the downstream lane.

### The downstream lane
Every consumer pins a revision of this repository, so its own CI checks a token
change only when someone moves the pin. The downstream lane checks the consumers
before a change reaches `dev`. Check the consumers out beside this repository
(`../codetracer`, `../codetracer-ci`, `../codetracer-web-site`, as in the
workspace) and run:

```
node scripts/run-tests.mjs scripts/downstream/consumers.lane.mjs
```

It needs git, bash, python3, `just` and, for the web site, `nix`. It checks the
`HEAD` commit of this checkout (`DS_DOWNSTREAM_CANDIDATE=<rev>` names another)
against the commit each consumer checkout has checked out, in scratch copies:
the checkouts are not modified, and uncommitted edits in them are not measured.
`DS_DOWNSTREAM_CODETRACER`, `DS_DOWNSTREAM_CODETRACER_CI` and
`DS_DOWNSTREAM_WEB_SITE` point it at checkouts elsewhere. One test per gate:

- **codetracer** — with the candidate as its `libs/codetracer-design-system`
  pin: `just sync-design-tokens` regenerates its stylus and terminal token
  module; `ci/test/design-tokens-fresh.sh` passes; and
  `check-token-refs.mjs` finds no stylesheet under `src/frontend/styles` that
  uses a generated variable the candidate stops generating.
- **codetracer-ci** — `scripts/generate-design-tokens.py --check` resolves every
  token of its facade map.
- **codetracer-web-site** — `just test` (the real static export) in its flake's
  `ci` dev shell, with `DESIGN_SYSTEM_SRC` pointing at the candidate.

A missing checkout or tool fails its gate; nothing skips. The log ends with the
same `TEST-COUNTS:` line. `.github/workflows/downstream.yml` runs the lane on
every push to `dev` and every pull request into `dev`, cloning codetracer and
codetracer-ci at `agents` and the web site at `dev` (it has no `agents`);
`workflow_dispatch` takes other refs. A red gate means that consumer cannot take
the candidate as it stands: migrate the consumer in the same change, as step 4
says, or change the tokens.

## Who consumes these tokens
- **Desktop app** — `codetracer/scripts/tokens-to-styl.sh` transforms this JSON into
  `codetracer/src/frontend/styles/generated/*.styl`.
- **Docs / web** — isonim-docs' `metacraft_docs_theme.nim` emits CSS custom
  properties from `docs/codetracer-docs.tokens.json`.
- **codetracer-ci WebUI** — `codetracer-ci/scripts/generate-design-tokens.py`
  (+ `scripts/design-tokens.map.json`) resolves `brand`/`alias`/`mapped`/`space`
  into `wwwroot/css/tokens.css` as `--cci-*` CSS custom properties, mode-aware
  (colour-mode `[data-theme]` + density `[data-density]`), plus self-hosted fonts.
- **codetracer.com** — `codetracer-web-site/src/design_system/tokens.nim` reads
  `brand`/`alias`/`mapped` from `DESIGN_SYSTEM_SRC` (its flake input) and emits
  `--ct-*` CSS custom properties; an unknown token fails its build.

The downstream lane (above) checks the desktop app, the codetracer-ci WebUI and
codetracer.com against every candidate. The docs sites are not in it: their
theme reads `docs/codetracer-docs.tokens.json` through
`nim/metacraft_docs_theme.nim`, both in this repository.

Don't change a token **value** here to fix a downstream look — fix it in Figma and
re-export, so every surface stays consistent.

## Policies
This repo follows the Metacraft development guidelines (`metacraft-dev-guidelines`:
`branching-policy.md`, `repo-requirements.md`, `code-quality-guidelines.md`). Token
authoring & export specifics live in
[`scripts/TOKEN-EXPORT-CONVENTIONS.md`](scripts/TOKEN-EXPORT-CONVENTIONS.md).
