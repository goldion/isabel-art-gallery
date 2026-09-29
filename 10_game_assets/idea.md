# Game ideas from these assets

Sprite sheets live in `characters/`, props in `elements/`, places in `backgrounds/`.
One PNG per character; poses and forms of that character share the file.
One PNG per element. One PNG per background place.

Detailed specs:

- `01-queen-team-up.md` — **building now** (pond jumper)
- `02-dragon-ville-picnic.md` — playable at `prototype/dragon-ville-picnic/`

The first *hub* build was a click-through and felt empty. Idea 1 is a real jumper instead.

---

## 1. Queen Team-Up (pond / mermaid)

**Type:** Top-down or side-scroll party RPG  
**Play as:** A team of three from mermaid, sea queen, sky queen, plant queen, dancing queen, teddy  

**Loop:** Jump lily pads on `full-pond` → a mermaid says join our team → **YAY!** → fight with a simple air / water / plant choice.

**Stages:** `full-pond`, `water-city`, `mermaid-home`, `stage`, `bubble-bath`  
**Foes:** Gugu, VS opponent, fire dragon  
**End:** Show cancelled after the mascara-pen disaster; switch to a bubble-bath / water-gun plan.

**Uses:** mermaid, queens, teddy, lily-pad, lotus, mascara-pen, water-gun, bubble-bath.

---

## 2. Dragon Ville Picnic

**Type:** Cozy collect-and-hatch  
**Play as:** Undercover princess (or the picnic crew)

**Loop:** Dragon eggs hatch → fox, bunny, lightning, blue 公主 → picnic → mind-move food → stop the gift-thief bird → open the portal “socket space” home. **No theft!**

**Stages:** `picnic-tree`, `campsite`, portal element  
**Cast:** purple-fox-dragon, pink-bunny-dragon, yellow-lightning-dragon, blue-princess-dragon, undercover-princess, bird, picnic props, dragon-egg.

Soft, short, good for younger play.

---

## 3. Transform 龍城

**Type:** Beat-em-up / form-switch  
**Play as:** 小亮, 小花, 小山 (button swaps girl ↔ dragon)

**Loop:** Friends shout **help! friends!** → rescue through hills and the three dragon cities.

**Stages:** `dragon-city-hills`, `sky-dragon-city`, `earth-dragon-city`, `sea-dragon-city`, `jail`, `treehouse`  
**Cast:** xiaoliang, xiaohua, xiaoshan, xiaosheng, xiaolian, sky/earth/sea dragon girls, lotus-dragon.

---

## 4. Spelling vs Lennon (school day)

**Type:** Tiny classroom / letter game  
**Play as:** Isabel (Maisie waits in the hall)

**Loop:** Write letters as god sisters → Harvey cuts in → 卓衡 blocks a playground game → Max is too good at it → spell **principal** vs Lennon → let the sadness go.

**Stages:** `school-hallway`, `clothing-shop`, house-map rooms  
**Cast:** isabel, maisie, luna, teacher, mr-lun, harvey, lennon, zhuoheng, max.

Short and funny. This is also **chapter 1** of God Sisters World.

---

## Hub that holds 1–4: God Sisters World

**Type:** 2D point-and-click / short adventure  
**Play as:** Isabel or Maisie  
**Repo:** `D:\Workspace\god-sisters-world`

Talk → pick up a prop → go to the next place → a tiny minigame → the next comic beat.

| Stage | Backgrounds | Chapter |
| --- | --- | --- |
| Letters / school | school-hallway, classroom, playground, tutoring-shop, park | **4** (ship first) |
| House | house-map, kitchen, bedroom, living-room, garden, cottage-home | Hub |
| Cat kingdom | cat-kingdom, people-castle | King Mr R, Cat Isabel, Ivi |
| Dragon picnic | picnic-tree, hatch-field, socket-space, campsite, snow-field | **2** |
| 水城 | water-city, lotus-shore, open-sea, underwater-home, mermaid-home, undersea-tent, underwater-fight, pond | Rescue + **1** |
| Next door | party-room, next-door-hallway, cloud-house, treehouse, dressing-room | Ninja, Moonie, 2018 / 2026 |
| The show | stage, disco, vs-arena, ballet-studio, bubble-bath, jail | Finale after **1** |
| 龍城 | hills + three cities, human-city | **3** |

Do not start as a 100-character fighter. One engine, many backgrounds, stories stay hers.

**Build order**

1. Weekend: school letter day (**4**), or picnic hatch (**2**), or pond jumper (**1**)
2. Real game: hub house → those levels → stage finale
3. Later: next-door mystery, seven-floor bear house, mall dress-up
