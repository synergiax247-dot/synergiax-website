/* ──────────────────────────────────────────────────────────────────────────
 * sx-nav.js — SX.nav: floating navigation behaviour.
 *  - Mobile menu toggle via [data-nav-toggle] (flips aria-expanded; the page
 *    CSS :has([data-nav-toggle][aria-expanded="true"]) reveals [data-nav-links]).
 *  - Smooth-scroll for .sx-nav-label[data-target] anchors (and the brand / CTA
 *    in-page anchors).
 *  - If a label's target section id is missing, reveal [data-nav-unavailable].
 *  - Closes the menu on link activation and on Escape.
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";

  var SX = (window.SX = window.SX || {});

  var unavailableTimer = null;

  function getToggle(nav) {
    return SX.qs("[data-nav-toggle]", nav || document);
  }

  function isOpen(toggle) {
    return !!toggle && toggle.getAttribute("aria-expanded") === "true";
  }

  function closeMenu(toggle) {
    toggle = toggle || getToggle();
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function openMenu(toggle) {
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }

  function animateScrollTo(toY, duration, done) {
    var startY = window.pageYOffset || document.documentElement.scrollTop;
    var dist = toY - startY, start = null;
    var docEl = document.documentElement;
    var prevSnap = docEl.style.scrollSnapType;
    docEl.style.scrollSnapType = "none";   // stop proximity-snap tugging the animation
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; } // easeInOutCubic
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      window.scrollTo(0, startY + dist * ease(t));
      if (t < 1) { window.requestAnimationFrame(step); }
      else { docEl.style.scrollSnapType = prevSnap; if (done) done(); }
    }
    window.requestAnimationFrame(step);
  }

  function scrollToTarget(target) {
    if (!target) return;
    function focusIt() {
      if (typeof target.setAttribute === "function" && !target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      if (typeof target.focus === "function") {
        try { target.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
      }
    }
    var navH = 90;  // keep the target clear of the fixed nav
    var rect = target.getBoundingClientRect();
    var toY = Math.max(0, (window.pageYOffset || 0) + rect.top - navH);

    if (SX.prefersReducedMotion() || typeof window.requestAnimationFrame !== "function") {
      window.scrollTo(0, toY);
      focusIt();
      return;
    }
    var dist = Math.abs(toY - (window.pageYOffset || 0));
    var dur = Math.min(1600, Math.max(700, dist * 0.55));  // slow, distance-scaled glide
    animateScrollTo(toY, dur, focusIt);
  }

  function showUnavailable() {
    var el = SX.qs("[data-nav-unavailable]");
    if (!el) return;
    el.hidden = false;
    if (unavailableTimer) window.clearTimeout(unavailableTimer);
    unavailableTimer = window.setTimeout(function () {
      el.hidden = true;
    }, 3200);
  }

  /** Click handler for an editorial label with a data-target section id. */
  function handleLabelClick(e, label, toggle) {
    var id = label.getAttribute("data-target");
    var target = id ? document.getElementById(id) : null;

    if (!target) {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      showUnavailable();
      return;
    }

    if (e && typeof e.preventDefault === "function") e.preventDefault();
    scrollToTarget(target);
    closeMenu(toggle);
  }

  /** Click handler for a plain in-page anchor (brand, CTA). */
  function handleAnchorClick(e, anchor, toggle) {
    var href = anchor.getAttribute("href") || "";
    if (href.charAt(0) !== "#" || href.length < 2) return;
    var target = document.getElementById(href.slice(1));
    if (!target) return; // let the browser handle unknown anchors
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    scrollToTarget(target);
    closeMenu(toggle);
  }

  /**
   * Initialise navigation behaviour.
   * @returns {boolean} true when a nav root was found and wired.
   */
  function init() {
    var nav = SX.qs("#sx-nav");
    var scope = nav || document;
    var toggle = getToggle(scope);

    // Mobile collapse control.
    if (toggle) {
      SX.on(toggle, "click", function () {
        if (isOpen(toggle)) {
          closeMenu(toggle);
        } else {
          openMenu(toggle);
        }
      });
    }

    // Editorial labels with data-target.
    var labels = SX.qsa(".sx-nav-label[data-target]", scope);
    labels.forEach(function (label) {
      SX.on(label, "click", function (e) {
        handleLabelClick(e, label, toggle);
      });
    });

    // Brand + CTA + any other in-page anchors inside the nav (skip labels,
    // already handled above).
    SX.qsa('a[href^="#"]', scope).forEach(function (anchor) {
      if (anchor.classList && anchor.classList.contains("sx-nav-label")) return;
      SX.on(anchor, "click", function (e) {
        handleAnchorClick(e, anchor, toggle);
      });
    });

    // Escape closes the mobile menu.
    SX.on(document, "keydown", function (e) {
      if (e && (e.key === "Escape" || e.key === "Esc")) {
        closeMenu(toggle);
      }
    });

    return !!nav;
  }

  SX.nav = {
    init: init,
    closeMenu: closeMenu,
    openMenu: openMenu,
    scrollToTarget: scrollToTarget,
    showUnavailable: showUnavailable
  };
})(window, document);
