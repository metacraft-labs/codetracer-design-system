# Dropdown

> Status: Current · Last checked: 2026-11-19 against codetracer branch `ui-design-improvements-part10`.
> A button that opens a short list of choices or commands over the UI. One
> shared surface (the menu), one shared row (`ct-menu-item`), and a trigger
> that is a normal button.

## Use it for / don't use it for

- **Use for:** picking one value from a list (the Requests Method and Status
  filters, the VCS branch, the Agent model and settings), a short list of
  commands (the Agent add-context menu, the status bar's tab-list menu), and a
  list of toggles (the Event Log Columns menu, with a checkbox in each row).
- **Don't use for:**
  - two to four views of one panel → use segmented tabs (`segmented-tabs()`,
    `shared_widgets.styl`);
  - one on/off setting → use the switch or the checkbox (`.ct-checkmark`);
  - one action → use a button (see `button.md`);
  - a hint that explains a control → use the tooltip (a `title`, see
    `tooltip.md`).

## Where it lives

| | |
|---|---|
| Figma | `menu-item` (node `1279:1317`, page ❖ Menu) is the row the code builds. `dropdown-item` (node `3728:90`, page ♦️ Dropdown) is a second, older-styled row that the code does **not** follow (see the differences table). The open examples beside it ("Dropdown / single-select (open)", node `3729:68`) show a surface and a field-style trigger. All in file `Ytr6Ux4bYZYRUBpgNsSVml`. |
| Surface (the menu) | `src/frontend/styles/components/shared_widgets.styl` |
| Row | `src/frontend/styles/components/menu_item.styl` (`.ct-menu-item`) |
| Hover colour | `DROPDOWN_HOVER_BG` in `src/frontend/styles/components/button.styl` |
| Mixins | `dropdown-surface()` the full menu: chrome + clip to the radius + reveal animation · `dropdown-surface-chrome()` the look only, no clip and no animation · `dropdown-surface-row()` rounds the first and last row into the menu's corners · `dropdown-scrollbar()` a 6px scrollbar for a menu · `key-focus()` (button.styl) the keyboard outline |
| Constants | `DROPDOWN_RADIUS` 4px · `DROPDOWN_TRIGGER_GAP` 6px between trigger and menu · `DROPDOWN_TRIGGER_OFFSET` the same gap measured from the trigger's bottom · `DROPDOWN_SCROLLBAR_SIZE` 6px · `DROPDOWN_HOVER_BG` (all in `shared_widgets.styl` except the hover, in `button.styl`) |
| Ready-made picker | `.ct-picker` / `.ct-picker-trigger` / `.ct-picker-dropdown` in `shared_widgets.styl`, rendered by `renderPicker` in `src/frontend/viewmodel/views/isonim_request_panel_view.nim` |
| Keyboard | `src/frontend/viewmodel/views/keyboard_focus.nim` (arrow keys, focus, Esc), `src/frontend/ui/key_router.nim` (Esc first, D-21) |
| Tooltip rule | `src/frontend/viewmodel/views/tooltips.nim` (`isOpen()`, D-35) |

### Markup

```
div.ct-picker                                   the box around trigger + menu
  div.ct-picker-trigger[.ct-picker-trigger--open]
      role="button" tabindex="0" aria-haspopup="true" aria-expanded="true|false"
    span.ct-picker-chevron
    span.ct-picker-label                        current value
  div.ct-picker-dropdown tabindex="-1"          only in the DOM while open
    div.ct-menu-item[.ct-menu-item--chosen] role="button" tabindex="-1"
      span.ct-menu-item-icon                    optional, 1em slot
      span.ct-menu-item-label                   the text
      span.ct-menu-item-sublabel                optional: shortcut or detail
      span.ct-menu-item-trailing                optional: › for a submenu
```

Row modifiers: `ct-menu-item--chosen` (the saved value), `ct-menu-item--active`
(the keyboard's place, in menus that keep focus elsewhere),
`ct-menu-item--disabled`. A checkbox row puts a `.ct-checkmark` in the icon
slot (the Columns menu, `isonim_event_log_view.nim`).

### Which dropdowns use it today

| Menu | Surface | Rows | Files |
|---|---|---|---|
| Requests Method / Status | `dropdown-surface()` | `ct-menu-item` | `shared_widgets.styl` (`.ct-picker-dropdown`), `isonim_request_panel_view.nim` |
| VCS branch picker | `dropdown-surface()` | `ct-menu-item` | `vcs.styl` (`.vcs-branch-dropdown`), `isonim_vcs_view.nim` |
| Agent model / branch | `dropdown-surface()` via `agent-toolbar-menu()` | `ct-menu-item` | `agent_activity.styl`, `isonim_agent_activity_view.nim` |
| Agent settings selects | `dropdown-surface()` | `ct-menu-item` (+ tick on the chosen row) | `agent_activity.styl` (`.agent-settings-dropdown-list`) |
| Agent add-context | `dropdown-surface()` | `ct-menu-item` + `dropdown-surface-row()`, own padding and hover rule | `agent_activity.styl` (`.agent-add-context-dropdown`) |
| Event Log Columns | `dropdown-surface()` | `ct-menu-item` + checkbox + drag handle | `event_log.styl` (`.eventLog-columns-menu`), `isonim_event_log_view.nim` |
| Status bar tab-list | `dropdown-surface()` | `ct-menu-item` + `dropdown-surface-row()` | `auto_hide.styl` (`.auto-hide-tablist-menu`), `isonim_auto_hide_collapsed_icons_view.nim` |
| Command palette results | `dropdown-surface()` | `ct-menu-item` + `dropdown-surface-row()` | `command-palette.styl`, `isonim_command_palette_view.nim` |
| Code editor right-click | `dropdown-surface()` | `ct-menu-item` | `text_editor.styl` (`#context-menu-container`), `renderer.nim`, `context_menu_bridge.nim` |
| Application menu + submenus | `dropdown-surface-chrome()` only | `ct-menu-item` | `menu_bar.styl` (`#menu-main`, `.menu-nested-elements`), `isonim_menu_shell_view.nim` |
| Session tabs overflow | `dropdown-surface()` | **own rows** `.session-tab-overflow-item` (28px) | `session_tabs.styl` |

**Not on the shared surface or row yet:** the Event Log filter
(`.dropdown-container` / `.dropdown-list`, `event_log.styl`: own canvas fill,
shadow, and a line on top of each `.dropdown-list-row`), the tracepoint
options ⋯ menu (`.hamburger-dropdown-container > .dropdown-list`,
`tracepoint.styl`: own surface, `.dropdown-list-item` rows with 2px corners),
the diff's "show more lines" menu (`.ct-diff-expand-menu`, `unified_diff.styl`:
fixed dark colours, 2px corners, shadow), the older `.context-menu`
(`renderer.nim` `renderContextMenu`, `text_editor.styl`: panel fill, rows
`context-menu-option ct-menu-item` with an `em` font size and 3px corners), and
the application menu's search results (`.menu-search-result`, `menu_bar.styl`,
old row markup).

