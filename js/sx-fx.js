/* ──────────────────────────────────────────────────────────────────────────
 * sx-fx.js — SX.fx: the global micro-interaction layer.
 * Borrows aerocore + ai-designer-portfolio techniques, re-themed for SynergiaX:
 *   - nav scroll-states: frosted/condensed on scroll-down, hides on scroll-up
 *     near top stays transparent.  (aerocore nav--scroll-down / --scroll-up)
 *   - stat count-up: numbers animate from 0 → target when the bar enters view.
 *   - generic parallax: [data-parallax] elements drift on scroll (±range px).
 *   - mouse-trail: glass thumbnails spawn at the cursor over [data-trail].
 *   - starfield: drifting dot layer injected into [data-starfield].
 * All effects are skipped under prefers-reduced-motion. Defensive throughout.
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";

  var SX = (window.SX = window.SX || {});

  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }

  // ── nav scroll-states ───────────────────────────────────────────────────────
  function initNavStates() {
    var nav = SX.qs("#sx-nav");
    if (!nav) return;
    var last = window.scrollY || 0;
    var ticking = false;
    function update() {
      var y = window.scrollY || 0;
      if (y < 40) {
        nav.classList.remove("sx-nav--down", "sx-nav--hidden");
      } else {
        nav.classList.add("sx-nav--down");
        if (y > last + 6) nav.classList.add("sx-nav--hidden");        // scrolling down
        else if (y < last - 6) nav.classList.remove("sx-nav--hidden"); // scrolling up
      }
      last = y;
      ticking = false;
    }
    SX.on(window, "scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  // ── stat count-up ───────────────────────────────────────────────────────────
  function animateCount(el) {
    var raw = el.getAttribute("data-count");
    var target = parseFloat(raw);
    if (isNaN(target)) return;
    var prefix = el.getAttribute("data-count-prefix") || "";
    var suffix = el.getAttribute("data-count-suffix") || "";
    var dur = 1400, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = clamp((ts - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      var val = target * eased;
      var shown = target % 1 === 0 ? Math.round(val) : val.toFixed(1);
      el.textContent = prefix + shown + suffix;
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function initCountUp() {
    var nums = SX.qsa("[data-count]");
    if (!nums.length) return;
    if (!("IntersectionObserver" in window)) { nums.forEach(animateCount); return; }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); o.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { obs.observe(n); });
  }

  // ── generic scroll parallax ─────────────────────────────────────────────────
  function initParallax() {
    var els = SX.qsa("[data-parallax]");
    if (!els.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var range = parseFloat(el.getAttribute("data-parallax")) || 60;
        var centre = rect.top + rect.height / 2;
        var rel = (centre - vh / 2) / vh;        // -0.5..0.5 across viewport
        el.style.transform = "translate3d(0," + (-rel * range).toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    SX.on(window, "scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    SX.on(window, "resize", update, { passive: true });
    update();
  }

  // ── mouse-trail (glass shards spawn at cursor) ───────────────────────────────
  function initMouseTrail() {
    var zones = SX.qsa("[data-trail]");
    if (!zones.length) return;
    zones.forEach(function (zone) {
      var lastSpawn = 0;
      SX.on(zone, "mousemove", function (e) {
        var now = Date.now();
        if (now - lastSpawn < 80) return;       // throttle
        lastSpawn = now;
        var rect = zone.getBoundingClientRect();
        var shard = document.createElement("span");
        shard.className = "sx-trail-shard";
        shard.style.left = (e.clientX - rect.left) + "px";
        shard.style.top = (e.clientY - rect.top) + "px";
        shard.style.setProperty("--rot", (Math.random() * 20 - 10).toFixed(1) + "deg");
        zone.appendChild(shard);
        window.setTimeout(function () {
          if (shard.parentNode) shard.parentNode.removeChild(shard);
        }, 1000);
      });
    });
  }

  // ── starfield ────────────────────────────────────────────────────────────────
  function initStarfield() {
    var hosts = SX.qsa("[data-starfield]");
    hosts.forEach(function (host) {
      if (host.querySelector(".sx-star")) return; // idempotent
      var count = parseInt(host.getAttribute("data-starfield"), 10) || 60;
      var frag = document.createDocumentFragment();
      for (var i = 0; i < count; i++) {
        var s = document.createElement("span");
        s.className = "sx-star";
        s.style.left = (Math.random() * 100).toFixed(2) + "%";
        s.style.top = (Math.random() * 100).toFixed(2) + "%";
        s.style.animationDelay = (Math.random() * 6).toFixed(2) + "s";
        s.style.opacity = (0.15 + Math.random() * 0.5).toFixed(2);
        var sz = (1 + Math.random() * 2).toFixed(1);
        s.style.width = sz + "px"; s.style.height = sz + "px";
        // drift vector + per-star timing (consumed by the sx-drift/sx-twinkle keyframes)
        s.style.setProperty("--dx", (Math.random() * 60 - 30).toFixed(0) + "px");
        s.style.setProperty("--dy", (Math.random() * -50 - 10).toFixed(0) + "px");
        s.style.setProperty("--df", (16 + Math.random() * 22).toFixed(0) + "s");
        s.style.setProperty("--tw", (3.5 + Math.random() * 4).toFixed(1) + "s");
        frag.appendChild(s);
      }
      host.appendChild(frag);
    });
  }

  // ── 3D pointer tilt for the golden-framed preview ([data-tilt3d]) ───────────
  function initGoldTilt() {
    var els = SX.qsa("[data-tilt3d]");
    if (!els.length) return;
    var touch = window.matchMedia && window.matchMedia("(hover: none)").matches;
    if (touch) return;
    els.forEach(function (el) {
      var MAX = 9;
      function typingInside() {
        var a = document.activeElement;
        return a && el.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
      }
      SX.on(el, "mousemove", function (e) {
        if (typingInside()) {                 // don't tilt while the visitor is filling the form
          el.classList.remove("is-tilt");
          el.style.transform = "";
          return;
        }
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add("is-tilt");
        el.style.transform =
          "perspective(1000px) rotateY(" + (px * MAX) + "deg) rotateX(" + (-py * MAX) + "deg) translateY(-4px) scale(1.02)";
      });
      SX.on(el, "mouseleave", function () {
        el.classList.remove("is-tilt");
        el.style.transform = "";
      });
    });
  }

  // ── global cursor glow (soft spotlight that trails the pointer) ─────────────
  function initCursorGlow() {
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
    var glow = document.createElement("div");
    glow.className = "sx-cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2, x = tx, y = ty, on = false;
    SX.on(window, "mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; glow.classList.add("is-on"); }
    }, { passive: true });
    SX.on(document, "mouseleave", function () { on = false; glow.classList.remove("is-on"); });
    (function loop() {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      glow.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      window.requestAnimationFrame(loop);
    })();
  }

  function init() {
    initNavStates();              // nav states are fine under reduced motion
    initStarfield();
    if (SX.prefersReducedMotion()) {
      // Pin counts to final values, skip motion-heavy effects.
      SX.qsa("[data-count]").forEach(function (el) {
        var p = el.getAttribute("data-count-prefix") || "";
        var s = el.getAttribute("data-count-suffix") || "";
        el.textContent = p + (el.getAttribute("data-count") || "") + s;
      });
      return;
    }
    initCountUp();
    initParallax();
    initMouseTrail();
    initGoldTilt();
    initCursorGlow();
  }

  SX.fx = { init: init };
})(window, document);
