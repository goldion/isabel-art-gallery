const SITE_ROOT = (() => {
  const script = document.currentScript;
  if (script && script.src) {
    return new URL("./", script.src).pathname;
  }
  let path = location.pathname;
  if (path.endsWith("/")) return path;
  const leaf = path.split("/").pop() || "";
  if (/\./.test(leaf)) return path.slice(0, path.lastIndexOf("/") + 1);
  return `${path}/`;
})();

function urlFromRoot(relative) {
  return SITE_ROOT + relative.replace(/^\//, "");
}

const CLEAN = urlFromRoot("02_cleaned/");
const CONV = urlFromRoot("07_comics/converted/");

function imgs(ids) {
  return ids.map((id) => ({
    src: `${CLEAN}IMG_${String(id).padStart(4, "0")}.JPG`,
    caption: `Isabel’s page IMG_${String(id).padStart(4, "0")}`,
  }));
}

function conv(file, caption) {
  return { src: CONV + file, caption };
}

const BOOKS = [
  {
    id: "god-sisters",
    title: "God sisters",
    blurb: "Letters and songs",
    shelfCover: "07_comics/converted/cover-isabel-art.png",
    original: imgs([951, 952, 953, 954, 955, 956, 962, 963, 964, 965, 966, 967, 968, 969]),
    converted: [
      conv("cover-isabel-art.png", "Cover"),
      conv("god-sisters-1.png", "We write letters"),
      conv("god-sisters-2.png", "School, shop, and goodbye"),
      conv("god-sisters-3.png", "Songs"),
    ],
  },
  {
    id: "cats",
    title: "Maisie and Isabel's Cat Journey",
    blurb: "Cat Ivi, Isabel, Maisie, and the Cat Kingdom",
    shelfCover: "07_comics/converted/cats-cover.png",
    original: imgs([957, 958, 959, 960, 961]),
    converted: [
      conv("cats-cover.png", "Maisie and Isabel's Cat Journey"),
      conv("cats-1.png", "Meadow opener — Ivy and pet"),
      conv("cats-2.png", "Yes, she is a CAT"),
      conv("cats-3.png", "Meet Cat Jan, Ivi, and friends"),
      conv("cats-4.png", "Battles"),
      conv("cats-5.png", "Trash Monster"),
      conv("cats-6.png", "Mystery Cat King"),
      conv("cats-7.png", "King Mr R"),
      conv("cats-8.png", "Goodnight — The End"),
    ],
  },
  {
    id: "dragon-ville",
    title: "Hum Dragon Ville",
    blurb: "Hatching, picnic, portal",
    shelfCover: "07_comics/converted/dragon-ville-1.png",
    original: imgs([989, 990, 991, 992]),
    converted: [
      conv("dragon-ville-1.png", "Hum Dragon Ville"),
      conv("dragon-ville-2.png", "Picnic and portal"),
    ],
  },
  {
    id: "water-city",
    title: "Water City",
    blurb: "荷花龍 to To Be Continued",
    shelfCover: "07_comics/converted/water-1.png",
    original: imgs([978, 979, 980, 982, 983, 984, 985, 986, 987, 988]),
    converted: [
      conv("water-1.png", "Water City"),
      conv("water-2.png", "To Be Continued"),
    ],
  },
  {
    id: "dragon-city",
    title: "Dragon City",
    blurb: "Dragons and transformations",
    shelfCover: "07_comics/converted/dragon-city-1.png",
    original: imgs([970, 971, 972, 973, 974, 975, 976, 977, 1008, 1010]),
    converted: [conv("dragon-city-1.png", "In Dragon City")],
  },
  {
    id: "next-door",
    title: "Next door",
    blurb: "2018 / 2026",
    shelfCover: "07_comics/converted/next-door-1.png",
    original: imgs([1038, 1039, 1040, 1041, 1042, 1043, 1044, 1045, 1046, 1047, 1048]),
    converted: [
      conv("next-door-1.png", "Next door"),
      conv("next-door-2.png", "Who are you?"),
    ],
  },
  {
    id: "pond-team",
    title: "Pond team",
    blurb: "Pond, mermaid team, the end",
    shelfCover: "07_comics/converted/pond-1.png",
    original: imgs([1002, 1003, 1015, 1035, 1036, 1055, 1065]),
    converted: [conv("pond-1.png", "The pond team")],
  },
  {
    id: "more",
    title: "More comics",
    blurb: "The rest of the notebook",
    shelfCover: "07_comics/converted/more-1.png",
    original: imgs([
      993, 994, 995, 996, 997, 998, 999,
      1001, 1004, 1005, 1006, 1007, 1009,
      1011, 1012, 1013, 1014, 1016, 1017, 1018, 1019,
      1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027,
      1028, 1029, 1030, 1031, 1032, 1033, 1034, 1037,
      1049, 1050, 1051, 1052, 1053, 1054, 1056, 1057,
      1058, 1059, 1060, 1061, 1062, 1063, 1064, 1066, 1067,
    ]),
    converted: [
      conv("more-1.png", "More adventures"),
      conv("more-2.png", "VS"),
      conv("more-3.png", "Stay"),
      conv("more-4.png", "Oh No"),
      conv("more-5.png", "Town"),
      conv("more-6.png", "Friends"),
    ],
  },
];

const SONGS = [
  { id: "together", title: "Together song", folder: "08_songs/01-together-song", blurb: "IMG_0954" },
  { id: "wish", title: "Wish song", folder: "08_songs/02-wish-song", blurb: "IMG_0954" },
  { id: "do-not-be", title: "Do not be", folder: "08_songs/03-do-not-be", blurb: "IMG_0954" },
  { id: "friend", title: "Friend song", folder: "08_songs/04-friend-song", blurb: "IMG_0955" },
  { id: "god-sister", title: "God sister", folder: "08_songs/05-god-sister-song", blurb: "IMG_0955" },
  { id: "maisie", title: "Maisie song", folder: "08_songs/06-maisie-song", blurb: "IMG_0955" },
  { id: "isabel", title: "Isabel song", folder: "08_songs/07-isabel-song", blurb: "IMG_0956" },
  { id: "sea", title: "In the sea", folder: "08_songs/08-in-the-sea", blurb: "IMG_0956" },
  { id: "eeee", title: "EEEE song", folder: "08_songs/09-eeee-song", blurb: "IMG_0956" },
];

const DEMOS = [
  {
    id: "fruit-catcher",
    title: "Catch the fruit!",
    kid: "Catch the fruit!",
    parent: "Basket race · 2 minutes · dodge bombs",
    blurb: "",
    kind: "play",
    playPath: "play/fruit-catcher/",
    shelfCover: "10_game_assets/demo/fruit-catcher.png?v=29",
    iframeTitle: "Catch the fruit!",
  },
  {
    id: "god-sisters-stroll",
    title: "Walk with your god sister",
    kid: "Walk with your god sister",
    parent: "Garden, park, pond · F waves · E talks",
    blurb: "",
    kind: "play",
    playPath: "play/god-sisters-stroll/?v=22",
    shelfCover: "10_game_assets/demo/god-sisters-stroll.png?v=22",
    iframeTitle: "Walk with your god sister",
  },
  {
    id: "dragon-flight",
    title: "Fly the blue princess!",
    kid: "Fly the blue princess!",
    parent: "Ring race through 龍城 · 12 rings",
    blurb: "",
    kind: "play",
    playPath: "play/dragon-flight/",
    shelfCover: "10_game_assets/demo/dragon-flight.png?v=21",
    iframeTitle: "Fly the blue princess!",
  },
  {
    id: "clover-wheel",
    title: "Race the clover wheel!",
    kid: "Race the clover wheel!",
    parent: "Greenness Queen vs sunglasses 小花 · 3 laps",
    blurb: "",
    kind: "play",
    playPath: "play/clover-wheel/?v=30",
    shelfCover: "10_game_assets/demo/clover-wheel.png?v=22",
    iframeTitle: "Race the clover wheel!",
  },
  {
    id: "transform-dragon-city",
    title: "Transform Dragon City!",
    kid: "Transform Dragon City!",
    parent: "Move · jump · transform · rescue",
    blurb: "",
    kind: "play",
    playPath: "play/transform-dragon-city/?v=25",
    shelfCover: "10_game_assets/demo/transform-dragon-city.png?v=29",
    iframeTitle: "Transform Dragon City",
  },
  {
    id: "school-day",
    title: "School day!",
    kid: "School day!",
    parent: "Classroom & hallway · meet school friends",
    blurb: "",
    kind: "play",
    playPath: "play/school-day/?v=2",
    shelfCover: "10_game_assets/demo/school-day.png?v=27",
    iframeTitle: "School day",
  },
  {
    id: "dragon-ville-picnic",
    title: "Picnic at Dragon Ville!",
    kid: "Picnic at Dragon Ville!",
    parent: "Hatch eggs · mind-move food · shoo the bird · portal home",
    blurb: "",
    kind: "play",
    playPath: "play/dragon-ville-picnic/?v=2",
    shelfCover: "10_game_assets/demo/dragon-ville-picnic.png?v=23",
    iframeTitle: "Picnic at Dragon Ville",
  },
  {
    id: "queen-team-up",
    title: "Queen Team-Up!",
    kid: "Queen Team-Up!",
    parent: "Pick a queen · pond lily & lotus · bath · star stage",
    blurb: "",
    kind: "play",
    playPath: "play/queen-team-up/?v=3",
    shelfCover: "10_game_assets/demo/queen-team-up.png?v=24",
    iframeTitle: "Queen Team-Up",
  },
  {
    id: "spelling-vs-lennon",
    title: "Spelling vs Lennon!",
    kid: "Spelling vs Lennon!",
    parent: "School hallway · spell words · face Lennon",
    blurb: "",
    kind: "play",
    playPath: "play/spelling-vs-lennon/?v=3",
    shelfCover: "10_game_assets/demo/spelling-vs-lennon.png?v=25",
    iframeTitle: "Spelling vs Lennon",
  },
];

const NOVELS = [
  { id: "god-sisters", title: "God Sisters", folder: "09_novels/01-god-sisters", blurb: "Isabel and Maisie" },
  { id: "cats", title: "The Cat Kingdom", folder: "09_novels/02-cat-kingdom", blurb: "Ivi and King Mr R" },
  { id: "dragons", title: "Hum Dragon Ville", folder: "09_novels/03-hum-dragon-ville", blurb: "Eggs, picnic, portal" },
  { id: "water", title: "Water City", folder: "09_novels/04-water-city", blurb: "荷花龍" },
  { id: "next-door", title: "Next Door", folder: "09_novels/05-next-door", blurb: "2018 / 2026" },
  { id: "pond", title: "The Pond Team", folder: "09_novels/06-the-pond-team", blurb: "Lily pads and mermaids" },
];

const ASSET = urlFromRoot("10_game_assets/");
const GROUP_LABELS = {
  "god-sisters": "God sisters",
  letters: "Letters",
  "named-girls": "Named girls",
  school: "School letters",
  cats: "Cat comic",
  "dragon-girls": "Dragon girls",
  "water-city": "Water City",
  dragons: "Dragons",
  "dragon-ville": "Dragon Ville",
  battle: "Battle",
  "next-door": "Next door",
  stage: "Stage",
  seasons: "Seasons",
  picnic: "Picnic",
  queens: "Queens",
  hospital: "Hospital",
  creatures: "Creatures",
  "dragon-city": "Dragon City",
  pets: "Pets",
  trigger: "Doors and portals",
  water: "Water",
  platform: "Platforms",
  pickup: "Pickups",
  scene: "Scene props",
  vehicle: "Vehicles",
  item: "Items",
  furniture: "Furniture",
};

const ART_NAMES = {
  yiniu: "一扭",
  "lang-cat": "浪 cat",
  "fake-princess": "假公主",
  "true-princess": "真公主",
  "mingri-wang": "明日王",
  shanzai: "珊仔",
  daliaoxing: "大料星",
  shaxing: "沙星",
  zhuoheng: "卓衡",
  "mr-lun": "Mr. Lun",
  "king-mr-r": "King Mr R",
  xiaoliang: "小亮",
  xiaohua: "小花",
  xiaoshan: "小山",
  xiaosheng: "小生",
  xiaolian: "小连",
  shengshansheng: "生山生",
  "lotus-dragon": "荷花龍",
  xiaochun: "小春",
  xiaoqiu: "小秋",
  "chuan-flower": "川 flower",
  xiaoxin: "小心",
  xiaoshui: "小水",
  autumn: "Autumn / 小涟",
  "sea-dragon-girl": "海龍城 girl",
};

const NOVEL_COVERS = {
  "god-sisters": `${CONV}cover-isabel-art.png`,
  cats: `${CONV}cats-cover.png`,
  dragons: `${CONV}dragon-ville-1.png`,
  water: `${CONV}water-1.png`,
  "next-door": `${CONV}next-door-1.png`,
  pond: `${CONV}pond-1.png`,
};

const GALLERY_CHIP = {
  characters: "characters",
  elements: "elements",
  backgrounds: "backgrounds",
  styles: "styles",
};

const GALLERY_LIKE_PREFIX = "isabel-art.gallery.like.";
const SHARED_COUNT_PREFIX = "isabel-art.shared-count.";
const GALLERY_SHARED_COUNT_PREFIX_LEGACY = "isabel-art.gallery.shared-count.";
const SHARED_LIKES_URL =
  "https://isabel-art-likes.isabel-art-goldion.workers.dev";
const sharedLikeCounts = Object.create(null);

function isWorkerArtId(id) {
  return (
    typeof id === "string" &&
    id.length > 0 &&
    id.length <= 128 &&
    /^[A-Za-z0-9._:-]+$/.test(id)
  );
}

function readCachedSharedCount(id) {
  if (!id) return null;
  try {
    const keys = [`${SHARED_COUNT_PREFIX}${id}`, `${GALLERY_SHARED_COUNT_PREFIX_LEGACY}${id}`];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw == null || raw === "") continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    return null;
  } catch (err) {
    return null;
  }
}

