/* ──────────────────────────────────────────────────────────────────────────
 * sx-bindings.js — wires every module on DOMContentLoaded and attaches the
 * lead-form submit handler.
 *  - SX.pricing.renderPackages()  (graceful no-op when grid absent)
 *  - SX.faq.init()
 *  - SX.nav.init()
 *  - SX.motion.init()
 *  - #sx-lead-form submit → SX.validation.validate() → POST /api/leads
 *    with a loading state on #submitBtn, an inline [data-lead-status] message
 *    on error, and the form replaced by a success state on success (mirroring
 *    the previous working build's UX).
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";

  var SX = (window.SX = window.SX || {});

  var API_BASE = "/api"; // proxied through Firebase Hosting rewrite.

  function setStatus(statusEl, kind, message) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    if (kind) statusEl.setAttribute("data-status-kind", kind);
    statusEl.hidden = !message;
  }

  function clearStatus(statusEl) {
    if (!statusEl) return;
    statusEl.textContent = "";
    statusEl.hidden = true;
  }

  function renderSuccess(container, name) {
    if (!container) return;
    var safeName = SX.escapeHtml(name || "there");
    container.innerHTML =
      '<div style="text-align:center;padding:40px 20px">' +
      '<span class="msym" aria-hidden="true" style="font-size:56px;color:#fff;display:block;margin-bottom:20px">check_circle</span>' +
      "<h3 style=\"font-family:'Instrument Serif',serif;font-size:28px;margin-bottom:12px\">We've got your brief!</h3>" +
      '<p style="color:rgba(255,255,255,.5);font-size:15px;line-height:1.75">Thanks, ' +
      '<strong style="color:#fff">' + safeName + "</strong>. " +
      "We'll review your project and come back to you within " +
      '<strong style="color:#fff">24 hours</strong> with a personalised strategy.</p>' +
      "</div>";
  }

  function buildPayload(values) {
    return {
      name: values.name,
      businessName: values.businessName,
      email: values.email,
      phone: values.phone,
      businessType: values.businessType || "other",
      brief: values.brief
    };
  }

  function submitLead(form, btn, statusEl, container, values) {
    var originalBtnHtml = btn ? btn.innerHTML : "";

    if (btn) {
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      btn.innerHTML =
        '<span class="msym" aria-hidden="true" style="animation:sx-spin 1s linear infinite;display:inline-block">autorenew</span> Sending…';
    }
    clearStatus(statusEl);

    function restoreButton() {
      if (!btn) return;
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.innerHTML = originalBtnHtml;
    }

    function fail(message) {
      restoreButton();
      setStatus(
        statusEl,
        "error",
        message || "Something went wrong. Please try again."
      );
    }

    if (typeof window.fetch !== "function") {
      fail("Your browser can't submit this form. Please email hello@synergiax.in instead.");
      return;
    }

    window
      .fetch(API_BASE + "/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(values))
      })
      .then(function (res) {
        return res
          .json()
          .catch(function () { return {}; })
          .then(function (data) {
            return { ok: res.ok, data: data || {} };
          });
      })
      .then(function (result) {
        if (result.ok && result.data && result.data.success) {
          renderSuccess(container, values.name);
        } else {
          fail((result.data && result.data.error) || "Submission failed. Please try again.");
        }
      })
      .catch(function (err) {
        fail((err && err.message) || "Network error. Please try again.");
      });
  }

  function bindLeadForm() {
    var form = SX.qs("#sx-lead-form");
    if (!form) return false;

    var btn = SX.qs("#submitBtn", form);
    var statusEl = SX.qs("[data-lead-status]", form);
    var container = SX.qs("#formContainer");

    SX.on(form, "submit", function (e) {
      if (e && typeof e.preventDefault === "function") e.preventDefault();

      if (!SX.validation || typeof SX.validation.validate !== "function") {
        // Validation module missing — let native validation/back end guard.
        return;
      }

      var result = SX.validation.validate(form);
      if (!result.valid) {
        setStatus(statusEl, "error", "Please fix the highlighted fields and try again.");
        SX.validation.focusFirstError(form, result.errors);
        return;
      }

      submitLead(form, btn, statusEl, container, result.values);
    });

    return true;
  }

  // Runtime-only spinner keyframe (does not touch the CSS files / design tokens).
  SX.injectStyleOnce("sx-spin-keyframe", "@keyframes sx-spin{to{transform:rotate(360deg)}}");

  SX.ready(function () {
    if (SX.pricing && typeof SX.pricing.renderPackages === "function") {
      SX.pricing.renderPackages();
    }
    if (SX.faq && typeof SX.faq.init === "function") {
      SX.faq.init();
    }
    if (SX.nav && typeof SX.nav.init === "function") {
      SX.nav.init();
    }
    if (SX.motion && typeof SX.motion.init === "function") {
      SX.motion.init();
    }
    if (SX.cinematic && typeof SX.cinematic.init === "function") {
      SX.cinematic.init();
    }
    if (SX.fx && typeof SX.fx.init === "function") {
      SX.fx.init();
    }
    if (SX.interactions && typeof SX.interactions.init === "function") {
      SX.interactions.init();
    }
    bindLeadForm();
  });

  SX.bindings = {
    bindLeadForm: bindLeadForm,
    API_BASE: API_BASE
  };
})(window, document);
