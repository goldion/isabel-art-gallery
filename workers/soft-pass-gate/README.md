# Soft PASS gate Worker

Live **Soft PASS** stage and **per-bot seat status** for the Hammer Studio war-room board (`play/soft-next-ops/`).

## Stages

`pick` → `soft-pass` → `waiting-go` → `tip` → `smoke` → `done`

## Bot seats (`bots`)

Lane bots keyed by id: `art`, `developer`, `tester`.

Each seat status is one of: `idle` | `cooking` | `waiting-go` | `smoking`.

Default mapping when `bots` is omitted from KV or on **stage-only** writes:

| Stage | art | developer | tester |
|-------|-----|-----------|--------|
| `pick` / `done` | idle | idle | idle |
| `soft-pass` | cooking | idle | idle |
| `waiting-go` | waiting-go | waiting-go | idle |
| `tip` | idle | cooking | idle |
| `smoke` | idle | idle | smoking |

Seat semantics (War Room):

- **Art** `cooking` — packing / Soft PASS art pass
- **Developer** `cooking` — tipping code
- **Tester** `smoking` — live smoke
- **`waiting-go`** — pack ready, tip on HOLD (Art + Developer lit)

## API

| Method | Body | Response |
|--------|------|----------|
| `GET /` | — | `{ stage, stages, bots, botStatuses, usage?, updatedAt, source }` |
| `PUT /` or `POST /` | `{ "stage": "tip" }` | Sets stage; **re-derives** `bots` from defaults; returns full payload + `ok: true` |
| `PUT /` or `POST /` | `{ "bots": { "developer": "cooking" } }` | Merges bot fields; stage unchanged |
| `PUT /` or `POST /` | `{ "stage": "smoke", "bots": { "tester": "smoking" } }` | Both updated |
| `PUT /` or `POST /` | `{ "usage": { … } }` | Persists CFO usage v1 to KV (`usage` key); stage/seat `bots` unchanged |
| `PUT /` or `POST /` | `{ "stage": "tip", "usage": { … } }` | Stage + usage in one write |

### Usage object (CFO schema v1)

Stored under KV key `usage`. Typical fields (all optional except the object itself):

- `schema` (number, `1`)
- `period` (e.g. `"this_week"`)
- `weeklyUsedPct` (number) — alias `weeklyLimitUsedPct`
- `resetsAt` (ISO, e.g. `+08:00`) — alias `resetsAtLocal`
- `bots`: `[{ id, name, sharePct }]` — ids may include `art`, `developer`, `tester`, `cto`, `assistant`, `admin`, `cfo`, `governess`, `other`
- `updatedAt`, `source`
- Optional extras (`plan`, `timezone`, `deskMap`, `notes`) are stored as sent.

Older clients that only read `stage` remain compatible (extra fields ignored).

CORS allows `https://goldion.github.io` (GitHub Pages hub).

If `SET_TOKEN` is set as a Worker secret, writes require `Authorization: Bearer <SET_TOKEN>`.

## Deploy (Wrangler)

```bash
cd workers/soft-pass-gate
npx wrangler kv namespace create GATE
# Add the id to wrangler.toml [[kv_namespaces]]
npx wrangler secret put SET_TOKEN   # optional
npx wrangler deploy
```

Default Worker URL (after deploy): `https://soft-pass-gate.isabel-art-goldion.workers.dev`

Seed KV (optional):

```bash
npx wrangler kv key put --namespace-id=<GATE_ID> stage waiting-go
npx wrangler kv key put --namespace-id=<GATE_ID> bots '{"art":"waiting-go","developer":"waiting-go","tester":"idle"}'
npx wrangler kv key put --namespace-id=<GATE_ID> updatedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

**Cloud agent note:** deploy needs Cloudflare credentials on the operator machine; this PR ships Worker code + UI against the new GET shape. After merge, run `npx wrangler deploy` from `workers/soft-pass-gate/`.

## Static fallback

`play/soft-next-ops/gate-status.json` mirrors the GET shape for local dev and when the Worker is unreachable.

## Room client

`play/soft-next-ops/js/room.js` polls the Worker every 12s (then `gate-status.json`). It lights **desk rings and locks** from seat `bots`, and **“% this week” desk bars** from `usage.bots` (fallback: static hardcoded shares when `usage` is absent). HUD shows `weeklyUsedPct` and `resetsAt` when present. Override the API base with `window.__SOFT_PASS_GATE_URL` before the module loads.
