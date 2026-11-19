# Typography and units

> Status: Current · Last checked: 2026-11-19. Rules set by Nikolay Fenixov
> (font rule 2026-09-14, dark weight 2026-09-14, dropdown rows 2026-11-02).
> Also recorded as standing rules and D-26 in `codetracer/docs/UI-Design-Decisions.md`.

## Two families, split by "is it code?"

**Space Mono only for code and program data.** Everything else is **Space
Grotesk**. The split is code vs not-code, not "panel contents vs chrome": an
older rule put all panel contents in mono, and that is gone.

| Space Mono (`type/ui/fontFamily/code`, `type/editor/*`) | Space Grotesk (`type/ui/fontFamily/primary`) |
|---|---|
| source code and code snippets | titles, headings, body text |
| program data: variable names, values, types, expressions | buttons, tabs, labels, form labels |
| stack frames and function names | messages, notes, empty states |
| program output: stdout, terminal, REPL, shell, trace-log content | menus and dropdown rows, tooltips |
| line and column numbers, gutters | table column headers, badges, counts |
| command lines, hex values and addresses | captions, status text, version strings |
| text explicitly marked as mono in a design | anything not in the left column |

Why: mono signals "this is code or program data". It loses that meaning when
labels, titles and buttons use it too.

## Weights

| | Dark theme | Light theme |
|---|---|---|
| Running interface text | 300 · `type/ui/fontWeight/body` | 400 · same token |
| Titles, headings, emphasis | 300 · `type/ui/fontWeight/emphasis` | 500 · same token |
| Space Mono (code) | 400, its lightest cut | 400 |

- **Dark theme: no weight above 300.** Light text on a dark ground looks
  heavier than the same weight on light. Emphasis in dark comes from size and
  colour, not weight.
- Space Grotesk ships 300, 400, 500, 600 and 700. Space Mono ships only 400 and
  700, so code text cannot go to 300; 400 is its floor. Say so rather than
  claiming code text follows the 300 rule.
- The desktop stylesheets still hold older weights (`600`, `bold`, `500`) that
  break this rule. Don't copy them; use the two tokens above.

## Text styles

The Figma text styles are exported to `typography/typography.json`. Pick by
role:

| Group | Use for | Sizes |
|---|---|---|
| `titles/*` | page and dialog titles | title-sm 28 · md 32 · lg 40 |
| `header/*` | section and panel headings | heading-sm 14 · md 16 · lg 20 |
| `body/*` | prose, messages | body-sm 12 · md 14 · lg 16 |
| `label/*`, `label/UPPER-CASE/*` | control labels, small caps labels | 10 – 16 |
| `caption/*` | metadata, secondary notes | caption-sm 10 · md 12 · lg 14 |
| `editor/*` | code (Space Mono) | sm 12 · md 14 · lg 16 |

At 14px, choose by role: `header/heading-sm` (a heading), `body/body-md`
(prose), `label/label-lg` (a control), `caption/caption-lg` (metadata).

**Dropdown rows: all text is 14px (`0.875rem`)**, label, sublabel and shortcut
alike, in every menu, theme and future component (D-26). See
[`../components/dropdown.md`](../components/dropdown.md).

## Units in the desktop stylesheets

Designers speak in px; the stylesheets are written in `rem` and `em` (root
16px). `ci/test/ui-design-decisions.py` fails on any px value.

- **`rem`** when the size must not change with the element's own font size:
  component heights, gaps between regions, the caption bar's spacing.
- **`em`** when it should scale with the element's text: padding inside a
  button, space that tracks a label.
- **Land on whole pixels.** A fraction cannot render evenly and shows as an
  off-by-one gap. Useful values: 4px = 0.25rem, 6px = 0.375rem, 8px = 0.5rem,
  14px = 0.875rem, 20px = 1.25rem, 24px = 1.5rem, 26px = 1.625rem, 28px = 1.75rem,
  34px = 2.125rem.
- **Trap: check the inherited font size before writing `em`.** Inside an
  element set to `font-size: 2em`, `1em` is 32px, not 16px. This has broken the
  welcome screen twice. When in doubt, use `rem`.

## Spacing

- Keep paddings and gaps consistent. When one screen or panel sets a value, the
  same kind of gap elsewhere matches it. Two sibling screens that differ are a
  bug, not a style choice: fix them together.
- Prefer one shared variable over per-screen numbers so values cannot drift.
- Known values: 6px between neighbouring controls (`CONTROL_GAP`, D-32), 8px
  panel content inset (`PANEL_INSET`, D-11), at least 24px between a card's
  content and its button (never `margin-top: auto` alone).
