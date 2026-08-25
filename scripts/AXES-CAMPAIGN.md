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

**PROMOTED TO PRODUCTION (2026-08-26)** — after structural sign-off. Additive edits
in the production Figma file: `mapped` gained a **Light** mode (14 semantic overrides
seeded via `neutral`/`brand`, the other 162 = Dark; designer refines values); a new
**`space`** collection (Compact/Comfortable/Spacious) holds the 8 reconciled
spacing/radii roles. The demo page was **rebound to production** `mapped` + `space`
(bindings by id, so the matrix is intact) and the disposable `zz-demo/*` collections
were deleted. Fresh export shipped: `mapped.json` carries `$extensions.modes.{Dark,
Light}` (default `$value` = Dark, so the `$extensions`-stripped hash is unchanged =
3707008020) and a new `space/space.json`. Every ref across all layers and all modes
resolves (657 scanned, 0 broken). **Figma is the source and matches the repo** — the
Light overrides were rewritten to the semantic layer in Figma too, so a re-export is
stable. Font sizes stay fixed (density = spacing/radii only, the chosen v1 scope).

**Still pending (app-level milestones, not blocking):** wiring the running desktop app
to *select* a colour-mode and density (generate the Light/density stylus sets via
`tokens-to-styl.sh … <mode>` and switch themes); optionally migrating docs' own
light/dark onto the shared `mapped` modes. Designer still to refine the seeded Light
values + density magnitudes.

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
2. **New `space` collection** with modes `Compact` / `Comfortable` / `Spacious`
   (Compact = default) holding the density-varying spacing/radius roles, named
   per the reconciliation below:
   - `padding/panel`, `padding/card`, `padding/control-horizontal`,
     `padding/control-vertical`
   - `gap/card`, `gap/control`
   - `border/border radius/card`, `border/border radius/control`
   Font-size density is **not** new tokens here — it is density modes on the
   **existing** `type/ui/size/heading/md` + `type/ui/size/body/md` role tokens
   (see the reconciliation note).
3. Bind production components' paddings/gaps/radii/font-sizes to the `space`
   variables and their paints to `mapped`, so components auto-theme.

**Naming stays convention-clean** (see `TOKEN-EXPORT-CONVENTIONS.md`): collection =
file, `/`-name = token path, base types 1:1 with Figma `resolvedType`. Adding these
modes/variables needs **no exporter change** — the transform is generic.

### Naming reconciliation (designer sign-off note, 2026-08-25)

The designer signed off the prototype structurally, flagging that some prototype
token names didn't match production. `zz-demo/mapped` was already byte-identical to
production (176 names). The divergence was confined to the density collection I
authored; the 10 tokens were renamed in the disposable prototype to follow
production conventions (property-first groups, spelled-out words, reuse of existing
roles). Every rename is justified:

| Prototype (`zz-demo/space`) | → Production-consistent | Why |
|---|---|---|
| `space/panel-padding` | `padding/panel` | production's spacing group is `padding/`, not `space/`; suffix redundant under it |
| `space/card-padding` | `padding/card` | same |
| `space/control-pad-x` | `padding/control-horizontal` | production spells words out; matches Figma auto-layout's "Horizontal padding" field |
| `space/control-pad-y` | `padding/control-vertical` | matches Figma's "Vertical padding" field |
| `space/card-gap` | `gap/card` | `gap` (itemSpacing) is a distinct layout property; its own honest group |
| `space/control-gap` | `gap/control` | same |
| `radius/card` | `border/border radius/card` | production radii live under `border/border radius/`; `card` is a role beside the ramp |
| `radius/control` | `border/border radius/control` | same |
| `font/heading` | `type/ui/size/heading/md` | **duplicated an existing production role** — reuse the exact name; density = modes on it |
| `font/body` | `type/ui/size/body/md` | same |

The last two mean **font-size density is NOT a new token** — it is density modes on
the role tokens production already has, exactly as `zz-demo/mapped` mirrors `mapped`.
No production rename was needed: production names stayed; the prototype was aligned
to them.

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
