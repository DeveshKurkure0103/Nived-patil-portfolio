const credits = [
  ["1971", "Film", "1971.jpg"],
  ["Artemis Fowl", "Film", "Artemis_fowl.jpg"],
  ["Cats", "Film", "cats.jpg"],
  ["Cruella", "Film", "Cruella.jpg"],
  ["Dark Phoenix", "Film", "Dark_Phoenix.jpg"],
  ["Dumbo", "Film", "Dumbo.jpg"],
  ["Dune: Part Two", "Film", "DUNE P2.jpg"],
  ["Finch", "Film", "Finch.jpg"],
  ["Forest", "Film", "Foret.jpg"],
  ["Game of Thrones", "Series", "Got.jpg"],
  ["House of the Dragon", "Series", "Hod.jpg"],
  ["The Rings of Power_S1", "Series", "LOR_ROP_S1.jpg"],
  ["The Rings of Power_S11", "Series", "LOR_ROP_S11.jpg"],
  ["Maleficent", "Film", "Malefique.jpg"],
  ["Mortal Kombat", "Film", "MK_VERT_MAIN_2764x4096_INTL-720x1066.jpg"],
  [
    "Pokémon Detective Pikachu",
    "Film",
    "Pokemon_Detective_Pikachu_teaser_poster.jpg",
  ],
  ["Skyscraper", "Film", "skyscraper.jpg"],
  ["Sous pression", "Film", "sous_pression.jpg"],
  ["The Call of the Wild", "Film", "The_Call_of_the_Wild.jpeg"],
  ["The Nutcracker", "Film", "The_Nutcracker.jpg"],
  ["The One and Only Ivan", "Film", "The_One_and_Only_Ivan_Poster.jpg"],
  ["Thor: Love and Thunder", "Film", "Thor.jpg"],
  ["The Little Mermaid", "Film", "TLM.jpg"],
  ["Top Gun: Maverick", "Film", "Top_Gun_Maverick.jpg"],
  ["The Wheel of Time", "Series", "TWOTS1.jpg"],
  ["Vikings", "Series", "Vikings.jpg"],
  ["WandaVision", "Series", "Wanda_Vision.jpeg"],
];
const stage = document.getElementById("carouselStage");
const creditCount = document.getElementById("creditCount");
const creditIndex = document.getElementById("creditIndex");
const creditProgress = document.getElementById("creditProgress");
const creditEmpty = document.getElementById("creditEmpty");
const creditExplorer = document.getElementById("creditExplorer");
const creditPrev = document.getElementById("creditPrev");
const creditNext = document.getElementById("creditNext");
let activeFilter = "All",
  activeIndex = 0,
  visibleCredits = [...credits],
  touchStartX = null;
