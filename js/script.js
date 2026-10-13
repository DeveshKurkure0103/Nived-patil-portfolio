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
  interval = 0,
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
    hold: false,

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

  /* auto-rotate: pauses on hover, touch, hidden tab, off-screen, open dialog */
  if (interval && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let hover = false, seen = true, last = 0;
    const bump = () => { last = Date.now(); };
    explorer.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hover = true; });
    explorer.addEventListener("pointerleave", () => { hover = false; });
    explorer.addEventListener("pointerdown", bump);
    explorer.addEventListener("wheel", bump, { passive: true });
    explorer.addEventListener("focusin", bump);
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; }).observe(explorer);
    setInterval(() => {
      if (hover || !seen || api.locked || api.hold || document.hidden) return;
      if (document.querySelector("dialog[open]") || Date.now() - last < interval) return;
      api.move(1);
    }, interval);
  }

  return api;
}

// /* ---------- Credits */ ---------- */

const lb = $("lb");
const lbi = $("lbi");
const lbc = $("lbc");

let visible = [];

const creditsFlow = coverflow({
  stage: $("carouselStage"),
  explorer: $("creditExplorer"),
  activateAny: true,
  interval: 2400,

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

document.querySelectorAll(".credit-filter").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".credit-filter").forEach((x) => {
      x.classList.toggle("active", x === b);
    });

    setFilter(b.dataset.filter);
  });
});

setFilter("All");
new IntersectionObserver(([e]) => {
  creditsFlow.hold = !e.isIntersecting;
}, { threshold: 0.05 }).observe($("credits"));

$("lbx").onclick = () => lb.close();

lb.addEventListener("click", (e) => {
  if (e.target === lb) lb.close();
});

/* ---------- Showreels ---------- */

const reelVideo = $("rv");
const reelSection = $("reel");
const detail = $("reelDetail");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* t / len = where the live teaser loops inside the reel (seconds).
   Optional: add teaser: "assets/video/xyz_teaser.mp4" for a dedicated short clip. */
const reels = [
  {
    title: "FX",
    kind: "Showreel 01 · FX",
    subtitle: "SIMULATIONS · DESTRUCTION · EFFECTS",
    src: "assets/video/FXshowreel_2.5_v1.mp4",
    note: "FX work: simulations, destruction and effects shots, with breakdowns.",
    text: "I am an FX Artist specializing in creating high-quality visual effects for feature films, episodic productions, and cinematic content. My expertise lies in developing physically believable and visually compelling simulations that enhance storytelling. With extensive experience in Houdini-based workflows, I create destruction, explosions, fire, smoke, debris, particles, water, atmospheric phenomena, and procedural environments. I focus on balancing artistic direction with technical problem-solving, ensuring every simulation integrates seamlessly into the broader visual narrative.",
    tags: ["Houdini FX", "Maya", "Nuke", "Unreal Engine", "Python"],
    t: 1, len: 6,
  },
  {
    title: "Layout",
    kind: "Showreel 02 · Layout",
    subtitle: "CAMERA · STAGING · SHOT BUILDING",
    src: "assets/video/LayoutShowreel_1.0_v1.mp4",
    note: "Layout work: camera, staging and shot building for sequences.",
    text: "I am a Layout Artist specializing in translating creative vision into compelling cinematic storytelling. My work focuses on camera composition, shot staging, animation blocking, and sequence continuity, ensuring every shot effectively supports the narrative while maintaining technical accuracy. I create layouts that establish scale, mood, and character performance while providing a solid foundation for downstream departments. I collaborate closely with directors, supervisors, animation, FX, lighting, and compositing teams to deliver visually engaging and production-ready sequences.",
    tags: ["Maya", "Houdini", "Unreal Engine", "Nuke", "ShotGrid"],
    t: 1, len: 6,
  },
  {
    title: "Matchmove & Bodytrack",
    kind: "Showreel 03 · Matchmove & Bodytrack",
    subtitle: "CAMERA TRACKING · BODY TRACKING",
    src: "assets/video/Showreel_2020.mp4",
    note: "Matchmove and bodytrack: camera solves, scene reconstruction and performance tracking.",
    text: "I am a Matchmove & Body Tracking Artist specializing in camera tracking, scene reconstruction, and human performance tracking for feature films and episodic productions. My work forms the critical bridge between live-action photography and digital visual effects, ensuring that CG elements, environments, and characters integrate seamlessly into filmed footage. I create accurate camera solves, reconstruct 3D environments, and capture actor performances with precision, establishing reliable technical foundations that enable downstream departments to build convincing visual effects while preserving the authenticity of the original performance.",
    tags: ["3DEqualizer", "Maya", "Nuke"],
    t: 1, len: 6,
  },
  {
    title: "Generative AI",
    kind: "Showreel 04 · Generative AI",
    subtitle: "AI IMAGERY · VIDEO · WORKFLOWS",
    src: "assets/video/GenAI_Showreel.mp4",
    note: "Generative AI: AI-assisted imagery, concept design and cinematic workflows.",
    text: "I am a Generative AI Artist focused on leveraging artificial intelligence to accelerate content creation, visual development, and cinematic storytelling. By combining traditional visual effects expertise with emerging AI technologies, I create high-quality imagery, concept designs, animated sequences, and creative workflows that enhance both artistic exploration and production efficiency. I develop structured workflows that combine AI-generated content with traditional VFX techniques, enabling rapid iteration while maintaining production-quality standards.",
    tags: ["ComfyUI", "Stable Diffusion", "Midjourney", "Runway", "Kling"],
    t: 1, len: 6,
  },
];
let curReel = 0;
let teasersOn = true;

