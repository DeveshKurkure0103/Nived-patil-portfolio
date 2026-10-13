const $ = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, "0");

/* ---------- Posters ---------- */
const credits = [
  ["1971", "Film", "1971"],
  ["Artemis Fowl", "Film", "Artemis_fowl"],
  ["Cats", "Film", "cats"],
  ["Cruella", "Film", "Cruella"],
  ["Dark Phoenix", "Film", "Dark_Phoenix"],
  ["Dumbo", "Film", "Dumbo"],
  ["Dune: Part Two", "Film", "DUNE P2"],
  ["Finch", "Film", "Finch"],
  ["Forest", "Film", "Foret"],
  ["Game of Thrones", "Series", "Got"],
  ["House of the Dragon", "Series", "Hod"],
  ["The Rings of Power_S1", "Series", "LOR_ROP_S1"],
  ["The Rings of Power_S11", "Series", "LOR_ROP_S11"],
  ["Maleficent", "Film", "Malefiqve"],
  ["Mortal Kombat", "Film", "MK_VERT_MAIN_2764x4096_INTL-720x1066"],
  ["Pokémon Detective Pikachu", "Film", "Pokemon_Detective_Pikachu_teaser_poster"],
  ["Skyscraper", "Film", "skyscraper"],
  ["Sous pression", "Film", "sous_pression"],
  ["The Call of the Wild", "Film", "The_Call_of_the_Wild"],
  ["The Nutcracker", "Film", "The_Nutcracker"],
  ["The One and Only Ivan", "Film", "The_One_and_Only_Ivan_Poster"],
  ["Thor: Love and Thunder", "Film", "Thor"],
  ["The Little Mermaid", "Film", "TLM"],
  ["Top Gun: Maverick", "Film", "Top_Gun_Maverick"],
  ["The Wheel of Time", "Series", "TWOTS1"],
  ["Vikings", "Series", "Vikings"],
  ["WandaVision", "Series", "Wanda_Vision"],
];

const posterExts = [
  ".avif",
  "_converted.avif",
  "_converted.jpeg",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
];

const posterPath = (c) =>
  c.url || `assets/poster/${encodeURI(c[2])}${posterExts[0]}`;

function loadPoster(img, c, onFail) {
  let n = 0;

  img.onload = () => {
    c.url = img.src;
  };

  img.onerror = () => {
    if (n < posterExts.length) {
      img.src = `assets/poster/${encodeURI(c[2])}${posterExts[n++]}`;
    } else {
      console.warn(
        `Poster not found for "${c[0]}": assets/poster/${c[2]}`
      );
      onFail();
    }
  };

  img.onerror();
}

/* ---------- Reusable 3D coverflow engine ---------- */

