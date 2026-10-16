# GSW art pipeline Soft PASS #1 — Dragon Ville Picnic art pack

**Source:** `/workspace/isabel-art/dragon-ville-picnic/` (17 PNG + `dvp-picnic-preview.zip`)  
**Out:** `/workspace/isabel-art/gsw-pipeline/picnic-softpass/`  
**Scope:** Soft-check existing Picnic assets vs crayon/Isabel look. No engine/gallery code. No new drawings.

## Verdict: **Soft PASS**

Pack reads crayon/Isabel — picnic/park BG, full cast sheets, picnic props present. No pink placeholder / missing-file squares in the pack itself.

### Soft-check bar

| Check | Result |
|-------|--------|
| Backgrounds read as picnic/park (tree/ground), crayon not stock | **PASS** — `picnic-tree.png` park tree/grass/trash cans on notebook paper; crayon strokes. Scene variants `campsite`, `hatch-field`, `socket-space` also crayon Soft PASS (not pure picnic; Soft Next) |
| Characters readable silhouette (cast present) | **PASS** — undercover-princess, blue-princess-dragon, pink-bunny-dragon, purple-fox-dragon, yellow-lightning-dragon, bird — pose sheets, silhouettes clear |
| Elements (blanket/food/props) present, crayon-look | **PASS** — picnic blanket+basket, gift, cake, fries, tray, dragon-egg, portal — all crayon |
| No pink/placeholder / ColorRect / missing-file pink squares in pack | **PASS** — none. Portal magenta/purple strokes are intentional crayon (not missing-texture pink) |
| Gift/prop art present (code-drawn in game = Soft Next only) | **PASS** — `elements/gift.png` crayon gift Soft PASS. Soft Next if live game still uses code-drawn gift elsewhere |

### Assets (Soft PASS flat copy → `assets/`)

| Folder | Files |
|--------|-------|
| backgrounds/ | campsite, hatch-field, picnic-tree, socket-space |
| characters/ | bird, blue-princess-dragon, pink-bunny-dragon, purple-fox-dragon, undercover-princess, yellow-lightning-dragon |
| elements/ | cake, dragon-egg, fries, gift, picnic, portal, tray |

Same filenames as source. See `capture-meta.json` for sizes + SHA-256.

### Stills

- `stills/soft-pass-annotate.png` — annotated Soft PASS overview
- `stills/contact-backgrounds.png`
- `stills/contact-characters.png`
- `stills/contact-elements.png`
- `stills/contact-full.png` — full 17 PNG contact

### Soft Next (not Soft FAIL)

- Gallery Showcase lists **18** picnic stickers incl. **Snow field** — that BG is **not** in this source pack (17 PNG). Soft Next: add snow field to pack or drop from gallery count when Demo wires Picnic.
- Scene BGs `campsite` / `hatch-field` / `socket-space` are world rooms beyond core picnic park — fine as pack, Soft Next if Picnic Demo should lead with park only.
- Gift Soft PASS as art; Soft Next only if engine/game still draws gift as code primitive when Picnic goes playable.
- Soft feel residuals (mid-swipe FOV etc.) stay parked — not Picnic pack.

### Handoff

@Developer — Soft PASS #1 Picnic art pack ready under `assets/`. Wire when Hammer puts Picnic on Demo. No PR from Art.
