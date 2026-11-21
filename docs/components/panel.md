# Panel

> Status: Current · Last checked: 2026-11-19 against codetracer branch `ui-design-improvements-part10`.
> A Golden Layout panel: a tab in a 32px header, a toolbar row with the search
> field, the panel body, and the 4px gaps between panels that you drag to resize.

## Use it for / don't use it for

- **Use for:** every view of an open trace that sits in the layout: Event Log,
  Requests, State, Calltrace, Search, Flow, Files, and any new one. The
  standing rule: build panels as Golden Layout stacks with the standard header
  and search-field toolbar, reusing the shared field, icon button and sub-tab.
- **Don't use for:**
  - the code editor. It is a layout item too, but not a panel: it keeps its
    own 4px top and its gutter owns its spacing (`.lm_content:has(> .code-editor)`);
  - menus and popovers → use the shared dropdown (`dropdown-surface()`,
    `ct-menu-item` rows);
  - the welcome screens. They have their own look (D-14).

A panel docked at a window edge or previewed from a strip tab (auto-hide) is the
same panel in a different host. It paints the same surface and the same 8px top
(`auto_hide.styl`), so build it once as a layout panel.

## Where it lives

| | |
|---|---|
| Figma | No panel component yet. Reference: page `Frame/GoldenLayout` (node `3833:14203`, frame `frame-mac-dark`), file `Ytr6Ux4bYZYRUBpgNsSVml`. It is built from `field`, `icon-button`, `ui-icons` and `sub-tab`. |
| Stylesheet | `src/frontend/styles/components/golden_layout.styl`: header, tabs, body, gaps, selected outline |
| Shared pieces | `button.styl` (`PANEL_INSET`, `CONTROL_GAP`, `CONTROL_HEIGHT_*`, buttons) · `input.styl` (`.ct-input-panel`, `.ct-input-search-image`, `field-fill()`) · `shared_widgets.styl` (`segmented-tabs()`, `tab-icon()`, `.component-container`, panel scrollbar) · `shared_components.styl` (`.ct-flex` toolbar row) |
| Theme constants | `LAYOUT_TAB_CLOSE_ICON_PATH`, `LAYOUT_TAB_PIN_ICON_PATH`, `LAYOUT_MAXIMIZE_ICON_PATH`, `LAYOUT_CLOSE_ICON_PATH` in `default_dark_theme.styl` / `default_white_theme.styl` |
| Mixins | `segmented-tabs()` a sub-tab track with its tabs · `segmented-tab()` one sub-tab · `tab-icon(icon, size)` pin / close icon on a tab · `field-fill(dark)` field fill, light theme takes `surface/input/default` (D-43) · `search-icon(color)` the magnifier · `key-focus()` |
| Mounting | `src/frontend/ui/layout.nim` registers the component and calls `markPaneScope()` (`data-scope-kind="pane"`, `tabindex="-1"`). `src/frontend/ui/panel_host.nim` mounts the view: add the panel's `Content` to `PanelHostKinds`. |
| Markup / view | `src/frontend/viewmodel/views/isonim_<name>_view.nim`. Root: `tdiv(class = "component-container <name>", tabindex = "-1")` (or `componentContainerClass("<name>")`, `renderer.nim`). Good examples: `isonim_event_log_view.nim`, `isonim_request_panel_view.nim`. |

There is no shared "render a panel toolbar" helper in the views yet. Each panel
writes its own toolbar row. Copy the Event Log or Requests pattern below.

## Parts and sizes

### Anatomy

```
.lm_stack
  .lm_header                 32px, transparent (the canvas shows through)
    .lm_tabs                 flex row, 4px gap between tabs
      .lm_tab[.lm_active]    24px tall, 4px from the header's top
        .lm_pin_tab  .lm_title  .lm_close_tab
  .lm_items
    .lm_content              the body: surface/base/panel, 4px corners, 8px top padding
      div.component-container.<name>   your view's root
        toolbar row          search field + buttons, 6px apart, 8px from the sides
        rows / table / tree
.lm_splitter                 the 4px gap to the next panel
  .lm_drag_handle            1px line inside it
```

### Header and tabs (`golden_layout.styl`)

| Part | Size | Look |
|---|---|---|
| Header `.lm_header` | 32px. Set from JavaScript (`headerHeight`), not CSS | transparent; label text colour |
| Tab `.lm_tab` | 24px tall, 4px below the header's top (`LAYOUT_TAB_TOP`), so 4 + 24 + 4 | `surface/base/panel`, `0.5em` side padding, `TAB_CORNER_RADIUS` 4px |
| Gap between tabs | `LAYOUT_TAB_GAP` 4px, as flex `gap` | never `margin-right` (Golden Layout miscounts it) |
| Title `.lm_title` | 14px (`0.875rem`), weight 400, one line with `…` | Space Grotesk. Back tab `text/primary/disabled`; active tab and hovered back tab `text/primary/label`. At least 8px before the icons |
| Pin `.lm_pin_tab` | 14px, 5px after it | `tab-icon()`: `icon/primary/subtle` |
| Close `.lm_close_tab` | 10px, does not shrink | `tab-icon()`: `icon/primary/subtle` |
| Active tab connectors | the `::before` / `::after` curves, painted radius `LAYOUT_TAB_CONNECTOR_RADIUS` 4px (`0.25rem`), also the `::before` / `::after` border-radius itself | join the tab to the body. Switched off on a first or last tab, where that body corner is square |