function coverflow({
  stage,
  explorer,
  make,
  onChange,
  onActivate,
  activateAny = false,
}) {
  let items = [];
  let els = [];
  let active = 0;
  let sx = null;
  let downX = 0;
  let moved = false;
  let wheelLock = 0;

  const activate = (i, e, via) => {
    if (api.locked || i < 0 || !items[i]) return;

    const was = i === active;

    if (!was) {
      api.go(i);
      if (!activateAny) return;
    }

    onActivate(items[i], i, e, was, via);
  };

  const api = {
    locked: false,

    set(list) {
      items = list;
      active = 0;
      stage.replaceChildren();

      els = items.map((it, i) => {
        const el = make(it, i);
        el.classList.add("cf");

        const g = document.createElement("span");
        g.className = "glare";
        g.setAttribute("aria-hidden", "true");

        el.append(g);
        el.onclick = (e) => {
          if (e.detail === 0) activate(i, e, "key");
        };

        stage.append(el);
        return el;
      });

      layout(false);
    },

    go(i) {
      if (items.length) {
        active = (i + items.length) % items.length;
        layout(true);
      }
    },

    move(d) {
      if (items.length > 1) api.go(active + d);
    },
  };

  function layout(user) {
    const n = items.length;

    els.forEach((el, i) => {
      let d = i - active;

      if (d > n / 2) d -= n;
      else if (d < -n / 2) d += n;

      const a = Math.abs(d);

      if (el._d !== undefined && Math.abs(d - el._d) > 4) {
        el.style.transition = "none";

        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            el.style.transition = "";
          })
        );
      }

      el._d = d;
      el.style.setProperty("--o", d);
      el.style.setProperty("--a", a);
      el.style.zIndex = 20 - a;
      el.dataset.a = a > 3 ? "x" : a;
      el.classList.toggle("active", d === 0);
      el.tabIndex = d === 0 ? 0 : -1;

      if (d) {
        el.style.removeProperty("--rx");
        el.style.removeProperty("--ry");
      }
    });

    onChange(active, items[active], user);
  }

  explorer.addEventListener("pointerdown", (e) => {
    if (api.locked) return;

    sx = downX = e.clientX;
    moved = false;
  });

  explorer.addEventListener("pointermove", (e) => {
    if (api.locked) return;

    if (sx !== null && Math.abs(e.clientX - sx) > 8) {
      moved = true;
    }

    if (e.pointerType !== "mouse" || sx !== null) return;

    const a = els[active];
    if (!a) return;

    const r = a.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;

    a.style.setProperty("--ry", (x - 0.5) * 14 + "deg");
    a.style.setProperty("--rx", (0.5 - y) * 10 + "deg");
    a.style.setProperty("--gx", x * 100 + "%");
    a.style.setProperty("--gy", y * 100 + "%");
  });

  explorer.addEventListener("pointerup", (e) => {
    if (sx === null) return;

    const d = e.clientX - sx;
    sx = null;

    if (Math.abs(d) > 50) {
      api.move(d < 0 ? 1 : -1);
    } else if (Math.abs(d) <= 10) {
      const card =
        e.target.closest && e.target.closest(".cf");

      if (card) {
        activate(els.indexOf(card), e, "pointer");
      }
    }

    setTimeout(() => {
      moved = false;
    }, 0);
  });

  explorer.addEventListener("pointercancel", () => {
    sx = null;
  });

  explorer.addEventListener("pointerleave", () => {
    const a = els[active];

    if (a) {
      a.style.removeProperty("--rx");
      a.style.removeProperty("--ry");
    }
  });

  explorer.addEventListener(
    "wheel",
    (e) => {
      if (api.locked) return;

      if (
        Math.abs(e.deltaX) < Math.abs(e.deltaY) ||
        Math.abs(e.deltaX) < 30
      ) {
        return;
      }

      e.preventDefault();

      if (Date.now() - wheelLock < 450) return;

      wheelLock = Date.now();
      api.move(e.deltaX > 0 ? 1 : -1);
    },
    { passive: false }
  );

  return api;
}

/* ---------- Credits ---------- */

const lb = $("lb");
const lbi = $("lbi");
const lbc = $("lbc");

let visible = [];

const creditsFlow = coverflow({
  stage: $("carouselStage"),
  explorer: $("creditExplorer"),

  make(c) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cf-card";
    b.setAttribute("aria-label", `${c[0]}, ${c[1]}`);

    const img = new Image();
    img.alt = `${c[0]} poster`;
    img.draggable = false;

    loadPoster(img, c, () => {
      b.classList.add("noimg");
    });

    const meta = document.createElement("span");
    meta.className = "poster-meta";

    const t = document.createElement("span");
    t.className = "poster-title";
    t.textContent = c[0];

    const k = document.createElement("span");
    k.className = "poster-kind";
    k.textContent = c[1];

    meta.append(t, k);
    b.append(img, meta);

    return b;
  },

  onChange(i) {
    const n = visible.length;

    $("creditIndex").textContent =
      `${pad2(i + 1)} / ${pad2(n)}`;

    $("creditProgress").style.width =
      n ? ((i + 1) / n) * 100 + "%" : "0%";
  },

  onActivate(c) {
    lbi.src = posterPath(c);
    lbi.alt = `${c[0]} poster`;

    lbc.replaceChildren();

    const cap = document.createElement("div");
    cap.textContent = c[0];

    const cat = document.createElement("p");
    cat.textContent = c[1];

    cat.style.cssText =
      "color:var(--gold);font-size:.8rem;letter-spacing:.14em;margin-top:.45rem;text-transform:uppercase";

    const a = document.createElement("a");
    a.className = "imdb-link";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.href =
      `https://www.imdb.com/find/?q=${encodeURIComponent(c[0])}`;
    a.textContent = `Find ${c[0]} on IMDb`;

    lbc.append(cap, cat, a);
    lb.showModal();
  },
});

