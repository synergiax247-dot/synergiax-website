/* ──────────────────────────────────────────────────────────────────────────
 * sx-core.js — global SX namespace + small, defensive DOM helpers.
 * Loaded first; every other module hangs off the SX object created here.
 * Plain classic <script> (no imports/exports). Never throws on missing DOM.
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";

  // Reuse an existing namespace if one was already created (idempotent load).
  var SX = window.SX || {};

  /** querySelector scoped to an optional context (defaults to document). */
  SX.qs = function (selector, ctx) {
    if (!selector) return null;
    try {
      return (ctx || document).querySelector(selector);
    } catch (e) {
      return null;
    }
  };

  /** querySelectorAll → real Array (so .forEach/.map are always available). */
  SX.qsa = function (selector, ctx) {
    if (!selector) return [];
    try {
      return Array.prototype.slice.call((ctx || document).querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  };

  /** Safe addEventListener — no-ops if the element/handler is absent. */
  SX.on = function (el, type, handler, opts) {
    if (el && typeof el.addEventListener === "function" && typeof handler === "function") {
      el.addEventListener(type, handler, opts);
    }
  };

  /** Safe removeEventListener. */
  SX.off = function (el, type, handler, opts) {
    if (el && typeof el.removeEventListener === "function" && typeof handler === "function") {
      el.removeEventListener(type, handler, opts);
    }
  };

  /** Run fn once the DOM is parsed (or immediately if it already is). */
  SX.ready = function (fn) {
    if (typeof fn !== "function") return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  /** Escape a string for safe insertion into innerHTML. */
  SX.escapeHtml = function (value) {
    var str = value == null ? "" : String(value);
    return str.replace(/[&<>"']/g, function (ch) {
      switch (ch) {
        case "&": return "&amp;";
        case "<": return "&lt;";
        case ">": return "&gt;";
        case '"': return "&quot;";
        case "'": return "&#39;";
        default: return ch;
      }
    });
  };

  /** True when the visitor has requested reduced motion. */
  SX.prefersReducedMotion = function () {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) {
      return false;
    }
  };

  /** Inject a small stylesheet rule once (used for the runtime spinner keyframe). */
  SX.injectStyleOnce = function (id, css) {
    if (!id || !css || document.getElementById(id)) return;
    var style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  };

  window.SX = SX;
})(window, document);
