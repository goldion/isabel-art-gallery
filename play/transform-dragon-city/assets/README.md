# Transform Dragon City — vendored art (static play slice)

Built for `/play/transform-dragon-city/` on GitHub Pages. Gameplay matches engine `rnd/godot/transform-dragon-city` (Godot Now Demo @ release `5d2238d`).

- `backgrounds/` — dragon-city hills, sky/earth/sea cities, jail, treehouse (from gallery `10_game_assets/backgrounds/`)
- `crops/` — single-pose PNGs generated with the same rules as engine `tools/make_crops.py` (girl/dragon heroes, friends, gugu + vs-opponent only)

`js/game.js` loads these paths directly (no sheet slicing in the browser).