function setFilter(f) {
  visible = credits.filter(
    (c) => f === "All" || c[1] === f
  );

  const none = !visible.length;

  $("creditCount").textContent = visible.length;
  $("creditEmpty").hidden = !none;
  $("creditExplorer").hidden = none;
  document.querySelector(".credit-caption").hidden = none;

  creditsFlow.set(visible);
}

$("creditPrev").onclick = () => creditsFlow.move(-1);
$("creditNext").onclick = () => creditsFlow.move(1);

document.querySelectorAll(".credit-filter").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".credit-filter").forEach((x) => {
      x.classList.toggle("active", x === b);
    });

    setFilter(b.dataset.filter);
  });
});

setFilter("All");

$("lbx").onclick = () => lb.close();

lb.addEventListener("click", (e) => {
  if (e.target === lb) lb.close();
});

/* ---------- Showreels ---------- */

const reelVideo = $("rv");
const reelSection = $("reel");
const player = document.querySelector(".player");

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

reelVideo.muted = true;
reelVideo.removeAttribute("src");
reelVideo.preload = "none";

player.classList.remove("rv");
$("reelExplorer").append(player);
player.hidden = true;

const reelsFlow = coverflow({
  stage: $("reelStage"),
  explorer: $("reelExplorer"),

  make(r, i) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "reel-card";
    b.setAttribute("aria-label", `${r.title} showreel`);

    const c = document.createElement("span");
    c.className = "reel-card-content";

    const n = document.createElement("span");
    n.className = "reel-card-number";
    n.textContent = `SHOWREEL 0${i + 1}`;

    const t = document.createElement("span");
    t.className = "reel-card-title";
    t.textContent = r.title;

    const s = document.createElement("span");
    s.className = "reel-card-subtitle";
    s.textContent = r.subtitle;

    c.append(n, t, s);

    const cta = document.createElement("span");
    cta.className = "reel-cta";

    const p = document.createElement("span");
    p.className = "reel-play";
    p.setAttribute("aria-hidden", "true");
    p.textContent = "▶";

    const h = document.createElement("span");
    h.className = "reel-hint";
    h.textContent = "Play showreel";

    cta.append(p, h);
    b.append(c, cta);

    return b;
  },

  activateAny: true,

  onChange(i, r) {
    $("reelIndex").textContent =
      `${pad2(i + 1)} / ${pad2(reels.length)}`;

    $("reelProgress").style.width =
      ((i + 1) / reels.length) * 100 + "%";

    $("note").textContent = r.note;
  },

  onActivate(r, i, e, was, via) {
    if (
      via === "key" ||
      was ||
      (e.target.closest && e.target.closest(".reel-cta"))
    ) {
      playInPlace(r);
    }
  },
});

/* ---------- Video player controls ---------- */

const playBtn = document.createElement("button");

playBtn.type = "button";
playBtn.className = "player-play";
playBtn.setAttribute("aria-label", "Play showreel");

playBtn.innerHTML =
  '<span class="pp-icon" aria-hidden="true">▶</span>' +
  '<span class="pp-label"></span>';

player.append(playBtn);

const playLabel = playBtn.querySelector(".pp-label");

const showPlay = (on) => {
  playBtn.classList.toggle("hide", !on);
};

playBtn.onclick = () => { reelVideo.muted = false; reelVideo.play().catch(() => {}); };

reelVideo.addEventListener("error", () => {
  if (!reelVideo.getAttribute("src")) return;

  const er = reelVideo.error;

  playLabel.textContent =
    "Video could not load. Check the file path and format.";

  showPlay(true);

  console.error(
    "[showreel] Video error:",
    er && er.code,
    er && er.message,
    reelVideo.currentSrc
  );
});

reelVideo.addEventListener("play", () => {
  showPlay(false);
});

reelVideo.addEventListener("pause", () => {
  showPlay(true);
});

function loadReel(r) {
  if (reelVideo.getAttribute("src") !== r.src) {
    reelVideo.pause();

    reelVideo.src = r.src;
    reelVideo.preload = "metadata";
    reelVideo.load();
  }

  playLabel.textContent = `${r.title} · Play showreel`;
  showPlay(reelVideo.paused);
}

const AUTOPLAY_ON_CLICK = true;

