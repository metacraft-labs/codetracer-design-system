# Button

> Status: Current · Last checked: 2026-11-18 against codetracer branch
> `ui-design-improvements-part10` (dbf8c8607 + uncommitted D-44 light theme).
> A control that does one thing when pressed: run, open, apply, cancel. Text,
> icon, or icon + text.

## Use it for / don't use it for

- **Use for:** actions in panels, toolbars, dialogs and the welcome screens.
- **Use the icon button for:** an action that has a well-known icon and no room
  for a label. It must have a `title` (see Tooltip).
- **Don't use for:**
  - choosing one of several views → use segmented tabs;
  - on/off settings → use the switch or the checkbox (`.ct-checkmark`);
  - opening a list of choices → use the shared dropdown (`dropdown-surface()`,
    `ct-menu-item` rows). The dropdown's trigger *is* a button and takes the
    "active" state while open.

## Where it lives

| | |
|---|---|
| Figma | `button` (node `69:171`), `icon-button` (node `99:867`), `main-menu-buttons` (node `1843:6319`), all on the ❖ Button page |
| Stylesheet | `src/frontend/styles/components/button.styl` (imported first, so every component sees its constants and mixins) |
| Welcome screens | `src/frontend/styles/components/welcome_screen.styl`: their own look, see D-14 |
| Mixins | `control-button()` rest look · `control-button-hover()` · `control-button-active()` open/on/selected · `key-focus()` keyboard outline · `button-icon(img, w, h)` icon + label/tooltip · `mask-icon(img, size)` icon on its own element · `tooltip-look()` |
| Constants | `CONTROL_HEIGHT_XL/LG/MD/SM/XS` · `BUTTON_TRANSITION_TIMING` · `CONTROL_GAP` (6px between controls, D-32) |
| Markup | a native `<button>` with one shared class (below). Never a `<div>` with a click handler. |

## Classes: how to name a button

```
ct-button-<size>-<type>          text button        ct-button-md-secondary
ct-button-image-<size>-<type>    icon-only button   ct-button-image-md-secondary
ct-button-no-border              modifier: drops the border (used in a few toolbars)
```

- **size:** `xl` · `lg` · `md` · `sm` · `xs` (heights below)
- **type:** `primary` · `secondary`. `tertiary` still works but is only an
  old name for `secondary` (same look). Don't use it in new markup.
- `ct-button-text-<size>-<type>` is an older spelling of the text button. It
  works, but write the short form.

Every button needs one of these classes. A button without one renders with the
browser's look, which D-41 forbids.

## Sizes

One height scale for buttons, icon buttons and fields, so a button beside a
field is the same height.

| Size | Height | Side padding (text) | Where it belongs |
|---|---|---|---|
| `xl` | 34px | 0.875em | welcome screens: their fields and buttons |
| `lg` | 28px | 0.875em | caption bar: the command prompt and its controls |
| `md` | 26px | 0.75em | **inside a panel: the default** |
| `sm` | 24px | 0.625em | compact controls |
| `xs` | 20px | 0.5em | inline controls inside a row or a code line |

Icon buttons are square: width = height of their size. The icon is 1em high.

Corners: the base rule gives buttons `0.5em`, icon buttons `0.375em`, and `xl`
`6px` to match the xl fields. Gap between neighbouring controls: `CONTROL_GAP`
(6px).

Label font: Space Grotesk (never Space Mono, even for a button that acts on
code). Dark theme: weight 300 or lighter.

## States

### Secondary (the default for everything that is not the main call to action)

| State | Look | Tokens |
|---|---|---|
| Rest | 0.5px border, dark fill, subtle text | `border/primary` · `surface/primary/default` · `text/primary/body-subtle` |
| Hover | fill lightens, text brightens; 100ms | `surface/primary/default-hover` · `text/primary/body` |
| Key-focus | 1.5px outline inside the edge | blue/500 (dark), blue/600 (light), via `key-focus()` |
| Active (`.open`, `.active`, `aria-expanded="true"`) | border turns accent, text brightens | `border/action` · `text/primary/body` |
| Disabled | **fill unchanged**, text and border go grey | `text/primary/disabled` · `border/disabled` |