A panel stacked under another has its header slid up by 4px, so the gap above
its tab is 4px like the gap between columns.

### Toolbar row

The first row of the body. It holds the search field and the panel's buttons.

| Rule | Value | Source |
|---|---|---|
| Space above | none of its own. The body's 8px top padding is the whole gap | `.lm_content` padding `PANEL_INSET` |
| Sides | `PANEL_INSET` (8px) left and right | D-11 |
| Between controls | `CONTROL_GAP` (6px) | D-32 |
| Search field | `.ct-input-panel .ct-input-search-image`: 26px (`INPUT_HEIGHT_MD`), fills the free width, 1px `border/secondary`, 4px corners, magnifier 6px in | `input.styl` |
| Buttons | md size: `ct-button-md-secondary`, or `ct-button-image-md-secondary` for an icon only | see `button.md` |
| Sub-tabs (mode switch) | `segmented-tabs()`: 26px track, 20px tabs, 2px padding | `shared_widgets.styl`. Used by State, Search, Flow |

Event Log (`isonim_event_log_view.nim`):

```nim
tdiv(class = "ct-flex"):
  button(id = "category-image", class = "ct-button-image-md-secondary ct-button-no-border",
         title = "Filter", tabindex = "0")
  input(class = "ct-input-panel ct-input-search-image eventLog-search-field",
        `type` = "text", placeholder = "Find event")
  button(class = "ct-button-md-secondary …", title = "Show, hide or move the event log's columns")
```

`.ct-flex` gives a flex row with `gap: CONTROL_GAP`, but its default padding is
4px. Each panel overrides the sides to `PANEL_INSET` in its own stylesheet
(`event_log.styl`: `> .ct-flex`). Requests uses its own row,
`.request-panel-filters` (`request_panel.styl`): `gap: CONTROL_GAP`,
`padding: 0 PANEL_INSET 0.5em`.

### Body

| Rule | Value | Source |
|---|---|---|
| Fill | `surface/base/panel` | `.lm_content` |
| Corners | `TAB_CORNER_RADIUS` 4px, square where the active tab is flush with the edge | D-12 |
| Top inset | 8px (`PANEL_INSET`), padding on `.lm_content`. Your rows add no top padding | D-11 |
| Side inset | 8px on text, fields and values. Rows with a fill (list, table, header bands) run edge to edge, with content 8px in | `button.styl` comment on `PANEL_INSET` |
| Row hover | `LIST_HOVER_BG` (`surface/primary/secondary-hover`), whole row, square corners | `button.styl` |
| Scrollbar | 8px (`PANEL_SCROLLBAR_SIZE`), thumb `surface/primary/tertiary`, hover and drag `tertiary-hover` | `shared_widgets.styl` |
| Root text | Space Grotesk, weight 400, line height 1.5em | `.component-container` |

### Gaps between panels (D-36)

| Part | Value |
|---|---|
| Gap `.lm_splitter` | 4px wide (`.lm_horizontal`) or tall (`.lm_vertical`). The whole 4px is the grab area. Fill `surface/primary/default`, the same as the layout behind it, and it never changes |
| Line `.lm_drag_handle` | 1px, 2px in from the gap's edge |
| Cursor | `col-resize` / `row-resize` |
| Layout behind the panels `.lm_goldenlayout` | `surface/primary/default` |

## States

### Tab

| State | How it looks | Tokens | Triggered by |
|---|---|---|---|
| Back tab, rest | title dim; pin and close at 40% | `text/primary/disabled` · `icon/primary/subtle` | `.lm_tab:not(.lm_active)` |
| Back tab, hover | title brightens (150ms); an icon under the pointer goes to 100% | `text/primary/label` · `TAB_ICON_COLOR_HOVER` | `:hover` |
| Active tab | joined to the body by the curves; icons at 100% | `surface/base/panel` · `text/primary/label` | `.lm_active` (Golden Layout) |
| Busy | title opacity breathes 1 → 0.45, 1.4s. Reduced motion: still, at 0.6 | — | `.lm_tab_busy`, set by `setCalltraceTabBusy` (`isonim_calltrace_view.nim`) |

### Panel

| State | How it looks | Tokens | Triggered by |
|---|---|---|---|
| Rest | body on the canvas, no outline | `surface/base/panel` | — |
| Selected | one 1px grey line around tab, curves and body. The fill does not change | `SELECTED_PANEL_BORDER_COLOR` = `border/primary` (D-15) | `setupSelectedPanelOutline()` in `ui/layout.nim` draws `.ct-selected-outline` |
| Focused (click in the body) | no browser ring; the selected outline already shows it | — | `[data-scope-kind="pane"]:focus { outline: none }` |

### Gap

