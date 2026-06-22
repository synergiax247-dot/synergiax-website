/* ──────────────────────────────────────────────────────────────────────────
 * sx-pricing.js — SX.pricing.renderPackages():
 * Renders the 3 pricing packages into the .sx-pricing-grid container using the
 * .sx-pricing-card / .sx-pricing-badge / .sx-pricing-name / .sx-pricing-price /
 * .sx-pricing-inclusions / .sx-pricing-inclusion classes already defined in the
 * page CSS (featured card adds .sx-pricing-card--featured).
 *
 * Package content mirrors the previous working build (Starter/Growth/Elite).
 * If the grid container is missing it fails gracefully; if it exists but there
 * are no packages it renders the .sx-pricing-empty / .sx-pricing-empty-message
 * fallback.
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";

  var SX = (window.SX = window.SX || {});

  var RUPEE = "\u20B9"; // ₹

  // Inclusion: { text, included } — included:false renders a muted "removed" row,
  // matching the previous build's check_circle / remove treatment.
  var PACKAGES = [
    {
      name: "Starter",
      price: RUPEE + "24,999",
      cadence: "one-time",
      featured: false,
      cta: { label: "Get Started", variant: "ghost" },
      inclusions: [
        { text: "Up to 5 pages", included: true },
        { text: "Mobile-responsive design", included: true },
        { text: "Contact form integration", included: true },
        { text: "Basic local SEO setup", included: true },
        { text: "14-day delivery", included: true },
        { text: "Booking system", included: false },
        { text: "E-commerce", included: false }
      ]
    },
    {
      name: "Growth",
      price: RUPEE + "49,999",
      cadence: "one-time",
      featured: true,
      badge: "Most Popular",
      cta: { label: "Start Growing", variant: "primary" },
      inclusions: [
        { text: "Up to 10 pages", included: true },
        { text: "Premium UI/UX design", included: true },
        { text: "Booking system integration", included: true },
        { text: "Full local SEO + Google profile", included: true },
        { text: "Analytics dashboard", included: true },
        { text: "14-day delivery", included: true },
        { text: "E-commerce store", included: false }
      ]
    },
    {
      name: "Elite",
      price: RUPEE + "89,999",
      cadence: "one-time",
      featured: false,
      cta: { label: "Go Elite", variant: "ghost" },
      inclusions: [
        { text: "Unlimited pages", included: true },
        { text: "Custom brand identity", included: true },
        { text: "E-commerce + gift cards", included: true },
        { text: "Booking + CRM integration", included: true },
        { text: "Advanced SEO strategy", included: true },
        { text: "3 months post-launch support", included: true },
        { text: "Priority 14-day delivery", included: true }
      ]
    }
  ];

  function inclusionHtml(inc) {
    var icon = inc.included ? "check_circle" : "remove";
    var rowStyle =
      "display:flex;align-items:flex-start;gap:12px" + (inc.included ? "" : ";opacity:.3");
    return (
      '<li class="sx-pricing-inclusion" style="' + rowStyle + '">' +
      '<span class="msym" aria-hidden="true" style="font-size:18px;color:#fff;flex-shrink:0">' +
      icon +
      "</span>" +
      "<span>" + SX.escapeHtml(inc.text) + "</span>" +
      "</li>"
    );
  }

  function cardHtml(pkg) {
    var classes = "sx-glass sx-pricing-card reveal";
    if (pkg.featured) classes += " sx-pricing-card--featured";

    var badge = pkg.badge
      ? '<div class="sx-pricing-badge">' + SX.escapeHtml(pkg.badge) + "</div>"
      : "";

    var nameStyle = pkg.featured ? "color:#c0c1ff" : "";
    var cadence = pkg.cadence
      ? '<div style="color:rgba(255,255,255,.35);font-size:13px;margin-top:-16px;margin-bottom:24px;position:relative;z-index:1">' +
        SX.escapeHtml(pkg.cadence) +
        "</div>"
      : "";

    var inclusions =
      '<ul class="sx-pricing-inclusions">' +
      pkg.inclusions.map(inclusionHtml).join("") +
      "</ul>";

    var ctaVariant = pkg.cta && pkg.cta.variant === "primary" ? "btn-primary" : "btn-ghost";
    var ctaLabel = pkg.cta ? SX.escapeHtml(pkg.cta.label) : "Get Started";
    var cta =
      '<a href="#project" class="' +
      ctaVariant +
      '" style="width:100%;justify-content:center;margin-top:32px">' +
      ctaLabel +
      "</a>";

    return (
      '<article class="' + classes + '" style="position:relative">' +
      badge +
      '<div class="sx-pricing-name" style="' + nameStyle + '">' + SX.escapeHtml(pkg.name) + "</div>" +
      '<div class="sx-pricing-price">' + SX.escapeHtml(pkg.price) + "</div>" +
      cadence +
      inclusions +
      cta +
      "</article>"
    );
  }

  function renderEmpty(grid) {
    grid.innerHTML =
      '<div class="sx-pricing-empty sx-glass">' +
      '<p class="sx-pricing-empty-message">Pricing packages are being updated. ' +
      'Please <a href="#project" class="sx-accent-link" style="text-decoration:underline">start a project</a> ' +
      "and we'll share a personalised quote.</p>" +
      "</div>";
  }

  /**
   * Render the packages into .sx-pricing-grid.
   * @returns {boolean} true when cards were rendered, false on graceful no-op.
   */
  function renderPackages() {
    var grid = SX.qs(".sx-pricing-grid");
    if (!grid) return false; // container absent → nothing to do (graceful).

    var packages = SX.pricing.packages;
    if (!packages || !packages.length) {
      renderEmpty(grid);
      return false;
    }

    grid.innerHTML = packages.map(cardHtml).join("");
    return true;
  }

  SX.pricing = {
    packages: PACKAGES,
    renderPackages: renderPackages
  };
})(window, document);
