# GSW art pipeline Soft PASS #2 — Queen Team-Up art pack

**Source:** `/workspace/isabel-art/gsw-pipeline/queen-team-up-src/` (13 PNG)  
**Out:** `/workspace/isabel-art/gsw-pipeline/queen-team-up-softpass/`  
**Scope:** Soft-check existing Queen Team-Up roster assets vs crayon/Isabel look. No engine/gallery code. No new drawings.

## Verdict: **Soft PASS**

Pack reads crayon/Isabel — pond / bubble-bath / stage BGs, full cast sheets (6 playables + gugu + star-director), lily-pad + lotus props. No pink placeholder / missing-file squares in the pack itself.

### Soft-check bar

| Check | Result |
|-------|--------|
| Backgrounds read as pond / bath / stage, crayon not stock | **PASS** — `full-pond.png` notebook pond + lotus/lily; `bubble-bath.png` clawfoot tub + crayon suds; `stage.png` curtains/speakers/yellow stage. All crayon on lined paper or crayon fill |
| Cast pick readable (6 playables + gugu + star-director) | **PASS** — mermaid, sea-queen, sky-queen, plant-queen, dancing-queen, teddy + gugu + star-director — pose sheets, silhouettes clear |
| Lily/lotus props present, crayon-look | **PASS** — `elements/lily-pad.png`, `elements/lotus.png` (map said lily-lotus; real filenames) |
| No pink/placeholder / ColorRect / missing-file pink squares in pack | **PASS** — none. Bubble-bath pink + lotus petal pink are intentional crayon (not missing-texture pink) |

### Assets (Soft PASS flat copy → `assets/`)

| Folder | Files |
|--------|-------|
| backgrounds/ | bubble-bath, full-pond, stage |
| characters/ | dancing-queen, gugu, mermaid, plant-queen, sea-queen, sky-queen, star-director, teddy |
| elements/ | lily-pad, lotus |

Same filenames as source. See `capture-meta.json` for sizes + SHA-256.

### Stills

- `stills/soft-pass-annotate.png` — annotated Soft PASS overview
- `stills/contact-backgrounds.png`
- `stills/contact-characters.png`
- `stills/contact-elements.png`
- `stills/contact-full.png` — full 13 PNG contact

### Soft Next (not Soft FAIL)

- `star-director.png` sheet reads as a multi-queen lineup (not director-only poses) — Soft Next if Demo needs a dedicated director pose sheet.
- Bubble-bath pink scribbles = intentional suds; Soft Next only if live Demo misreads as placeholder.
- GDD pick-three of 6 playables — all 6 Soft PASS in pack; wire picks at Demo time.
- Soft feel residuals (mid-swipe FOV etc.) stay parked — not Queen Team-Up pack.

### Handoff

@Developer — Soft PASS #2 Queen Team-Up art pack ready under `assets/`. Wire when Hammer puts Queen Team-Up on Demo. No PR from Art.
