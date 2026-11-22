# Sources by design decision

Outside resources, sorted by the decision they help with and graded like the library: **use**, **use with care**, or **avoid as taste** (fine as a tool, but its default output is the generic look). Checked in November 2026. The graded library (`refs.search`) comes first; these are for research beyond it.

| Decision | Use | Use with care | Avoid as taste |
| --- | --- | --- | --- |
| **Type** | **Fonts In Use** (fontsinuse.com): how real brands set type, searchable by typeface, industry and format; the best way to choose a pairing. Foundry sites for studying type-led pages: Dinamo, Grilli Type, Klim, Displaay, Commercial Type (library `facet: 'type'`). | **Fontshare** (fontshare.com): good free fonts, but Satoshi, General Sans, Clash Display and Cabinet Grotesk are now on so many AI-built sites that they read as default. Pick its less common faces. **Google Fonts**: fine for text faces. | **Fontesk** (fontesk.com): free display fonts of uneven quality; check the full character set and the license before use. |
| **Color** | The break-color method in page.md, and colors sampled from the concept's own world (photos, materials, objects). | **Coolors** (coolors.co): fast for exploring, never for choosing; random palettes have no meaning. **Pinterest**: moodboards to find a world, not palettes to copy. | |
| **Sections** | **Unsection** (unsection.com): real sites' sections filed by type (hero, pricing, footer, FAQ, team, contact). **details.so** (details.so/inspo): real sites filed by detail, including 404, legal, case study, preloader and page transitions. | **Supahero** (supahero.io): heroes only, mixed quality. | |
| **Motion** | **details.so** categories scroll-animations, pinned-scroll, horizontal-scroll, page-transition, section-transition, morphing. **animations.dev/vocabulary** (Emil Kowalski) and the **aidesign.guide animation dictionary**: shared names for motion, so a brief can say "origin-aware pop" instead of "make it smoother". **Kinetics** (kinetics.colorion.co): 162 spring-based CSS and React interface animations. | **Kawaii text animations** (kawai-text-animation.pages.dev): 100 text effects; a few are good (mask reveal, blur in), many are clip art (typewriter, neon glow, bouncy letters). | |
| **3D, effects, scroll** | **Awwwards** categories WebGL, 3D, Scrolling and Animation (judge usability yourself); details.so "built with three.js" and "3d". Library `facet: ['3d', 'effects', 'scroll']`. | | **Prompt shops** (MotionSites, GetLayers, Scrolltide's "cinematic AI sites"): one recognisable dark, glowing, cinematic look. |
| **Backgrounds** | Texture and real imagery (effects.md). | **Super Visuals** (a Figma community file, CC BY 4.0): recolor before use. | **backgrounds.supply**, **Gradient Lab**: gradient blobs and AI art backgrounds, the exact look slop.md lists. Only recolored, with grain, and tied to the concept. |
| **Components** | The `ui-libraries-no-ai-look` skill (Radix, cmdk, Sonner, Vaul, Number Flow, react-resizable-panels). | **21st.dev**: huge, mixed; take behavior, restyle everything. **Originkit**, **Spell UI**: effect components (3D glass, light rays, glimmer); one at most, recolored, if it fits the concept. | |
| **General inspiration** | **curated.design**: handpicked sites by industry, with sections and styles. **Awwwards** winners: for motion and craft, less for usability. | **Pinterest**: good for worlds and materials, poor for UI. | Dribbble popular shots: mostly the generic look (library tier C). |
| **Sound** | **UI SFX** (uisfx.com): an open-source UI sound library, 900+ sounds in 12 personalities (minimal, glass, mechanical, organic and more), installable from npm. **Bencho** (bencho.dev): interface sounds synthesized with the Web Audio API (no files), plus tunable React blocks. Rules in micro-interactions.md. | | |

## Using a source well

1. Search the graded library first: it is filtered for quality and tagged by facet.
2. Go to a source with a specific question ("how do editorial sites set legal pages?"), not to browse.
3. Open the real site behind any inspiration card; judge it live on desktop and phone.
4. Take decisions, not layouts. Write one line per reference on what you take from it.
5. When a real site is excellent, capture it into the library (`refs.capture`), then grade it and tag its facets with `refs.tag(id, { tier, facets, note })`, so the next project starts from it.
