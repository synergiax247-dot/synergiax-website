/* SynergiaX Studio Dashboard — admin-only, client-side, gated by Firestore rules.
   Live leads + reviews, analytics, filters, status management, Gmail-compose reply. */
(function () {
  "use strict";
  var ADMIN_EMAIL = "synergiax247@gmail.com";
  var cfg = {
    apiKey: "AIzaSyBhORDIcJ1pLm63NcS1nw86OTJzi6NPPwo",
    authDomain: "synergiax-b9b76.firebaseapp.com",
    projectId: "synergiax-b9b76",
    storageBucket: "synergiax-b9b76.firebasestorage.app",
    messagingSenderId: "402801373488",
    appId: "1:402801373488:web:812a15a960b648adf5d8f5"
  };
  firebase.initializeApp(cfg);
  var auth = firebase.auth(), db = firebase.firestore();

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function esc(v) { return (v == null ? "" : String(v)).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function when(t) { try { var d = t && t.toDate ? t.toDate() : (t ? new Date(t) : null); return d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—"; } catch (e) { return "—"; } }
  function ms(t) { try { var d = t && t.toDate ? t.toDate() : new Date(t); return d.getTime(); } catch (e) { return 0; } }
  function stars(n) { n = Math.max(0, Math.min(5, n | 0)); return "★".repeat(n) + "☆".repeat(5 - n); }

  var gate = $("[data-gate]"), dash = $("[data-dash]");
  var leadsData = [], reviewsData = [], chartType = null, chartTime = null;

  // ── auth gate ───────────────────────────────────────────────────────────
  $("[data-gate-signin]").addEventListener("click", function () {
    var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
    auth.signInWithPopup(p).catch(function (e) { if (e && e.code === "auth/popup-blocked") auth.signInWithRedirect(p); });
  });
  $("[data-signout]").addEventListener("click", function () { auth.signOut(); });

  auth.onAuthStateChanged(function (u) {
    if (!u) { showGate("Studio Access", "Sign in with the SynergiaX business account to continue.", false); return; }
    if (u.email !== ADMIN_EMAIL || !u.emailVerified) {
      showGate("Access denied", "The account <b>" + esc(u.email) + "</b> doesn't have studio access.", true);
      return;
    }
    gate.classList.add("hide"); dash.classList.remove("hide");
    $("[data-me-name]").textContent = u.displayName || "Admin";
    $("[data-me-email]").textContent = u.email;
    if (u.photoURL) $("[data-me-av]").style.backgroundImage = "url('" + u.photoURL + "')";
    subscribe();
  });

  function showGate(title, msg, showSignout) {
    dash.classList.add("hide"); gate.classList.remove("hide");
    $("[data-gate-title]").textContent = title;
    $("[data-gate-msg]").innerHTML = msg;
    var extra = $("[data-gate-extra]"); extra.innerHTML = "";
    if (showSignout) {
      var b = document.createElement("button"); b.className = "btn btn--ghost"; b.style.marginTop = "14px";
      b.innerHTML = '<span class="msym" style="font-size:16px">logout</span> Use a different account';
      b.addEventListener("click", function () { auth.signOut(); });
      extra.appendChild(b);
    }
  }

  // ── live data ───────────────────────────────────────────────────────────
  function subscribe() {
    db.collection("leads").orderBy("createdAt", "desc").onSnapshot(function (snap) {
      leadsData = []; snap.forEach(function (d) { var x = d.data(); x._id = d.id; leadsData.push(x); });
      populateTypeFilter(); renderStats(); renderCharts(); renderLeads();
    }, function (err) { console.warn("leads listen:", err.message); });

    db.collection("reviews").orderBy("createdAt", "desc").onSnapshot(function (snap) {
      reviewsData = []; snap.forEach(function (d) { var x = d.data(); x._id = d.id; reviewsData.push(x); });
      renderStats(); renderReviews();
    }, function (err) { console.warn("reviews listen:", err.message); });
  }

  // ── stats ───────────────────────────────────────────────────────────────
  function renderStats() {
    var nNew = leadsData.filter(function (l) { return (l.status || "new") === "new"; }).length;
    var nWon = leadsData.filter(function (l) { return l.status === "won"; }).length;
    var avg = reviewsData.length ? (reviewsData.reduce(function (s, r) { return s + (r.rating || 0); }, 0) / reviewsData.length) : 0;
    var cards = [
      { n: leadsData.length, l: "Total enquiries", i: "inbox" },
      { n: nNew, l: "New / unactioned", i: "fiber_new" },
      { n: nWon, l: "Won deals", i: "verified" },
      { n: reviewsData.length, l: "Reviews", i: "reviews" },
      { n: avg ? avg.toFixed(1) + "★" : "—", l: "Avg. rating", i: "grade" }
    ];
    $("[data-stats]").innerHTML = cards.map(function (c) {
      return '<div class="stat"><div class="stat__num">' + esc(c.n) + '</div><div class="stat__lab">' + esc(c.l) + '</div></div>';
    }).join("");
    var avgEl = $("[data-rev-avg]"); if (avgEl) avgEl.textContent = reviewsData.length ? (avg.toFixed(1) + "★ avg") : "";
  }

  // ── charts ──────────────────────────────────────────────────────────────
  function renderCharts() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.color = "rgba(255,255,255,.6)";
    Chart.defaults.font.family = "Inter, sans-serif";
    var byType = {};
    leadsData.forEach(function (l) { var t = l.businessType || "other"; byType[t] = (byType[t] || 0) + 1; });
    var tLabels = Object.keys(byType), tVals = tLabels.map(function (k) { return byType[k]; });
    var palette = ["#7c7dff", "#b07dff", "#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#22d3ee", "#a78bfa"];
    if (chartType) chartType.destroy();
    chartType = new Chart($("[data-chart-type]"), {
      type: "doughnut",
      data: { labels: tLabels, datasets: [{ data: tVals, backgroundColor: palette, borderColor: "#0c0c14", borderWidth: 2 }] },
      options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 12 } } }, cutout: "62%" }
    });
    // last 8 weeks
    var weeks = [], counts = [], now = Date.now(), W = 7 * 864e5;
    for (var i = 7; i >= 0; i--) {
      var start = now - (i + 1) * W, end = now - i * W;
      var c = leadsData.filter(function (l) { var t = ms(l.createdAt); return t > start && t <= end; }).length;
      var d = new Date(end); weeks.push((d.getMonth() + 1) + "/" + d.getDate()); counts.push(c);
    }
    if (chartTime) chartTime.destroy();
    chartTime = new Chart($("[data-chart-time]"), {
      type: "bar",
      data: { labels: weeks, datasets: [{ data: counts, backgroundColor: "#7c7dff", borderRadius: 6 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(255,255,255,.06)" } }, x: { grid: { display: false } } } }
    });
  }

  function populateTypeFilter() {
    var sel = $("[data-lead-type]"); if (!sel) return;
    var cur = sel.value, types = {};
    leadsData.forEach(function (l) { if (l.businessType) types[l.businessType] = 1; });
    sel.innerHTML = '<option value="">All types</option>' + Object.keys(types).map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + '</option>'; }).join("");
    sel.value = cur;
  }

  // ── leads ───────────────────────────────────────────────────────────────
  function gmail(to, subj, body) {
    return "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(to) + "&su=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
  }
  function renderLeads() {
    var q = ($("[data-lead-search]").value || "").toLowerCase();
    var st = $("[data-lead-status]").value, ty = $("[data-lead-type]").value, sort = $("[data-lead-sort]").value;
    var rows = leadsData.filter(function (l) {
      if (st && (l.status || "new") !== st) return false;
      if (ty && l.businessType !== ty) return false;
      if (q) { var blob = (l.name + " " + l.businessName + " " + l.email + " " + (l.accountEmail || "")).toLowerCase(); if (blob.indexOf(q) < 0) return false; }
      return true;
    });
    rows.sort(function (a, b) { return sort === "old" ? ms(a.createdAt) - ms(b.createdAt) : ms(b.createdAt) - ms(a.createdAt); });
    var host = $("[data-leads]");
    if (!rows.length) { host.innerHTML = '<div class="empty">No enquiries match these filters yet.</div>'; return; }
    host.innerHTML = rows.map(function (l) {
      var status = l.status || "new";
      var body = "Hi " + (l.name || "there") + ",\n\nThank you for reaching out to SynergiaX about " + (l.businessName || "your business") + ". ";
      return '<div class="card">' +
        '<div class="card__row"><div>' +
          '<div class="card__title">' + esc(l.name) + ' <span class="badge b-type">' + esc(l.businessType || "other") + '</span></div>' +
          '<div class="card__sub">' + esc(l.businessName) + '</div>' +
        '</div><span class="badge b-' + status + '">' + status + '</span></div>' +
        (l.brief ? '<div class="card__brief">' + esc(l.brief) + '</div>' : '') +
        '<div class="meta">' +
          '<span><span class="msym" style="font-size:14px">mail</span> <a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a></span>' +
          '<span><span class="msym" style="font-size:14px">call</span> <a href="tel:' + esc(l.phone) + '">' + esc(l.phone) + '</a></span>' +
          '<span><span class="msym" style="font-size:14px">schedule</span> ' + when(l.createdAt) + '</span>' +
        '</div>' +
        '<div class="actions">' +
          '<a class="mini mini--reply" target="_blank" rel="noopener" href="' + gmail(l.email, "Re: Your project enquiry to SynergiaX", body) + '"><span class="msym" style="font-size:15px">reply</span> Reply</a>' +
          '<select class="select" data-setstatus="' + l._id + '" style="padding:7px 10px">' +
            ["new", "contacted", "won", "lost"].map(function (s) { return '<option value="' + s + '"' + (s === status ? " selected" : "") + '>' + s + '</option>'; }).join("") +
          '</select>' +
          '<button class="mini mini--del" data-dellead="' + l._id + '"><span class="msym" style="font-size:15px">delete</span></button>' +
        '</div></div>';
    }).join("");

    $$("[data-setstatus]", host).forEach(function (sel) {
      sel.addEventListener("change", function () { db.collection("leads").doc(sel.getAttribute("data-setstatus")).update({ status: sel.value }); });
    });
    $$("[data-dellead]", host).forEach(function (b) {
      b.addEventListener("click", function () { if (confirm("Delete this enquiry permanently?")) db.collection("leads").doc(b.getAttribute("data-dellead")).delete(); });
    });
  }

  // ── reviews ─────────────────────────────────────────────────────────────
  function renderReviews() {
    var rt = $("[data-rev-rating]").value, sort = $("[data-rev-sort]").value;
    var rows = reviewsData.filter(function (r) { return !rt || (r.rating | 0) === parseInt(rt, 10); });
    rows.sort(function (a, b) {
      if (sort === "high") return (b.rating || 0) - (a.rating || 0);
      if (sort === "low") return (a.rating || 0) - (b.rating || 0);
      return ms(b.createdAt) - ms(a.createdAt);
    });
    var host = $("[data-reviews]");
    if (!rows.length) { host.innerHTML = '<div class="empty">No reviews match these filters yet.</div>'; return; }
    host.innerHTML = rows.map(function (r) {
      var av = r.photoURL ? ' style="background-image:url(\'' + esc(r.photoURL) + '\')"' : '';
      var ini = (r.name || "?").charAt(0).toUpperCase();
      return '<div class="card"><div class="card__row" style="align-items:center">' +
        '<div style="display:flex;gap:12px;align-items:center">' +
          '<div class="av"' + av + '>' + (r.photoURL ? '' : esc(ini)) + '</div>' +
          '<div><div class="card__title">' + esc(r.name) + '</div><div class="card__sub">' + esc(r.biz) + (r.email ? ' · ' + esc(r.email) : '') + '</div></div>' +
        '</div><div class="stars">' + stars(r.rating) + '</div></div>' +
        '<div class="card__brief">' + esc(r.text) + '</div>' +
        '<div class="meta"><span><span class="msym" style="font-size:14px">schedule</span> ' + when(r.createdAt) + '</span></div>' +
        '<div class="actions"><button class="mini mini--del" data-delrev="' + r._id + '"><span class="msym" style="font-size:15px">delete</span> Remove</button></div>' +
      '</div>';
    }).join("");
    $$("[data-delrev]", host).forEach(function (b) {
      b.addEventListener("click", function () { if (confirm("Remove this review permanently?")) db.collection("reviews").doc(b.getAttribute("data-delrev")).delete(); });
    });
  }

  // filters re-render
  ["[data-lead-search]", "[data-lead-status]", "[data-lead-type]", "[data-lead-sort]"].forEach(function (s) {
    var el = $(s); if (el) el.addEventListener("input", renderLeads);
  });
  ["[data-rev-rating]", "[data-rev-sort]"].forEach(function (s) {
    var el = $(s); if (el) el.addEventListener("change", renderReviews);
  });
})();
