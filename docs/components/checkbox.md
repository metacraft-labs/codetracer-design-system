# Checkbox

> Status: Current · Last checked: 2026-11-19 against codetracer branch
> `ui-design-improvements-part10`.
> A small box the user ticks to turn one option on or off. It can also show
> "some" (a bar) when it stands for a group whose items are only partly on.

## Use it for / don't use it for

- **Use for:** options in a form or dialog ("Use default output folder",
  "Don't ask me again!"), and lists where several items can be on at once (the
  Event Log filter's tags and kinds, the Columns menu).
- **Use the indeterminate type for:** a parent row whose children are partly
  on. The Event Log filter's tag row does this (`tagState` in
  `src/frontend/ui/event_log.nim`: all kinds on = checked, some = indeterminate,
  none = unchecked).
- **Don't use for:**
  - a setting that takes effect at once, like a power switch → use the switch
    (`.ct-toggle`, `toggle.styl`);
  - choosing one of several values → use the shared dropdown or segmented tabs;
  - marking the chosen row in a dropdown → use `ct-menu-item--chosen` with a
    tick (`mask-icon(CHECKMARK_CHECK_16)`), as the Agent settings menus do
    (`agent_activity.styl`, D-37). That tick is the checkbox's own check path,
    but it is not a checkbox.

## Where it lives

| | |
|---|---|
| Figma | `check box`, node `598:2395`, on the ❖ Checkbox page (node `69:2282`) of file `Ytr6Ux4bYZYRUBpgNsSVml`. D-08 names the page: every check in the app comes from it. |
| Stylesheet | `src/frontend/styles/components/checkmark.styl`, imported by `src/frontend/styles/codetracer.styl` and `src/frontend/styles/subwindow.styl` |
| Mixins | None of its own. It uses `key-focus()` from `button.styl` for keyboard focus. |
| Constants | `CHECKMARK_CHECK_16/18/24` (the check) and `CHECKMARK_BAR_16/18/24` (the indeterminate bar): Figma's own paths as SVG masks. Other files may reuse them, e.g. `mask-icon(CHECKMARK_CHECK_16)`. |
| Custom properties | `--ct-checkmark-size`, `--ct-checkmark-radius`, `--ct-checkmark-bg`, `--ct-checkmark-border`, `--ct-checkmark-icon`, `--ct-checkmark-check`, `--ct-checkmark-bar`. States change these, nothing else. |
| Markup | `src/frontend/viewmodel/views/isonim_welcome_screen_view.nim` (new-record form) · `isonim_event_log_filter_dropdown_view.nim` (filter tags and kinds) · `isonim_event_log_view.nim` (Columns menu) · `src/frontend/subwindow.nim` (installer dialog, `checkmarkBox()` / `appendCheckboxOption()`) |

### Classes

| Class | What it is |
|---|---|
| `ct-checkmark-field` | The `<label>` around everything. Makes the box and the text one click target; 0.5em gap, 0.25em padding top and bottom. |
| `ct-checkmark-input` | The real `<input type="checkbox">`. Visually hidden, still reachable by Tab and read by screen readers. |
| `ct-checkmark` | The visible box. A `<span>` with `aria-hidden="true"`. Must come **right after** the input: the CSS uses `input + .ct-checkmark`. |
| `ct-checkmark-label` | The text. Inherits font and colour from its parent. |

### Recommended markup

```html
<label class="ct-checkmark-field">
  <input class="ct-checkmark-input" type="checkbox" />
  <span class="ct-checkmark" aria-hidden="true"></span>
  <span class="ct-checkmark-label">Use default output folder</span>
</label>
```

In IsoNim views (from `isonim_welcome_screen_view.nim`):

```nim
label(class = "ct-checkmark-field"):
  input(ref = checkbox, `type` = "checkbox", class = "ct-checkmark-input")
  span(class = "ct-checkmark", `aria-hidden` = "true")
  span(class = "ct-checkmark-label"):
    text "Use default output folder"
```

Label text is Space Grotesk, like all interface text. Space Mono is only for
code and program data, so never for a checkbox label, even one that names a
code item. `ct-checkmark-label` sets `font: inherit`, so it gets Space Grotesk
from the page; don't set a font on it. Dark theme: weight 300 or lighter.

