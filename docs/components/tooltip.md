# Tooltip

> Status: Current · Last checked: 2026-11-21 against codetracer branch `ui-design-improvements-part10`.
> A small chip that says what a control does, or shows text that is cut off.
> It appears after a short rest of the pointer or when the keyboard reaches
> the control. There is one tooltip for the whole app.

## Use it for / don't use it for

- **Use for:**
  - every icon-only control (D-31: every icon-only control has a tooltip);
  - a control whose label is short and needs a word more, such as a key chord;
  - text cut off with an ellipsis: the full value shows with no extra work.
- **Don't use for:**
  - text that is already on screen in full. A `title` that repeats the visible
    text shows nothing (`tooltips.nim`), so don't write one;
  - anything the user must read or click. The tooltip has `pointer-events: none`
    and hides on any click or key → use a dropdown (`dropdown-surface()`) or a
    notification instead;
  - hovers in the code editor. The editor shows its own (`.monaco-editor`,
    `[data-ct-cell]`), except a tracepoint's box (`.trace`), which uses this one.

## Where it lives

| | |
|---|---|
| Figma | `Tooltip`, node `4203:11656` on the ❖ Tooltip page (file `Ytr6Ux4bYZYRUBpgNsSVml`). Variants: Mode Dark / Light, Size sm / lg, Direction Left |
| Stylesheet | `src/frontend/styles/components/tooltip.styl` (`.ct-tooltip`), imported in `src/frontend/styles/codetracer.styl` |
| Mixins | `tooltip-look()` in `src/frontend/styles/components/button.styl`: fill, text colour, border, padding, corners, shadow and type of the sm tooltip, both themes. Shared by `.ct-tooltip` and `.custom-tooltip` |
| Constants | `TOOLTIP_BORDER_WIDTH` (`button.styl`) · `TOOLTIP_DELAY_TIMER = 0.20s` (`src/frontend/styles/defaults.styl`, used by the old `.custom-tooltip` hover rules) |
| Behaviour | `src/frontend/viewmodel/views/tooltips.nim`, imported once in `src/frontend/ui_js.nim` (`import viewmodel/views/tooltips`). It listens on the document, so it covers every view, including ones built later |
| Markup | **none of your own.** Put a plain `title` on the control. The module builds one shared `<div id="ct-tooltip" class="ct-tooltip" role="tooltip">` on `document.body` |

## How to add a tooltip

Give the control a `title`. That is all.

```nim
button(class = "ct-button-image-md-secondary", `type` = "button",
       title = "Agent settings")                       # IsoNim view (isonim_agent_activity_view.nim)
runButton.setAttribute(cstring"title", cstring"Run tracepoints (Ctrl+Enter)")  # DOM code (ui/trace.nim)
```

What `tooltips.nim` then does for you:

- takes the `title` off the control (and off its ancestors) while it is the
  tooltip's source, so the operating system's tooltip never shows, and puts it
  back when the pointer or focus leaves;
- gives an icon-only control the `title` as its `aria-label` while shown, and sets
  `aria-describedby="ct-tooltip"` on it;
- shows the full text of an element cut off with `text-overflow: ellipsis`
  (checked up to 3 levels above the pointer), with no `title` needed;
- the jstree folder arrow (`.jstree-ocl`) has a built-in text, "Show or hide the
  folder".

## Writing the text

- Say **what the control does**, starting with the verb: "Pin to the sidebar",
  not "Pin"; "Run tracepoints", not "Run".
