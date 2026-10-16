# GSW art pipeline Soft PASS #3 — Spelling vs Lennon art pack

**Source:** `/workspace/isabel-art/gsw-pipeline/spelling-vs-lennon-src/` (9 PNG)  
**Out:** `/workspace/isabel-art/gsw-pipeline/spelling-vs-lennon-softpass/`  
**Scope:** Soft-check existing Spelling vs Lennon assets vs crayon/Isabel look. No engine/gallery code. No new drawings.

## Verdict: **Soft PASS**

Pack reads crayon/Isabel — school-hallway BG (pencil on notebook paper), full 8-cast pose sheets (Isabel, Maisie, teacher, Mr. Lun, Harvey, 卓衡/zhuoheng, Max, Lennon). No pink placeholder / missing-file squares in the pack itself.

### Soft-check bar

| Check | Result |
|-------|--------|
| Crayon from Isabel Art refs, no pink placeholders | **PASS** — all sheets crayon/pencil texture. Maisie pink = intentional character crayon (not missing-texture pink). Magenta placeholder scan 0% |
| BG school-hallway crayon readable | **PASS** — `school-hallway.png` notebook paper + red margin, lockers + perspective door, pencil/crayon strokes |
| Cast readable (8 characters) | **PASS** — isabel, maisie, teacher, mr-lun, harvey, zhuoheng, max, lennon — pose sheets, silhouettes clear |
| Soft Next parked unless Soft FAIL | **PASS** — Soft PASS; Soft Next notes only (below) |

### Assets (Soft PASS flat copy → `assets/`)

| Folder | Files |
|--------|-------|
| backgrounds/ | school-hallway |
| characters/ | harvey, isabel, lennon, maisie, max, mr-lun, teacher, zhuoheng |

Same filenames as source. See `capture-meta.json` for sizes + SHA-256.

### Stills

- `stills/soft-pass-annotate.png` — annotated Soft PASS overview
- `stills/contact-backgrounds.png`
- `stills/contact-characters.png`
- `stills/contact-elements.png` — N/A note (no elements/ in source)
- `stills/contact-full.png` — full 9 PNG contact

### Soft Next (not Soft FAIL)

- `school-hallway.png` is B&W pencil on notebook paper while cast is color crayon — intentional Isabel notebook look. Soft Next only if Demo wants a color hallway variant.
- Maisie pink poses (dance/magic/cape) are intentional crayon — Soft Next only if live Demo misreads as placeholder.
- No `elements/` folder in source (walker + spelling fight = BG + cast). Soft Next if Demo needs desk/word-card props as stamped art.
- Soft feel residuals stay parked — not Spelling vs Lennon pack.

### Handoff

@Developer — Soft PASS #3 Spelling vs Lennon art pack ready under `assets/`. Wire when Hammer puts Spelling vs Lennon on Demo. No PR from Art.
