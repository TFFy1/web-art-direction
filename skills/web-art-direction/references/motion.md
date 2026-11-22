# Scroll motion

A page that looks different but scrolls like every other page still feels generic. Motion is where a site gets its soul: the visitor's thumb drives the story, and the page answers. The goal is a moment the visitor did not expect, one they scroll back up to watch again.

## What the probe found on real sites

`scripts/motion.mjs` scrolls a page with wheel events and counts what moves. Measured in November 2026, desktop 1440×900:

| Site | Pinned | Horizontal | Scale | Rotate | Clip | Scrubbed | Read |
| --- | --- | --- | --- | --- | --- | --- | --- |
| landonorris.com | 4 | 10 | 9 | 6 | 51 | 6 | A world: signature draws itself, manifesto words light up, photo cloud drifts at depths, panels bend on a curve |
| apple.com/airpods-pro | 2 | 1 | 6 | 0 | 0 | 1 | Product pinned while copy scrubs from grey to black; a sound ring expands around the headline |
| stripe.com | 0 | 1 | 2 | 0 | 6 | 11 | Many small scrubbed details; CSS scroll timelines; WebGL canvases |
| tines.com | 0 | 3 | 2 | 2 | 0 | 2 | Product UI tilts out of the hero; mascot slides through a giant closing wordmark |
| linear.app | 0 | 0 | 1 | 0 | 0 | 0 | Blur-to-sharp entrances only: refined, but no scene |
| AI-default page | 0 | 0 | 1 | 0 | 0 | 0 | Static, or the same fade-up on every block |

Read the gap: memorable sites combine **several kinds** of motion (pin + clip + scale + horizontal), and some of it is **scrubbed** (tied to the scroll position, so it plays backwards too). Linear-grade restraint suits a tool whose UI is the hero; a marketing page for a new brand needs a scene.

To see a site's motion yourself, shoot it: `node scripts/shoot.mjs https://site.com out/` writes `filmstrip.jpg`, frames at even scroll steps.

## The motion system (decide all three in the contract)

1. **Signature scene: one, mandatory on marketing pages.** A pinned section (100–300vh of scroll) where the page's concept *happens*: the thing the product does, played by the visitor's scroll. It must come from the thesis, not from a catalogue. Ask: "What is the verb of this product, and what would it look like if scrolling performed it?"
   - Ledger product → the month's receipts fly in and sort themselves into columns, totals tick up, the stamp lands at 100%.
   - Coffee roaster → a bean cracks open into a cross-section with flavor notes on the cut.
   - Security product → the page's own text gets redacted line by line as you scroll.
2. **Section behaviors.** Every section gets a motion that suits its content, and no two neighbors share one. A list reveals item by item with its numbers counting; a photo un-crops from a slit; a quote types itself; a diagram draws its lines. "Fade up 24px" is not a behavior.
3. **Texture.** Small continuous life: a cursor-reactive detail, an owned motif that drifts with scroll velocity, a sticky element that changes state between sections, a progress mark tied to the story.

## Technique catalogue

Pick by meaning, not novelty. Each has a stack recipe below.

