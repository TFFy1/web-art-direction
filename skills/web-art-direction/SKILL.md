---
name: web-art-direction
description: Art direction for websites and landing pages so they look made by an experienced human designer, not generated. Use whenever building, redesigning or reviewing a marketing site, landing page, storefront, marketplace home, product page or portfolio, or when the user says the design looks generic, templated, "AI", "slop", or wants it premium, distinctive or award-level. Works from a library of graded real-world references (design-refs MCP), a composition-move library, and a fresh-context design critic that loops fixes until the page passes and records lessons so mistakes are not repeated. For component behavior (toasts, drawers, menus, dialogs) it hands off to ui-libraries-no-ai-look.
---

# Web art direction

Components decide whether a page works. Composition and motion decide whether anyone remembers it. This skill handles both: concept, first screen, section choice and rhythm, scroll choreography, type, color, imagery and copy. Then a critic reviews the result until it ships.

The bar: a visitor should feel something they did not expect. A page that looks different but scrolls like every other page still feels generic. If nothing on the page makes someone stop, scroll back and watch again, it is not done.

## Tools

The **design-refs** MCP server exposes `refs_api` and `refs_run` (code mode). Call `refs_api` once per session to load the API. If those tools are missing, tell the user the design-refs server is not connected, and point them to the plugin README. If `DESIGN_REFS_DIR` is set, read `refs/index.json`, `lessons.json` and the images from that folder instead.

Load these files only when their step comes up:
- [references/moves.md](references/moves.md): composition moves with tier-A references
- [references/page.md](references/page.md): rhythm, type, color, imagery, copy, mobile
- [references/slop.md](references/slop.md): the generic look, with counter-examples
- [references/sections.md](references/sections.md): section types beyond the AI default, by job, with references
- [references/motion.md](references/motion.md): scroll choreography, the signature scene, techniques and stacks

## Process

### 1. Brief
Find out who the page is for, what they must believe, the one action, and which real assets exist (logo, photos, product, copy, prices). If any of these is missing and can't be inferred, ask once, with at most three questions. Never invent customers, logos, reviews, prices or stats. Use marked placeholders and list them at the end.

### 2. Memory
Run `lessons.list()` and read every lesson. They come from past critiques and are binding unless the brief overrides one. Name the lessons that apply to this page.

### 3. Research (take your time)
Research is where ideas come from; a longer study beats a faster build. Don't start building until you have found at least one idea you would not have had without it.
- **First screens:** three tier-A references from the page's category, two tier-A picked at random (`Math.random`) from other categories as challengers, and two tier-C from the category as what to avoid.
- **Whole pages:** scroll the `full` view of at least four tier-A references, two of them from other categories (`refs.image(id, { view: 'full', top, height: 6000, width: 400 })`, then page down). Note every section that isn't in the AI-default list in sections.md.
- **Motion:** read motion.md. Shoot one or two live sites whose scroll you want to learn from (`node scripts/shoot.mjs <url> <dir>`) and look at their `filmstrip.jpg`.
- Measure the most relevant reference live with `refs.measure(url)`. If the user names sites they like, `refs.capture()` them first and tag them.

Write one line per reference on what you take from it: a decision, not a layout. End with **"New to me:"**, the ideas this research gave you that you would not have reached alone, and use at least one.

### 4. Direction
Read moves.md. Write down:
- **The rut:** the page this category always ships, and the anti-slop version of it (e.g. cream background + serif + terracotta). Both are off-limits unless the brief pins them.
- **Thesis:** one sentence naming the one idea this page owns.
- **First screen:** one first-screen move and exactly what sits where, at what scale.
- **Sections:** read sections.md. List the jobs the page must do, then pick one section per job, in order, with the container and rhythm of each. At least half come from outside the AI-default list; no two neighbors share a container; at most one card grid.
- **Motion:** read motion.md. The signature scene (which section, how many vh pinned, what the scroll performs and why that is this product's verb), the behavior of every other section (no two neighbors alike), the texture, and the phone version.
- **Type, color, imagery:** one type move, one color strategy with hex values, and the imagery plan with real sources.

Put this contract in an HTML comment at the top of the page. If any line reads like a mood instead of a decision, it isn't decided yet.

### 5. Build
Read page.md and slop.md, then build the contract with full commitment: real fonts, real copy, and real images at full HD or better (see page.md, Imagery). Use the `ui-libraries-no-ai-look` skill for interactive components. Fix the hero first, then the signature scene, then everything else.

### 6. Shoot
```bash
node <this-skill-dir>/scripts/shoot.mjs <page.html-or-url> <out-dir>
```
This writes `desktop.jpg`, desktop slices, `mobile.jpg`, `mobile-full.jpg`, `filmstrip.jpg` (frames at even scroll steps from a fresh load, so scroll motion shows in stills) and `report.json`. The report has mechanical tells (eyebrows, gradient text, purple gradients, equal card rows, stock phrases, timid h1, low-resolution or over-compressed images, broken images, overflow) and a motion probe: counts of pinned, horizontal, scaled, rotated, clipped and scrubbed elements, with `no-scroll-motion`, `fade-up-only` and `no-signature-scene` tells. Fix every tell the brief doesn't justify before the critique. Look at the filmstrip yourself: if the signature scene doesn't read in it, it won't read for the visitor either.

### 7. Critique loop
Spawn the critic with a fresh context, never a fork of this conversation:
- if the `web-art-director` agent type is available (it ships with this plugin), use it;
- otherwise spawn a general-purpose agent whose prompt starts with the full text of `agents/web-art-director.md` from this plugin.

Send it these inputs:
- the brief and the user's answers,
- the contract,
- the page path,
- the shot folder, `filmstrip.jpg` and `report.json`,
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
Usability beats expression here. Use moves only for the shell's identity (type, color, one signature detail). Let `ui-libraries-no-ai-look` drive the components, and still run steps 2, 3 (references from product UIs), 6 and 7.

Shell conventions people expect:
- **Account at the bottom left.** The user's avatar, name and workspace sit at the foot of the sidebar and open the account menu (profile, billing, theme, sign out) upward. The top bar keeps search, the command menu and notifications.
- **Resizable splits.** Every multi-pane layout (sidebar | main | detail or assistant panel) has drag handles so people size panes themselves: visible grip on hover, keyboard resizing (arrow keys on the focused handle), min and max sizes, double-click to reset, collapse to an edge, and sizes saved between visits. Use `react-resizable-panels` in React; in plain HTML, build the same behaviors.
- Motion here is for feedback and continuity (numbers animating, panels sliding, list items settling), not scroll scenes.
