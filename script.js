/* =====================================================================
   Site scripts for smrhnijhum.github.io
   1. Clickjacking guard (frame-busting)
   2. Theme toggle (light / dark)  — unchanged behaviour, moved out of HTML
   3. Visitor counter (tiny, footer corner) — fails silently if offline
   ===================================================================== */

/* ---- 1. Clickjacking guard -------------------------------------------
   If this page is ever loaded inside another site's <iframe>, break out.
   Wrapped in try/catch so a blocked cross-origin access never errors. */
(function frameGuard() {
  try {
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }
  } catch (_) {
    /* cross-origin access blocked — nothing to do */
  }
})();

/* ---- 2. Theme toggle -------------------------------------------------- */
(function themeToggle() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  const textEl = toggle.querySelector(".theme-text");

  let savedTheme = null;
  try { savedTheme = localStorage.getItem("theme"); } catch (_) {}

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    if (textEl) textEl.textContent = "Light";
  }

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch (_) {}
    if (textEl) textEl.textContent = isDark ? "Light" : "Dark";
  });
})();

/* ---- 3. Visitor counter ----------------------------------------------
   Uses the free CounterAPI service (no account / no key needed).
   - Increments at most once per browser every 6 hours (avoids refresh spam).
   - Otherwise just reads the current total.
   - On ANY failure (offline, service down, blocked) the counter stays
     hidden and the rest of the page is completely unaffected. */
(function visitorCounter() {
  const NAMESPACE = "smrhnijhum-github-io"; // change only if you want a fresh count
  const COUNTER   = "site-visits";
  const THROTTLE_MS = 6 * 60 * 60 * 1000;   // 6 hours
  const TIMEOUT_MS  = 6000;

  const wrap = document.getElementById("visitCount");
  if (!wrap || typeof fetch !== "function") return;
  const numEl = wrap.querySelector(".footer-count-num");
  if (!numEl) return;

  let shouldIncrement = true;
  try {
    const last = Number(localStorage.getItem("vc_last") || 0);
    shouldIncrement = (Date.now() - last) > THROTTLE_MS;
  } catch (_) { shouldIncrement = true; }

  const base = "https://api.counterapi.dev/v1/" +
    encodeURIComponent(NAMESPACE) + "/" + encodeURIComponent(COUNTER);
  const url = shouldIncrement ? base + "/up" : base;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  fetch(url, { signal: controller.signal, cache: "no-store" })
    .then((res) => { if (!res.ok) throw new Error("bad status"); return res.json(); })
    .then((data) => {
      const count =
        (data && data.count != null) ? data.count :
        (data && data.value != null) ? data.value :
        (data && data.data && data.data.up_count != null) ? data.data.up_count :
        (data && data.data && data.data.value != null) ? data.data.value : null;

      const n = Number(count);
      if (count == null || Number.isNaN(n)) throw new Error("no count");

      numEl.textContent = n.toLocaleString();
      wrap.hidden = false;
      if (shouldIncrement) {
        try { localStorage.setItem("vc_last", String(Date.now())); } catch (_) {}
      }
    })
    .catch(() => { /* stay hidden — never disturb the page */ })
    .finally(() => clearTimeout(timer));
})();
