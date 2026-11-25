# Icons

> Status: Current · Last checked: 2026-11-19. Rule set by Nikolay Fenixov
> (2026-10-20); recorded in code as D-38 and D-42 in
> `codetracer/docs/UI-Design-Decisions.md`.

## One source

**Every CodeTracer icon comes from the design system's icons page:** Figma file
`Ytr6Ux4bYZYRUBpgNsSVml`, page ❖ Icons, node `1:12`. Never draw an icon, never
download one from elsewhere, never stand in a Unicode glyph (☑, ›, ✕) or a
generic icon.

Icons are named by variant properties, for example
`type=arrows-expand-vertical-diamond, theme=dark`. The main sets:
`ui-icons` (192:11889), `code-icons` (95:2817), `nav-icons 16x16` (97:327),
`alert-icons` (101:380), `browser-icons 24x24` (95:2821), `extended-icon-set`
(4393:25743).

## Getting one into the app

1. Look it up by name on the icons page.
2. Check whether the app already ships it (`src/public/resources/`,
   `libs/codetracer-design-system`) before exporting a new SVG.
3. Export the `theme=dark` variant as SVG; its colour does not matter, see 4.
4. Paint it as a **mask in the text colour**, never as a picture with a colour
   baked in:
   - `button-icon(ICON_…)` on a button that also has a label or tooltip child;
   - `mask-icon(ICON_…)` on an element of its own;
   - both live in `src/frontend/styles/components/button.styl`.
   The icon then follows hover, disabled and both themes with no extra rules.
5. Add the path as an `ICON_*` constant at the top of `button.styl`, with its
   Figma name in a comment.

On a primary (indigo) button the icon colour is `icon/on-action/primary`
(D-45). A picture with a fixed colour disappears in one of the themes (D-42):
the Files panel and the menu chevron were examples.

## In Figma

Instance the icon component and bind its fill to a `colors/ui/icon/*` token.
Don't flatten or recolour a copy.