### Primary (one per area, at most: the main action)

| State | Look | Tokens |
|---|---|---|
| Rest | brand fill, light text | `surface/action/primary` · `text/on-action/primary` |
| Hover | darker brand fill | `surface/action/primary-hover`; text: dark `text/primary/body`, light `text/on-action/primary-hover` |
| Key-focus | as secondary | `key-focus()` |
| Disabled | **fill unchanged**, label at 50% (dark) / 70% (light) | `text/on-action/primary` with alpha |

### Welcome screens only

Tertiary fill, no border, hover lightens the fill only
(`surface/primary/tertiary`, `text/primary/body-subtle`). Lives in
`welcome_screen.styl` under `.welcome-screen-wrapper`. Don't apply panel button
changes here unless Nikolay names the welcome screens (D-14).

## Icons on buttons

- Icons come from the Figma icons page (node `1:12`). Never draw or download one.
- Paint them with `button-icon(ICON_…)` when the button also has a label or a
  tooltip child, or `mask-icon(ICON_…)` on an element of its own. The icon takes
  the text colour, so hover, disabled and both themes work with no extra rules
  (D-38).
- Add a new icon as an `ICON_*` constant at the top of `button.styl`, with its
  Figma name in a comment.

## Keyboard and tooltip

- Tab reaches the button; **Enter and Space** both press it (D-17).
- Key-focus shows only when using the keyboard, never after a click.
- Every icon-only button has a `title` saying what it does ("Pin to the
  sidebar", not "Pin"). `views/tooltips.nim` shows it as the design-system
  tooltip after a 0.2s rest or on key-focus (D-31).
- A button whose menu is open, or that was just clicked, shows no tooltip until
  the pointer leaves (D-35). A new dropdown must be added to `DROPDOWNS` in
  `views/keyboard_focus.nim` so this and Esc-to-close work (D-21, D-41).

## Protected decisions

From `codetracer/docs/UI-Design-Decisions.md`. Don't undo these as part of
other work; ask Nikolay.

- **D-06** Panel buttons share one look and a 100ms hover.
- **D-14** The welcome screens keep their own button look.
- **D-17** Enter and Space both press a focused button.
- **D-20** A disabled button keeps its fill; never fade it with `opacity`.
- **D-31** One tooltip, from the design system.
- **D-32** 6px between controls.
- **D-35** An open or pressed button shows no tooltip.
- **D-37** The Agent panel uses the shared buttons (md, 26px).
- **D-38** Every icon is a Design System icon in the text colour.
- **D-41** Every button has a shared class; no browser default look.

## Don't

- Don't write colours, px or a new hover timing in a component file. Use the
  mixins above.
- Don't give a disabled button `opacity` or a different fill.
- Don't make a new button style for one panel. If the shared look doesn't fit,
  ask Nikolay.
- Don't use `tertiary` in new markup, and don't add a third look under that name.
- Don't put an icon in as a `background-image` with a baked-in colour. It
  disappears in one of the themes (D-38, D-42).
- Don't remove `outline` on focus without `key-focus()` in its place.

## Figma ↔ code differences

Open until Nikolay settles them; until then **the code wins**.

| Figma | Code | Note |
|---|---|---|
| `button` type: primary / secondary / tertiary | tertiary = secondary (one look) | Figma still draws a separate tertiary |
| Disabled primary loses its indigo fill | keeps the fill, label dims (D-20) | Figma should follow D-20 |
| `icon-button` type: primary / **outlined** / secondary | no `outlined` | |
| Sizes: large / medium / small | xl / lg / md / sm / xs (34–20px) | mapping between the two not yet written down |
| Status `selected` | `.open` / `.active` / `aria-expanded` → `control-button-active()` | same idea, different name |
| Status `focused` | `key-focus()` outline | |
| `icon-button` radius: sm / md | one radius per kind (`0.375em`) | |
| Key-focus in light | `border/focus` token = blue/500 in both modes; code uses blue/600 in light | token should change in Figma |
