# Micro-interactions and fidgets

A dashboard is used for hours, so it is judged by touch more than by looks. No single detail is noticed; together they decide whether the product feels made with care or assembled. Each one answers an action within a frame or two, says what changed, and is a little satisfying to repeat. This is the dashboard's equivalent of a website's scroll scene.

Sources: Rauno Freiberg, "Invisible Details of Interaction Design" (rauno.me/craft); Emil Kowalski's Sonner and Vaul; Paco Coursey's cmdk; Apple's system UI. In the library: `sonner-emilkowal-ski`, `vaul-emilkowal-ski`, `rauno-me-craft`, `ray-so`, `teenage-engineering-apps-ep-sample-tool`.

## Principles

1. **Frequency sets the amount of motion.** What people do hundreds of times a day gets none or almost none: the command menu, keyboard navigation, context menus and tab switching open instantly. Rare moments can celebrate: the first import, the inbox reaching zero, the month closing. A fade on a frequent action feels sluggish within a couple of days.
2. **Answer on press, commit on release.** Visual feedback starts on pointer-down (`:active`). Destructive or irreversible actions commit only on release, so a person can change their mind mid-gesture. Light, reversible things (a peek, a preview) may trigger during the gesture.
3. **Interruptible.** State changes use transitions or springs that retarget from wherever they are, never keyframes that must finish. A double click or a reversed drag must never wait for an animation.
4. **Spatial consistency.** Things come from where they live and go back there: a popover grows from its trigger (`transform-origin` at the trigger, Radix exposes `--radix-popover-content-transform-origin`), the account menu opens upward from the bottom-left avatar, a closed panel collapses to the edge it is attached to.
5. **Springs for things with mass.** A small overshoot on controls, none on large surfaces or text. In Motion: `{ type: 'spring', stiffness: 500, damping: 32 }` for controls, `{ stiffness: 260, damping: 30 }` for panels.
6. **Timings when not a spring:** press and hover 80–150ms; small state changes 150–220ms; panels and drawers 240–320ms. Enter with ease-out (`cubic-bezier(.2,.8,.2,1)`), never ease-in. Never scale from 0; start at 0.95 with opacity 0.
7. **Motion says what changed.** Every animation names a change (this row is new, this number went up, this pane is now wider). Nothing loops on its own over data.
8. **`prefers-reduced-motion`:** keep the state change and colour feedback, drop movement and scale.

## The catalogue

Pick the ones the product's actions call for. A finished dashboard has at least **eight** across its components, each tied to a real action.

| Where | Detail |
| --- | --- |
| Buttons | Press: `scale(.97)` on `:active`, 100ms. Icon nudges 2px in its direction on hover (arrow right, download down). Loading keeps the button's width; the label stays and a spinner replaces the icon. Success morphs the icon into a check for about 1.2s, then returns. |
| Hold to confirm | Destructive actions (delete workspace, void invoice) fill a progress bar inside the button while held (about 1s). Releasing early drains it back. No modal. |
| Copy | The copy icon cross-fades into a check (scale .8 → 1 with a 2px blur clearing), and reverts after 1.5s. |
| Toggle | The knob springs across and stretches a little wider while pressed (iOS). The track colour tweens. |
| Checkbox | The check stroke draws (`stroke-dashoffset`, 150ms). Shift-click selects a range. |
| Tabs and segmented controls | One indicator slides between options (Motion `layoutId`, or a positioned element moved with a transform). The label weight doesn't change, so nothing shifts. |
| Lists and menus | One hover background follows the pointer from row to row instead of each row lighting up alone. Row actions appear on hover at the row's right edge. |
| New and changed data | A new row slides in and its background flashes the break colour at 15% for about 1s, then fades. A removed row collapses its height. A changed cell flashes the same way. |
| Numbers | Digits roll to the new value (`@number-flow/react`, or `NumberFlow` in plain HTML) with `font-variant-numeric: tabular-nums` so the width stays. Up and down can roll in opposite directions. |
| Badges and counts | A count bumps (`scale 1 → 1.15 → 1`, spring) when it grows. |
| Drag and reorder | The lifted item scales to 1.02 with a deeper shadow and a slight tilt (1°); others make room with a spring; the drop settles. Past a limit, the item rubber-bands instead of stopping dead. |
| Resizable splits | The handle's grip thickens and takes the break colour on hover and while dragging. Panes snap to a collapsed edge past a threshold. Double-click springs back to the default size. |
| Sidebar | When collapsing, labels fade before the width animates; collapsed icons get tooltips. The active item's marker slides to the new item. |
| Tooltips | The first one waits about 500ms; neighbours then open instantly while the pointer moves along a toolbar (Radix `skipDelayDuration`). |
| Inputs | The focus ring grows from 0 to 3px. Errors appear after blur, not on each keystroke. A rejected submit shakes the field (three 4px swings, 300ms). |
| Loading | Skeletons match the final layout exactly, then cross-fade, so nothing jumps. Optimistic updates show the result before the server confirms and roll back visibly if it fails. |
| Charts | The line draws once on first load, never on every refresh. The hover crosshair snaps to data points with a value pill. Clicking a legend entry fades the other series rather than removing them. |
| Toasts and drawers | Sonner (stacked, swipe to dismiss, hover expands the stack) and Vaul (velocity-based dismiss, the background scales back). |
| Keyboard | Holding ⌘ reveals shortcut hints on buttons. The command menu opens with no animation. |
| Empty and done states | One owned idle detail (a cursor blinking in an empty note, a slowly drifting mark) and a single small celebration on completion: the stamp, the tick, the closed ring. Never confetti. |
| Scroll edges | Panes that overflow show a soft edge shadow only when there is more content in that direction. |

