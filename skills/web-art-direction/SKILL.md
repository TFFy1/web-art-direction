---
name: web-art-direction
description: Art direction for websites and landing pages so they look made by an experienced human designer, not generated. Use whenever building, redesigning or reviewing a marketing site, landing page, storefront, marketplace home, product page or portfolio, or when the user says the design looks generic, templated, "AI", "slop", or wants it premium, distinctive or award-level. Works from a library of graded real-world references (design-refs MCP), a composition-move library, and a fresh-context design critic that loops fixes until the page passes and records lessons so mistakes are not repeated. For component behavior (toasts, drawers, menus, dialogs) it hands off to ui-libraries-no-ai-look.
---

# Web art direction

Components decide whether a page works. Composition decides whether anyone remembers it. This skill handles the composition: concept, first screen, section rhythm, type, color, imagery and copy. Then a critic reviews the result until it ships.

## Tools

The **design-refs** MCP server exposes `refs_api` and `refs_run` (code mode). Call `refs_api` once per session to load the API. If those tools are missing, tell the user the design-refs server is not connected, and point them to the plugin README. If `DESIGN_REFS_DIR` is set, read `refs/index.json`, `lessons.json` and the images from that folder instead.

Load these files only when their step comes up:
- [references/moves.md](references/moves.md): composition moves with tier-A references
- [references/page.md](references/page.md): rhythm, type, color, imagery, copy, mobile
- [references/slop.md](references/slop.md): the generic look, with counter-examples

## Process

### 1. Brief
Find out who the page is for, what they must believe, the one action, and which real assets exist (logo, photos, product, copy, prices). If any of these is missing and can't be inferred, ask once, with at most three questions. Never invent customers, logos, reviews, prices or stats. Use marked placeholders and list them at the end.

### 2. Memory
Run `lessons.list()` and read every lesson. They come from past critiques and are binding unless the brief overrides one. Name the lessons that apply to this page.

### 3. References
In one `refs_run` call:
- three tier-A references from the page's category,
- two tier-A references picked at random (`Math.random`) from other categories. These are challengers against the category default,
- two tier-C references from the category, as what to avoid.

Look at their first screens. Measure the most relevant one live with `refs.measure(url)`. For each, write one line on what you take from it: a decision, not a layout. If the user names sites they like, `refs.capture()` them first and tag them.

### 4. Direction
Read moves.md. Write down:
- **The rut:** the page this category always ships, and the anti-slop version of it (e.g. cream background + serif + terracotta). Both are off-limits unless the brief pins them.
- **Thesis:** one sentence naming the one idea this page owns.
- **First screen:** one first-screen move and exactly what sits where, at what scale.
- **Sections:** four to six section moves in order, with the rhythm (dense or quiet, container, scale) of each.
- **Type, color, imagery:** one type move, one color strategy with hex values, and the imagery plan with real sources.

Put this contract in an HTML comment at the top of the page. If any line reads like a mood instead of a decision, it isn't decided yet.

### 5. Build
Read page.md and slop.md, then build the contract with full commitment: real fonts, real images (check that each URL loads), real copy. Use the `ui-libraries-no-ai-look` skill for interactive components. Fix the hero first, then everything below it.

### 6. Shoot
```bash
node <this-skill-dir>/scripts/shoot.mjs <page.html-or-url> <out-dir>
```
This writes `desktop.jpg`, desktop slices, `mobile.jpg`, `mobile-full.jpg` and `report.json` with mechanical tells (eyebrows, gradient text, purple gradients, equal card rows, stock phrases, timid h1, broken images, overflow). Fix every tell the brief doesn't justify before the critique.

### 7. Critique loop
Spawn the critic with a fresh context, never a fork of this conversation:
- if the `web-art-director` agent type is available (it ships with this plugin), use it;
- otherwise spawn a general-purpose agent whose prompt starts with the full text of `agents/web-art-director.md` from this plugin.

Send it these inputs:
- the brief and the user's answers,
- the contract,
- the page path,
- the shot folder and `report.json`,
- the reference ids from step 3.

It returns `rebuild`, `fix` or `ship`, with ordered fixes, and records lessons itself through `lessons.add`.

- `rebuild`: go back to step 4 for the named regions.
- `fix`: apply every fix in one batch, re-shoot, and send the new shots to the **same** critic (continue it, don't spawn a new one) for a verdict.
- Repeat until `ship`, at most three rounds. If round three still isn't `ship`, show the user the open items and let them decide.

Report the critic's verdict word exactly as it wrote it, never a softer one.

### 8. Close
Tell the user:
- the thesis,
- the final verdict,
- the lessons that were added or reinforced,
- which placeholders need real content.

## Dashboards and app UI
Usability beats expression here. Use moves only for the shell's identity (type, color, one signature detail). Let `ui-libraries-no-ai-look` drive the components, and still run steps 2, 6 and 7.
