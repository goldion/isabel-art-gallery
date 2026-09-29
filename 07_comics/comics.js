const CLEAN = "../02_cleaned/";
const CONV = "converted/";

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
    original: imgs([957, 958, 959, 960, 961]),
    converted: [conv("cats-1.png", "Ivi is a cat")],
  },
  {
    id: "dragon-ville",
    title: "Hum Dragon Ville",
    blurb: "Hatching, picnic, portal",
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
    original: imgs([970, 971, 972, 973, 974, 975, 976, 977, 1008, 1010]),
    converted: [conv("dragon-city-1.png", "In Dragon City")],
  },
  {
    id: "next-door",
    title: "Next door",
    blurb: "2018 / 2026",
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
    original: imgs([1002, 1003, 1015, 1035, 1036, 1055, 1065]),
    converted: [conv("pond-1.png", "The pond team")],
  },
  {
    id: "more",
    title: "More comics",
    blurb: "The rest of the notebook",
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

const booksEl = document.getElementById("books");
const img = document.getElementById("page");
const caption = document.getElementById("caption");
const title = document.getElementById("book-title");
const kicker = document.getElementById("book-kicker");
const pos = document.getElementById("pos");
const prev = document.getElementById("prev");
const next = document.getElementById("next");
const tabOriginal = document.getElementById("tab-original");
const tabConverted = document.getElementById("tab-converted");

let bookIndex = 0;
let pageIndex = 0;
let mode = "original";

function pagesOf(book) {
  return book[mode] || [];
}

function renderNav() {
  booksEl.innerHTML = "";
  BOOKS.forEach((book, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = i === bookIndex ? "active" : "";
    const n = (mode === "converted" ? book.converted : book.original).length;
    btn.innerHTML = `${book.title}<small>${n} ${mode} pages · ${book.blurb}</small>`;
    btn.addEventListener("click", () => openBook(i));
    booksEl.appendChild(btn);
  });
}

function setMode(nextMode) {
  mode = nextMode;
  tabOriginal.setAttribute("aria-selected", mode === "original" ? "true" : "false");
  tabConverted.setAttribute("aria-selected", mode === "converted" ? "true" : "false");
  pageIndex = 0;
  showPage();
}

function showPage() {
  const book = BOOKS[bookIndex];
  const pages = pagesOf(book);
  if (!pages.length) {
    img.removeAttribute("src");
    caption.textContent = "No pages in this tab yet.";
    pos.textContent = "0 / 0";
    prev.disabled = true;
    next.disabled = true;
    renderNav();
    return;
  }
  if (pageIndex >= pages.length) pageIndex = 0;
  const page = pages[pageIndex];
  img.src = page.src;
  img.alt = page.caption;
  caption.textContent = page.caption;
  title.textContent = book.title;
  kicker.textContent = book.blurb;
  pos.textContent = `${pageIndex + 1} / ${pages.length}`;
  prev.disabled = pageIndex <= 0;
  next.disabled = pageIndex >= pages.length - 1;
  renderNav();
}

function openBook(i) {
  bookIndex = i;
  pageIndex = 0;
  showPage();
}

tabOriginal.addEventListener("click", () => setMode("original"));
tabConverted.addEventListener("click", () => setMode("converted"));
prev.addEventListener("click", () => {
  if (pageIndex > 0) {
    pageIndex -= 1;
    showPage();
  }
});
next.addEventListener("click", () => {
  if (pageIndex < pagesOf(BOOKS[bookIndex]).length - 1) {
    pageIndex += 1;
    showPage();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") prev.click();
  if (event.key === "ArrowRight") next.click();
});

openBook(0);