**Fidgets** are the controls people play with even when they don't need to: the toggle that squashes, the dial or slider with detents (it snaps and shows a tick), the hold-to-confirm button, the drag handle that resists at its limits. Give the product one or two that come from its own world (Ledgerly: a receipt that tears off when an invoice is approved; a music tool: a knob with real detents).

## Building it

- **React:** Motion (`motion/react`) for springs, `layout` and `layoutId`; `@number-flow/react`; Sonner; Vaul; cmdk; Radix primitives (origins, skip delays, safe triangles on submenus); `react-resizable-panels`; `@formkit/auto-animate` for list add and remove.
- **Plain HTML:** CSS transitions for state, with `@starting-style` for entry (Chrome 117+, Safari 17.5+); `interpolate-size: allow-keywords` to animate to `height: auto` (Chrome 129+, falls back to an instant change); the View Transitions API (`document.startViewTransition`) for reorders and pane swaps; `NumberFlow` as a web component.

```css
button { transition: transform .1s ease-out, background-color .15s; }
button:active { transform: scale(.97); }
.toast { transition: opacity .2s, transform .24s cubic-bezier(.2,.8,.2,1); @starting-style { opacity: 0; transform: translateY(8px) scale(.96); } }
.row.is-new { animation: flash 1s ease-out; }
@keyframes flash { from { background: color-mix(in oklab, var(--break) 15%, transparent); } }
@media (prefers-reduced-motion: reduce) { * { transition-duration: .01ms !important; animation-duration: .01ms !important; } }
```

## Sound

Sound is the strongest feedback and the easiest to overdo. Use it when the product is about feel (creative tools, music, games, a celebratory moment in a finance app), never as decoration.
- **Off by default** on the web, with a visible switch in settings; respect the system's reduced-motion and mute settings.
- **One personality** for the whole product (soft, glassy, mechanical, organic), matching the visual system, the way a break color does.
- **Few sounds with one meaning each:** confirm, toggle, error, complete. Nothing on hover or on every keystroke.
- **Quiet and short:** under 150ms for clicks, mixed well below other audio; the error sound is lower, not louder.
- **Sources:** UI SFX (uisfx.com, open source, npm) or Bencho (bencho.dev, synthesized with the Web Audio API, no files). See sources.md.

## Checking it

Screenshots can't show any of this. Test it in the page: press, hover, drag, resize and type through every control, at least once with the keyboard, and once with `prefers-reduced-motion`. `report.json` flags `static-controls` (most interactive elements have no transition) and `no-press-feedback` (no `:active` style changes the transform or colour).
