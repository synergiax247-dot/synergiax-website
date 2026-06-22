/* ──────────────────────────────────────────────────────────────────────────
 * sx-cinematic.js — SX.cinematic: scroll-driven portal hero.
 *
 * Adapted from the open-design "dreamcore-landing" parallax technique, re-themed
 * for SynergiaX's obsidian liquid-glass identity (no nature imagery):
 *   - A sticky 100vh viewport inside a tall (420vh) scroll track.
 *   - Layer stack driven by scrollProgress (0..1):
 *       world  : scale 1 → 1.18      (far digital-flagship interior)
 *       portal : scale 1 → 7.5       (glass portal zooms toward the viewer)
 *       curtains: entrance sweep ±60% then parallax off-screen on scroll
 *   - Scene 1 UI (headline / CTA / stats) fades out by 22% scroll.
 *   - Scene 2 UI (reveal heading + arc card slider) fades in 66% → 84%.
 *   - Desktop mouse parallax, lerped at speed 0.07, per-layer MAG.
 *   - Entrance sequence: curtains open @100ms, scene-1 UI in @600ms,
 *     parallax made instant @2200ms.
 *
 * Respects prefers-reduced-motion: collapses to a static hero (scene 1 only;
 * the arc slider is decorative and hidden — the canonical personas live in
 * #works). Plain classic <script>; never throws on missing DOM.
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";

  var SX = (window.SX = window.SX || {});

  // ── math helpers ──────────────────────────────────────────────────────────
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function isMobile() {
    try { return window.matchMedia("(max-width: 767px)").matches; } catch (e) { return false; }
  }

  var raf = null;
  var bound = false;

  function init() {
    var root = SX.qs("[data-cine]");
    if (!root) return false;

    var viewport = SX.qs("[data-cine-viewport]", root);
    var world = SX.qs("[data-cine-world]", root);
    var portal = SX.qs("[data-cine-portal]", root);
    var curtainL = SX.qs("[data-cine-curtain-l]", root);
    var curtainR = SX.qs("[data-cine-curtain-r]", root);
    var scene1 = SX.qs("[data-cine-scene1]", root);
    var scene2 = SX.qs("[data-cine-scene2]", root);
    var arc = SX.qs("[data-cine-arc]", root);
    var cue = SX.qs("[data-cine-cue]", root);

    // Reduced motion / no rAF → static hero. Pin scene 1, drop the tall track,
    // hide the decorative portal/curtain/scene-2 layers.
    if (SX.prefersReducedMotion()) {
      root.classList.add("sx-cine--static");
      if (scene1) scene1.style.opacity = "1";
      return true;
    }

    // ── arc card slider geometry (built once) ────────────────────────────────
    var arcCards = arc ? SX.qsa(".sx-arc__card", arc) : [];
    var ARC = { spacingDeg: 0, centerIndex: 0, radius: 0, count: arcCards.length };
    function computeArc() {
      var m = isMobile();
      ARC.spacingDeg = m ? 16 : 11;
      ARC.radius = m ? 1000 : 1750;
      ARC.centerIndex = Math.floor(ARC.count / 2);
      for (var i = 0; i < arcCards.length; i++) {
        arcCards[i].style.transformOrigin = "50% " + ARC.radius + "px";
      }
    }
    computeArc();

    // ── mouse parallax state ─────────────────────────────────────────────────
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var entranceDone = false;
    var progress = 0;

    function onScroll() {
      var track = root.scrollHeight - window.innerHeight;
      progress = track > 0 ? clamp((window.scrollY - root.offsetTop) / track, 0, 1) : 0;
    }
    function onMouse(e) {
      var w = window.innerWidth, h = window.innerHeight;
      mouse.tx = (e.clientX / w - 0.5) * 2;   // -1 .. 1
      mouse.ty = (e.clientY / h - 0.5) * 2;
    }

    function frame() {
      // lerp mouse toward target (desktop only — on mobile tx/ty stay 0)
      mouse.x = lerp(mouse.x, mouse.tx, 0.07);
      mouse.y = lerp(mouse.y, mouse.ty, 0.07);

      var ep = easeInOut(progress);
      var mx = mouse.x, my = mouse.y;

      // World: gentle zoom + slow parallax
      if (world) {
        var ws = lerp(1, 1.18, ep);
        world.style.transform =
          "translate(" + (-mx * 6) + "px," + (-my * 6) + "px) scale(" + ws + ")";
      }

      // Portal: the signature zoom-toward-viewer; fades out 0.62 → 0.82
      if (portal) {
        var ps = lerp(1, 7.5, ep);
        portal.style.transform =
          "translate(" + (-mx * 7) + "px," + (-my * 7) + "px) scale(" + ps + ")";
        portal.style.opacity = String(clamp(1 - (progress - 0.62) / 0.20, 0, 1));
      }

      // Curtains: CSS owns the entrance sweep (class --open animates 0 → ±100%).
      // After entrance completes, JS takes over: base open ±100% + scroll-driven
      // extra slide + horizontal mouse parallax (half-width edge-anchored panels).
      if (entranceDone) {
        var extra = lerp(0, 120, ep);
        if (curtainL) {
          curtainL.style.transform =
            "translateX(-" + (100 + extra) + "%) translateX(" + (-mx * 14) + "px)";
        }
        if (curtainR) {
          curtainR.style.transform =
            "translateX(" + (100 + extra) + "%) translateX(" + (-mx * 14) + "px)";
        }
      }

      // Scene 1 fades out by 0.22
      if (scene1 && entranceDone) {
        scene1.style.opacity = String(clamp(1 - progress / 0.22, 0, 1));
        scene1.style.pointerEvents = progress > 0.18 ? "none" : "auto";
      }

      // Scene 2 + arc share the same fade-in window 0.66 → 0.84
      var s2 = clamp((progress - 0.66) / 0.18, 0, 1);
      if (scene2) {
        scene2.style.opacity = String(s2);
        scene2.style.pointerEvents = s2 > 0.5 ? "auto" : "none";
      }
      if (arc) arc.style.opacity = String(s2);

      // Scroll cue fades out quickly
      if (cue) cue.style.opacity = String(clamp(1 - progress / 0.12, 0, 1));

      // Arc rotation 0.70 → 1.0
      if (arcCards.length) {
        var rot = lerp(0, (ARC.count - 1) * 10, clamp((progress - 0.70) / 0.30, 0, 1));
        for (var i = 0; i < arcCards.length; i++) {
          var baseDeg = (i - ARC.centerIndex) * ARC.spacingDeg;
          var deg = baseDeg - rot + ARC.centerIndex * ARC.spacingDeg;
          var rad = (deg * Math.PI) / 180;
          var x = Math.sin(rad) * ARC.radius;
          var y = ARC.radius - Math.cos(rad) * ARC.radius;
          var card = arcCards[i];
          card.style.transform =
            "translate(-50%,0) translate(" + x + "px," + (-y) + "px) rotate(" + deg + "deg)";
        }
      }

      raf = window.requestAnimationFrame(frame);
    }

    // ── entrance milestones ───────────────────────────────────────────────────
    window.setTimeout(function () { root.classList.add("sx-cine--open"); }, 100);
    window.setTimeout(function () { root.classList.add("sx-cine--ui"); }, 600);
    window.setTimeout(function () { entranceDone = true; root.classList.add("sx-cine--instant"); }, 2200);

    if (!bound) {
      SX.on(window, "scroll", onScroll, { passive: true });
      SX.on(window, "resize", function () { computeArc(); onScroll(); }, { passive: true });
      if (!isMobile()) SX.on(window, "mousemove", onMouse, { passive: true });
      bound = true;
    }
    onScroll();
    raf = window.requestAnimationFrame(frame);
    return true;
  }

  SX.cinematic = { init: init };
})(window, document);
