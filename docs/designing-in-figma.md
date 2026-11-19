# Designing in Figma

> Status: Current · Last checked: 2026-11-19. For agents and people building
> screens or components in the Figma file `Ytr6Ux4bYZYRUBpgNsSVml`. Moved here
> from a private `DESIGN_SYSTEM.md` so every agent sees it.

## Use the system, never redraw it

- Build from the **published components** (`button`, `icon-button`, `field`,
  `ui-icons`, `menu-item`, `check box`, `Tooltip`, `notification-components`, …).
  Instance them and set their variant properties. Don't redraw a component from
  rectangles and text.
- **Colours: only `colors/ui/*` and `colors/editor/*` from the `mapped`
  collection** of this file. Read each variable's description, or
  [`foundations/color.md`](foundations/color.md), before choosing.
- **Spacing, radius, border width:** variables from `alias` and `space`.
- **Text:** a text style picked by role (see
  [`foundations/typography.md`](foundations/typography.md)); never a hand-set
  font, size or weight. Space Mono only for code.
- **Icons:** from the icons page only (see [`foundations/icons.md`](foundations/icons.md)).
- **Never bind variables from other libraries**: `CodeTracer Project`
  (`surface/*`, `text/*`, `border/*`), `agent harbor` (`color/background/*`),
  `Blocksense Website`. If a search returns those first, ignore them.

## If something is missing: stop and flag it

Never substitute a different variable or component, and never type a value in
silently. Tell Nikolay, in detail:

1. what you looked for (intended name and kind: component, colour, spacing,
   text style, icon);
2. where it would be used;
3. what you searched and what you found instead.

He adds it to the system; you then use it.

## Panels are Golden Layout stacks

CodeTracer screens are Golden Layout panels, not invented cards. Follow the
reference frame `Frame/GoldenLayout` (page id `3833:14203`) and
[`components/panel.md`](components/panel.md):

- the window ground is `surface/base/canvas`; panels are stacks separated by
  thin gaps;
- each stack has a header with tabs (pin and close icons from `ui-icons`);
- panel content opens with a toolbar row: the panel `field` with a search icon,
  plus icon buttons; then the panel's own content;
- reuse `field`, `icon-button`, `ui-icons` and the sub-tab / mode switcher.

Where the reference frame and the code differ (header height, control size,
gaps), the code wins until Nikolay settles it; `panel.md` lists them.

## Building a component

- **Auto-layout everywhere.** Every frame holding related children is an
  auto-layout frame. Absolute positions only for where a top-level frame sits on
  the canvas.
- **Sizing modes, not fixed sizes.** `Fill` for content that stretches, `Hug`
  for content that sizes to itself, `Fixed` only for truly fixed things (an icon
  box, a swatch).
- **Survives resizing.** Check it wider, narrower and with longer text: no
  overlap or clipping. Text boxes auto-resize.
- **Spacing from variables** on the auto-layout frame (gap and padding bound to
  `space`/`alias` variables).
- **Shallow, named structure** (leading · content · trailing), so instances and
  overrides behave.
- **Every component has a description** (the component's description field):
  what it is, when to use it, what its variants mean, and its spec reference if
  any. It shows in Dev Mode and is what the team reads.
- Both themes: check the Dark and Light modes of the `mapped` collection.

## Scratch work

Build experiments on a clearly named scratch page or collection (for example
`zz-demo/*`) and delete it afterwards. Don't leave test frames on library
pages. Designer feedback arrives as Dev Mode annotations; agents cannot read
comment pins.

## Specs

Before designing a feature, read its spec in
<https://github.com/metacraft-labs/codetracer-specs>. Stay close to it; say so
when you deviate and why.
