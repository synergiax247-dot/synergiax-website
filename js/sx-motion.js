/* ──────────────────────────────────────────────────────────────────────────
 * sx-motion.js — SX.motion: reveal-on-scroll.
 * Adds .show to .reveal elements as they enter the viewport (IntersectionObserver,
 * threshold ~0.12). Respects prefers-reduced-motion: reduce by skipping the
 * observer entirely and simply showing everything (the page CSS already pins
 * .reveal visible under that media query). The ticker animation is pure CSS and
 * is left untouched.
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";

  var SX = (window.SX = window.SX || {});

  var observer = null;

  function showAll(els) {
    els.forEach(function (el) {
      el.classList.add("show");
    });
  }

  /**
   * Initialise reveal-on-scroll.
   * @returns {boolean} true when there was something to handle.
   */
  function init() {
    var els = SX.qsa(".reveal");
    if (!els.length) return false;

    // Reduced motion OR no IntersectionObserver support → reveal immediately.
    if (SX.prefersReducedMotion() || !("IntersectionObserver" in window)) {
      showAll(els);
      return true;
    }

    observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach(function (el) {
      // Already-revealed elements (e.g. the hero) don't need observing.
      if (!el.classList.contains("show")) {
        observer.observe(el);
      }
    });

    return true;
  }

  /** Observe any newly-added .reveal elements (e.g. JS-rendered content). */
  function refresh() {
    if (!observer) {
      // No active observer (reduced motion / unsupported) → just show them.
      showAll(SX.qsa(".reveal"));
      return;
    }
    SX.qsa(".reveal").forEach(function (el) {
      if (!el.classList.contains("show")) {
        observer.observe(el);
      }
    });
  }

  SX.motion = {
    init: init,
    refresh: refresh
  };
})(window, document);