function playReel() {
  reelVideo.muted = false;

  reelVideo.play().catch((err) => {
    console.warn(
      "[showreel] Playback request rejected:",
      err && err.name,
      err && err.message
    );

    // Fallback: try muted playback if sound-enabled playback is rejected.
    reelVideo.muted = true;

    reelVideo.play().catch((mutedErr) => {
      console.warn(
        "[showreel] Muted playback also failed:",
        mutedErr
      );

      playLabel.textContent =
        "Press play to start the showreel";

      showPlay(true);
    });
  });
}

/* ---------- In-place showreel player ---------- */

const reelEx = $("reelExplorer");

let explorerH = 0;
let closeT = 0;
let openT = 0;

const targetH = () =>
  Math.max(
    explorerH,
    Math.min(
      reelEx.clientWidth * 9 / 16,
      window.innerHeight * 0.82
    )
  );

const closeBtn = document.createElement("button");

closeBtn.type = "button";
closeBtn.className = "player-close";
closeBtn.setAttribute("aria-label", "Close video");
closeBtn.textContent = "✕ Close";
closeBtn.onclick = () => closeReel();

player.append(closeBtn);


function playInPlace(r) {
  if (reelsFlow.locked) return;

  reelsFlow.locked = true;
  clearTimeout(closeT);

  explorerH = reelEx.offsetHeight;

  player.hidden = false;
  reelEx.classList.add("dimming");

  // Load the chosen reel, but don't autoplay yet.
  loadReel(r);
  showPlay(true);

  reelEx.style.height = explorerH + "px";
  void reelEx.offsetHeight;

  reelEx.classList.add("playing");
  reelEx.style.height = targetH() + "px";

  requestAnimationFrame(() => {
    player.classList.add("on");
  });
}


function closeReel() {
  if (!reelsFlow.locked) return;

  clearTimeout(openT);
  clearTimeout(closeT);

  reelVideo.pause();

  player.classList.remove("on");

  reelEx.style.height = explorerH + "px";

  closeT = setTimeout(() => {
    player.hidden = true;

    reelEx.classList.remove("playing", "dimming");

    reelsFlow.locked = false;

    setTimeout(() => {
      if (!reelsFlow.locked) {
        reelEx.style.height = "";
      }
    }, 650);

    const a = $("reelStage").querySelector(".cf.active");

    if (a) {
      a.focus({ preventScroll: true });
    }
  }, 450);
}

window.addEventListener("resize", () => {
  if (reelEx.classList.contains("playing")) {
    reelEx.style.height = targetH() + "px";
  }
});

document.querySelector(
  ".reel-caption-row span:last-child"
).textContent =
  "Press ▶ on a reel to play it · arrows or swipe to browse";

reelsFlow.set(reels);

$("reelPrev").onclick = () => reelsFlow.move(-1);
$("reelNext").onclick = () => reelsFlow.move(1);

reelVideo.addEventListener("play", () => {
  player.classList.add("playing");
});

reelVideo.addEventListener("pause", () => {
  player.classList.remove("playing");
});

// Pause the video when the visitor scrolls away from the reel section.
new IntersectionObserver(
  ([e]) => {
    if (!e.isIntersecting) {
      reelVideo.pause();
    }
  },
  { threshold: 0.05 }
).observe(reelSection);

/* ---------- Keyboard navigation ---------- */

const inView = (el) => {
  const r = el.getBoundingClientRect();

  return (
    r.top < window.innerHeight * 0.7 &&
    r.bottom > window.innerHeight * 0.3
  );
};

document.addEventListener("keydown", (e) => {
  if (reelsFlow.locked) {
    if (e.key === "Escape") closeReel();
    return;
  }

  if (
    lb.open ||
    /INPUT|TEXTAREA/.test(document.activeElement.tagName)
  ) {
    return;
  }

  const d =
    e.key === "ArrowLeft"
      ? -1
      : e.key === "ArrowRight"
        ? 1
        : 0;

  if (!d) return;

  if (inView(reelSection)) {
    reelsFlow.move(d);
  } else if (inView($("credits"))) {
    creditsFlow.move(d);
  }
});

/* ---------- Preloader, navigation and reveal ---------- */

const pre = $("pre");
const nav = $("nav");
const burger = $("burger");
const menu = $("menu");

window.addEventListener("load", () => {
  pre.classList.add("done");
  document.querySelector(".hero").classList.add("in");
});