function writeCachedSharedCount(id, count) {
  if (!id || typeof count !== "number" || !Number.isFinite(count) || count < 0) return;
  try {
    localStorage.setItem(`${SHARED_COUNT_PREFIX}${id}`, String(count));
  } catch (err) {
    /* ignore quota / private mode */
  }
}

function sharedCountForWorkerId(id) {
  if (!id) return null;
  const live = sharedLikeCounts[id];
  if (typeof live === "number") return live;
  return readCachedSharedCount(id);
}

async function fetchSharedLike(id) {
  if (!isWorkerArtId(id)) return null;
  try {
    const res = await fetch(`${SHARED_LIKES_URL}?id=${encodeURIComponent(id)}`, {
      method: "GET",
      mode: "cors",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.count === "number") {
      sharedLikeCounts[id] = data.count;
      writeCachedSharedCount(id, data.count);
    }
    return data;
  } catch (err) {
    return null;
  }
}

async function postSharedLike(id) {
  if (!isWorkerArtId(id)) return null;
  try {
    const res = await fetch(`${SHARED_LIKES_URL}?id=${encodeURIComponent(id)}`, {
      method: "POST",
      mode: "cors",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.count === "number") {
      sharedLikeCounts[id] = data.count;
      writeCachedSharedCount(id, data.count);
    }
    return data;
  } catch (err) {
    return null;
  }
}

async function deleteSharedLike(id) {
  if (!isWorkerArtId(id)) return null;
  try {
    const res = await fetch(`${SHARED_LIKES_URL}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      mode: "cors",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.count === "number") {
      sharedLikeCounts[id] = data.count;
      writeCachedSharedCount(id, data.count);
    }
    return data;
  } catch (err) {
    return null;
  }
}

function bumpSharedCountLocal(id, delta) {
  if (!id || !isWorkerArtId(id) || !delta) return;
  const prev =
    typeof sharedLikeCounts[id] === "number" ? sharedLikeCounts[id] : readCachedSharedCount(id);
  if (typeof prev !== "number") return;
  const next = Math.max(0, prev + delta);
  sharedLikeCounts[id] = next;
  writeCachedSharedCount(id, next);
}

function sectionLikeLocalPrefix(sec) {
  if (sec === "gallery") return GALLERY_LIKE_PREFIX;
  return `isabel-art.${sec}.like.`;
}

function currentLikeTarget() {
  if (section === "gallery") {
    const arts = currentGalleryArts();
    const art = arts[pageIndex];
    if (!art) return null;
    const artKey = galleryArtKey(art);
    if (!artKey) return null;
    return {
      workerId: artKey,
      label: artName(art),
      localKey: `${GALLERY_LIKE_PREFIX}${artKey}`,
      art,
    };
  }
  if (section === "comics") {
    const book = BOOKS[itemIndex];
    if (!book || !book.id) return null;
    return {
      workerId: `comics:${book.id}`,
      label: book.title,
      localKey: `${sectionLikeLocalPrefix("comics")}${book.id}`,
    };
  }
  if (section === "songs") {
    const song = SONGS[itemIndex];
    if (!song || !song.id) return null;
    return {
      workerId: `songs:${song.id}`,
      label: song.title,
      localKey: `${sectionLikeLocalPrefix("songs")}${song.id}`,
    };
  }
  if (section === "novels") {
    const novel = NOVELS[itemIndex];
    if (!novel || !novel.id) return null;
    return {
      workerId: `novels:${novel.id}`,
      label: novel.title,
      localKey: `${sectionLikeLocalPrefix("novels")}${novel.id}`,
    };
  }
  if (section === "demo") {
    const entry = DEMOS[itemIndex];
    if (!entry || !entry.id) return null;
    return {
      workerId: `demo:${entry.id}`,
      label: entry.title,
      localKey: `${sectionLikeLocalPrefix("demo")}${entry.id}`,
    };
  }
  return null;
}

function workerIdsForCurrentSection() {
  if (section === "comics") {
    return BOOKS.map((book) => (book.id ? `comics:${book.id}` : "")).filter(Boolean);
  }
  if (section === "songs") {
    return SONGS.map((song) => (song.id ? `songs:${song.id}` : "")).filter(Boolean);
  }
  if (section === "novels") {
    return NOVELS.map((novel) => (novel.id ? `novels:${novel.id}` : "")).filter(Boolean);
  }
  if (section === "demo") {
    return DEMOS.map((entry) => (entry.id ? `demo:${entry.id}` : "")).filter(Boolean);
  }
  if (section === "gallery") {
    const ids = [];
    const seen = new Set();
    for (const art of currentGalleryArts()) {
      const id = galleryArtKey(art);
      if (!id || seen.has(id) || !isWorkerArtId(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    return ids;
  }
  return [];
}

function prefetchSharedCountsForSection() {
  const ids = workerIdsForCurrentSection();
  if (!ids.length) return;
  const sec = section;
  void Promise.all(ids.map((id) => fetchSharedLike(id))).then(() => {
    if (section !== sec) return;
    syncLikeButtons();
  });
}

function isLikeTargetLiked(target) {
  if (!target || !target.localKey) return false;
  try {
    return localStorage.getItem(target.localKey) === "1";
  } catch (err) {
    return false;
  }
}

function setLikeTargetLiked(target, liked) {
  if (!target || !target.localKey) return;
  try {
    if (liked) localStorage.setItem(target.localKey, "1");
    else localStorage.removeItem(target.localKey);
  } catch (err) {
    /* ignore quota / private mode */
  }
}

function galleryArtKey(art) {
  if (!art) return "";
  if (art.id) return art.id;
  const file = art.file || "";
  const base = file.split("/").pop() || file;
  return base.replace(/\.[^.]+$/, "");
}

function isGalleryArtLiked(art) {
  const artKey = galleryArtKey(art);
  if (!artKey) return false;
  return isLikeTargetLiked({ localKey: `${GALLERY_LIKE_PREFIX}${artKey}` });
}

function syncLikeButtonElement(btn, iconEl, textEl, countEl, target) {
  if (!btn) return;
  if (!target) {
    btn.hidden = true;
    btn.classList.add("hidden");
    btn.setAttribute("aria-pressed", "false");
    if (countEl) {
      countEl.hidden = true;
      countEl.textContent = "";
    }
    return;
  }
  btn.hidden = false;
  btn.classList.remove("hidden");
  const liked = isLikeTargetLiked(target);
  const sharedCount = sharedCountForWorkerId(target.workerId);
  const name = target.label || "this item";
  btn.setAttribute("aria-pressed", liked ? "true" : "false");
  const countPhrase =
    typeof sharedCount === "number" ? `, ${sharedCount} shared likes` : "";
  btn.setAttribute(
    "aria-label",
    liked ? `Unlike ${name}${countPhrase}` : `Like ${name}${countPhrase}`
  );
  if (iconEl) iconEl.textContent = liked ? "♥" : "♡";
  if (textEl) textEl.textContent = liked ? "Liked" : "Like";
  if (countEl) {
    if (typeof sharedCount === "number") {
      countEl.textContent = String(sharedCount);
      countEl.hidden = false;
    } else {
      countEl.hidden = true;
      countEl.textContent = "";
    }
  }
}

function syncLikeButtons() {
  const target = currentLikeTarget();
  const galleryTarget = section === "gallery" ? target : null;
  const itemTarget =
    section === "comics" || section === "songs" || section === "novels" || section === "demo"
      ? target
      : null;
  syncLikeButtonElement(
    galleryLikeBtn,
    galleryLikeIcon,
    galleryLikeText,
    galleryLikeCount,
    galleryTarget
  );
  syncLikeButtonElement(itemLikeBtn, itemLikeIcon, itemLikeText, itemLikeCount, itemTarget);
}

function toggleCurrentLike() {
  const target = currentLikeTarget();
  if (!target) return;
  const nextLiked = !isLikeTargetLiked(target);
  const { workerId } = target;
  setLikeTargetLiked(target, nextLiked);
  if (!nextLiked) bumpSharedCountLocal(workerId, -1);
  syncLikeButtons();
  if (section === "gallery") {
    const gridBtn = galleryGrid.querySelector(`button:nth-child(${pageIndex + 1})`);
    if (gridBtn) gridBtn.classList.toggle("is-liked", nextLiked);
  }
  const syncAfterShared = () => {
    const now = currentLikeTarget();
    if (!now || now.workerId !== workerId) return;
    syncLikeButtons();
  };
  if (nextLiked) void postSharedLike(workerId).then(syncAfterShared);
  else void deleteSharedLike(workerId).then(syncAfterShared);
}

function bookCover(book) {
  if (book.shelfCover) return urlFromRoot(book.shelfCover);
  const conv = book.converted && book.converted[0];
  if (conv) return conv.src;
  const orig = book.original && book.original[0];
  return orig ? orig.src : "";
}

function shelfCover(item) {
  if (section === "comics") return bookCover(item);
  if (section === "songs") return urlFromRoot(`${item.folder}/picture.png`);
  if (section === "novels") return NOVEL_COVERS[item.id] || "";
  if (section === "gallery") {
    const art = item.arts && item.arts[0];
    if (art) return ASSET + art.file;
  }
  if (section === "demo" && item.shelfCover) return urlFromRoot(item.shelfCover);
  return "";
}

function makeShelfThumb(coverSrc, title, fallbacks = []) {
  const wrap = document.createElement("span");
  wrap.className = "shelf-thumb-wrap";

  const tryFallback = (sources, index) => {
    if (index >= sources.length) {
      wrap.classList.add("is-placeholder");
      wrap.setAttribute("aria-hidden", "true");
      wrap.textContent = title.charAt(0).toUpperCase();
      return;
    }
    const img = document.createElement("img");
    img.className = "shelf-thumb";
    img.alt = `${title} cover`;
    img.width = 72;
    img.height = 72;
    img.decoding = "async";
    img.src = sources[index];
    img.addEventListener("error", () => {
      img.remove();
      tryFallback(sources, index + 1);
    });
    wrap.appendChild(img);
  };

  const sources = [coverSrc, ...fallbacks].filter(Boolean);
  if (sources.length) tryFallback(sources, 0);
  else tryFallback([], 0);

  return wrap;
}

function syncVersionTabLabels() {
  if (!tabOriginal || !tabConverted) return;
  tabOriginal.textContent = "Notebook";
  tabConverted.textContent = "Comic book";
  tabOriginal.setAttribute("aria-label", "Notebook pages");
  tabConverted.setAttribute("aria-label", "Comic book pages");
  if (comicTabs) comicTabs.setAttribute("aria-label", "Notebook or comic book");
}

function applyBodyChrome() {
  document.body.classList.remove(
    "section-comics",
    "section-songs",
    "section-novels",
    "section-gallery",
    "section-demo",
    "mode-notebook",
    "mode-comic"
  );
  document.body.classList.add(`section-${section}`);
  if (section === "comics") {
    document.body.classList.add(mode === "converted" ? "mode-comic" : "mode-notebook");
  }
}

const galleryShelfLede = document.getElementById("gallery-shelf-lede");

const listEl = document.getElementById("list");
const img = document.getElementById("page");
const caption = document.getElementById("caption");
const title = document.getElementById("item-title");
const kicker = document.getElementById("item-kicker");
const pos = document.getElementById("pos");
const prev = document.getElementById("prev");
const next = document.getElementById("next");
const tabOriginal = document.getElementById("tab-original");
const tabConverted = document.getElementById("tab-converted");
const comicTabs = document.getElementById("comic-tabs");
const galleryTabs = document.getElementById("gallery-tabs");
const pager = document.getElementById("pager");
const stageComic = document.getElementById("stage-comic");
const stageSong = document.getElementById("stage-song");
const stageNovel = document.getElementById("stage-novel");
const stageGallery = document.getElementById("stage-gallery");
const stageDemo = document.getElementById("stage-demo");
const demoPlay = document.getElementById("demo-play");
const demoIframe = document.getElementById("demo-iframe");
const galleryFocusPanel = document.getElementById("gallery-focus-panel");
const galleryFocus = document.getElementById("gallery-focus");
const galleryPage = document.getElementById("gallery-page");
const galleryCaption = document.getElementById("gallery-caption");
const galleryLikeBtn = document.getElementById("gallery-like");
const galleryLikeIcon = galleryLikeBtn && galleryLikeBtn.querySelector(".gallery-like-icon");
const galleryLikeText = galleryLikeBtn && galleryLikeBtn.querySelector(".gallery-like-text");
const galleryLikeCount = document.getElementById("gallery-like-count");
const itemLikeBtn = document.getElementById("item-like");
const itemLikeIcon = itemLikeBtn && itemLikeBtn.querySelector(".gallery-like-icon");
const itemLikeText = itemLikeBtn && itemLikeBtn.querySelector(".gallery-like-text");
const itemLikeCount = document.getElementById("item-like-count");
const galleryGrid = document.getElementById("gallery-grid");
const songPicture = document.getElementById("song-picture");
const songLyrics = document.getElementById("song-lyrics");
const shelfKicker = document.getElementById("shelf-kicker");
const shelfTitle = document.getElementById("shelf-title");
const shelfLede = document.getElementById("shelf-lede");

let section = "comics";
let galleryKind = "characters";
let galleryPack = null;
let itemIndex = 0;
let pageIndex = 0;
let mode = "converted";

const STYLE_LOOKS = [
  ["japan-comic", "Japan comic"],
  ["teen-comic", "Teen comic"],
  ["pixel", "Pixel"],
  ["low-poly-3d", "Low poly 3D"],
  ["hd-2d", "HD 2D"],
  ["ghibli", "Ghibli"],
  ["pixar-3d", "Pixar 3D"],
  ["pony", "Pony"],
  ["chibi", "Chibi"],
  ["watercolor", "Watercolor"],
];

const STYLE_SUBJECTS = [
  { id: "isabel", title: "Isabel", folder: "characters/style-samples", kind: "character" },
  { id: "maisie", title: "Maisie", folder: "characters/style-samples", kind: "character" },
  { id: "lotus-dragon", title: "荷花龍", folder: "characters/style-samples", kind: "character" },
  { id: "xiaolian", title: "小连", folder: "characters/style-samples", kind: "character" },
  { id: "castle", title: "Castle", folder: "elements/style-samples", kind: "element" },
  { id: "mermaid-fridge", title: "Mermaid fridge", folder: "elements/style-samples", kind: "element" },
  { id: "mall-city", title: "Mall city", folder: "backgrounds/style-samples", kind: "place" },
  { id: "party-room", title: "Party room", folder: "backgrounds/style-samples", kind: "place" },
  { id: "garden", title: "Garden", folder: "backgrounds/style-samples", kind: "place" },
];

function pretty(id) {
  return id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function artName(item) {
  return item.name || ART_NAMES[item.id] || pretty(item.id);
}

function styleArts(subject) {
  return STYLE_LOOKS.map(([slug, look], i) => ({
    id: `${subject.id}-${slug}`,
    file: `${subject.folder}/${subject.id}-${String(i + 1).padStart(2, "0")}-${slug}.png`,
    name: `${subject.title} · ${look}`,
    look,
  }));
}

function allStyleArts() {
  return STYLE_SUBJECTS.flatMap(styleArts);
}

function styleGroups() {
  const all = allStyleArts();
  const groups = [
    { id: "all", title: "All styles", blurb: `${all.length} samples`, arts: all },
  ];
  for (const subject of STYLE_SUBJECTS) {
    const arts = styleArts(subject);
    groups.push({
      id: subject.id,
      title: subject.title,
      blurb: `${arts.length} looks`,
      arts,
    });
  }
  return groups;
}

function items() {
  if (section === "songs") return SONGS;
  if (section === "novels") return NOVELS;
  if (section === "demo") return DEMOS;
  if (section === "gallery") return galleryGroups();
  return BOOKS;
}

function galleryKindLabel() {
  if (galleryKind === "elements") return "Elements";
  if (galleryKind === "backgrounds") return "Backgrounds";
  if (galleryKind === "styles") return "Styles";
  return "Characters";
}

function galleryArts() {
  if (galleryKind === "styles") return allStyleArts();
  if (!galleryPack) return [];
  return galleryPack[galleryKind] || [];
}

function galleryWord() {
  if (galleryKind === "elements") return "element";
  if (galleryKind === "backgrounds") return "place";
  if (galleryKind === "styles") return "sample";
  return "character";
}

function countBlurb(n) {
  const word = galleryWord();
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function galleryGroups() {
  if (galleryKind === "styles") return styleGroups();
  if (!galleryPack) {
    return [{ id: "loading", title: "Loading…", blurb: "Art pack", arts: [] }];
  }
  const arts = galleryArts();
  const groups = [
    {
      id: "all",
      title: `All ${galleryKind}`,
      blurb: countBlurb(arts.length),
      arts,
    },
  ];
  if (galleryKind === "backgrounds") return groups;
  const bucket = {};
  const order = [];
  for (const art of arts) {
    const key = art.group || art.use || "other";
    if (!bucket[key]) {
      bucket[key] = [];
      order.push(key);
    }
    bucket[key].push(art);
  }
  for (const key of order) {
    const list = bucket[key];
    groups.push({
      id: key,
      title: GROUP_LABELS[key] || pretty(key),
      blurb: countBlurb(list.length),
      arts: list,
    });
  }
  return groups;
}

async function loadGallery() {
  if (galleryPack) return galleryPack;
  const res = await fetch(urlFromRoot("10_game_assets/manifest.json"));
  galleryPack = await res.json();
  return galleryPack;
}

function currentGalleryArts() {
  const group = galleryGroups()[itemIndex];
  return (group && group.arts) || [];
}

function comicPages(book) {
  return book[mode] || [];
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function renderMarkdown(md, imgBase) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let para = [];
  const flush = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  for (const line of lines) {
    const image = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (image) {
      flush();
      out.push(
        `<img src="${imgBase}${image[2]}" alt="${escapeHtml(image[1])}">`
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flush();
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    para.push(line);
  }
  flush();
  return out.join("\n");
}

function markNav() {
  for (const id of ["comics", "novels", "songs", "gallery", "demo"]) {
    const link = document.getElementById(`nav-${id}`);
    if (section === id) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

function markGalleryTabs() {
  for (const kind of ["characters", "elements", "backgrounds", "styles"]) {
    const tab = document.getElementById(`tab-${kind}`);
    tab.setAttribute("aria-selected", galleryKind === kind ? "true" : "false");
  }
}

function setGalleryFocusVisible(show) {
  if (galleryFocus) {
    galleryFocus.classList.toggle("hidden", !show);
    if (show) galleryFocus.removeAttribute("aria-hidden");
    else galleryFocus.setAttribute("aria-hidden", "true");
  }
  if (galleryFocusPanel) {
    galleryFocusPanel.classList.toggle("is-open", show);
    if (show) galleryFocusPanel.removeAttribute("hidden");
    else galleryFocusPanel.setAttribute("hidden", "");
  }
}

function setSection(next) {
  const allowed = { comics: 1, songs: 1, novels: 1, demo: 1, gallery: 1 };
  const prevSection = section;
  section = allowed[next] ? next : "comics";
  if (section === "comics" && prevSection !== "comics") {
    mode = "converted";
    syncVersionTabLabels();
    tabOriginal.setAttribute("aria-selected", "false");
    tabConverted.setAttribute("aria-selected", "true");
  }
  itemIndex = 0;
  pageIndex = 0;
  markNav();
  markGalleryTabs();
  comicTabs.classList.toggle("hidden", section !== "comics");
  galleryTabs.classList.toggle("hidden", section !== "gallery");
  pager.classList.toggle("hidden", section !== "comics" && section !== "gallery" && section !== "demo");
  stageComic.classList.toggle("hidden", section !== "comics");
  stageSong.classList.toggle("hidden", section !== "songs");
  stageNovel.classList.toggle("hidden", section !== "novels");
  stageDemo.classList.toggle("hidden", section !== "demo");
  stageGallery.classList.toggle("hidden", section !== "gallery");
  if (section !== "demo" && demoIframe) demoIframe.removeAttribute("src");
  if (section !== "gallery") setGalleryFocusVisible(false);
  applyBodyChrome();
  if (section === "comics") {
    shelfKicker.textContent = "Comics";
    shelfTitle.textContent = "Books";
    shelfLede.textContent = "Isabel’s notebook pages, plus crayon versions.";
  } else if (section === "songs") {
    shelfKicker.textContent = "Songs";
    shelfTitle.textContent = "Lyrics";
    shelfLede.textContent = "Isabel’s songs, each with a picture. Spelling kept as she wrote it.";
  } else if (section === "gallery") {
    shelfKicker.textContent = "Gallery";
    shelfTitle.textContent = galleryKind === "styles" ? "Looks" : "Arts";
    shelfLede.textContent =
      galleryKind === "styles"
        ? "Ten looks for games, tried on people, props, and places."
        : "Characters, props, and places redrawn from the notebook.";
  } else if (section === "demo") {
    shelfKicker.textContent = "Demo";
    shelfTitle.textContent = "Playable games";
    shelfLede.textContent = "Try Isabel’s games right here — same builds as /play/… on this site.";
  } else {
    shelfKicker.textContent = "Novels";
    shelfTitle.textContent = "Stories";
    shelfLede.textContent = "Illustrated stories grown from her notebook plots.";
  }
  showItem();
}

function modePageLabel() {
  return mode === "converted" ? "comic book" : "notebook";
}

function renderList() {
  const all = items();
  listEl.innerHTML = "";
  all.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = i === itemIndex ? "active" : "";
    let extra = item.blurb;
    if (section === "comics") {
      const n = (mode === "converted" ? item.converted : item.original).length;
      extra = `${n} ${modePageLabel()} pages · ${item.blurb}`;
    }
    if (section === "gallery") extra = item.blurb;
    if (section === "demo") {
      extra = item.parent
        ? item.blurb
          ? `${item.parent} · ${item.blurb}`
          : item.parent
        : item.blurb;
    }

    const coverSrc = shelfCover(item);
    const fallbacks = [];
    if (section === "comics") {
      const orig = item.original && item.original[0];
      const conv = item.converted && item.converted[0];
      if (orig && orig.src !== coverSrc) fallbacks.push(orig.src);
      if (conv && conv.src !== coverSrc) fallbacks.push(conv.src);
    }
    const thumb = makeShelfThumb(coverSrc, item.title, fallbacks);

    const text = document.createElement("span");
    text.className = "shelf-text";
    const titleSpan = document.createElement("span");
    titleSpan.className = "shelf-title";
    titleSpan.textContent = section === "demo" && item.kid ? item.kid : item.title;
    const small = document.createElement("small");
    small.textContent = extra;
    text.appendChild(titleSpan);
    text.appendChild(small);

    btn.appendChild(thumb);
    btn.appendChild(text);
    btn.addEventListener("click", () => {
      itemIndex = i;
      pageIndex = 0;
      showItem();
    });
    listEl.appendChild(btn);
  });
}

function showComics() {
  const book = BOOKS[itemIndex];
  const pages = comicPages(book);
  const page = pages[pageIndex];
  img.src = page.src;
  img.alt = page.caption;
  caption.textContent = page.caption;
  title.textContent = book.title;
  kicker.textContent = book.blurb;
  pos.textContent = `${pageIndex + 1} / ${pages.length}`;
  prev.disabled = pageIndex <= 0;
  next.disabled = pageIndex >= pages.length - 1;
  syncLikeButtons();
  prefetchSharedCountsForSection();
}

async function showSong() {
  const song = SONGS[itemIndex];
  title.textContent = song.title;
  kicker.textContent = song.blurb;
  songPicture.src = urlFromRoot(`${song.folder}/picture.png`);
  songPicture.alt = song.title;
  songLyrics.textContent = "Loading…";
  try {
    const res = await fetch(urlFromRoot(`${song.folder}/lyrics.txt`));
    songLyrics.textContent = await res.text();
  } catch (err) {
    songLyrics.textContent = "Could not load lyrics.";
  }
  syncLikeButtons();
  prefetchSharedCountsForSection();
}

async function showNovel() {
  const novel = NOVELS[itemIndex];
  title.textContent = novel.title;
  kicker.textContent = novel.blurb;
  stageNovel.innerHTML = "<p>Loading…</p>";
  try {
    const res = await fetch(urlFromRoot(`${novel.folder}/novel.md`));
    const md = await res.text();
    stageNovel.innerHTML = renderMarkdown(md, urlFromRoot(`${novel.folder}/`));
    stageNovel.scrollTop = 0;
  } catch (err) {
    stageNovel.innerHTML = "<p>Could not load this novel.</p>";
  }
  syncLikeButtons();
  prefetchSharedCountsForSection();
}

function galleryChipKind() {
  return GALLERY_CHIP[galleryKind] || "characters";
}

function showDemo() {
  const entry = DEMOS[itemIndex];
  title.textContent = entry.title;
  kicker.textContent = "Playable demo";
  demoIframe.title = entry.iframeTitle || entry.title;
  const src = urlFromRoot(entry.playPath);
  if (demoIframe.getAttribute("src") !== src) demoIframe.src = src;
  pager.classList.add("hidden");
  syncLikeButtons();
  prefetchSharedCountsForSection();
}

function showGallery(opts = {}) {
  if (galleryKind !== "styles" && !galleryPack) {
    title.textContent = "Gallery";
    kicker.textContent = "Loading…";
    if (galleryShelfLede) galleryShelfLede.textContent = "Loading the art pack…";
    galleryPage.removeAttribute("src");
    galleryPage.alt = "";
    galleryGrid.innerHTML = "";
    syncLikeButtons();
    setGalleryFocusVisible(false);
    pos.textContent = "0 / 0";
    prev.disabled = true;
    next.disabled = true;
    loadGallery()
      .then(() => {
        if (section === "gallery") showItem();
      })
      .catch(() => {
        if (section !== "gallery") return;
        kicker.textContent = "Could not load";
        if (galleryShelfLede) galleryShelfLede.textContent = "Could not load the gallery.";
      });
    return;
  }
  const groups = galleryGroups();
  if (itemIndex >= groups.length) itemIndex = 0;
  const group = groups[itemIndex];
  const arts = group.arts;
  if (pageIndex >= arts.length) pageIndex = Math.max(0, arts.length - 1);
  const art = arts[pageIndex];
  title.textContent = group.title;
  kicker.textContent = galleryKindLabel();
  const chip = galleryChipKind();
  if (galleryShelfLede) {
    galleryShelfLede.textContent = art
      ? `${arts.length} stickers · pick one or use ← →`
      : "No art in this group yet.";
  }
  if (!art) {
    galleryPage.removeAttribute("src");
    galleryPage.alt = "";
    galleryGrid.innerHTML = "";
    syncLikeButtons();
    setGalleryFocusVisible(false);
    pos.textContent = "0 / 0";
    prev.disabled = true;
    next.disabled = true;
    return;
  }
  galleryPage.src = ASSET + art.file;
  galleryPage.alt = artName(art);
  galleryCaption.textContent = art.note ? `${artName(art)} · ${art.note}` : artName(art);
  syncLikeButtons();
  setGalleryFocusVisible(true);
  pos.textContent = `${pageIndex + 1} / ${arts.length}`;
  prev.disabled = pageIndex <= 0;
  next.disabled = pageIndex >= arts.length - 1;
  galleryGrid.innerHTML = "";
  arts.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = i === pageIndex ? "active" : "";
    if (isGalleryArtLiked(item)) btn.classList.add("is-liked");
    btn.setAttribute("role", "listitem");
    const slot = document.createElement("span");
    slot.className = "grid-thumb-slot";
    const thumb = document.createElement("img");
    thumb.src = ASSET + item.file;
    thumb.alt = "";
    slot.appendChild(thumb);
    if (i === pageIndex) {
      slot.appendChild(document.createTextNode("Shown above"));
    }
    const chipRow = document.createElement("span");
    chipRow.className = "chip-row";
    const typeChip = document.createElement("span");
    typeChip.className = `type-chip ${chip}`;
    typeChip.textContent = galleryKind === "styles" && item.look ? item.look : galleryKindLabel();
    chipRow.appendChild(typeChip);
    const label = document.createElement("span");
    label.className = "art-label";
    label.textContent = artName(item);
    btn.appendChild(slot);
    btn.appendChild(chipRow);
    btn.appendChild(label);
    btn.addEventListener("click", () => {
      pageIndex = i;
      showItem();
    });
    galleryGrid.appendChild(btn);
  });
  if (opts.scrollGalleryShelf) {
    const active = galleryGrid.querySelector("button.active");
    if (active) {
      active.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  }
  prefetchSharedCountsForSection();
}

function showItem(opts = {}) {
  renderList();
  if (section === "songs") return showSong();
  if (section === "novels") return showNovel();
  if (section === "demo") return showDemo();
  if (section === "gallery") return showGallery(opts);
  showComics();
}

function setMode(nextMode) {
  mode = nextMode;
  syncVersionTabLabels();
  tabOriginal.setAttribute("aria-selected", mode === "original" ? "true" : "false");
  tabConverted.setAttribute("aria-selected", mode === "converted" ? "true" : "false");
  applyBodyChrome();
  pageIndex = 0;
  showItem();
}

function galleryHash(kind) {
  return kind === "characters" ? "#gallery" : `#gallery/${kind}`;
}

function setGalleryKind(kind) {
  const next =
    kind === "elements" || kind === "backgrounds" || kind === "styles" ? kind : "characters";
  const hash = galleryHash(next);
  galleryKind = next;
  itemIndex = 0;
  pageIndex = 0;
  markGalleryTabs();
  if (section === "gallery") {
    shelfTitle.textContent = galleryKind === "styles" ? "Looks" : "Arts";
    shelfLede.textContent =
      galleryKind === "styles"
        ? "Ten looks for games, tried on people, props, and places."
        : "Characters, props, and places redrawn from the notebook.";
  }
  if (location.hash !== hash) location.hash = hash;
  else if (section === "gallery") showItem();
}

function readHash() {
  let raw = (location.hash || "#comics").replace(/^#/, "");
  const [sec, kind] = raw.split("/");
  let sectionKey = sec;
  if (sec === "showcase") {
    sectionKey = "demo";
    if (location.hash !== "#demo") history.replaceState(null, "", "#demo");
  }
  if (sectionKey === "gallery") {
    galleryKind =
      kind === "elements" || kind === "backgrounds" || kind === "styles" ? kind : "characters";
  }
  setSection(sectionKey);
}

function stepPage(delta) {
  if (section === "demo") return;
  if (section === "comics") {
    const pages = comicPages(BOOKS[itemIndex]);
    const nextIndex = pageIndex + delta;
    if (nextIndex < 0 || nextIndex >= pages.length) return;
    pageIndex = nextIndex;
    showItem();
    return;
  }
  if (section === "gallery") {
    const arts = currentGalleryArts();
    const nextIndex = pageIndex + delta;
    if (nextIndex < 0 || nextIndex >= arts.length) return;
    pageIndex = nextIndex;
    showItem({ scrollGalleryShelf: true });
  }
}

tabOriginal.addEventListener("click", () => setMode("original"));
tabConverted.addEventListener("click", () => setMode("converted"));
document.getElementById("tab-characters").addEventListener("click", () => setGalleryKind("characters"));
document.getElementById("tab-elements").addEventListener("click", () => setGalleryKind("elements"));
document.getElementById("tab-backgrounds").addEventListener("click", () => setGalleryKind("backgrounds"));
document.getElementById("tab-styles").addEventListener("click", () => setGalleryKind("styles"));
if (galleryLikeBtn) galleryLikeBtn.addEventListener("click", () => toggleCurrentLike());
if (itemLikeBtn) itemLikeBtn.addEventListener("click", () => toggleCurrentLike());
prev.addEventListener("click", () => stepPage(-1));
next.addEventListener("click", () => stepPage(1));
document.addEventListener("keydown", (event) => {
  if (section !== "comics" && section !== "gallery") return;
  if (event.key === "ArrowLeft") prev.click();
  if (event.key === "ArrowRight") next.click();
});
window.addEventListener("hashchange", readHash);
syncVersionTabLabels();
readHash();
