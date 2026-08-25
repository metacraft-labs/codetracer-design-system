# Design-system axes campaign — color-mode × density

**Goal.** Serve every surface (CodeTracer desktop, docs, CI products, marketing,
future BlockTracer) from ONE token system by adding two independent **mode axes**
to the Figma design system:

- **Color-mode** — `Dark` (default, today's desktop) and `Light`. Lives on the
  **`mapped`** collection (the colour-role layer). Later also on any colour-bearing
  collection that needs a light value.
- **Density** — `Compact` (default, desktop), `Comfortable` (docs), `Spacious`
  (marketing). A NEW **`space`** collection of spacing / radius / font-size roles,
  one value per density mode.

The two axes are orthogonal: a surface picks one colour-mode AND one density, and
every token resolves per-surface with no hardcoding. This is the model the
disposable `zz-demo` prototype already proved (auto-theming matrix: 3 densities ×
2 colour-modes, every paint/padding/gap/radius/font bound to a variable, cells
differing ONLY by their two explicit modes).

---

## Status (what is already proven — 2026-08-25)

| Piece | State |
|---|---|
| **Prototype** (disposable Figma) | ✅ `zz-demo/mapped` (Dark/Light) + `zz-demo/space` (Compact/Comfortable/Spacious) on page "🧪 Density × Mode demo" — proves the model with ZERO touch to production `brand/alias/mapped`. |
| **Exporter multi-mode path** | ✅ Validated on the real `zz-demo/space`: `build-tokens.mjs` emits mode-policy A — default mode flat in `$value`, all modes under `$extensions.modes.<name>`. |
| **Desktop consumer mode-awareness** | ✅ `codetracer/scripts/tokens-to-styl.sh <root> <out> [mode]` — a mode arg selects `$extensions.modes[mode]` (fallback `$value`). With NO mode arg the output is **byte-identical** to today, so nothing breaks until a theme opts in. |
| **Docs consumer** | ✅ Already light/dark via its own `DocsTokenLayer` (`docs/codetracer-docs.tokens.json`) + already fluid/generous density. Unifying it onto the `mapped` modes is a later milestone, not required to open the campaign. |
| **Safety gate** | ✅ `check-token-refs.mjs` fails a build if a consumer still references a removed/renamed token; every removal is migrated in the same change. |
| **Faithful-mirror guarantee** | ✅ `validate-collection.mjs` content hash == live Figma (proven during the drift-sync landing). |

**Not done, and deliberately gated on designer sign-off:** any mutation of the
**production-canonical** `mapped`/`space` collections in Figma.

---

## Production-shaped structure the designer signs off on

The prototype `zz-demo/*` collections ARE the proposed production shape; making it
real is mechanical (the exact Plugin-API ops are proven — `addMode`,
`setValueForMode`, `setBoundVariableForPaint`, `setBoundVariable`,
`setExplicitVariableModeForCollection`). The additive plan:

1. **On `mapped`:** add a second mode **`Light`** (rename the existing single mode
   to `Dark` if not already named). Fill every colour role's Light value (designer;
   most are aliases to brand ramps — e.g. `surface/base/canvas` Dark→`neutral.900`,
   Light→`neutral.50`). Dark stays the DEFAULT mode, so the flat `$value` export is
   unchanged and today's desktop keeps rendering Dark with no consumer change.
2. **New `space` collection** with modes `Compact` / `Comfortable` / `Spacious` and
   the density roles the prototype uses: `space/panel-padding`, `space/card-padding`,
   `space/card-gap`, `space/control-pad-x`, `space/control-pad-y`, `space/control-gap`,
   `radius/card`, `radius/control`, `font/heading`, `font/body` (extend as needed).
   Compact is the default mode.
3. Bind production components' paddings/gaps/radii/font-sizes to the `space`
   variables and their paints to `mapped`, so components auto-theme.

**Naming stays convention-clean** (see `TOKEN-EXPORT-CONVENTIONS.md`): collection =
file, `/`-name = token path, base types 1:1 with Figma `resolvedType`. Adding these
modes/variables needs **no exporter change** — the transform is generic.

---

## Migration procedure (additive-only, no branches)

Figma branches are unavailable on the current plan, so safety comes from
additive-only edits + a checkpoint + the disposable prototype:

1. **Named version-history checkpoint** in the DS file before any edit ("pre-axes").
2. Designer applies steps 1–3 above ON the production collections (additive: new
   mode + new collection; never remove/rename an existing token without the
   `check-token-refs.mjs` gate).
3. **Export** with the mode-aware exporter → `mapped.json` gains
   `$extensions.modes.{Dark,Light}` per token; a new `space/space.json` appears.
   (Mode policy **A** now — single-file, extra modes in `$extensions`. Flip to
   **B**, one file per mode + a `themes.json` manifest, once BOTH consumers select a
   mode file; it's a one-line policy swap in `build-tokens.mjs`.)
4. **Consumers opt in** (behind the checker):
   - Desktop: generate a `Light` stylus set (`tokens-to-styl.sh … Light`) and a
     density set (`… Compact|Comfortable|Spacious`), then wire theme selection to
     `@import` the chosen set. (Theme-switch wiring = a desktop milestone.)
   - Docs: either keep the current `DocsTokenLayer` light/dark, or migrate it to
     read `mapped` `$extensions.modes` so there is a single colour source.
5. `check-token-refs.mjs` green + `stylus` compiles + `validate-collection.mjs`
   hash matches live Figma ⇒ land design-system + consumer opt-ins together.

---

## Sign-off gate (do NOT skip)

Before ANY production-canonical Figma mutation, the designer reviews:
- the `zz-demo` structure (does the two-axis organization match intent?), and
- the concrete **Light** colour values + **density** magnitudes.

Only structural sign-off unlocks editing the real `mapped`/`space`. Value choices
remain the designer's; this campaign guarantees the *pipeline* is ready so the flip
is mechanical and downstream-safe.