setTimeout(() => {
  pre.classList.add("done");
}, 4000);

window.addEventListener(
  "scroll",
  () => {
    nav.classList.toggle("solid", window.scrollY > 40);
  },
  { passive: true }
);

burger.onclick = () => {
  const o = menu.classList.toggle("open");

  burger.setAttribute("aria-expanded", o);
  burger.textContent = o ? "Close" : "Menu";
};

menu.querySelectorAll("a").forEach((a) => {
  a.onclick = () => {
    menu.classList.remove("open");
    burger.textContent = "Menu";
  };
});

const links = [...menu.querySelectorAll("a")];

const spy = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (e.isIntersecting) {
      links.forEach((l) => {
        l.classList.toggle(
          "on",
          l.getAttribute("href") === "#" + e.target.id
        );
      });
    }
  });
}, { rootMargin: "-45% 0px -50%" });

document.querySelectorAll("section").forEach((s) => {
  spy.observe(s);
});

const io = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("show");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".rv").forEach((el) => {
  io.observe(el);
});

/* ---------- Hero intro ---------- */

const hero = document.querySelector(".hero");
const intro = $("intro");
const tcEl = $("tc");

let shown = false;
let timecodeFrame = 0;

const reveal = () => {
  if (shown) return;

  shown = true;

  intro.pause();

  try {
    intro.currentTime = intro.duration || intro.currentTime;
  } catch (_) {}

  if (timecodeFrame) {
    cancelAnimationFrame(timecodeFrame);
  }

  tcEl.textContent = "00:00:00:00";
  tcEl.hidden = true;

  hero.classList.add("complete", "reveal");
};

intro.addEventListener("ended", reveal, { once: true });
intro.addEventListener("error", reveal, { once: true });

intro.querySelector("source").addEventListener(
  "error",
  reveal,
  { once: true }
);

setTimeout(() => {
  if (!shown && intro.paused && intro.currentTime === 0) {
    reveal();
  }
}, 6000);

/* ---------- Mobile intro background ---------- */

let introBg = null;

if (matchMedia("(max-width: 700px)").matches) {
  introBg = intro.cloneNode(true);

  introBg.removeAttribute("id");
  introBg.className = "intro-bg";
  introBg.setAttribute("aria-hidden", "true");

  intro.before(introBg);

  intro.addEventListener("timeupdate", () => {
    if (
      Math.abs(introBg.currentTime - intro.currentTime) > 0.3
    ) {
      introBg.currentTime = intro.currentTime;
    }
  });

  intro.addEventListener("pause", () => {
    introBg.pause();
  });

  intro.addEventListener("play", () => {
    introBg.play().catch(() => {});
  });
}

// Optional portrait intro video for phones.
if (matchMedia("(max-width: 700px)").matches) {
  fetch("assets/video/hero_intro_mobile.mp4", { method: "HEAD" })
    .then((r) => {
      if (
        r.ok &&
        /video/.test(r.headers.get("content-type") || "") &&
        !shown
      ) {
        intro.querySelector("source").src =
          "assets/video/hero_intro_mobile.mp4";

        intro.load();
        intro.play().catch(() => {});

        if (introBg) {
          introBg.querySelector("source").src =
            "assets/video/hero_intro_mobile.mp4";

          introBg.load();
          introBg.play().catch(() => {});
        }
      }
    })
    .catch(() => {});
}

new IntersectionObserver(([entry]) => {
  if (shown) return;

  if (entry.isIntersecting) {
    intro.play().catch(() => reveal());
  } else {
    intro.pause();
  }
}).observe(hero);

const tick = () => {
  if (shown) return;

  const f = Math.floor((intro.currentTime || 0) * 24);

  tcEl.textContent =
    `${pad2(Math.floor(f / 86400))}:` +
    `${pad2(Math.floor(f / 1440) % 60)}:` +
    `${pad2(Math.floor(f / 24) % 60)}:` +
    `${pad2(f % 24)}`;

  timecodeFrame = requestAnimationFrame(tick);
};

tick();

/* ---------- Back to top ---------- */

const goTop = $("goTop");

const updateGoTop = () => {
  goTop.classList.toggle("visible", window.scrollY > 350);
};

window.addEventListener("scroll", updateGoTop, { passive: true });

updateGoTop();

goTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});