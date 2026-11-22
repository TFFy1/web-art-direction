export const API_DOC = `# design-refs API (code mode)

Run JavaScript with the refs_run tool. The code is the body of an async function: use await, and \`return\` a value to get it back as JSON. console.log() output is returned too. Images requested with refs.image() are attached to the tool result (max 6 per run).

The library holds screenshots of professionally designed websites, each graded by tier:
  A = study this: a composition, type or art-direction decision worth learning from
  B = solid, conventional: the professional floor for its category
  C = counter-example: the generic "AI look" to recognize and avoid
  ? = captured but not reviewed yet

\`\`\`ts
type Tier = 'A' | 'B' | 'C' | '?';
type View = 'desktop' | 'full' | 'mobile' | 'shot';   // desktop = first screen 1440x900, full = whole page, mobile = first screen 390x844, shot = Dribbble image
type Facet =                                         // the design decision a reference teaches
  | 'layout' | 'type' | 'color' | 'imagery' | 'copy' | 'motion' | 'scroll' | '3d' | 'effects' | 'sections' | 'components' | 'micro-interactions'
  | 'app-shell' | 'data-viz'
  | 'page-404' | 'page-auth' | 'page-settings' | 'page-pricing' | 'page-changelog' | 'page-careers' | 'page-docs' | 'page-article'
  | 'page-case-study' | 'page-about' | 'page-contact' | 'page-legal' | 'page-checkout' | 'page-onboarding'
  | 'state-empty' | 'state-error' | 'state-loading' | 'state-success';
interface RefSummary { id: string; name: string; category: string; tier: Tier; moves: string[]; facets: Facet[]; note: string; url: string; views: View[] }

declare const refs: {
  /** Filter the library. Categories (industry): big-tech, saas, ecommerce, marketplace, enterprise, creative, dashboard (real app UIs), pages (product pages beyond the home page: 404, sign-in, settings, pricing, changelog, careers, docs, articles), dribbble, 21st. Facets (the decision a reference teaches) cut across categories: { facet: 'page-404' } or { facet: ['3d', 'effects'] } (any of). */
  search(q?: { category?: string; tier?: Tier | Tier[]; facet?: Facet | Facet[]; moves?: string[]; match?: 'all' | 'any'; text?: string; limit?: number /* 1-40, default 12 */ }): Promise<{ total: number; results: RefSummary[] }>;
  /** Full entry: url, files per view, pageHeight, capturedAt, tier, moves, note. */
  get(id: string): Promise<object>;
  /** Attach an image to the result. Full pages are tall: page through them with top/height (default slice 2400px, max 6000; a top past the end is an error). width 200-1600, default 1000. */
  image(id: string, opts?: { view?: View; top?: number; height?: number; width?: number }): Promise<{ id: string; view: View; source: { width: number; height: number }; slice: { top: number; height: number }; more: boolean }>;
  /** Move vocabulary with counts and tier-A examples. */
  moves(): Promise<{ move: string; count: number; tierA: string[] }[]>;
  stats(): Promise<{ total: number; byCategory: Record<string, number>; byTier: Record<string, number>; byFacet: Record<string, number> }>;
  /** Re-grade a reference after looking at it. */
  tag(id: string, patch: { tier?: Tier; moves?: string[]; facets?: Facet[]; note?: string }): Promise<RefSummary>;
  /** Load a live public site in headless Chrome and measure it: fonts per role (h1/h2/h3/body/nav/button), type scale, font families, text and background colors, radii, shadows, content widths, primary button, and a section map (top, height, background, heading, image count, word count). ~15-40s. If a heavy page crashes the server's browser, it is measured again with JavaScript off and the result carries a \`note\`. */
  measure(url: string): Promise<object>;
  /** Screenshot a public site (desktop, full page, mobile) into the library at tier "?". Look at it, then refs.tag() it. ~30-60s. */
  capture(url: string, category: string, name: string): Promise<RefSummary & { notes: string[] }>;
};

declare const lessons: {
  /** Design lessons learned from past critiques, most reinforced first. Read these before designing. */
  list(q?: { scope?: string; text?: string }): Promise<{ id: string; rule: string; why: string; scope: string; evidence: string[]; seen: number }[]>;
  /** Record a general, reusable lesson from a critique. Near-duplicates reinforce the existing lesson instead of adding a new one. */
  add(l: { rule: string /* 10-300 chars */; why: string /* 10-500 chars */; scope?: 'composition' | 'type' | 'color' | 'imagery' | 'copy' | 'motion' | 'components' | 'mobile' | 'process' | 'general'; evidence?: string /* up to 300 chars */ }): Promise<{ status: 'added' | 'reinforced'; lesson: object }>;
};
\`\`\`

## Examples

Three tier-A SaaS first screens:
\`\`\`js
const { results } = await refs.search({ category: 'saas', tier: 'A', limit: 3 });
for (const r of results) await refs.image(r.id, { width: 900 });
return results.map(r => ({ id: r.id, note: r.note }));
\`\`\`

The second screen of a full page:
\`\`\`js
return await refs.image('stripe-com', { view: 'full', top: 900, height: 1800, width: 800 });
\`\`\`

Measure a site's real type scale and section rhythm:
\`\`\`js
const m = await refs.measure('https://linear.app/');
return { roles: m.roles, typeScale: m.typeScale, sections: m.sections.map(s => [s.top, s.height, s.heading]) };
\`\`\`

Counter-examples to avoid for a SaaS landing:
\`\`\`js
return (await refs.search({ tier: 'C', text: 'gradient', limit: 8 })).results.map(r => r.note);
\`\`\`
`;
