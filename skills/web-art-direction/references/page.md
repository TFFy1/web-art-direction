# Page craft

## Rhythm
- Vary section height, density and scale on purpose. A dense section earns a quiet one after it; a full-bleed image earns a typographic one.
- Change the container between sections: full-bleed, narrow text column, wide grid, offset. Never the same centered 1200px box all the way down.
- More space above a heading than below it. One spacing scale for the whole page.
- Six to nine sections is plenty for a marketing page. Cut any section that restates a claim already made.
- Pick section types from sections.md by the job each must do. The default stack (logos, three feature cards, 1-2-3 steps, three quote cards, three price cards, FAQ accordion, CTA band) is the generic look even when each part is well made.
- End on a real close: one statement and one action with space around it.

## Type
- Two families at most; often one. Pick the display face for character, the text face for reading.
- Hero display between 64px and 160px on desktop depending on the move; body 16–18px; a real step between levels (ratio 1.5 or more), not 32/28/24.
- Measure the reference you are borrowing from (`refs.measure(url)`) and match its ratios, not its fonts.
- Body measure 60–75 characters. Headings balanced (`text-wrap: balance`).
- Load real fonts (Google Fonts or self-hosted) with `font-display: swap`; system fonts only for UI text.

## Color
- Choose a strategy before choosing colors: restrained (neutrals + one break color), drenched (one color owns regions), or from photography. Every strategy still has one break color (below).
- Text on color uses a tint of that color or the foreground, never mid grey.
- Body text contrast at least 4.5:1, large text 3:1.
- Dark or light comes from the use scene (who, where, what light), not from the category.

### Break color
A calm system with one shock of saturated color feels designed; an all-neutral page feels dull, and a multi-colored one feels like a template. Grey, white and black are a document. Add one signal yellow and they become sport. This applies to websites and dashboards alike.
- **Base:** neutrals (two or three greys plus an ink), or one muted family. **Break:** a single saturated hue far from the base in hue and temperature, at full chroma. The quieter the base, the louder the break.
- **Pick it from the concept's world, not the category:** safety orange from tools and hardware (`teenage-engineering`, `teenage-engineering-apps-ep-sample-tool`), fluorescent lime from racing (`landonorris-com`), stamp or ink blue from paperwork, highlighter yellow from reading, traffic red from Swiss posters, Klein blue from art. Never the category cliché: fintech purple, AI violet or cyan, wellness sage.
- **Ration it:** 2–8% of the painted page (the palette probe in `report.json` measures it). It appears in three to five kinds of places, all with one meaning: the primary action, the selection or focus, the one number that matters, the anchor of the signature scene. One drenched moment is allowed (a band, the scene's payoff), and then the color stays rare everywhere else.
- **One break only.** No second saturated hue. In dashboards, semantic colors (error, warning, success) are darker or desaturated, or carried by an icon, so they never compete with the break, and chart series are greys with the break on the highlighted series.
- **Ink on the break:** define `--break` and `--on-break`. Yellow, lime and orange take black ink; blue and red take white. `--on-break` stays the same in both themes: anything drawn on or over the break (buttons, badges, stamps, a highlighter under a figure) uses it, never the theme's ink, which flips to near-white in dark mode. Check the contrast in both themes.
- **Pairings that work:** graphite + safety orange (tool), black, white and grey + signal yellow (sport, timing), off-white paper + stamp blue (documents), concrete + fluorescent pink (fashion), navy + highlighter yellow (editorial), bone + traffic red (Swiss), bone + acid lime (`granola-ai`).
- `shoot.mjs` reports `no-break-color` (almost nothing saturated), `competing-accents` (three or more saturated hues) and `accent-flood` (most of the page saturated).

## Imagery
- Real photographs of real scenes or one authored object. Verify every image URL loads.
- **Full HD or better, always.** Every photograph is at least 1920px on its long edge at the source; full-bleed images 2400px or more. Small images (avatars, thumbnails under 120px) at least 3x their displayed width. JPEG/WebP quality 80 or higher. For Unsplash: `?w=2400&q=85&auto=format&fit=crop`, but the `w` parameter never upscales: a photo whose original is 1440px wide comes back at 1440px. Check the delivered size (`naturalWidth`) and pick another photo if the original is too small. Never ship a soft, blocky or upscaled-looking image; if no sharp source exists, choose another image or author the visual. `shoot.mjs` flags `low-res-image` and `low-image-quality`.
- When there is no real material, author it: SVG illustration in one consistent stroke, a typeset specimen, a real document rendered in HTML. Label demonstration data as sample data.
- One decisive image beats five average ones.

## Copy
- The product's own language: specific nouns, numbers, verbs. Write the headline so a competitor could not use it.
- Buttons name the action ("Start a free ledger"), not "Get started" everywhere.
- No invented customers, logos, reviews, prices or stats. Use clearly marked placeholders and list them for the user.

## Motion
See motion.md. In short: one signature scroll scene that performs the product's verb, a different behavior for every section, small continuous texture, a separate phone choreography, and a reduced-motion version. Never the same fade-up on every block, and never a static page. Content is visible without JS.

## Mobile
- Re-compose, don't shrink: the first screen on 390px must still carry the one idea.
- Tap targets 44px; no horizontal scroll; type scale steps down but stays committed.

## Components
Interactive parts (dialogs, drawers, menus, tabs, toasts, command palettes, animated numbers) come from libraries via the `ui-libraries-no-ai-look` skill, restyled to the page's type, color and radius. In a single static HTML file, build them with care and real states, and keep them few.