## Variants and sizes

Two attributes on the box set the variant. Without them it is the 16px
default.

| Size | Attribute | Box | Corners | Where it belongs |
|---|---|---|---|---|
| 16px | none | 1rem | 0.25rem (4px) | **the default; every checkbox in the app today** |
| 18px | `data-size="md"` | 1.125rem | 0.375rem (6px) | not used yet |
| 24px | `data-size="lg"` | 1.5rem | 0.375rem (6px) | not used yet |

| Type | How to set it | Mark |
|---|---|---|
| Unselected | `data-state="unchecked"`, or the input is not `:checked` | none |
| Selected | `data-state="checked"`, or the input is `:checked` | check, 1.5px stroke |
| Indeterminate | `data-state="indeterminate"`, or the input is `:indeterminate` | bar, 1px stroke |

- **Next to a real input**, you may leave `data-state` off: the input's
  `:checked` / `:indeterminate` drives the mark (welcome screen, installer
  dialog).
- **When the view model owns the state**, set `data-state` on the box (Event
  Log filter and Columns menu). The browser cannot set `:indeterminate` from
  markup, so the indeterminate type needs `data-state`.
- The border is 1px, drawn inside the box as an inset `box-shadow`, not
  `border`. That lets the mark (a mask on `::before`) cover the whole box.
- The mark is a mask painted with `--ct-checkmark-icon`, so a state changes
  only colours, never the drawing.

## States

| State | How it looks | Tokens | How it is triggered in code |
|---|---|---|---|
| Rest | dark fill, grey 1px border, light mark | fill `colors-ui-surface-primary-default` · border `colors-ui-border-primary` · mark `colors-ui-icon-primary-default` | default |
| Hover | fill and border lighten; mark unchanged; 140ms | `colors-ui-surface-primary-default-hover` · `colors-ui-border-primary-hover` | pointer over the input, the `ct-checkmark-field`, or the `ct-menu-item` row the box sits in |
| Key-focus | 1.5px blue outline inside the box edge; fill, border and mark stay as at rest | `key-focus()`: blue/500 (dark), blue/600 (light) | `.ct-checkmark-input:focus-visible + .ct-checkmark`. In the Columns menu the whole row shows it instead (D-23). |
| Selected / indeterminate | mark appears (check or bar) | mark `colors-ui-icon-primary-default` | `data-state`, or the input's `:checked` / `:indeterminate` |
| Error | border and mark turn red; no hover change | border `colors-ui-border-error` · mark `colors-ui-icon-error-primary` | `data-error="true"` on the box. Not used by any view yet. |
| Disabled | flat fill, **no border**, dimmed mark; `not-allowed` cursor on the field | fill `colors-ui-surface-primary-disabled` · border `transparent` · mark `colors-ui-icon-primary-disabled` | input `:disabled`, `data-disabled="true"` on the field or the box, or a `ct-menu-item--disabled` row. Comes last in the file, so it beats hover and error. |

Both themes: every token above has its own Light value in
`docs/foundations/color.md`; `checkmark.styl` has no light-only rule. Only the
key-focus colour differs by name (blue/600 in Light, via `KEY_FOCUS_COLOR` in
`button.styl`).

## Keyboard and tooltip

- **Tab** reaches the hidden input; the visible box shows key-focus.
- **Space** toggles it (Focus rule 12). **Enter does not**: that is native
  checkbox behaviour, and `src/frontend/tests/view_vocabulary_chromium_test.nim`
  checks it.
- Key-focus shows only from the keyboard, never after a click (Focus rule 3).
  `shared_widgets.styl` keeps the generic input focus rule off
  `.ct-checkmark-input`, so the box is the only thing that shows it.
- **Columns menu (Event Log):** the check is a `span` with `role="button"`,
  `tabindex="-1"` and `aria-pressed`, not an input. Up and Down move between
  rows, Left and Right between a row's check and its drag handle (D-07).
  key-focus runs around the whole row (D-23).