## Variants and sizes

### Surface

| Variant | Mixin | When |
|---|---|---|
| Standard | `dropdown-surface()` | **Every new dropdown.** Clips rows to the 4px corners and plays the reveal. |
| Chrome only | `dropdown-surface-chrome()` | Only for a menu that is rebuilt while open, or that shows children outside its box (submenus). Both broke `#menu-main` (flicker, missing submenus); the comment above `dropdown-surface()` explains. Clip the rows on an inner element instead (`#menu-elements`). |

- Fill `colors-ui-surface-primary-default`, a 0.5px (`0.03125rem`)
  `colors-ui-border-primary` border, `DROPDOWN_RADIUS` (4px), no shadow.
- Inset: the pickers and Agent menus pad the surface by 4px (`0.25rem`) on
  every side (D-37). Rows have no gap between them.
- Gap to the trigger: `DROPDOWN_TRIGGER_GAP` (6px), below the trigger with
  `top: DROPDOWN_TRIGGER_OFFSET`, or above it with `bottom:` when the trigger
  sits at the bottom of a panel (Agent toolbar, status bar).
- A list that can grow sets `max-height` and `overflow-y: auto` **after** the
  mixin, because the mixin sets `overflow: hidden` (`.ct-picker-dropdown`,
  `.session-tab-overflow-menu`, `.auto-hide-tablist-menu` do this).