function syncTeasers() {
  [...$("reelStage").children].forEach((el, j) => {
    const v = el.querySelector("video");
    if (!v) return;
    if (j === curReel && teasersOn && !calm && detail.hidden) v.play().catch(() => {});
    else v.pause();
  });
}

const reelsFlow = coverflow({
  stage: $("reelStage"),
  explorer: $("reelExplorer"),
  activateAny: true,
  interval: 4000,

  make(r, i) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "reel-card cf-card";
    b.setAttribute("aria-label", `${r.title} showreel`);

    const v = document.createElement("video");
    v.className = "reel-video";
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.tabIndex = -1;
    v.setAttribute("aria-hidden", "true");
    v.src = r.teaser || r.src;
    if (r.teaser) v.loop = true;
    else {
      v.addEventListener("loadedmetadata", () => { v.currentTime = r.t; });
      v.addEventListener("timeupdate", () => {
        if (v.currentTime > r.t + r.len) v.currentTime = r.t;
      });
    }

    const c = document.createElement("span");
    c.className = "reel-card-content";

    const n = document.createElement("span");
    n.className = "reel-card-number";
    n.textContent = `SHOWREEL 0${i + 1}`;

    const t = document.createElement("span");
    t.className = "reel-card-title" + (r.title.length > 8 ? " long" : "");
    t.textContent = r.title;

    const s = document.createElement("span");
    s.className = "reel-card-subtitle";
    s.textContent = r.subtitle;

    c.append(n, t, s);

    const cta = document.createElement("span");
    cta.className = "reel-cta";
    cta.innerHTML = '<span class="reel-play" aria-hidden="true">▶</span><span class="reel-hint">Open reel</span>';

    b.append(v, c, cta);
    return b;
  },

  onChange(i, r) {
    curReel = i;
    $("reelIndex").textContent = `${pad2(i + 1)} / ${pad2(reels.length)}`;
    $("reelProgress").style.width = ((i + 1) / reels.length) * 100 + "%";
    $("note").textContent = r.note;
    syncTeasers();
  },

  onActivate(r) {
    openReel(r);
  },
});
/* ---------- Description card + full reel ---------- */

function openReel(r) {
  $("rdKind").textContent = r.kind;
  $("rdTitle").textContent = r.title;
  $("rdText").textContent = r.text;
  $("rdTags").replaceChildren(
    ...r.tags.map((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      return li;
    })
  );

  if (reelVideo.getAttribute("src") !== r.src) {
    reelVideo.pause();
    reelVideo.src = r.src;
  }

  const wasHidden = detail.hidden;
  detail.hidden = false;
  reelsFlow.hold = true;
  syncTeasers();

  reelVideo.muted = false;
  reelVideo.play().catch(() => {
    reelVideo.muted = true;
    reelVideo.play().catch(() => {});
  });

  if (wasHidden) detail.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeReel() {
  if (detail.hidden) return;
  reelVideo.pause();
  detail.hidden = true;
  reelsFlow.hold = false;
  syncTeasers();
}

$("rdClose").onclick = closeReel;

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeReel();
});

document.querySelector(".reel-caption-row span:last-child").textContent =
  "Plays live on each card · click to open the full reel";

reelsFlow.set(reels);

// Pause everything when the visitor scrolls away from the reel section.
new IntersectionObserver(
  ([e]) => {
    teasersOn = e.isIntersecting;
    if (!e.isIntersecting) reelVideo.pause();
    syncTeasers();
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