- **Tooltip:** a checkbox with a visible label needs none. The Columns menu
  check has `title="Show or hide this column"`, shown by `views/tooltips.nim`
  (D-31). The installer dialog's options add an "ⓘ" with its own
  `.custom-tooltip` (`subwindow.nim`, `subwindow.styl`), not the shared
  tooltip.

## Protected decisions

From `codetracer/docs/UI-Design-Decisions.md`. Don't undo these as part of
other work; ask Nikolay.

- **D-08** Every checkbox is the design system's Checkbox: built once as
  `.ct-checkmark`, no per-panel overrides, no text glyphs (☑ / ☐).
- **D-07** The Columns menu uses the shared menu row; Left and Right move
  between a row's check and handle.
- **D-16** key-focus is the one keyboard selection style; no own focus ring.
- **D-23** A Columns menu row shows key-focus on the whole row when its check
  has focus.
- **D-37** A dropdown's chosen row keeps a tick (the checkbox's check path,
  not a checkbox).
- **Focus rules 1–5, 12, 14** Always visible, one style, keyboard only;
  checkboxes answer Space; use the real control first.
- **Standing rules** Space Grotesk for labels; dark-theme weight ≤ 300; styles
  in rem/em.

## Don't

- Don't draw a checkbox of your own, restyle a native `<input type="checkbox">`,
  or use ☑ / ☐ text (D-08). Use `.ct-checkmark`.
- Don't add a per-panel colour, size or corner for the box. A parent may set
  the field's gap, padding and text colour (as `event_log.styl` does), never
  the box.
- Don't put anything between `.ct-checkmark-input` and `.ct-checkmark`. The
  `+` selector breaks, and the tick, hover, focus and disabled stop working.
- Don't drop the box span. The input is visually hidden, so without the span
  there is no box at all (this happened on the welcome screen).
- Don't use the CSS `border` property on the box; the border is the inset
  shadow.
- Don't fade a disabled checkbox with `opacity`; use the disabled state.
- Don't remove the focus outline, and don't give the box a second ring.
- Don't use Space Mono for a checkbox label.
- Don't use a checkbox where the option acts at once; that is the switch.

## Older code still in use

- `src/frontend/ui_js.nim` (save-changed-files dialog, `vex.dialog`) still
  writes a bare `<input type=checkbox>` with no `ct-checkmark` classes. It breaks
  D-08 and should move to the shared markup.
- `src/frontend/styles/subwindow.styl` `.dialog-options label` hard-codes
  `color: #ABABAB` and `font-weight: 400`. Both break the token and dark-weight
  rules.
- `src/frontend/styles/components/status_bar.styl` still has `.checkbox` and
  `.checkbox-text` rules; no view emits these classes now.
- The header comment of `checkmark.styl` says focused = no fill and
  `border/contrast`. The rules below it use `key-focus()`. Trust the rules.

## Figma ↔ code differences

Open until Nikolay settles them; until then **the code wins**.

| Figma | Code | Note |
|---|---|---|
| Property `checkbox`: `16x16` / `18x18` / `24x24` | no attribute / `data-size="md"` / `data-size="lg"` | same sizes and corners, different names |
| Property `type`: `selected` / `indeterminate` / `unselected` | `data-state`: `checked` / `indeterminate` / `unchecked` | same idea, different names |
| Status `focused`, 16px: no fill, 1px `border/contrast` border | rest fill and border kept, plus 1.5px blue `key-focus()` outline (D-16) | Figma should follow D-16 |
| Status `focused`, 18 and 24px: no fill, no border, a separate `focus-ring` 2px outside the box (1px `border/contrast`, 8px corners) | same `key-focus()` outline inside the edge | Figma's ring sits outside; D-16 puts it inside |
| `focused` is drawn three different ways across sizes | one rule for every size | |
| Status `error` exists | `data-error="true"` exists, but no view sets it | fine; no screen needs it yet |
| Box only, no label | `ct-checkmark-field` + `ct-checkmark-label`, 0.5em gap | label spacing and text style are not in Figma |
| Hover shown on the box | hover also comes from the label and from a `ct-menu-item` row | code is wider than Figma |
| Mark icons: `ui-icons` `check-sm` (16, 18), `check-lg` (24), `line` (bar) | same paths, inlined as `CHECKMARK_*` masks | matches |