- A control that opens something may name what it opens: "Agent settings".
- Add the key chord in brackets when there is one: "Run tracepoints (Ctrl+Enter)".
- Don't repeat the label on screen. That tooltip is dropped (see above).
- Keep it to one line where you can. Longer text wraps into the `lg` size.
- Never shorten a value with "…". The tooltip is where the full value shows;
  it wraps into `lg` when it is long (the value-origin badge: "Show where this
  value came from: <full expression>").

## Variants and sizes

The size is chosen by the code, not by you: `tooltips.nim` adds `.ct-tooltip--lg`
when the text runs taller than two lines.

| Size | Class | Width | Corners | Padding (top/bottom, sides) | When |
|---|---|---|---|---|---|
| `sm` | `.ct-tooltip` | fits the text, at most `min(20rem, 100vw - 1rem)` | 2px (`0.125rem`) | Dark 6px, 12px · Light 4px, 8px | one line |
| `lg` | `.ct-tooltip.ct-tooltip--lg` | 320px (`20rem`) | 6px (`0.375rem`) | 6px, 8px in both themes | the text wraps |

Type: Space Grotesk, 12px on a 16px line (`0.75rem` / `1rem`). Weight 300 in Dark,
400 in Light (`tooltip-look()`). Long words break anywhere (`overflow-wrap: anywhere`).

Placement (`tooltips.nim`): centred under the control, 8px below it. It flips
above when there is no room below, and stays 8px from the window edges. No
arrow (D-31). It sits on `z-index: 10000`.

## States

The tooltip has no hover or press of its own. It is either hidden or shown.

| State | How it looks | Tokens | How it is triggered in code |
|---|---|---|---|
| Hidden | not drawn (`display: none`) | | default; `ct-tooltip--shown` removed |
| Shown, Dark | dark raised chip, light text, 1px border inside its edge, soft shadow | `colors/ui/surface/base/raised` · `colors/ui/text/primary/body` · `colors/ui/border/tertiary` | `.ct-tooltip--shown`, added 0.2s after the pointer rests, or at once on key-focus |
| Shown, Light | inverse dark chip, light text, no border | `colors/ui/surface/on-color/secondary` · `colors/ui/text/on-color/body` | as Dark |

Both themes use the same shadow: `0 0.5rem 1rem -0.125rem rgba(27, 33, 44, 0.12)`,
written in `tooltip-look()` (the same values as Figma's effect). The border is a
`box-shadow` inset, so it adds nothing to the size, as Figma's inside stroke.

**When it shows nothing** (`tooltips.nim`):

- the control is open: its menu is on screen (`aria-expanded="true"`, or a
  dropdown from `DROPDOWNS` in `views/keyboard_focus.nim`) (D-35);
- the control was just pressed, until the pointer leaves it (D-35);
- the `title` repeats the visible text and the text is not cut off;
- the control is inside the code editor (see above).

**What hides it:** the pointer leaving, any click, any key except Tab, scrolling
the area the control is in, and the window losing focus.

## Keyboard and tooltip

- When Tab reaches a control (`:focus-visible`, and the app is not in mouse focus
  mode: `data-focus-mode="mouse"` on `<html>`, set in `ui_js.nim`), its tooltip
  shows at once, with no wait.
- It hides when focus leaves or any other key is pressed, so Esc hides it (D-31).
- On key-focus, a `.custom-tooltip` child's text is read too (the debug toolbar).
- Screen readers: the tooltip is `role="tooltip"` and linked to the control by
  `aria-describedby`.

## Exception: `.custom-tooltip`

Some controls still hold their tooltip as a child `<div class="custom-tooltip">`
inside the button. It is painted with the same `tooltip-look()`, but shown by
CSS on `:hover` (`button.styl`, after `TOOLTIP_DELAY_TIMER`), not by
`tooltips.nim`. `tooltips.nim` leaves the pointer alone on these and only reads
their text on key-focus.

- **Allowed:** the debug toolbar (`views/isonim_debug_controls_view.nim`). Its
  tests read the `.custom-tooltip` text (D-31).
- **Still in the code, not named by D-31:** the status bar's "Path copied to
  clipboard" note (`views/isonim_status_view.nim`, shown with `.active` after
  a click: a confirmation, not a hover tooltip), leftover style rules in
  `event_log.styl` and `history.styl` that nothing builds any more, and the
  info icon in `subwindow.nim` (a separate window without `tooltips.nim`).
- **Moved to a `title` on 2026-11-21:** the value-history button
  (`views/isonim_state_view.nim`, `ui/value.nim`) and the VCS "View diff"
  button (`views/isonim_vcs_view.nim`). The history button's child tooltip sat
  inside the Variables panel, which clipped it, and it covered the origin badge
  beside it. The subwindow's `.custom-tooltip` in
  `src/frontend/styles/subwindow.styl` has its own hex colours, not
  `tooltip-look()`.

New work: use a `title`. Don't add a `.custom-tooltip`.

## Protected decisions

From `codetracer/docs/UI-Design-Decisions.md`. Don't undo these as part of other
work; ask Nikolay.

- **D-31** One tooltip, from the design system: a `title`, shown by
  `views/tooltips.nim` after 0.2s or on key-focus; sm/lg sizes; no arrow; every
  icon-only control has one; the debug toolbar keeps `.custom-tooltip`.
- **D-35** An open or just-pressed control shows no tooltip, for every present
  and future dropdown in `DROPDOWNS`.
- **D-44** In the light theme the tooltip is an inverse dark chip.
- **House rule** (same file): give every new icon-only control a `title`
  saying what it does. Dark theme: no font weight above 300.

## Don't

- Don't build your own tooltip element, popup or `:hover` rule. Write a `title`.
- Don't add a `.custom-tooltip` child to a new control.
- Don't write a `title` that only repeats the button's label. Nothing shows.
- Don't write a one-word tooltip ("Pin"). Say what happens.
- Don't put the tooltip's colours or padding in a component file. Change
  `tooltip-look()` and both tooltips follow.
- Don't use `text/primary/body` for the light tooltip's text. It is dark ink on a
  dark chip there. Use `text/on-color/body`, as the code does.
- Don't use px in a stylesheet. `ci/test/ui-design-decisions.py` fails on it.
- Don't add a second `installTooltips` or remove the `globalThis.__ctTooltips`
  guard. The listeners must be installed once.
- Don't add a new dropdown without listing it in `DROPDOWNS`
  (`views/keyboard_focus.nim`), or its trigger will show a tooltip over its own menu.

## Figma ↔ code differences

Open until Nikolay settles them; until settled, **the code wins**.

| Figma | Code | Note |
|---|---|---|
| Property `Direction` (only `Left`); the description speaks of an arrow | no arrow; below the control, or above when there is no room | D-31 says no arrow. Figma's description should drop it |
| Text weight Regular (400) in both modes | Dark 300, Light 400 | house rule: no weight above 300 in the dark theme |
| `lg` Content frame has a fixed height (60px) | `lg` grows with the text | |
| Size is picked by the designer | `lg` is added by the code when the text wraps | same two looks |
| `sm` width hugs the text with no limit | at most `min(20rem, 100vw - 1rem)`, then wraps to `lg` | |
| Light text `text/on-color/body` | same in code | D-31's text still says `colors/ui/text/primary/body` for light; the decisions file is out of date, not Figma |
