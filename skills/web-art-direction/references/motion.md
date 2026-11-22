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

## Tell the scene as a story

A scroll scene is a short animation whose playhead is the visitor's thumb, so the grammar of short animated films applies. These rules come from the shot logs behind the `animate` skill:

1. **The plot is a true process** of the product, in its real order (the slips arrive → they sort → one question is asked → the totals add up → the stamp lands). Each beat follows from the one before, so nothing needs a caption to explain it.
2. **One constant the eye can hold.** One anchor object keeps its screen position through the scene while everything around it changes (the receipt). It carries the break color (page.md, Color), and nothing else in the scene does.
3. **Beat roles, with a scroll budget for each:**

   | Role | What happens | Budget |
   | --- | --- | --- |
   | open | the start state, readable before anything moves | about 0.3 vh |
   | build | detail accrues on one framing | 0.5–1 vh |
   | journey | the most changes per 100px: the fastest stretch | 1–1.5 vh |
   | hold | a deliberate still beat; density drops, nothing new arrives | at most 0.3 vh |
   | payoff | the biggest single change, at the largest scale | 0.3–0.5 vh |
   | settle | the finished state held so it can be read before the unpin | about 0.3 vh |

4. **The busiest moment comes just before the hold. The payoff is the cleanest frame, not the busiest.**
5. **Something changes at every 250–300px step** except during the one hold. The probe flags a `dead-stretch` when a pinned section goes about a viewport (three steps) with nothing changing.
6. **What existed before a beat is on screen from its first frame; only the beat's own effect animates.** Never fade the whole stage in.
7. **The end is the start, changed.** A later section brings the anchor back in its finished state (the stamped receipt by the footer).

## Storyboard before you animate

Write the scene as a beat table before writing code: scroll range, what is on screen, what changes, its role, and how it hands off to the next beat. Build the timeline with one label per beat. Then expose it in development (`window.__scene = tl`) and render each beat as a still to check it before building the rest of the page:

```js
for (const p of [0, 0.12, 0.45, 0.7, 0.78, 0.92, 1]) {
  await page.evaluate((p) => { const st = window.__scene.scrollTrigger; scrollTo(0, st.start + p * (st.end - st.start)); }, p);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `board-${p}.jpg` });
}
```

Every frame must pass "legible when paused", with the anchor in place. A frame that can't be read is fixed now, while it is cheap.

## Bridges between sections

Most sections just follow each other. Two or three should be joined by a reason you could say out loud:

| Link | Reason | Recipe |
| --- | --- | --- |
| shape morph | this becomes that | the last object of one section moves and scales into the container of the next (the receipt becomes the paper the price list is printed on) |
| scale-in | going inside | zoom through an element until it is the next section's background |
| match-position | same place, new world | a sticky element holds while the section changes beneath it |
| time-cut | later | the same framing, with the time, light or state changed (the clock jumps to 4:40) |
| cause-effect | this made that | an action at the end of one section sets the first state of the next |
| callback | back to the start, changed | the hero object returns, finished |

Triggered motion (things that play once when they are reached) uses springs or `back.out(1.4)` for objects with mass, and no overshoot on large type. Scrubbed motion follows the thumb (scrub 0.4–1).

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