| State | How it looks | Tokens |
|---|---|---|
| Rest | line hidden | transparent |
| Hover | line shows, quiet grey | `border/primary` (`.lm_splitter:hover .lm_drag_handle`) |
| Dragging | line in the accent | `border/action` (`.lm_splitter.lm_dragging .lm_drag_handle`) |

### Search field

| State | Look | Tokens |
|---|---|---|
| Rest | placeholder and magnifier quiet | `field-fill(surface/input/secondary)` · `border/secondary` · `text/primary/label-subtle` (D-39) |
| Hover | border lightens, text and magnifier brighten | `border/primary-hover` · `text/primary/body` |
| Typing / filled | 1px accent border | `border/action` · `text/primary/body` |
| Key-focus (Tab) | 1.5px blue line inside, only when reached by Tab | `key-focus()` (D-16) |
| Disabled | grey border, grey text | `border/disabled` · `surface/primary/disabled` · `text/primary/disabled` |

Light theme: every field fill is `surface/input/default` through `field-fill()`
(D-43). The tab icons in light use the `default_white_theme.styl` pictures,
painted through `tab-icon()` masks.

## Keyboard and tooltip

- A pane is not a Tab stop. A click puts focus in it (`tabindex="-1"`, set by
  `markPaneScope()`), and its keys become the pane's (Focus rule 9).
- Tab moves between the panel's controls, left to right, top to bottom (Focus
  rule 8). A list, menu or set of sub-tabs is one Tab stop; arrow keys move
  inside it (Focus rule 6). Add a new one to `views/keyboard_focus.nim`.
- Never use a positive `tabindex`.
- A dropdown in the toolbar goes in `DROPDOWNS` (`views/keyboard_focus.nim`),
  so Esc closes it first (D-21) and it shows no tooltip while open (D-35).
- Every icon-only toolbar button has a `title` that says what it does. The
  tooltip comes from `views/tooltips.nim` (D-31).
- The tab title text is an identity key: `ui/auto_hide.nim` and tests match
  panels by it. Don't add badges or extra text to `.lm_title`.

## Protected decisions

From `codetracer/docs/UI-Design-Decisions.md`. Don't undo these as part of
other work; ask Nikolay.

- **D-06** Panel buttons share one look and a 100ms hover.
- **D-11** Panel content has an 8px inset (`PANEL_INSET`).
- **D-12** One 4px corner for the tab and its panel (`TAB_CORNER_RADIUS`).
- **D-15** The selected panel outline is subtle and grey (`border/primary`).
- **D-16** key-focus is the one keyboard selection style.
- **D-21** Esc closes the open dropdown first.
- **D-22** A focused strip tab's key-focus runs around its whole panel.
- **D-24** The Files tree's first arrow lines up with the panel title.
- **D-25** An active strip tab stays joined to its panel when focused.
- **D-32** 6px between controls (`CONTROL_GAP`).
- **D-36** Every gap between panels is 4px with a 1px line: hidden at rest,
  `border/primary` on hover, `border/action` while dragged.
- **D-37** The Agent panel uses the shared controls.
- **D-39** A placeholder and the magnifier are quieter than typed text.
- **D-43** In light, every text field is `surface/input/default`.

## Don't

- Don't give your panel's first row a top padding or margin. The 8px is already
  on `.lm_content`.
- Don't write 8px or 6px by hand. Use `PANEL_INSET` and `CONTROL_GAP`.
- Don't make your own search field. Use `ct-input-panel ct-input-search-image`.
- Don't size a panel field in `em` or off the scale (24.5px, 30px happened).
  Use `INPUT_HEIGHT_MD`.
- Don't put `margin-right` on `.lm_tab`. Use the `gap` on `.lm_tabs`.
- Don't paint the gap. Only the 1px `.lm_drag_handle` changes colour (D-36).
- Don't change the panel fill to show selection. The outline alone does it.
- Don't add a second outline rule. The layout, docked and overlay outlines are
  stroked from one rule on purpose.
- Don't add elements to `.lm_tabs` or text to `.lm_title`. Tests and
  `auto_hide.nim` depend on both.
- Don't draw your own mode switcher. Use `segmented-tabs()`.

## Figma ↔ code differences

Open until Nikolay settles them; until then **the code wins**.

| Figma | Code | Note |
|---|---|---|
| No panel component. Only the reference frame on page `3833:14203` | `golden_layout.styl` + shared field, buttons, sub-tabs | **For the designer:** a library `panel` component (header, toolbar, body, gap) is missing |
| Header frame 36px | header 32px, tab 24px | |
| Panel field `field` type `panel-sm` 24px / `panel-lg` 28px | one panel field, 26px (`INPUT_HEIGHT_MD`) | |
| `icon-button` size small, 24px | md icon button, 26px | |
| 4px between field and buttons, 4px padding around the field | `CONTROL_GAP` 6px; `PANEL_INSET` 8px | code follows D-11 and D-32 |
| `sub-tab` 24px tall | track 26px, tab 20px (`segmented-tabs()`, Figma "I2 · Mode switcher" node `4342:744`) | two Figma names for one idea |
| — | dock resize grip (`.auto-hide-docked-resize-handle`, `auto_hide.styl`) fills its whole 4px with `border/action` on hover | differs from D-36; not in Figma |
