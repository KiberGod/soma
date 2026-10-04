(() => {
  "use strict";

  // Installers are attached to GitHub Releases of this repo (never committed
  // into it). The list is read from the public GitHub API.
  const RELEASES_API = "https://api.github.com/repos/KiberGod/soma/releases";
  const RELEASES_PAGE = "https://github.com/KiberGod/soma/releases";
  const LANG_KEY = "soma-site-lang";
  const RELEASES_CACHE_KEY = "soma-site-releases";
  const RELEASES_CACHE_MS = 10 * 60 * 1000;

  const dict = window.SOMA_I18N;
  const OS_NAMES = { windows: "Windows", macos: "macOS", linux: "Linux" };
  const OS_ORDER = ["windows", "macos", "linux"];

  // ---- Small helpers -------------------------------------------------------

  const $ = (sel) => document.querySelector(sel);
  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

  function storage(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch {
      return null;
    }
    return null;
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const child of [].concat(children)) if (child) node.append(child);
    return node;
  }

  // ---- Language ------------------------------------------------------------

  /** Saved choice first; otherwise the browser's languages - Russian-reading
   * locales get RU, everything else EN. */
  function detectLang() {
    const saved = storage(LANG_KEY);
    if (saved && dict[saved]) return saved;
    const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const l of langs) {
      const code = String(l || "").toLowerCase().split("-")[0];
      if (["ru", "be", "kk"].includes(code)) return "ru";
      if (code) return "en";
    }
    return "en";
  }

  let lang = detectLang();
  const t = () => dict[lang];

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t().meta.title;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = get(t(), node.dataset.i18n);
      if (typeof value === "string") node.textContent = value;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
      const value = get(t(), node.dataset.i18nHtml);
      if (typeof value === "string") node.innerHTML = value;
    });
    document.querySelectorAll("img[data-shot]").forEach((img) => {
      img.src = `assets/shots/${lang}/${img.dataset.shot}.webp`;
    });
    startThemeCycle();
    /** Starts the hero's theme crossfade once all four screenshots are loaded
   * (and again after a language switch swaps them for the other language). */
  function startThemeCycle() {
    const stack = $(".theme-stack");
    if (!stack) return;
    stack.classList.remove("is-ready");
    const images = [...stack.querySelectorAll("img")];
    const loaded = images.map((img) =>
      (img.decode ? img.decode() : Promise.resolve()).catch(() => {}),
    );
    const src = images[0] && images[0].src;
    Promise.all(loaded).then(() => {
      // A newer switch may have replaced these images meanwhile.
      if (images[0] && images[0].src === src) stack.classList.add("is-ready");
    });
  }

  document.querySelectorAll(".lang-switch button").forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-checked", String(active));
    });
    renderDownloads();
  }

  document.querySelectorAll(".lang-switch button").forEach((btn) =>
    btn.addEventListener("click", () => {
      lang = btn.dataset.lang;
      storage(LANG_KEY, lang);
      applyLang();
    }),
  );

  // ---- Operating system ----------------------------------------------------

  /** "windows" | "macos" | "linux" | null (a phone, tablet or anything else
   * Soma has no build for). */
  function detectOs() {
    const ua = navigator.userAgent || "";
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    const s = `${platform} ${ua}`.toLowerCase();
    if (/android|iphone|ipad|ipod|mobile/.test(s)) return null;
    // iPadOS reports itself as a Mac - a touch screen gives it away.
    if (/mac/.test(s) && navigator.maxTouchPoints > 1) return null;
    if (/win/.test(s)) return "windows";
    if (/mac/.test(s)) return "macos";
    if (/linux|x11|cros/.test(s)) return /cros/.test(s) ? null : "linux";
    return null;
  }

  const os = detectOs();

  // ---- Releases ------------------------------------------------------------

  /** Which OS an installer file is for, and what kind it is - by extension. */
  function classifyAsset(name) {
    const n = name.toLowerCase();
    if (n.endsWith(".sig") || n.endsWith(".json")) return null;
    if (n.endsWith(".msi")) return { os: "windows", kind: "msi", rank: 1 };
    if (n.endsWith(".exe")) return { os: "windows", kind: "exe", rank: 0 };
    if (n.endsWith(".dmg")) return { os: "macos", kind: "dmg", rank: 0 };
    if (n.endsWith(".appimage")) return { os: "linux", kind: "appimage", rank: 0 };
    if (n.endsWith(".deb")) return { os: "linux", kind: "deb", rank: 1 };
    if (n.endsWith(".rpm")) return { os: "linux", kind: "rpm", rank: 2 };
    return null;
  }

  /** Releases newest first, each with its installers grouped by OS. Drafts
   * and releases without any installer are left out. */
  function normalizeReleases(raw) {
    return raw
      .filter((r) => !r.draft)
      .map((r) => {
        const byOs = {};
        for (const a of r.assets || []) {
          const info = classifyAsset(a.name);
          if (!info) continue;
          (byOs[info.os] ||= []).push({ ...info, name: a.name, url: a.browser_download_url, size: a.size });
        }
        for (const list of Object.values(byOs)) list.sort((x, y) => x.rank - y.rank);
        return {
          version: String(r.tag_name || r.name || "").replace(/^v/i, ""),
          date: r.published_at,
          url: r.html_url,
          prerelease: r.prerelease,
          byOs,
        };
      })
      .filter((r) => Object.keys(r.byOs).length > 0);
  }

  // Cached for a few minutes per tab - the unauthenticated API allows 60
  // requests an hour per visitor.
  async function loadReleases() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(RELEASES_CACHE_KEY) || "null");
      if (cached && Date.now() - cached.at < RELEASES_CACHE_MS) return cached.releases;
    } catch {
      /* no cache */
    }
    const res = await fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const releases = normalizeReleases(await res.json());
    try {
      sessionStorage.setItem(RELEASES_CACHE_KEY, JSON.stringify({ at: Date.now(), releases }));
    } catch {
      /* fine */
    }
    return releases;
  }

  // "loading" | "ready" | "failed"
  let releasesState = "loading";
  let releases = [];

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { dateStyle: "medium" }) : "";
  const formatSize = (bytes) => (bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : "");

  // ---- Rendering -----------------------------------------------------------

  function downloadButton(file, primary) {
    const a = el("a", { class: `btn ${primary ? "btn--primary" : "btn--ghost"}`, href: file.url, rel: "nofollow" });
    a.append(el("span", { text: t().download.kinds[file.kind] }));
    if (file.size) a.append(el("span", { class: "btn__meta", text: formatSize(file.size) }));
    return a;
  }

  /** The hero button, its note, and the big "your system" card. */
  function renderPrimary() {
    const d = t().download;
    const latest = releases[0];
    const files = latest && os ? latest.byOs[os] || [] : [];
    const heroBtn = $("#hero-download");
    const heroLabel = $("#hero-download-label");
    const heroNote = $("#hero-note");
    const card = $("#download-card");
    const actions = $("#download-card-actions");
    actions.replaceChildren();

    heroLabel.textContent = os ? d.buttonFor(OS_NAMES[os]) : d.button;
    $("#download-card-label").textContent = os ? `${d.detected}: ${OS_NAMES[os]}` : "";
    card.classList.toggle("is-muted", false);

    if (releasesState === "ready" && files.length) {
      heroBtn.href = files[0].url;
      heroNote.textContent = "";
      $("#download-card-title").textContent = `Soma ${latest.version}`;
      $("#download-card-meta").textContent = d.latest(latest.version, formatDate(latest.date));
      files.forEach((f, i) => actions.append(downloadButton(f, i === 0)));
      return;
    }

    heroBtn.href = "#download";
    card.classList.add("is-muted");
    if (!os) {
      heroNote.textContent = d.noteUnsupported;
      $("#download-card-title").textContent = d.unsupported;
      $("#download-card-meta").textContent = d.unsupportedMeta;
    } else if (releasesState === "ready" && releases.length === 0) {
      heroNote.textContent = "";
      $("#download-card-title").textContent = d.noReleases;
      $("#download-card-meta").textContent = d.noReleasesMeta;
    } else if (releasesState === "ready") {
      heroNote.textContent = "";
      $("#download-card-title").textContent = d.noBuildForOs(OS_NAMES[os]);
      $("#download-card-meta").textContent = d.noBuildMeta;
    } else if (releasesState === "failed") {
      heroNote.textContent = "";
      $("#download-card-title").textContent = d.loadFailed;
      $("#download-card-meta").textContent = "";
      actions.append(el("a", { class: "btn btn--ghost", href: RELEASES_PAGE, target: "_blank", rel: "noopener", text: d.openReleases }));
    } else {
      heroNote.textContent = "";
      $("#download-card-title").textContent = d.loading;
      $("#download-card-meta").textContent = "";
    }
  }

  /** Every release, each split into Windows / macOS / Linux columns. */
  function renderVersions() {
    const d = t().download;
    const box = $("#versions");
    box.replaceChildren();
    if (releasesState === "loading") {
      box.append(el("p", { class: "versions__empty", text: d.loading }));
      return;
    }
    if (releasesState === "failed" || releases.length === 0) {
      const p = el("p", { class: "versions__empty", text: releasesState === "failed" ? d.loadFailed : d.noReleasesMeta });
      box.append(p, el("a", { class: "btn btn--ghost", href: RELEASES_PAGE, target: "_blank", rel: "noopener", text: d.openReleases }));
      return;
    }
    releases.forEach((r, index) => {
      const head = el("div", { class: "release__head" }, [
        el("span", { class: "release__version", text: `v${r.version}` }),
        index === 0 ? el("span", { class: "release__badge", text: d.latestBadge }) : null,
        el("span", { class: "release__date", text: formatDate(r.date) }),
      ]);
      const grid = el("div", { class: "release__grid" });
      for (const key of OS_ORDER) {
        const col = el("div", { class: `release__os ${key === os ? "is-current" : ""}`, "data-os": key });
        col.append(el("div", { class: "release__os-title", text: OS_NAMES[key] }));
        const files = r.byOs[key] || [];
        if (files.length === 0) col.append(el("span", { class: "release__none", text: "-" }));
        for (const f of files) {
          // Only the name is the link; the size beside it is plain text.
          col.append(
            el("div", { class: "release__file" }, [
              el("a", { class: "release__file-link", href: f.url, rel: "nofollow", text: d.kinds[f.kind] }),
              el("span", { class: "release__size", text: formatSize(f.size) }),
            ]),
          );
        }
        grid.append(col);
      }
      box.append(el("article", { class: "release" }, [head, grid]));
    });
  }

  /** "Available for" under the hero buttons: only the systems some release
   * actually has an installer for, each jumping to its column in the list.
   * Before the first release it's a "coming to" line for all three; while
   * loading (or if GitHub didn't answer) it stays hidden. */
  function renderPlatforms() {
    const box = $("#platforms");
    box.replaceChildren();
    const h = t().hero;
    if (releasesState !== "ready") {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    const available = OS_ORDER.filter((key) => releases.some((r) => r.byOs[key]));
    if (available.length === 0) {
      box.append(el("span", { class: "platforms__label", text: h.platformsSoon }));
      for (const key of OS_ORDER) {
        box.append(el("span", { class: "platforms__item is-soon", text: OS_NAMES[key] }));
      }
      return;
    }
    box.append(el("span", { class: "platforms__label", text: h.platforms }));
    for (const key of available) {
      const link = el("a", { class: "platforms__item", href: "#versions", text: OS_NAMES[key] });
      link.addEventListener("click", () => flashOsColumn(key));
      box.append(link);
    }
  }

  /** Briefly lights up one system's column in every release of the list. */
  function flashOsColumn(key) {
    document.querySelectorAll(`.release__os[data-os="${key}"]`).forEach((col) => {
      col.classList.remove("is-flash");
      void col.offsetWidth; // restart the animation if it's already running
      col.classList.add("is-flash");
    });
  }

  function renderDownloads() {
    renderPrimary();
    renderVersions();
    renderPlatforms();
  }

  // ---- Demo chat -------------------------------------------------------------

  /** What the browser lets us find out about the visitor's machine. Nothing
   * here leaves the page. Unknown values are null. */
  function readSystem() {
    const ua = navigator.userAgent || "";
    const osName = os
      ? OS_NAMES[os]
      : /android/i.test(ua)
        ? "Android"
        : /iphone|ipad|ipod/i.test(ua) || (/mac/i.test(ua) && navigator.maxTouchPoints > 1)
          ? "iOS"
          : /cros/i.test(ua)
            ? "ChromeOS"
            : null;
    const browser = /edg\//i.test(ua)
      ? "Edge"
      : /opr\/|opera/i.test(ua)
        ? "Opera"
        : /yabrowser/i.test(ua)
          ? "Yandex Browser"
          : /firefox|fxios/i.test(ua)
            ? "Firefox"
            : /chrome|crios/i.test(ua)
              ? "Chrome"
              : /safari/i.test(ua)
                ? "Safari"
                : null;
    const dpr = window.devicePixelRatio || 1;
    let language = null;
    try {
      const code = (navigator.languages && navigator.languages[0]) || navigator.language;
      // Just the language, without the region ("русский", not "русский (Россия)").
      language = new Intl.DisplayNames([lang], { type: "language" }).of(String(code).split("-")[0]);
    } catch {
      language = null;
    }
    // "UTC+3", "UTC-4:30", "UTC" - from the visitor's own clock.
    const minutes = -new Date().getTimezoneOffset();
    const abs = Math.abs(minutes);
    const offset =
      minutes === 0
        ? "UTC"
        : `UTC${minutes > 0 ? "+" : "-"}${Math.floor(abs / 60)}${abs % 60 ? `:${String(abs % 60).padStart(2, "0")}` : ""}`;
    return {
      os: osName,
      browser,
      width: Math.round(screen.width * dpr),
      height: Math.round(screen.height * dpr),
      language: language ? (lang === "ru" ? language.toLowerCase() : language) : null,
      offset,
      dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    };
  }

  const DEMO_TYPING_MS = 900;
  const DEMO_GAP_MS = 500;
  let demoRun = 0;

  const demoTime = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function demoStatus(typing) {
    const status = $("#demo-status");
    status.replaceChildren();
    if (typing) {
      status.classList.add("is-typing");
      status.append(t().demo.typing, el("span", { class: "demo-dots" }, [el("i"), el("i"), el("i")]));
    } else {
      status.classList.remove("is-typing");
      status.append(t().demo.online);
    }
  }

  function addBubble(author, text, action) {
    const box = $("#demo-messages");
    const bubble = el("div", { class: `demo-bubble demo-bubble--${author}` }, [
      el("span", { class: "demo-bubble__text", text }),
      el("span", { class: "demo-bubble__time", text: demoTime() }),
    ]);
    if (action) {
      // On a line of its own, but only as wide as its text.
      const link = el("a", { class: "demo-bubble__action", href: action.href, text: action.label });
      bubble.append(el("div", { class: "demo-bubble__actions" }, [link]));
    }
    box.append(bubble);
    scrollChatToBottom();
  }

  /** Keeps the newest message fully in view. Scrolls once the new bubble is
   * laid out (not right when it's appended), and again whenever the message
   * area changes size — the reply buttons appearing under it, for one. */
  function scrollChatToBottom() {
    const box = $("#demo-messages");
    requestAnimationFrame(() => box.scrollTo({ top: box.scrollHeight, behavior: "smooth" }));
  }

  /** Soma "types" for a moment, then the message appears. Stops quietly if
   * the conversation was restarted meanwhile (language switch). */
  async function somaSays(run, text, action) {
    demoStatus(true);
    await sleep(DEMO_TYPING_MS + Math.min(text.length * 12, 900));
    if (run !== demoRun) return false;
    demoStatus(false);
    addBubble("bot", text, action);
    await sleep(DEMO_GAP_MS);
    return run === demoRun;
  }

  function renderReplies(run, used) {
    const box = $("#demo-replies");
    box.replaceChildren();
    const d = t().demo;
    for (const [key, reply] of Object.entries(d.replies)) {
      if (used.has(key)) continue;
      const btn = el("button", { type: "button", class: "demo-reply", text: reply.ask });
      btn.addEventListener("click", async () => {
        used.add(key);
        box.replaceChildren();
        addBubble("user", reply.ask);
        await sleep(400);
        if (run !== demoRun) return;
        const action = reply.action ? { href: "#download", label: reply.action } : null;
        if (await somaSays(run, reply.answer, action)) renderReplies(run, used);
      });
      box.append(btn);
    }
  }

  async function playDemo() {
    const run = ++demoRun;
    const d = t().demo;
    $("#demo-messages").replaceChildren();
    $("#demo-replies").replaceChildren();
    demoStatus(false);

    const sys = readSystem();
    const hour = new Date().getHours();
    const lines = [
      d.hello,
      sys.os ? d.system(sys.os, sys.browser) : "",
      sys.width && sys.height ? d.screen(sys.width, sys.height) : "",
      sys.language ? d.locale(sys.language, sys.offset) : "",
      d.theme(sys.dark),
      d.time(demoTime(), hour),
      d.outro,
    ].filter(Boolean);

    for (const line of lines) {
      if (!(await somaSays(run, line))) return;
    }
    renderReplies(run, new Set());
  }

  /** Starts the conversation the first time the chat scrolls into view. */
  function setupDemo() {
    const win = $("#demo-window");
    if (!win) return;
    if ("ResizeObserver" in window) new ResizeObserver(scrollChatToBottom).observe($("#demo-messages"));
    demoStatus(false);
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      playDemo();
    };
    if (!("IntersectionObserver" in window)) return start();
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(win);
    // A language switch replays it in the new language (if it had started).
    document.querySelectorAll(".lang-switch button").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (started) playDemo();
        else demoStatus(false);
      }),
    );
  }

  // ---- Screenshot hover zoom ----------------------------------------------

  /** Feature screenshots grow and come to the front while hovered. Done here
   * rather than with :hover alone so the order of events is exact: in front
   * immediately on enter, back behind its pair only after shrinking. */
  function setupHoverZoom() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const leaveTimers = new Map();
    document.querySelectorAll(".feature .shot").forEach((img) => {
      img.classList.add("is-zoomable");
      img.addEventListener("mouseenter", () => {
        // The other screenshot of a pair may still be shrinking back with
        // its own "in front" on - it gives way right now, or it would stay
        // on top until its shrink finished.
        img
          .closest(".feature__visual")
          .querySelectorAll(".shot")
          .forEach((other) => {
            if (other === img) return;
            window.clearTimeout(leaveTimers.get(other));
            other.classList.remove("is-front");
          });
        window.clearTimeout(leaveTimers.get(img));
        img.classList.add("is-front", "is-zoomed");
      });
      img.addEventListener("mouseleave", () => {
        img.classList.remove("is-zoomed");
        leaveTimers.set(
          img,
          window.setTimeout(() => img.classList.remove("is-front"), 360),
        );
      });
    });
  }

  // ---- Start ---------------------------------------------------------------

  $("#year").textContent = new Date().getFullYear();
  applyLang();
  setupHoverZoom();
  setupDemo();
  loadReleases()
    .then((list) => {
      releases = list;
      releasesState = "ready";
    })
    .catch(() => {
      releasesState = "failed";
    })
    .finally(renderDownloads);
})();
