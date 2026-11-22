# Backgrounds, visual effects and 3D

An effect earns its place when it shows something about the product that a flat surface can't. Otherwise it is the generic look's favorite disguise: purple or pink gradient blobs, aurora washes, bokeh orbs, particle starfields, "light rays", glass cards on blur, glowing grids on black. Most pages need no effect at all. Decide it in the contract, with a reason.

Library: `refs.search({ facet: ['3d', 'effects'] })`. Study the tier-A ones before building one.

## Does this page need an effect?

Use one only when one of these is true:

| Situation | What fits | Example |
| --- | --- | --- |
| The product is physical or spatial: hardware, vehicles, architecture, places, objects | a real 3D model, real video, or a pre-rendered image sequence | `forgeautomotive-co-uk`, `igloo-inc`, Apple product pages |
| The product works on something invisible that can be shown: data, money, sound, security, weather | a generative visual driven by the concept itself | `earth-nullschool-net` (wind), `stripe-com` (the gradient as flow) |
| The brand has a material: paper, film, ink, metal, fabric | texture: grain, halftone, paper fibre, film burn, dithering | `fidele-editions-com`, `nextjs-org-conf` |
| Wonder is the product: a studio portfolio, a launch, an event, a game, a campaign | an immersive WebGL scene the visitor moves through | `lusion-co`, `preymaker-com` |

Don't use one when the product's own UI is the best visual (show the UI), on reading pages, in dashboards (except charts), on settings, forms, auth or error pages, or when the same effect would fit a competitor's page unchanged.

## The ladder: go only as high as the idea needs

1. **Texture.** SVG `feTurbulence` grain over flat color, halftone, ruled paper, dithering. Nearly free, and it removes the plastic look of flat digital color.
2. **A real image or video loop.** Full HD or better, muted, `autoplay loop playsinline`, a poster frame, H.264 or AV1 under about 3 MB for a hero, paused when off screen.
3. **CSS and SVG backgrounds.** Layered radial or conic gradients, masks, patterns from the brand's world (ledger rules, contour lines for maps, a waveform for audio), animated with scroll timelines.
4. **2D canvas, generative.** Flow fields, particles that are data (one dot per order), noise. Seeded, so the screenshot and the visit match.
5. **A shader plane.** One fragment shader on a full-screen quad: a gradient with grain and slow movement in the brand colors, an image distortion on hover, a transition between images. Use OGL (small) or three.js `ShaderMaterial`.
6. **A 3D scene.** three.js or React Three Fiber with drei: a glTF model, environment lighting, a camera driven by scroll. Spline is the fastest way to author one, with a heavier runtime. Theatre.js sequences complex camera moves.

## 3D, done properly

- **Model:** glTF/GLB compressed with gltf-transform (Draco or meshopt geometry, KTX2 or WebP textures), ideally under 3 MB. Use the real product's CAD when it exists; never a stock robot or abstract blob.
- **Light and material:** an HDRI environment plus one key light, ACES tone mapping, physically based materials with real roughness. A default grey material reads as a prototype.
- **Scroll:** the camera or the model moves with ScrollTrigger as the signature scene (motion.md), with the same story grammar: an anchor, a hold, a payoff.
- **Performance:** show a still poster at once, and load the scene after first paint. Cap the device pixel ratio at 1.5–2 and render on demand (R3F `frameloop="demand"`). Pause when off screen (IntersectionObserver), and dispose geometries and textures on unmount.
- **Fallbacks:** a static image when WebGL is unavailable, with `prefers-reduced-motion`, with `navigator.connection.saveData`, or on low-end devices (`navigator.hardwareConcurrency <= 4`).
- **Phones:** a lighter model, or a pre-rendered image sequence scrubbed on a canvas (Apple's approach), rather than a full live scene.
- **Accessibility:** the canvas is decorative (`aria-hidden="true"`); every word and action lives in the DOM.

Single HTML file, with an import map and exact versions:
```html
<script type="importmap">{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/" } }</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
</script>
```

## Backgrounds that aren't generic

- Grain over one flat color from the palette.
- A photograph or video of the real thing, full HD.
- A pattern from the brand's own world.
- One slow shader gradient in the brand's colors, with grain, that means something (Stripe's).
- A drenched band in the break color (page.md).

Gradient libraries (backgrounds.supply, Gradient Lab, "light ray" components) produce the generic look by default. Use them only recolored to the palette, with grain, and tied to the concept, never as the hero's idea.

## Kinetic type

Text can be the effect. Split words or lines with GSAP SplitText and pick **one** treatment per page that fits the voice:
- line-by-line mask reveals for editorial,
- a scramble for code or security,
- a variable font's weight or width axis moving with scroll,
- type along a path,
- a marquee that skews with scroll velocity,
- words lighting up as they are read (motion.md).

Typewriter, neon glow, bouncing letters and rainbow gradients are clip art. Catalogues for vocabulary: Kawaii text animations, Kinetics (sources.md).

## Checking it

- The screenshot without motion still has an idea. If the frozen frame is a blur of color, the effect is carrying a page that has nothing to say.
- Hard-reload with the network throttled: the poster appears first and the text never waits on the scene.
- Phone at 390px: a lighter version, no jank, no horizontal overflow.
- `report.json` lists `largeCanvases`. The critic asks what each one means.
