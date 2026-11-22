---
name: ui-libraries-no-ai-look
description: Use when building or improving any React/web UI where AI-built components tend to look generic ("AI slop"). Tells you to stop hand-building toasts, drawers, command menus, animated numbers and base components, and to use the right component library instead (foundations, specialists, design components), then restyle defaults so the product has its own look. Triggers on requests for toasts, drawers, command palettes, dialogs, dropdowns, tabs, loading states, landing page effects, AI-product interfaces, or "make this not look AI generated".
metadata:
  source: "Griffin Wooldridge, 'UI Libraries for Claude Code (Ban the AI Look)', https://www.youtube.com/watch?v=zsCGS-Yzjnw"
---

# UI libraries instead of from-scratch components

Core idea: AI builds every component from scratch with default styling. It does not know how a toast should stack or how a drawer should feel when dragged. A component library is the fastest way to borrow someone else's taste and behavior. Use a library first, build by hand only when none fits.

## Three kinds of library, each with one job

### 1. Foundations: behavior, you add the style
Shadcn, Base UI, Radix. They supply keyboard navigation, focus handling and accessibility, which are easy to get wrong by hand. Use them for most of the app: buttons, inputs, dialogs, dropdowns, tabs and the rest.

**Default Shadcn is itself an AI look**: same radius, same gray, same fonts. Treat it as a starting point and change three things so it looks like the product:
- the **radius** (a tighter radius reads as more deliberate),
- the **colors** (brand palette, not the default gray),
- the **type** (a serif heading on the same components can turn a SaaS template into an editorial product).

Shadcn copies code into the project instead of hiding it in a package, so Claude can edit all of it. Give Claude the brand colors and fonts up front.

### 2. Specialists: one component done really well
| Need | Use | What it gets right |
| --- | --- | --- |
| Toasts | Sonner | stacking, expand on hover, enter/exit animation |
| Drawers (drag up on mobile, flick down to close) | Vaul | real drag behavior |
| Command menu (the Cmd+K search box) | cmdk ("Command K") | keyboard use that does not break |
| Numbers that change (prices, balances) | Number Flow | animates the change instead of jumping |
| Resizable split panes (sidebar, detail, assistant panel) | react-resizable-panels | drag handles, keyboard resizing, min/max, collapse, saved layout |

Hand-built versions fail in predictable ways: toasts pile up or vanish before they can be read, drawers only open and close without dragging, command menus break with the keyboard. These small details are what make a product feel finished, and they are exactly what AI skips. If you catch yourself writing a custom toast system, drawer or command menu, stop and use the specialist.

Sonner and Vaul are by Emil Kowalski, who also publishes a skill for picking a UI library (the video calls it "Pick UI Library"). It maps a component need to one library from a short list with a one-sentence reason. Install it if available so the choice is automatic.

### 3. Design components: finished, styled, copied into the project
- **AI-product interfaces** (streaming text, approval cards for agent permission, diff views, agent screens): the library the video calls "Beautiful UI" by Turbo is built for these. Most libraries predate AI products and do not cover these states.
- **Flashy moments** (animated buttons, text effects, interactive backgrounds): "Rare UI".
- **Animated components on top of Shadcn** (150+ free): Magic UI.
- **Landing page effects** (3D cards, background beams, marquees): Aceternity. Installs via the Shadcn CLI, or have the coding agent add it.
- **Marketplace of many authors, for a specific need without committing to one library**: 21st.dev.

Rule for this group: **one big standout effect component per page.** One animated hero or one interactive background makes a page feel designed. Ten on one page gives the next AI look where everything glows and moves and nothing stands out. This limits stock effect components only; the page's own scroll choreography (a signature scene plus a different behavior per section) is a separate job, covered by the web-art-direction skill's motion.md.

## How to apply

1. Before writing any UI component, decide which of the three kinds it falls under.
2. Name the library in the working prompt or plan, for example "Shadcn for base components, Sonner for toasts".
3. Install through the library's CLI or registry so the source lives in the project, where it can be read and edited. Do not paste approximations from memory.
4. Restyle foundation defaults (radius, colors, type) to the product's brand before calling the UI done.
5. Cap flashy design components at one per page.

## Project constraints still win

Check the project's own rules before adding a dependency. A new UI library is a dependency choice: if the project requires approval for new packages, or has a fixed design system, propose the library and wait. Accessibility, right-to-left layout and bilingual support of a candidate library should be verified, not assumed.

## Provenance note

Written from the auto-generated captions of the video, not from the library docs. Library names ("Beautiful UI", "Rare UI", "Pick UI Library") may be caption misspellings of the real product names, and claims such as "150+ components" are the presenter's, not verified. Confirm the exact package name and current docs before installing.
