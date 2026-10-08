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
    title: "Cat kingdom",
    blurb: "Ivi is a cat",
    shelfCover: "07_comics/converted/cats-1.png",
    original: imgs([957, 958, 959, 960, 961]),
    converted: [conv("cats-1.png", "Ivi is a cat")],
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
    shelfCover: "10_game_assets/demo/fruit-catcher.png?v=22",
    iframeTitle: "Catch the fruit!",
  },
  {
    id: "clover-wheel",
    title: "Race the clover wheel!",
    kid: "Race the clover wheel!",
    parent: "Greenness Queen vs sunglasses 小花 · 3 laps",
    blurb: "",
    kind: "play",
    playPath: "play/clover-wheel/?v=23",
    shelfCover: "10_game_assets/demo/clover-wheel.png?v=22",
    iframeTitle: "Race the clover wheel!",
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
    id: "god-sisters-stroll",
    title: "Walk with your god sister",
    kid: "Walk with your god sister",
    parent: "Garden, park, pond · F waves · E talks",
    blurb: "",
    kind: "play",
    playPath: "play/god-sisters-stroll/?v=2",
    shelfCover: "10_game_assets/demo/god-sisters-stroll.png?v=22",
    iframeTitle: "Walk with your god sister",
  },
  {
    id: "transform-dragon-city",
    title: "Transform Dragon City!",
    kid: "Transform Dragon City!",
    parent: "Move · jump · transform · rescue",
    blurb: "",
    kind: "play",
    playPath: "play/transform-dragon-city/?v=22",
    shelfCover: "10_game_assets/demo/transform-dragon-city.png?v=22",
    iframeTitle: "Transform Dragon City",
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
  cats: `${CONV}cats-1.png`,
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
const galleryScroll = document.querySelector("#stage-gallery .gallery-scroll");
const galleryFocus = document.getElementById("gallery-focus");
const galleryPage = document.getElementById("gallery-page");
const galleryCaption = document.getElementById("gallery-caption");
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
}

function showGallery() {
  if (galleryKind !== "styles" && !galleryPack) {
    title.textContent = "Gallery";
    kicker.textContent = "Loading…";
    if (galleryShelfLede) galleryShelfLede.textContent = "Loading the art pack…";
    galleryPage.removeAttribute("src");
    galleryPage.alt = "";
    galleryGrid.innerHTML = "";
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
    setGalleryFocusVisible(false);
    pos.textContent = "0 / 0";
    prev.disabled = true;
    next.disabled = true;
    return;
  }
  galleryPage.src = ASSET + art.file;
  galleryPage.alt = artName(art);
  galleryCaption.textContent = art.note ? `${artName(art)} · ${art.note}` : artName(art);
  setGalleryFocusVisible(true);
  pos.textContent = `${pageIndex + 1} / ${arts.length}`;
  prev.disabled = pageIndex <= 0;
  next.disabled = pageIndex >= arts.length - 1;
  galleryGrid.innerHTML = "";
  arts.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = i === pageIndex ? "active" : "";
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
  const active = galleryGrid.querySelector("button.active");
  if (active && galleryScroll) {
    const top = active.offsetTop - Math.max(0, (galleryScroll.clientHeight - active.offsetHeight) / 2);
    galleryScroll.scrollTo({ top, behavior: "smooth" });
  }
}

function showItem() {
  renderList();
  if (section === "songs") return showSong();
  if (section === "novels") return showNovel();
  if (section === "demo") return showDemo();
  if (section === "gallery") return showGallery();
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
    showItem();
  }
}

tabOriginal.addEventListener("click", () => setMode("original"));
tabConverted.addEventListener("click", () => setMode("converted"));
document.getElementById("tab-characters").addEventListener("click", () => setGalleryKind("characters"));
document.getElementById("tab-elements").addEventListener("click", () => setGalleryKind("elements"));
document.getElementById("tab-backgrounds").addEventListener("click", () => setGalleryKind("backgrounds"));
document.getElementById("tab-styles").addEventListener("click", () => setGalleryKind("styles"));
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
