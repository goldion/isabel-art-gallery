# Isabel Art — web reader

A local webpage for Isabel’s **comics**, **songs**, **novels**, and **gallery**.

The camera files in `F:\Isabel Art\IMG_*.JPG` are not used here and were never changed.

## What you will see

Top nav: **Comics** · **Songs** · **Novels** · **Gallery**

- **Comics** — notebook photos (Original pages) and crayon retellings (Converted). Left/Right arrows turn pages.
- **Songs** — picture plus Isabel’s lyrics.
- **Novels** — illustrated stories grown from her plots.
- **Gallery** — characters, elements, and backgrounds from `10_game_assets`. One PNG per person, prop, or place. Extra poses of the same person stay on that person’s sheet. **Styles** shows the ten game-look tryouts (Isabel, Maisie, 荷花龍, 小连, castle, mermaid fridge, mall city, party room, garden).

## How to run

From `_derived`:

```powershell
cd "F:\Isabel Art\_derived"
npm start
```

Then open:

http://127.0.0.1:3001/

or

- http://127.0.0.1:3001/#comics
- http://127.0.0.1:3001/#songs
- http://127.0.0.1:3001/#novels
- http://127.0.0.1:3001/#gallery
- http://127.0.0.1:3001/#gallery/elements
- http://127.0.0.1:3001/#gallery/backgrounds
- http://127.0.0.1:3001/#gallery/styles

`07_comics/index.html` redirects to the Comics tab.

Stop the server with Ctrl+C.

Do not open `index.html` by double-clicking the file. Songs and novels load extra text over http, so they need this local server.

## GitHub Pages (later)

This folder is already a static site (HTML, CSS, JS, images). No Python build.

When you deploy, publish the contents of `_derived` (not the camera JPGs in `F:\Isabel Art`). Keep `.nojekyll` so GitHub Pages does not skip files. Links are relative, so the site works at a project URL such as `https://USER.github.io/REPO/`.
