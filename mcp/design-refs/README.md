# design-refs MCP server

A code-mode MCP server over a library of professionally designed websites. Two tools:

- `refs_api`: the typed API, tier meanings and library size
- `refs_run`: runs a JavaScript snippet in a QuickJS sandbox against `refs.*` (search, image, moves, stats, tag, measure, capture) and `lessons.*` (list, add)

`measure(url)` loads a live site in headless Chrome and returns its real fonts per role, type scale, colors, radii, button style and section map. `capture(url)` adds a site to the library. `lessons.add()` is the design critic's memory: near-duplicates reinforce an existing lesson instead of piling up.

## Data

The library (screenshots, `refs/index.json`, `lessons.json`) lives in a separate private repo. On boot the server clones it into `DATA_DIR`; every write (capture, tag, lesson) is committed and pushed back within a few seconds, and flushed on SIGTERM. The container keeps no state of its own.

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `MCP_TOKEN` | yes (HTTP) | Bearer token clients must send; 24+ characters |
| `DATA_REPO` | for hosting | `owner/name` of the private library repo |
| `GITHUB_TOKEN` | for hosting | Fine-grained token with Contents read/write on that repo only |
| `DATA_DIR` | yes | Where the library lives (`/data` in the image) |
| `PORT` | yes (HTTP) | Set by Railway automatically |
| `DATA_BRANCH` | no | Default `main` |
| `RUN_WALL_MS` | no | Per-run time budget, default 150000 |

Without `DATA_REPO`/`GITHUB_TOKEN` the server serves whatever is already in `DATA_DIR` and does not push.

## Run locally

```bash
npm ci
DATA_DIR=../../../design-refs-library PORT=7070 MCP_TOKEN=$(openssl rand -hex 24) npm start
# or over stdio for a local Claude Code:
DATA_DIR=../../../design-refs-library node src/server.mjs --stdio
```

## Deploy on Railway

1. New project → Deploy from GitHub repo → this repo; set the service **Root Directory** to `mcp/design-refs` (it builds from the `Dockerfile`, health check `/healthz`).
2. Variables: `MCP_TOKEN`, `DATA_REPO`, `GITHUB_TOKEN`.
3. Networking → Generate domain. The endpoint is `https://<domain>/mcp`.

Then connect Claude Code:

```bash
claude mcp add --transport http design-refs https://<domain>/mcp --header "Authorization: Bearer <MCP_TOKEN>"
```

## Limits and safety

- Sandbox: QuickJS (WASM) with 64 MB memory, 1 MB stack and a wall-clock deadline; no filesystem, network, `require` or `process`. The only way out is the whitelisted API, and every call's arguments are validated with zod.
- `measure`/`capture` refuse non-http(s) URLs, non-default ports, credentials in URLs, and any host that resolves to a private, loopback, link-local or CGNAT address; every sub-request the page makes goes through the same check.
- Rate limits: 60 runs/minute, 120 measures/hour, 30 captures/hour. At most 6 images per run, max 1600 px wide.
- Internal errors are logged server-side; clients get generic messages.

## Tests

```bash
npm test                                                  # 13 tests against a fixture library
node test/smoke.mjs https://<domain>/mcp <token> [--capture]   # live check against a running server
```