| Technique | What it does | Good for | Seen on |
| --- | --- | --- | --- |
| Pinned scrub timeline | Section pins; a timeline of several tweens plays with scroll | the signature scene | apple airpods, landonorris |
| Word-by-word light-up | A paragraph starts at 15% opacity; words reach full ink as they pass a line | manifestos, the one claim | landonorris, apple airpods ("The best thing you've never heard") |
| Self-drawing stroke | SVG path `stroke-dashoffset` scrubbed: signatures, routes, chart lines, underlines | anything hand-made, routes, growth | landonorris signature |
| Depth cloud | 6–12 photos at different z, each with a different scroll speed and slight rotation | proof, community, a world of people | landonorris gallery |
| Horizontal track | Vertical scroll drives a pinned horizontal row (`x: -(track - viewport)`) | timelines, processes, ranges, steps | tines, landonorris helmets |
| Clip-path reveal | An image opens from a slit, a circle, or a shape of the brand mark | photo reveals, transitions between worlds | landonorris (51 clipped elements) |
| Scale-through | An element grows until it becomes the next section's background ("zoom into the screen") | moving from claim into product | apple, tines product UI |
| Curve / bend | Panel or text row bends (`rotateX`/`skewY` tied to scroll velocity) and settles | energy, speed, sport, music | landonorris |
| Stacking cards | Cards pin and stack, each one scaling down slightly as the next covers it | sequential steps, plans, chapters | many studios |
| Counter ticks | Numbers count to their value as they enter, with tabular figures | real metrics, totals, prices | stripe GDP counter |
| Split / converge | Two halves of a headline or image slide apart to reveal what is between | before/after, problem/solution | landonorris ON/OFF track |
| Mask text over video/photo | Giant type acts as a window onto an image that moves inside it | wordmarks, closing statements | tines "Start today" |
| Sticky state change | A sticky object (phone, document, product) swaps content as sections pass it | features of one product | apple "Significant others" |
| Velocity skew | Rows skew slightly with scroll speed, relax when scrolling stops | marquees, ticker of titles | studios, landonorris |
| Sticky title, scrolling stack | The section title pins at the top-left while its items scroll past and hand off | portfolios, case studies, feature chapters | basement.studio "Featured Projects" |
| Accumulating line | The hero line repeats and grows one word per scroll step ("Design / Design & Code / Design & Tools of…") | a claim that builds | locomotive.ca |
| Blur-to-sharp | Elements arrive from `filter: blur(12px)` to 0 | a quiet tool brand (texture only, never the scene) | linear |

## Stacks

**Single HTML file:** GSAP + ScrollTrigger + Lenis from jsDelivr (pin exact versions):
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js"></script>
<script>
gsap.registerPlugin(ScrollTrigger);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) {
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    gsap.timeline({ scrollTrigger: { trigger: '#scene', start: 'top top', end: '+=2400', pin: true, scrub: 0.6 } })
      .from('.receipt', { y: () => innerHeight, rotate: (i) => (i % 2 ? 8 : -6), stagger: 0.08 })
      .to('.total', { textContent: 4280, snap: { textContent: 1 } }, '<0.3')
      .from('.stamp', { scale: 2.4, opacity: 0, ease: 'back.out(2)' });
  });
  mm.add('(max-width: 899px)', () => { /* simpler, unpinned version for phones */ });
}
window.addEventListener('load', () => ScrollTrigger.refresh());
</script>
```
GSAP is free to use, including the formerly paid plugins (SplitText, DrawSVG, MorphSVG), so use `SplitText` for word and line reveals instead of hand-splitting.

**React app:** `gsap` + `@gsap/react` (`useGSAP` scopes and cleans up triggers), or Motion (`motion/react`) `useScroll` + `useTransform` for scrubbed values. Lenis has a React wrapper (`lenis/react`).

**No JS:** CSS scroll-driven animations (`animation-timeline: view()` / `scroll()`, `animation-range`). Chrome 115+, Safari 26; wrap in `@supports (animation-timeline: view())` so other browsers get the static page. Good for reveals, progress marks and parallax; use GSAP for pinned scenes.

## Rules

- **Content is visible without JS.** Set initial hidden states from JS (`gsap.from`), never in CSS, so a failed script or a screenshot still shows the page.
- **`prefers-reduced-motion`:** no pinning, no scrub, no smooth scroll; keep the final states and at most simple opacity.
- **Phones get their own choreography,** usually shorter and unpinned (`gsap.matchMedia`). Never leave a 300vh pin on a 390px screen with nothing changing.
- **Pins add scroll length.** The section after a pin gets normal or tighter top padding, never extra.
- **Refresh after load:** `ScrollTrigger.refresh()` after fonts and images load, or pins will sit at the wrong place.
- **Animate transform, opacity, clip-path and filter only.** Never animate layout properties (top, height, width) on scroll.
- **Scrub at 0.4–1** for a soft follow; `scrub: true` feels mechanical.
- **Every scene is legible when paused** at any scroll point: no frame where the text is half-covered and unreadable for long.
- **Motion obeys the concept.** If a technique could be pasted onto any other site unchanged, it is decoration; tie it to the product's verb, objects or materials.