- Reveal: 120ms ease-out, fade in and slide down 4px (`ct-dropdown-reveal`).
  No closing animation (the menu leaves the DOM). Off under
  `prefers-reduced-motion`.
- All sizes are `rem`, so the menu looks the same in a 12px or 16px container.

### Row (`ct-menu-item`)

One size: **36px** (`2.25rem`). Text 14px (`0.875rem`, D-26), Space Grotesk,
weight 400. Side padding and icon gap `0.5em` (7px at 14px). Icon slot 1em.
Label and sublabel cut off with an ellipsis. Rows are square; only the first
and last row round into the menu's corners.

| Row kind | How |
|---|---|
| Text | `.ct-menu-item-label` only |
| With icon | add `.ct-menu-item-icon` before the label |
| With detail or shortcut | add `.ct-menu-item-sublabel` after the label |
| Opens a submenu | add `.ct-menu-item-trailing` (› at the end) |
| Checkbox | `.ct-checkmark` in the icon slot; the box follows the row's hover and disabled (`checkmark.styl`) |

### Trigger

The trigger is a button and takes the button's look (see `button.md`):

- `.ct-picker-trigger`: 26px (`CONTROL_HEIGHT_MD`), `control-button()` at rest,
  `control-button-hover()` on hover, `control-button-active()` while open
  (`.ct-picker-trigger--open`). Label 12px; it keeps its control size, it does
  not take the rows' 14px (D-26).
- Or a `ct-button-md-secondary` button with a chevron painted by
  `mask-icon(ICON_CHEVRON_DOWN)` (the Agent settings selects, D-37).
- While open, the trigger carries `aria-expanded="true"`. That is what turns on
  the button's active look and what silences its tooltip (D-35).

## States

### Row

