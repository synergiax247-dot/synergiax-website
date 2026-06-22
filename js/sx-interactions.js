/* ──────────────────────────────────────────────────────────────────────────
 * sx-interactions.js — SX.interactions
 *   - works hover-reveal: crossfades a themed section background as the visitor
 *     hovers each persona card (two-layer fade; default image when idle).
 *   - reviews: client-side review system. Seeds with curated reviews, lets
 *     visitors post a star-rated review (persisted to localStorage), renders a
 *     paged carousel with prev/next/dots + autoplay, and a live average.
 *   - tilt: subtle 3D pointer tilt on cards (desktop, motion-allowed only).
 * Defensive; reduced-motion aware. Plain classic <script>.
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";

  var SX = (window.SX = window.SX || {});
  var reduce = SX.prefersReducedMotion();
  function isTouch() { return window.matchMedia && window.matchMedia("(hover: none)").matches; }

  /* ── 1. Who-We-Work-With hover background ─────────────────────────────────── */
  function initWorksBg() {
    var wrap = SX.qs("[data-works-bg]");
    var grid = SX.qs("[data-works-grid]");
    if (!wrap || !grid) return;
    var layers = SX.qsa("[data-works-layer]", wrap);
    if (layers.length < 2) return;
    var DEFAULT = "./assets/personas/default.jpg";
    var active = 0;

    // caption elements (hover-driven, crossfaded)
    var cap = SX.qs("[data-works-caption]");
    var capTitle = SX.qs("[data-works-caption-title]");
    var capDesc = SX.qs("[data-works-caption-desc]");
    var capTimer = null, lastCap = "";
    var defaultTitle = capTitle ? capTitle.textContent : "";
    var defaultDesc = capDesc ? capDesc.textContent : "";

    function setCaption(title, desc) {
      if (!cap || !capTitle || !capDesc) return;
      var key = title + "|" + desc;
      if (key === lastCap) return;
      lastCap = key;
      if (reduce) { capTitle.textContent = title; capDesc.textContent = desc; return; }
      cap.classList.add("is-swapping");
      if (capTimer) window.clearTimeout(capTimer);
      capTimer = window.setTimeout(function () {
        capTitle.textContent = title;
        capDesc.textContent = desc;
        cap.classList.remove("is-swapping");
      }, 200);
    }

    function show(url) {
      var next = active === 0 ? 1 : 0;
      layers[next].style.backgroundImage = "url('" + url + "')";
      layers[next].classList.add("is-active");
      layers[active].classList.remove("is-active");
      active = next;
    }
    // preload default + show it
    layers[0].style.backgroundImage = "url('" + DEFAULT + "')";
    layers[0].classList.add("is-active");

    SX.qsa(".persona-card", grid).forEach(function (card) {
      var url = card.getAttribute("data-bg");
      var h = SX.qs("h3", card), pEl = SX.qs("p", card);
      var t = h ? h.textContent.trim() : "";
      var d = pEl ? pEl.textContent.trim() : "";
      function enter() { if (url) show(url); setCaption(t, d); }
      SX.on(card, "mouseenter", enter);
      SX.on(card, "focusin", enter);
      if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
    });
    SX.on(grid, "mouseleave", function () {
      show(DEFAULT);
      setCaption(defaultTitle, defaultDesc);
    });
  }

  /* ── 2. Reviews ───────────────────────────────────────────────────────────── */
  var SEED = [
    { name: "Rahul Sharma", biz: "Iron Peak Fitness, Pune", rating: 5,
      text: "SynergiaX transformed our gym's online presence completely. Bookings doubled within the first month of launch. The site looks more premium than places 10x our size." },
    { name: "Priya Nair", biz: "Luna & Co Salon, Mumbai", rating: 5,
      text: "I was skeptical at first — we're a small salon. But the website they built made us look like a luxury brand. Our average booking value went up 40% in 6 weeks." },
    { name: "Dr. Anita Desai", biz: "Wellness First Clinic, Nashik", rating: 5,
      text: "They had our clinic website live in under 2 weeks. The appointment system alone saved us 3 hours of phone calls a day. An absolute game changer for a local practice." },
    { name: "Karan Mehta", biz: "Brew Lane Cafe, Pune", rating: 5,
      text: "Our new menu and reservation flow is gorgeous. Weekend covers are up, and regulars keep complimenting the site. Worth every rupee." },
    { name: "Sneha Iyer", biz: "Bloom Boutique, Bengaluru", rating: 5,
      text: "The lookbook and online store they built feels like a national brand. Online orders now rival our walk-ins. Fast, polished, and stress-free." }
  ];
  var LS_KEY = "sx_reviews_v1";

  function loadUserReviews() {
    try { var raw = window.localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : []; }
    catch (e) { return []; }
  }
  function saveUserReviews(list) {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function stars(n) { n = Math.max(0, Math.min(5, n | 0)); return "\u2605".repeat(n) + "\u2606".repeat(5 - n); }
  function initials(name) {
    return (name || "?").trim().split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join("").toUpperCase() || "?";
  }

  function initReviews() {
    var root = SX.qs("[data-reviews]");
    if (!root) return;
    var track = SX.qs("[data-reviews-track]", root);
    var dotsWrap = SX.qs("[data-reviews-dots]", root);
    var prev = SX.qs("[data-reviews-prev]", root);
    var next = SX.qs("[data-reviews-next]", root);
    var avgEl = SX.qs("[data-reviews-avg]", root);
    var avgStars = SX.qs("[data-reviews-avgstars]", root);
    var countEl = SX.qs("[data-reviews-count]", root);
    var toggleBtn = SX.qs("[data-reviews-toggle]", root);
    var form = SX.qs("[data-review-form]", root);
    if (!track) return;

    var page = 0, perView = 3, auto = null;
    var remote = null;

    function all() { return (remote && remote.length ? remote : loadUserReviews()).concat(SEED); }

    function render() {
      var list = all();
      track.innerHTML = list.map(function (r) {
        return '<article class="sx-review-card" role="listitem">' +
          '<div class="sx-review-card__stars" aria-label="' + r.rating + ' out of 5">' + SX.escapeHtml(stars(r.rating)) + '</div>' +
          '<p class="sx-review-card__text">&ldquo;' + SX.escapeHtml(r.text) + '&rdquo;</p>' +
          '<div class="sx-review-card__who"><div class="sx-review-card__avatar">' + SX.escapeHtml(initials(r.name)) + '</div>' +
          '<div><div style="font-weight:600;font-size:14px;color:#fff">' + SX.escapeHtml(r.name) + '</div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,.45);letter-spacing:.04em">' + SX.escapeHtml(r.biz) + '</div></div></div>' +
          '</article>';
      }).join("");

      // average
      var avg = list.reduce(function (s, r) { return s + r.rating; }, 0) / (list.length || 1);
      if (avgEl) avgEl.textContent = avg.toFixed(1);
      if (avgStars) avgStars.textContent = stars(Math.round(avg));
      if (countEl) countEl.textContent = "from " + list.length + " review" + (list.length === 1 ? "" : "s");

      layout();
      if (SX.fx && SX.fx.tilt) SX.fx.tilt(); // re-tilt new cards (if exposed)
      tiltCards();
    }

    function layout() {
      var vpw = track.parentElement.getBoundingClientRect().width;
      perView = vpw < 640 ? 1 : vpw < 900 ? 2 : 3;
      var cards = SX.qsa(".sx-review-card", track);
      var pages = Math.max(1, Math.ceil(cards.length / perView));
      if (page > pages - 1) page = pages - 1;
      // dots
      if (dotsWrap) {
        dotsWrap.innerHTML = "";
        for (var i = 0; i < pages; i++) {
          var d = document.createElement("button");
          d.type = "button"; d.className = "sx-reviews__dot" + (i === page ? " is-active" : "");
          d.setAttribute("aria-label", "Go to review page " + (i + 1));
          (function (idx) { SX.on(d, "click", function () { goTo(idx); }); })(i);
          dotsWrap.appendChild(d);
        }
      }
      move();
    }

    function move() {
      var cards = SX.qsa(".sx-review-card", track);
      if (!cards.length) return;
      var cardW = cards[0].getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "20") || 20;
      var step = (cardW + gap) * perView;
      track.style.transform = "translateX(" + (-page * step) + "px)";
      SX.qsa(".sx-reviews__dot", dotsWrap).forEach(function (d, i) {
        d.classList.toggle("is-active", i === page);
      });
    }

    function pages() {
      var cards = SX.qsa(".sx-review-card", track);
      return Math.max(1, Math.ceil(cards.length / perView));
    }
    function goTo(i) { var p = pages(); page = (i + p) % p; move(); }
    function nextPage() { goTo(page + 1); }
    function prevPage() { goTo(page - 1); }

    if (next) SX.on(next, "click", function () { nextPage(); restartAuto(); });
    if (prev) SX.on(prev, "click", function () { prevPage(); restartAuto(); });

    function startAuto() {
      if (reduce) return;
      auto = window.setInterval(function () { nextPage(); }, 5500);
    }
    function stopAuto() { if (auto) { window.clearInterval(auto); auto = null; } }
    function restartAuto() { stopAuto(); startAuto(); }
    SX.on(root, "mouseenter", stopAuto);
    SX.on(root, "mouseleave", startAuto);

    SX.on(window, "resize", function () { layout(); }, { passive: true });

    // ── write-a-review form ──
    if (toggleBtn && form) {
      SX.on(toggleBtn, "click", function () {
        var open = form.classList.toggle("is-open");
        if (open) {
          var nm = SX.qs("[data-review-name]", form); if (nm) nm.focus();
          form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        }
      });
      var cancel = SX.qs("[data-review-cancel]", form);
      if (cancel) SX.on(cancel, "click", function () { form.classList.remove("is-open"); });

      SX.on(form, "submit", function (e) {
        if (e && e.preventDefault) e.preventDefault();
        var nm = SX.qs("[data-review-name]", form);
        var bz = SX.qs("[data-review-biz]", form);
        var tx = SX.qs("[data-review-text]", form);
        var rt = SX.qs('[data-review-rating] input:checked', form);
        var name = nm && nm.value.trim(), biz = bz && bz.value.trim(), text = tx && tx.value.trim();
        if (!name || !biz || !text) { toast("Please fill in your name, business, and review."); return; }
        var review = { name: name, biz: biz, text: text, rating: rt ? parseInt(rt.value, 10) : 5 };
        if (nm) nm.value = ""; if (bz) bz.value = ""; if (tx) tx.value = "";
        form.classList.remove("is-open");
        if (SX.db && SX.db.addReview) {
          toast("Posting your review…");
          SX.db.addReview(review)
            .then(function () { return SX.db.listReviews(50); })
            .then(function (list) { if (list) remote = list; page = 0; render(); toast("Thank you! Your review is now live."); })
            .catch(function () {
              var user = loadUserReviews(); user.unshift(review); saveUserReviews(user);
              page = 0; render(); toast("Thank you! Your review has been saved.");
            });
        } else {
          var user = loadUserReviews(); user.unshift(review); saveUserReviews(user);
          page = 0; render();
          toast("Thank you! Your review is now live.");
        }
      });
    }

    render();
    startAuto();
    // pull live reviews from Firestore (if available), then re-render
    if (SX.db && typeof SX.db.listReviews === "function") {
      SX.db.listReviews(50).then(function (list) {
        if (list && list.length) { remote = list; page = 0; render(); }
      }).catch(function () { /* offline / Firestore not ready → keep seed+local */ });
    }
  }

  /* ── 3. toast ─────────────────────────────────────────────────────────────── */
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "sx-toast"; toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toastEl.classList.remove("is-show"); }, 3200);
  }

  /* ── 4. 3D tilt on cards ──────────────────────────────────────────────────── */
  function tiltCards() {
    if (reduce || isTouch()) return;
    var sel = ".feature-card, .persona-card, .sx-review-card, .pricing-card";
    SX.qsa(sel).forEach(function (card) {
      if (card.__tilt) return; card.__tilt = true;
      SX.on(card, "mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        var max = 5;
        card.style.transform = "perspective(800px) rotateY(" + (px * max) + "deg) rotateX(" + (-py * max) + "deg) translateY(-4px)";
      });
      SX.on(card, "mouseleave", function () { card.style.transform = ""; });
    });
  }

  function init() {
    initWorksBg();
    initReviews();
    tiltCards();
  }

  SX.interactions = { init: init, tilt: tiltCards };
})(window, document);
