/* ──────────────────────────────────────────────────────────────────────────
 * sx-validation.js — SX.validation: lead-form field validation.
 * Shows/hides the .field-error[data-error-for="<field>"] elements (which use
 * the `hidden` attribute) and returns a { valid, values } result.
 * Mirrors the backend contract (api/index.js): email regex + brief >= 10 chars
 * + required fields, and adds the new required phone field (>= 8 digits).
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";

  var SX = (window.SX = window.SX || {});

  // Same regex the backend uses.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var BRIEF_MIN = 10;
  var PHONE_MIN_DIGITS = 8;

  // Field name (matches data-error-for / input name) → input selector.
  var FIELDS = {
    name: "#lead-name",
    businessName: "#lead-business-name",
    email: "#lead-email",
    phone: "#lead-phone",
    businessType: "#lead-business-type",
    brief: "#lead-brief"
  };

  function errorEl(form, field) {
    return SX.qs('.field-error[data-error-for="' + field + '"]', form || document);
  }

  function readValue(form, field) {
    var el = SX.qs(FIELDS[field], form || document);
    if (!el || typeof el.value !== "string") return "";
    return el.value.trim();
  }

  /** Show (message truthy) or hide (message falsy) a field's error element. */
  function setError(form, field, message) {
    var el = errorEl(form, field);
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  /** Clear every field error in the form. */
  function clearErrors(form) {
    SX.qsa(".field-error[data-error-for]", form || document).forEach(function (el) {
      el.textContent = "";
      el.hidden = true;
    });
  }

  /** Count the digits in a phone string. */
  function digitCount(value) {
    var digits = (value || "").replace(/\D/g, "");
    return digits.length;
  }

  /**
   * Validate the lead form. Returns { valid:Boolean, values:Object, errors:Object }.
   * Safe to call with a missing form (returns valid:false).
   */
  function validate(form) {
    if (!form) return { valid: false, values: {}, errors: {} };

    var values = {
      name: readValue(form, "name"),
      businessName: readValue(form, "businessName"),
      email: readValue(form, "email"),
      phone: readValue(form, "phone"),
      businessType: readValue(form, "businessType"),
      brief: readValue(form, "brief")
    };

    var errors = {};

    if (!values.name) errors.name = "Name is required";
    if (!values.businessName) errors.businessName = "Business name is required";
    if (!EMAIL_RE.test(values.email)) errors.email = "Enter a valid email address";
    if (digitCount(values.phone) < PHONE_MIN_DIGITS) errors.phone = "Enter a valid phone number";
    if (!values.businessType) errors.businessType = "Please select a business type";
    if (values.brief.length < BRIEF_MIN) errors.brief = "Please add a brief description (min 10 chars)";

    // Reflect each field's state (set message or clear it).
    Object.keys(FIELDS).forEach(function (field) {
      setError(form, field, errors[field] || null);
    });

    return { valid: Object.keys(errors).length === 0, values: values, errors: errors };
  }

  /** Move focus to the first field that currently has an error (best-effort). */
  function focusFirstError(form, errors) {
    if (!form || !errors) return;
    var order = ["name", "businessName", "email", "phone", "businessType", "brief"];
    for (var i = 0; i < order.length; i++) {
      if (errors[order[i]]) {
        var el = SX.qs(FIELDS[order[i]], form);
        if (el && typeof el.focus === "function") {
          el.focus();
        }
        return;
      }
    }
  }

  SX.validation = {
    EMAIL_RE: EMAIL_RE,
    BRIEF_MIN: BRIEF_MIN,
    PHONE_MIN_DIGITS: PHONE_MIN_DIGITS,
    fields: FIELDS,
    validate: validate,
    setError: setError,
    clearErrors: clearErrors,
    focusFirstError: focusFirstError
  };
})(window, document);