| State | How it looks | Tokens | How it is triggered in code |
|---|---|---|---|
| Rest | row fill, body text | fill `colors-ui-surface-base-raised` · text `colors-ui-text-primary-body` · sublabel `colors-ui-text-primary-body-subtle` · icon `colors-ui-icon-primary-default` | `.ct-menu-item` |
| Hover | fill lightens, 0.12s | `DROPDOWN_HOVER_BG` = `colors-ui-surface-primary-default-hover` (#262626) | `:hover` |
| Key-focus | 1.5px outline inside the row, no fill change | blue/500 (dark), blue/600 (light), via `key-focus()` | the row has real focus and the global `:focus-visible` rule paints it (pickers); or `.ct-menu-item--active` where focus stays elsewhere (application menu, command palette after an arrow key, editor right-click) |
| Chosen (saved value) | subtle grey fill, never key-focus | `colors-ui-surface-primary-tertiary` (#333333) | `.ct-menu-item--chosen` |
| Disabled | **fill unchanged**, text and icon go grey, › dims | `colors-ui-text-primary-disabled` · `colors-ui-icon-primary-disabled` | `.ct-menu-item--disabled` (also `pointer-events: none` and a not-allowed cursor) |

Hover and chosen must look different: that is why the hover is the quieter
`#262626` and the chosen fill is `#333333` (D-30). A dropdown painted `#242424`
or lighter keeps the list hover instead (D-30).

**Light theme** (only where it differs): the same hover token, its light value
(D-30; pure white from 2026-11-18 until it was reverted on 2026-11-21). The
tokens resolve to: surface and row
`#f7f6f4`, border `#a8a49c`, chosen `#d9d6d1`, text `#262523`
(`foundations/color.md`).

### Surface and trigger

| State | Surface | Trigger |
|---|---|---|
| Closed | not in the DOM | button rest look, `aria-expanded="false"` |
| Open | revealed, 6px from the trigger | `control-button-active()`: accent border (`border/action`), body text; no tooltip |

## Keyboard and tooltip

How it behaves (D-18, D-21, Focus rules 6, 7, 10, 11):

- The trigger is **one Tab stop**. Enter or Space opens it.
- Opening moves focus to the menu's search field if it has one (Agent branch
  menu), else the chosen row, else the first row.
- **Up / Down** move between rows, **Home / End** jump to the ends. In the
  Columns menu Left / Right move between a row's checkbox and its drag handle
  (D-07, D-23).
- **Enter or Space** picks a row. Picking closes the menu and returns focus to
  the trigger.
- **Esc** closes the open dropdown and does nothing else, wherever the focus
  is, and focus returns to the trigger (D-21). The innermost one closes first.
- **Tab**, or a click outside, closes it. At most one dropdown is open.
- An arrow key counts as keyboard use, so a menu opened with the mouse shows
  key-focus as soon as an arrow moves in it (D-23).
- Rows are `role="button"` with `tabindex="-1"`; they are reached with the
  arrows, never with Tab.

Tooltip: the trigger has a `title` if it is icon-only. While its menu is open,
and after a click until the pointer leaves, it shows **no tooltip** (D-35).
Rows normally have no tooltip; a disabled Agent add-context row keeps
`pointer-events` so its `title` can say why it is disabled.

### Adding a new dropdown: the checklist

1. Surface: call `dropdown-surface()` (not your own fill, border or radius).
   Pad it `0.25rem`. Place it with `DROPDOWN_TRIGGER_OFFSET`.
2. Rows: emit `ct-menu-item` with a `ct-menu-item-label` child. Mark the saved
   value `ct-menu-item--chosen`. Don't set a font size on the row.
3. Trigger: a real button with a shared class (D-41), or `.ct-picker-trigger`.
   Set `aria-haspopup="true"` and `aria-expanded`.
4. In `views/keyboard_focus.nim`, add the menu to **all** of these, or part of
   the behaviour will be missing:
   - `DROPDOWNS` (Esc closes it, D-21; its trigger shows no tooltip, D-35);
   - `DropdownListSelector` (the arrow keys work in it, and the key router
     leaves those keys to it);
   - `CONTAINER` and `TRIGGER` inside `installKeyboardFocus` (focus moves into
     the menu on open and back to the trigger on close).
5. Check it in both themes and with the keyboard only.

## Protected decisions

From `codetracer/docs/UI-Design-Decisions.md`. Don't undo these as part of
other work; ask Nikolay.

- **D-06** The trigger has the shared button look and 100ms hover.
- **D-07** The Columns menu uses the shared menu row; its handle moves rows from the keyboard.
- **D-16** The keyboard's current row shows `key-focus`, not a filled row.
- **D-17** An open menu keeps its own Enter.
- **D-18** One Tab stop; arrows, Enter/Space, Esc, Tab; the chosen row is a grey fill, not key-focus.
- **D-19** The Requests filters have no "All" row; picking the chosen row again clears it.
- **D-21** Esc closes the open dropdown first, wherever the focus is.
- **D-23** A Columns row shows key-focus on the whole row.
- **D-26** Every dropdown row's text is 14px (`0.875rem`); the trigger keeps its own size.
- **D-28** The command palette's first row is chosen, not focused, until an arrow key moves.
- **D-29** No line between dropdown rows.
- **D-30** A dropdown row's hover is quieter than a list row's; the same token in light (no longer white).
- **D-35** An open or just-pressed trigger shows no tooltip.
- **D-37** The Agent panel's menus are the shared dropdown (4px inset, 36px rows).
- **D-41** Every menu is in `DROPDOWNS`, so Esc closes it.

## Don't

- Don't paint a menu's own fill, border, radius or shadow. Call `dropdown-surface()`.
- Don't use `dropdown-surface-chrome()` for a normal menu; it drops the clip and the reveal.
- Don't set a font size on a row or take it from the menu. `ct-menu-item` sets 14px in `rem` (D-26).
- Don't write sizes in `em` on a menu; it changes with the container. Use `rem` (and land on whole pixels).
- Don't use `key-focus` for the chosen row, or a fill for the keyboard's row (D-16, D-18).
- Don't reuse `LIST_HOVER_BG` (#333333) for a row's hover; it looks like the chosen row (D-30).
- Don't draw a line between rows (D-29). A line that sets apart a part of the menu (a search field, a "New branch" row) is not a row line.
- Don't fade a disabled row with `opacity` or change its fill.
- Don't put `overflow-y: auto` before the mixin; the mixin's `overflow: hidden` wins.
- Don't forget the lists in `keyboard_focus.nim`. A menu missing from `DROPDOWNS` stays open on Esc (the tracepoint ⋯ menu did, D-41).
- Don't animate the menu's close, or use a heavier reveal. The 120ms fade-and-slide is the one motion.

## Figma ↔ code differences

The code's `ct-menu-item` row follows **`menu-item`** (1279:1317): same parts
(left icon, label, sub-text, right chevron, checkbox type), same rest, hover,
text and disabled-text tokens, square corners. **`dropdown-item`** (3728:90) is
a different row the code does not use. Open until Nikolay settles them; until
then **the code wins**.

| Figma | Code | Note |
|---|---|---|
| Two row components: `menu-item` and `dropdown-item` | one row, `ct-menu-item` | `dropdown-item` should be retired or made to match |
| `menu-item` Size lg 34 / md 28 / sm 24px; `dropdown-item` 36px | one size, 36px (`2.25rem`) | |
| `menu-item` sm uses 12px text | 14px everywhere (D-26) | Figma sm breaks D-26 |
| `menu-item` padding 8px, gap 8px; `dropdown-item` 10/12px, gap 10px | `0.5em` side padding and gap (7px at 14px), no vertical padding | |
| Icon slot 16px | `1em` (14px) | |
| `menu-item` focused: row filled with `colors/ui/border/focus` | `key-focus()` 1.5px outline, no fill (D-16) | `menu_item.styl`'s header comment still says "Focused: fill=colors-ui-border-focus"; the rule below it uses `key-focus()` |
| `menu-item` type=selected: trailing check, no fill | `--chosen`: grey fill `surface/primary/tertiary`, no check (D-18); a tick only in the Agent settings selects | |
| `dropdown-item` hover and selected: the same fill, `surface/primary/secondary` | hover `DROPDOWN_HOVER_BG`, chosen `surface/primary/tertiary`, different on purpose (D-30) | |
| `menu-item` disabled: fill `default-hover` | fill unchanged, only text and icon grey | |
| `dropdown-item` secondary text `text/primary/caption` | sublabel `text/primary/body-subtle` | `menu-item` matches the code |
| `menu-item` corner=rounded (8px / 6px rows) | square rows; only the menu's ends round (4px) | |
| `menu-item` type=line (dot, line under the lg row) | no such row; no line between rows (D-29) | |
| Open example's menu: `surface/base/card` fill, 1px `border/secondary`, 10px radius, 4px top/bottom inset | `surface/primary/default`, 0.5px `border/primary`, 4px radius, 4px inset all round | |
| Open example's trigger: a 36px field (`surface/input/default`, 8px radius, `border/action` when open) | a 26px md button; open = `control-button-active()` | |
| `menu-item` right chevron: an icon in `icon/primary/default` | `.ct-menu-item-trailing` is a data-URI picture with a fixed `#DDDDDD` stroke | in the light theme this near-white chevron will barely show (compare D-38, D-42) |
