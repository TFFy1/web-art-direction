# The generic look

Patterns that make a page read as machine-made. Tier-C references in the library show each one; open them when unsure (`refs.search({ tier: 'C' })`). A brief can ask for any of these; without that, each one is a defect.

## First screen
- Centered headline + subhead + two buttons + product screenshot + logo wall, all in one viewport. (`21st-dev-ruixen-ui-templates-folio-open-source-data-intelligence-landing-template`)
- Eyebrow pill or chip above the headline ("✨ New", "Backed by …", "#1 Product of the Day").
- **Status dots, anywhere: banned outright.** A colored dot beside a label to suggest something live or online ("● October · open", "● Live", "● All systems normal", "● 3 online"), above all a green one, and above all in a pill in the nav. It is a template's shorthand for "real product". Say the fact in words or show it in the product itself; in app UIs, carry a state with an owned icon or the word in its color, never the generic dot. `shoot.mjs` flags `status-dot`.
- Purple-to-blue, lavender or pink-lavender gradient washes and blurred blobs. (dribbble `25738085`, `25904369`, `27424439`, `okta-com`)
- Glowing prompt box or input on black as the hero. (`framer-com`, `21st-dev-minhxthanh-components-waitlist-hero`)
- Floating app icons or integration logos orbiting the headline. (dribbble `27190142`)
- Tilted perspective dashboard mockups. (`datadoghq-com`, dribbble `24370911`)
- Glossy 3D icons, cartoon 3D characters, AI-rendered hero art. (`okta-com`, dribbble `27833257`)
- Stock smiles with floating UI chips. (dribbble `24965259`, `rippling-com`)

## Structure
- Three or four equal cards of icon + heading + two lines, repeated section after section.
- Every section the same height, the same centered heading, the same padding.
- Section numbers (01/02/03) that carry no sequence.
- Bento grid used because it is fashionable, not because the content has unequal weights.
- Testimonials as three identical quote cards with round avatars and five stars.
- A stats band of four big numbers with small labels, unsourced.
- FAQ accordion + CTA band + mega footer as an automatic ending.
- The default section order: hero → logo wall → three feature cards → how it works 1-2-3 → testimonials → three-column pricing → FAQ → CTA band. Replace at least half with sections from sections.md.

## Type and copy
- One safe sans (Inter, DM Sans, Plus Jakarta) at medium sizes everywhere; no real display size.
- Gradient text on the key words of the headline.
- Copy phrases: elevate, unlock, seamless, supercharge, revolutionize, empower, streamline, effortless, next-level, game-changer, "in today's fast-paced world", "all-in-one platform", "Welcome back, Name 👋".
- Em dashes everywhere; emoji as icons; headlines that could belong to any company.
- Invented proof: fake logos, fake reviews, "Trusted by 10,000+ teams".

## Surface
- Glassmorphism cards and backdrop blur as decoration.
- Soft shadows plus rounded corners on everything, nested cards inside cards.
- Neon accent (lime, cyan, magenta) on dark with glowing borders. (A break color is different: one saturated hue, rationed, with one meaning; see page.md.)
- An all-neutral palette with nothing saturated anywhere (`no-break-color`), or three competing accent hues (`competing-accents`).
- Same fade-up entrance animation on every section, or no scroll motion at all: the page looks designed in a screenshot and dead in the browser.
- Photos that are soft, blocky or over-compressed (under 1920px, quality under 80).
- Dashboards: "Welcome back 👋", a row of four KPI cards with sparklines, a donut chart, a purple primary. (dribbble `26758172`, `25270785`)
- Dashboards: the account menu in the top-right corner of the top bar, and fixed panes nobody can resize.
- Dashboards that are dead to the touch: buttons that don't answer a press, tabs that jump, numbers that swap instead of rolling, rows that appear without saying they are new (`static-controls`, `no-press-feedback`). See micro-interactions.md.

## The test
If someone could guess the page's look from its category alone ("AI tool → dark + glow", "fintech → purple gradient", "coffee → cream + serif"), it is generic, even if every element is well made.