const posterPath = (item) => `assets/poster/${encodeURI(item[2])}`;
function makePoster(item, position, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `credit-poster ${position}`;
  button.setAttribute(
    "aria-label",
    `${item[0]}, ${item[1]}. Select to view details`,
  );
  const img = document.createElement("img");
  img.src = posterPath(item);
  img.alt = `${item[0]} poster`;
  img.loading = "lazy";
  img.onerror = () => {
    button.classList.add("poster-unavailable");
    button.remove();
  };
  const meta = document.createElement("span");
  meta.className = "poster-meta";
  const title = document.createElement("span");
  title.className = "poster-title";
  title.textContent = item[0];
  const kind = document.createElement("span");
  kind.className = "poster-kind";
  kind.textContent = item[1];
  meta.append(title, kind);
  button.append(img, meta);
  button.addEventListener("click", () => {
    if (position !== "active") {
      activeIndex = index;
      renderCredits();
      return;
    }
    lbi.src = posterPath(item);
    lbi.alt = `${item[0]} poster`;
    lbc.replaceChildren();
    const caption = document.createElement("div");
    caption.textContent = item[0];
    const category = document.createElement("p");
    category.textContent = item[1];
    category.style.cssText =
      "color:var(--gold);font-size:.8rem;letter-spacing:.14em;margin-top:.45rem;text-transform:uppercase";
    const imdb = document.createElement("a");
    imdb.className = "imdb-link";
    imdb.href = `https://www.imdb.com/find/?q=${encodeURIComponent(item[0])}`;
    imdb.target = "_blank";
    imdb.rel = "noopener noreferrer";
    imdb.textContent = `Find ${item[0]} on IMDb`;
    lbc.append(caption, category, imdb);
    lb.showModal();
  });
  return button;
}
function renderCredits() {
  visibleCredits = credits.filter(
    ([title, kind]) => activeFilter === "All" || kind === activeFilter,
  );
  activeIndex = visibleCredits.length
    ? ((activeIndex % visibleCredits.length) + visibleCredits.length) %
      visibleCredits.length
    : 0;
  stage.replaceChildren();
  creditCount.textContent = visibleCredits.length;
  creditEmpty.hidden = visibleCredits.length !== 0;
  creditExplorer.hidden = visibleCredits.length === 0;
  document.querySelector(".credit-caption").hidden =
    visibleCredits.length === 0;
  if (!visibleCredits.length) {
    creditIndex.textContent = "00 / 00";
    creditProgress.style.width = "0%";
    return;
  }
  const prev =
    (activeIndex - 1 + visibleCredits.length) % visibleCredits.length;
  const next = (activeIndex + 1) % visibleCredits.length;
  if (visibleCredits.length > 1)
    stage.append(makePoster(visibleCredits[prev], "side left", prev));
  stage.append(makePoster(visibleCredits[activeIndex], "active", activeIndex));
  if (visibleCredits.length > 2)
    stage.append(makePoster(visibleCredits[next], "side right", next));
  creditIndex.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(visibleCredits.length).padStart(2, "0")}`;
  creditProgress.style.width = `${((activeIndex + 1) / visibleCredits.length) * 100}%`;
  creditPrev.disabled = creditNext.disabled = visibleCredits.length < 2;
  creditPrev.style.opacity = creditNext.style.opacity =
    visibleCredits.length < 2 ? ".35" : "1";
}
function moveCredit(step) {
  if (visibleCredits.length > 1) {
    activeIndex =
      (activeIndex + step + visibleCredits.length) % visibleCredits.length;
    renderCredits();
  }
}
creditPrev.addEventListener("click", () => moveCredit(-1));
creditNext.addEventListener("click", () => moveCredit(1));
document.querySelectorAll(".credit-filter").forEach((button) =>
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    activeIndex = 0;
    document
      .querySelectorAll(".credit-filter")
      .forEach((item) => item.classList.toggle("active", item === button));
    renderCredits();
  }),
);
creditExplorer.addEventListener(
  "touchstart",
  (event) => {
    touchStartX = event.changedTouches[0].clientX;
  },
  { passive: true },
);
creditExplorer.addEventListener(
  "touchend",
  (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 45) moveCredit(delta < 0 ? 1 : -1);
    touchStartX = null;
  },
  { passive: true },
);
creditExplorer.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;
  const active = stage.querySelector(".credit-poster.active");
  if (!active) return;
  const rect = active.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  active.style.transform = `rotateX(${-y * 5}deg) rotateY(${x * 7}deg) translateY(-3px)`;
});
creditExplorer.addEventListener("pointerleave", () => {
  const active = stage.querySelector(".credit-poster.active");
  if (active) active.style.transform = "";
});
document.addEventListener("keydown", (event) => {
  if (lb.open || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (event.key === "ArrowLeft") {
    if (
      reelSection.getBoundingClientRect().top < innerHeight &&
      reelSection.getBoundingClientRect().bottom > 0
    )
      moveReel(-1);
    else moveCredit(-1);
  }
  if (event.key === "ArrowRight") {
    if (
      reelSection.getBoundingClientRect().top < innerHeight &&
      reelSection.getBoundingClientRect().bottom > 0
    )
      moveReel(1);
    else moveCredit(1);
  }
});
renderCredits();
lbx.onclick = () => lb.close();
lb.addEventListener("click", (e) => {
  if (e.target === lb) lb.close();
});
// preloader + hero
addEventListener("load", () => {
  pre.classList.add("done");
  document.querySelector(".hero").classList.add("in");
});
setTimeout(() => pre.classList.add("done"), 4000);
// nav
const nav = document.getElementById("nav");
addEventListener("scroll", () => nav.classList.toggle("solid", scrollY > 40), {
  passive: true,
});
burger.onclick = () => {
  const o = menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", o);
  burger.textContent = o ? "Close" : "Menu";
};
menu.querySelectorAll("a").forEach(
  (a) =>
    (a.onclick = () => {
      menu.classList.remove("open");
      burger.textContent = "Menu";
    }),
);
const links = [...menu.querySelectorAll("a")];
const spy = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting)
        links.forEach((l) =>
          l.classList.toggle(
            "on",
            l.getAttribute("href") === "#" + e.target.id,
          ),
        );
    }),
  { rootMargin: "-45% 0px -50%" },
);
document.querySelectorAll("section").forEach((s) => spy.observe(s));
// reveal
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("show");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.12 },
);
document.querySelectorAll(".rv").forEach((el, i) => {
  el.style.transitionDelay =
    (el.classList.contains("card") ? (i % 5) * 70 : 0) + "ms";
  io.observe(el);
});
// Interactive showreel carousel. Selecting a card loads that reel.
const reelVideo = document.getElementById("rv");
const reelSection = document.getElementById("reel");
const reelStage = document.getElementById("reelStage");
const reelPrev = document.getElementById("reelPrev");
const reelNext = document.getElementById("reelNext");
const reelIndex = document.getElementById("reelIndex");
const reelProgress = document.getElementById("reelProgress");
const note = document.getElementById("note");
const reels = [
  {
    title: "FX",
    subtitle: "SIMULATIONS · DESTRUCTION · EFFECTS",
    src: "assets/video/FXshowreel_2.5_v1.mp4",
    note: "FX work: simulations, destruction and effects shots, with breakdowns.",
  },
  {
    title: "LAYOUT",
    subtitle: "CAMERA · STAGING · SHOT BUILDING",
    src: "assets/video/LayoutShowreel_1.0_v1.mp4",
    note: "Layout work: camera, staging and shot building for sequences.",
  },
  {
    title: "2020",
    subtitle: "EARLIER SHOWREEL",
    src: "assets/video/Showreel_2020.mp4",
    note: "Earlier work from the 2020 reel.",
  },
];
let activeReel = 0,
  reelTouchStartX = null;
reelVideo.muted = true;
reelVideo.volume = 1;
function selectReel(index, autoplay = true) {
  activeReel = (index + reels.length) % reels.length;
  const item = reels[activeReel];
  reelStage.replaceChildren();
  const previous = (activeReel - 1 + reels.length) % reels.length;
  const next = (activeReel + 1) % reels.length;
  const addCard = (idx, position) => {
    const reel = reels[idx],
      card = document.createElement("button");
    card.type = "button";
    card.className = `reel-card ${position}`;
    card.setAttribute(
      "aria-label",
      `${reel.title} showreel${position === "active" ? ", selected" : ", select this reel"}`,
    );
    const content = document.createElement("span");
    content.className = "reel-card-content";
    const number = document.createElement("span");
    number.className = "reel-card-number";
    number.textContent = `SHOWREEL 0${idx + 1}`;
    const title = document.createElement("span");
    title.className = "reel-card-title";
    title.textContent = reel.title;
    const subtitle = document.createElement("span");
    subtitle.className = "reel-card-subtitle";
    subtitle.textContent = reel.subtitle;
    content.append(number, title, subtitle);
    card.append(content);
    card.addEventListener("click", () => {
      if (idx === activeReel) {
        reelVideo.play().catch(() => {});
      } else {
        selectReel(idx, true);
      }
    });
    reelStage.append(card);
  };
  addCard(previous, "side left");
  addCard(activeReel, "active");
  addCard(next, "side right");
  reelIndex.textContent = `0${activeReel + 1} / 0${reels.length}`;
  reelProgress.style.width = `${((activeReel + 1) / reels.length) * 100}%`;
  note.textContent = item.note;
  if (reelVideo.getAttribute("src") !== item.src) {
    reelVideo.pause();
    reelVideo.src = item.src;
    reelVideo.muted = true;
    reelVideo.load();
  }
  if (autoplay) reelVideo.play().catch(() => {});
}
function moveReel(step) {
  selectReel(activeReel + step, true);
}
reelPrev.addEventListener("click", () => moveReel(-1));
reelNext.addEventListener("click", () => moveReel(1));
const reelExplorer = document.getElementById("reelExplorer");
reelExplorer.addEventListener(
  "touchstart",
  (e) => {
    reelTouchStartX = e.changedTouches[0].clientX;
  },
  { passive: true },
);
reelExplorer.addEventListener(
  "touchend",
  (e) => {
    if (reelTouchStartX === null) return;
    const delta = e.changedTouches[0].clientX - reelTouchStartX;
    if (Math.abs(delta) > 45) moveReel(delta < 0 ? 1 : -1);
    reelTouchStartX = null;
  },
  { passive: true },
);
reelExplorer.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const active = reelStage.querySelector(".reel-card.active");
  if (!active) return;
  const rect = active.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  active.style.transform = `rotateX(${-y * 4}deg) rotateY(${x * 6}deg) translateY(-3px)`;
});
reelExplorer.addEventListener("pointerleave", () => {
  const active = reelStage.querySelector(".reel-card.active");
  if (active) active.style.transform = "";
});
selectReel(0, false);
const reelObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !reelAutoStarted) {
        reelAutoStarted = true;
        reelVideo.muted = true;
        reelVideo.play().catch(() => {});
      } else if (!entry.isIntersecting && reelAutoStarted) {
        reelVideo.pause();
      }
    });
  },
  { threshold: 0.35 },
);
reelObserver.observe(reelSection);
// Intro plays once. Hide all hero content during playback; then stop the video/timecode
// and reveal the wallpaper, logo, text, buttons, and scroll cue.
const hero = document.querySelector(".hero");
const intro = document.getElementById("intro");
const tcEl = document.getElementById("tc");
let shown = false;
let timecodeFrame = 0;
const reveal = () => {
  if (shown) return;
  shown = true;
  intro.pause();
  try {
    intro.currentTime = intro.duration || intro.currentTime;
  } catch (_) {}
  if (timecodeFrame) cancelAnimationFrame(timecodeFrame);
  tcEl.textContent = "00:00:00:00";
  tcEl.hidden = true;
  hero.classList.add("complete", "reveal");
};
intro.addEventListener("ended", reveal, { once: true });
intro.addEventListener("error", reveal, { once: true });
intro.querySelector("source").addEventListener("error", reveal, { once: true });
// Fallback only for failed/blocked playback; do not reveal early while video is playing.
setTimeout(() => {
  if (!shown && intro.paused && intro.currentTime === 0) reveal();
}, 6000);
const heroObserver = new IntersectionObserver(([entry]) => {
  if (shown) return;
  if (entry.isIntersecting) intro.play().catch(() => reveal());
  else intro.pause();
});
heroObserver.observe(hero);
// Timecode follows the intro video's own playback position and stops with the video.
const pad = (n) => String(n).padStart(2, "0");
const tick = () => {
  if (shown) return;
  const frames = Math.floor((intro.currentTime || 0) * 24);
  tcEl.textContent = `${pad(Math.floor(frames / 86400))}:${pad(Math.floor(frames / 1440) % 60)}:${pad(Math.floor(frames / 24) % 60)}:${pad(frames % 24)}`;
  timecodeFrame = requestAnimationFrame(tick);
};
tick();
const goTop = document.getElementById("goTop");
const updateGoTop = () =>
  goTop.classList.toggle("visible", window.scrollY > 350);
addEventListener("scroll", updateGoTop, { passive: true });
updateGoTop();
goTop.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" }),
);
