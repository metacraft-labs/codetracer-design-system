# Token export — conventions & design (Figma → DTCG JSON)

**Goal (maintainability contract).** The exporter is a **generic, reflection-driven
transform**. Adding a new variable, group, collection, mode, or text style in Figma
requires **no change to the script** — you run it and commit. The script only changes
for two rare things: a genuinely new *value type*, or a change to the *mode policy* /
*collection allow-list* — and both are one-line **config**, never per-token code.

This works because the exporter never names a token. It discovers everything at run
time (`getLocalVariableCollectionsAsync`, each collection's `modes`, each variable's
`valuesByMode`, and `getLocalTextStylesAsync`) and serializes it by rule.

---

## Source of truth
- The export reads **Figma variables** (collections → modes → variables) and **text
  styles** in the design-system file.
- Tokens are authored **directly in the Figma UI** (native variables + text styles).
  **Tokens Studio is export-only** — it reads these same Figma variables to produce
  JSON; it is not the authoring model. So this MCP reflection and Tokens Studio read
  the identical source of truth; there is no plugin-internal store to sync from.

## Authoring conventions (follow these ⇒ the generic script "just works")

1. **Collections → files.** Each variable collection exports to
   `<collection>/<collection>.json` (e.g. `brand/brand.json`). Add a collection and it
   exports automatically. Collection names: lowercase, filesystem-safe.
   *(Optional `collections` allow-list in config restricts which ones export.)*

2. **Variable name = token path.** Group with `/`
   (`colors/ui/surface/action/primary`). The exporter splits on `/` into nested DTCG
   groups. Rules: segments are lowercase-kebab; **no** `.` `{` `}` whitespace; no
   leading/trailing `/`. New tokens under existing or new groups need no code.

3. **Types — a closed base map, 1:1 with Figma's `resolvedType`** (the only place
   types are enumerated; tiny config, never per-token):
   | Figma `resolvedType` | DTCG `$type` |
   |---|---|
   | `COLOR`   | `color` (hex `#rrggbb`, or `#rrggbbaa` if alpha ≠ 1) |
   | `FLOAT`   | `number` |
   | `STRING`  | `text` |
   | `BOOLEAN` | `boolean` |
   Figma variables only carry those four types, and **the exporter maps them
   straight through** — a FLOAT `type/fontSize/*` variable exports as `number`, a
   STRING `type/fontFamily/*` as `text`. We deliberately do **not** "refine" a
   richer DTCG type (`fontSize`, `fontFamily`, …) from the token's name: **Tokens
   Studio exports the same variables using this same 1:1 mapping** (verified against
   the canonical `alias.json`, where `type/fontSize/2xs` is `number`), so any
   name-based refinement would make this reflection *diverge* from the export it is
   meant to reproduce — breaking the faithful-mirror guarantee. The richer DTCG
   composites you see in `brand.json` (`typography`, `fontSizes`, `lineHeights`, …)
   are **not** variable-backed; they are Tokens-Studio-authored tokens outside
   variable reflection (see "Scope & the typography boundary" below). New variables
   of any of the four base types need no code.

4. **References, not duplicates.** Express any "same as X" relationship as a **Figma
   variable alias**. The exporter emits `{dotted.path}` (alias → `colors/grey/50`
   becomes `"{colors.grey.50}"`). Never hardcode a value that duplicates another token —
   alias it, so the reference survives export and stays maintainable.

5. **Typography = text styles.** Text styles export to DTCG `typography` composite
   tokens; the **style name is the token path** (`header/heading-md` →
   `header/heading-md`). Group style names with `/`. Composite fields captured:
   `fontFamily`, `fontWeight`, `fontSize`, `lineHeight`, `letterSpacing`.

6. **Scopes / `$extensions`** are passed through (or dropped) generically — consumers
   (`tokens-to-styl.sh`, `metacraft_docs_theme.nim`) ignore them. Never authored per token.

## The one real decision — **mode policy**

