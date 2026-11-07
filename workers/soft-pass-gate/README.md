# Soft PASS gate Worker

Live **Soft PASS** stage for the Hammer Studio war-room board (`play/soft-next-ops/`).

## Stages

`pick` → `soft-pass` → `waiting-go` → `tip` → `smoke` → `done`

## API

| Method | Body | Response |
|--------|------|----------|
| `GET /` | — | `{ stage, stages, updatedAt, source: "kv" }` |
| `PUT /` or `POST /` | `{ "stage": "tip" }` | `{ stage, stages, updatedAt, ok: true }` |

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
npx wrangler kv key put --namespace-id=<GATE_ID> updatedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

## Static fallback

`play/soft-next-ops/gate-status.json` mirrors the GET shape for local dev and when the Worker is unreachable. Edit `stage` in that file and bump `?v=` on the play slice to ship a default on Pages-only deploys.

## Room client

`play/soft-next-ops/js/room.js` polls the Worker every 12s, then falls back to `gate-status.json`. Override the API base with `window.__SOFT_PASS_GATE_URL` before the module loads.
