/* ──────────────────────────────────────────────────────────────────────────
 * sx-faq.js — SX.faq: single-open accordion.
 * Wires the [data-faq-toggle] buttons inside [data-faq]. Toggling a question
 * opens its answer (.faq-answer / [data-faq-answer] gets the .open class) and
 * closes the others. The +/× icon is driven by aria-expanded (the page CSS
 * rotates .faq-icon 45° when [data-faq-toggle][aria-expanded="true"]), so we
 * only flip aria-expanded and the .open class — no manual icon swap needed.
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";

  var SX = (window.SX = window.SX || {});

  /** Resolve the answer panel for a toggle button. */
  function answerFor(btn) {
    if (!btn) return null;
    var id = btn.getAttribute("aria-controls");
    if (id) {
      var byId = document.getElementById(id);
      if (byId) return byId;
    }
    var item = btn.closest ? btn.closest("[data-faq-item], .faq-item") : null;
    if (item) {
      var inner = SX.qs("[data-faq-answer], .faq-answer", item);
      if (inner) return inner;
    }
    return btn.nextElementSibling || null;
  }

  function closeOne(btn) {
    if (!btn) return;
    btn.setAttribute("aria-expanded", "false");
    var answer = answerFor(btn);
    if (answer) answer.classList.remove("open");
  }

  function openOne(btn) {
    if (!btn) return;
    btn.setAttribute("aria-expanded", "true");
    var answer = answerFor(btn);
    if (answer) answer.classList.add("open");
  }

  /** Toggle a single question; closes all others (single-open accordion). */
  function toggle(btn, toggles) {
    if (!btn) return;
    toggles = toggles && toggles.length ? toggles : SX.qsa("[data-faq-toggle]");
    var willOpen = btn.getAttribute("aria-expanded") !== "true";

    toggles.forEach(closeOne);
    if (willOpen) openOne(btn);
  }

  /**
   * Initialise the FAQ accordion.
   * @returns {boolean} true when at least one toggle was wired.
   */
  function init() {
    var root = SX.qs("[data-faq]") || document;
    var toggles = SX.qsa("[data-faq-toggle]", root);
    if (!toggles.length) return false;

    toggles.forEach(function (btn) {
      // Normalise initial state: collapsed unless explicitly expanded.
      if (btn.getAttribute("aria-expanded") !== "true") {
        closeOne(btn);
      } else {
        openOne(btn);
      }
      SX.on(btn, "click", function (e) {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        toggle(btn, toggles);
      });
    });

    return true;
  }

  SX.faq = {
    init: init,
    toggle: toggle,
    answerFor: answerFor
  };
})(window, document);
