# web-art-direction

A Claude Code plugin for websites that look like an experienced human designer made them.

Component libraries fix the parts: toasts, drawers, menus. What still gives a page away is the whole: no concept, the category template, timid type, gradient filler, ten sections of equal cards. This plugin handles that layer, and it learns.

| Part | What it does |
|---|---|
| `skills/web-art-direction` | The process: brief → past lessons → graded references → direction contract → build → screenshots and mechanical tells → critic loop |
| `skills/ui-libraries-no-ai-look` | Component layer: use Sonner, Vaul, cmdk, Number Flow and Shadcn/Radix instead of hand-built parts, then restyle them |
| `agents/web-art-director` | Fresh-context critic. Returns `rebuild` / `fix` / `ship` with exact fixes, re-scores after fixes, and writes reusable lessons to memory so the builder doesn't repeat them |
| `mcp/design-refs` | Code-mode MCP server (`refs_api` + `refs_run`) over a library of real websites graded A (study) / B (solid) / C (counter-example). It can also measure live sites (real fonts, type scale, colors, section map), capture new ones, and store the critic's lessons |

## Install

```bash
/plugin marketplace add TFFy1/web-art-direction
/plugin install web-art-direction@web-art-direction
```

Connect the reference server (hosted or local, see [mcp/design-refs/README.md](mcp/design-refs/README.md)):

```bash
claude mcp add --scope user --transport http design-refs https://<your-domain>/mcp --header "Authorization: Bearer <token>"
```

The screenshot library isn't in this repo. Screenshots belong to their sites, so they stay in a private data repo that the server pulls on boot. To run your own server, build a library with the capture tool (`refs.capture(url, category, name)`) or the batch scripts, and point `DATA_REPO` at it.

## Use

Ask for a website or landing page normally ("build a landing page for …"); the skill triggers on its own. Or ask for it by name: "use web-art-direction". The critic runs at the end of every build. Its lessons are stored on the server, so every project after the first starts smarter.

## Layout

```
.claude-plugin/         plugin + marketplace manifests
skills/web-art-direction/
  SKILL.md              the process
  references/           moves.md (composition library), page.md (craft, break color), slop.md (generic look),
                        sections.md (section catalogue), motion.md (scroll scenes), micro-interactions.md (dashboard feel)
  scripts/shoot.mjs     screenshots + mechanical tells for review
  scripts/motion.mjs    scroll-motion probe and filmstrip
  scripts/palette.mjs   break-color probe (share of saturated color, hue clusters)
skills/ui-libraries-no-ai-look/SKILL.md
agents/web-art-director.md
mcp/design-refs/        the MCP server (Node, QuickJS sandbox, Playwright), Dockerfile, Railway config, tests
```

## License

MIT for the code and text in this repo. The reference screenshots served by a design-refs server are not covered and must not be redistributed.