Today `brand`/`alias` are single-mode ("Label"), `mapped` single-mode ("Dark"). The
unified-DS direction adds modes (color-mode Dark/Light; density Compact/Comfortable/
Spacious). Pick one policy; it's a single function in the exporter, swappable in one line:

- **A — one file per collection; default mode flat, other modes under
  `$extensions.modes.<name>`.** Keeps today's single-file consumers working untouched;
  theme-aware consumers read the extra modes. Lowest blast radius.
- **B — one file per (collection × mode)** `<collection>/<collection>.<mode>.json`
  + a `themes.json` manifest mapping theme → files. Cleanest for multi-theme; requires
  teaching `tokens-to-styl.sh` / `metacraft_docs_theme.nim` to select a mode file.
- **C — modes as separate collections** in Figma (no in-file modes). Avoids the issue in
  code at the cost of Figma bookkeeping.

**Recommendation: B** long-term (mirrors Tokens Studio's sets+themes and how the two
consumers already want to *pick a theme*), starting from **A** so nothing breaks while
we migrate. Because it's config, we can ship A now and flip to B when the consumers are
theme-aware.

## Scope & the typography boundary (important)

Reflection covers **whatever is a Figma variable or text style** — and that is the
gap to be aware of. In this DS today:
- **Fully covered by variables** (the exporter owns these end to end): all **colors**
  (`brand`/`alias`/`mapped`), the numeric **`scale`** ramp, **`type/fontFamily/*`**
  strings, and the numeric aliases (`type/fontSize/*`, `type/lineHeight/*`, `icon/*`,
  `spacing/*`, `padding/*`). This is exactly the **colour + spacing/density + mode**
  system — the part we're unifying.
- **NOT Figma variables:** the Tokens-Studio **typographic composites** in the current
  `brand.json` (`$type: typography` — 18 of them — plus the `fontSizes`/`lineHeights`/
  `letterSpacing`/`textCase` composite tokens). Those are authored in the Tokens
  Studio plugin and correspond to the **23 Figma text styles**; they have no Figma-
  *variable* equivalent, so a variable-only reflection can't reproduce them.

Two clean ways to handle typography (a design decision):
- **(i) Reflect text styles → `typography` composites** — a second generic pass
  (`getLocalTextStylesAsync` → fontFamily/weight/size/lineHeight/letterSpacing). Fully
  covers typography from Figma, but the emitted shape differs from the current
  TS-authored `brand.json` typography.
- **(ii) Keep typography in Tokens Studio** — let the exporter own the variable-backed
  layer (colours + spacing + scale) and continue exporting the typographic composites
  via the TS plugin. Smallest change; two producers for one repo.

Recommendation: start with **(ii)** (the exporter owns the colour/spacing/density
system we're actively changing; typography is stable), and add **(i)** later if we
want a single producer.

## What is guaranteed generic (the payoff)
- **Add a variable / group / collection / mode / text style in Figma → run the script,
  commit. No script edit.**
- Script edits happen **only** for: a new value *type*, a change to the *mode policy*,
  or the *collection allow-list*. All are tiny config.

## Exporter architecture (keeps the transform pure & testable)
- **`figma-dump.js`** — Plugin-API reflection run via the Figma MCP `use_figma`:
  returns *all* collections/modes/variables (with alias target ids→names) + text styles
  as raw JSON. Contains **no token-specific logic** — pure reflection.
- **`build-tokens.mjs`** — a **pure function**: raw dump → DTCG files, applying the
  conventions above. No Figma/MCP dependency ⇒ unit-testable with fixtures.
- **`export-tokens.mjs`** — the runner a developer executes: connects to the Figma MCP
  **with their own Figma login** (home profile), runs `figma-dump.js`, pipes to
  `build-tokens`, writes files. Default writes to a scratch dir and prints a diff;
  `--write` applies to `brand/alias/mapped/…`.

Developer usage (no CI): `node scripts/export-tokens.mjs` (diff) → review →
`node scripts/export-tokens.mjs --write` → commit.
