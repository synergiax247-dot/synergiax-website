/* SynergiaX Studio Console — admin-only dashboard (client-side, Firestore-gated). */
(function () {
  "use strict";
  var ADMIN_EMAIL = "synergiax247@gmail.com";
  firebase.initializeApp({
    apiKey: "AIzaSyBhORDIcJ1pLm63NcS1nw86OTJzi6NPPwo",
    authDomain: "synergiax-b9b76.firebaseapp.com",
    projectId: "synergiax-b9b76",
    storageBucket: "synergiax-b9b76.firebasestorage.app",
    messagingSenderId: "402801373488",
    appId: "1:402801373488:web:812a15a960b648adf5d8f5"
  });
  var auth = firebase.auth(), db = firebase.firestore();

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  function esc(v) { return (v == null ? "" : String(v)).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function dt(t) { try { return t && t.toDate ? t.toDate() : (t ? new Date(t) : null); } catch (e) { return null; } }
  function when(t) { var d = dt(t); return d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—"; }
  function ms(t) { var d = dt(t); return d ? d.getTime() : 0; }
  function ago(t) { var d = dt(t); if (!d) return "—"; var s = (Date.now() - d.getTime()) / 1000; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago"; if (s < 86400) return Math.floor(s / 3600) + "h ago"; return Math.floor(s / 86400) + "d ago"; }
  function stars(n) { n = Math.max(0, Math.min(5, n | 0)); return "★".repeat(n) + "☆".repeat(5 - n); }
  function toast(m) { var t = $("[data-toast]"); t.textContent = m; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove("show"); }, 3000); }
  function gmail(to, su, body) { return "https://mail.google.com/mail/?authuser=" + encodeURIComponent(ADMIN_EMAIL) + "&view=cm&fs=1&to=" + encodeURIComponent(to) + "&su=" + encodeURIComponent(su) + "&body=" + encodeURIComponent(body); }

  var leads = [], reviews = [], charts = {}, sortKey = "createdAt", sortDir = -1, range = 8, gq = "";

  // ── gate ──
  $("[data-gate-signin]").addEventListener("click", function () {
    var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
    auth.signInWithPopup(p).catch(function (e) { if (e && e.code === "auth/popup-blocked") auth.signInWithRedirect(p); else toast(e.message || "Sign-in failed"); });
  });
  $$("[data-signout]").forEach(function (b) { b.addEventListener("click", function () { auth.signOut(); }); });

  auth.onAuthStateChanged(function (u) {
    var gate = $("[data-gate]"), app = $("[data-app]");
    if (!u) return showGate("Studio Console", "Sign in with the SynergiaX business account to continue.", false);
    if (u.email !== ADMIN_EMAIL || !u.emailVerified) return showGate("Access denied", "The account <b>" + esc(u.email) + "</b> isn't authorised for the studio console.", true);
    gate.classList.add("hide"); app.classList.remove("hide");
    var av = u.photoURL ? "url('" + u.photoURL + "')" : "none";
    $$("[data-me-av]").concat($$("[data-me-av2]")).forEach(function (e) { e.style.backgroundImage = av; });
    $("[data-me-name]").textContent = u.displayName || "Admin";
    $("[data-me-email]").textContent = u.email;
    subscribe();
  });
  function showGate(title, msg, sw) {
    $("[data-app]").classList.add("hide"); $("[data-gate]").classList.remove("hide");
    $("[data-gate-title]").textContent = title; $("[data-gate-msg]").innerHTML = msg;
    var ex = $("[data-gate-extra]"); ex.innerHTML = "";
    if (sw) { var b = document.createElement("button"); b.className = "btn btn--ghost"; b.innerHTML = '<span class="msym" style="font-size:16px">logout</span> Use a different account'; b.onclick = function () { auth.signOut(); }; ex.appendChild(b); }
  }

  // ── nav (SPA) ──
  var titles = { overview: ["Dashboard", "Studio Console"], analytics: ["Analytics", "Insights & trends"], enquiries: ["Enquiries", "Project leads"], reviews: ["Reviews", "Client feedback"], about: ["About", "Studio Console"] };
  $$("[data-nav]").forEach(function (n) {
    n.addEventListener("click", function () {
      var v = n.getAttribute("data-nav");
      $$("[data-nav]").forEach(function (x) { x.classList.toggle("is-active", x === n); });
      $$("[data-view]").forEach(function (s) { s.classList.toggle("is-active", s.getAttribute("data-view") === v); });
      $("[data-pagetitle]").textContent = titles[v][0]; $("[data-crumb]").textContent = titles[v][1];
      $("[data-app]").classList.remove("mobileopen");
      if (charts.time) setTimeout(renderCharts, 30); // resize fix when becoming visible
    });
  });
  $("[data-burger]").addEventListener("click", function () {
    var app = $("[data-app]");
    if (window.innerWidth <= 820) app.classList.toggle("mobileopen"); else app.classList.toggle("collapsed");
  });
  $$("[data-range] button").forEach(function (b) { b.addEventListener("click", function () { $$("[data-range] button").forEach(function (x) { x.classList.toggle("is-active", x === b); }); range = +b.getAttribute("data-r"); renderCharts(); }); });

  // ── data ──
  function subscribe() {
    db.collection("leads").orderBy("createdAt", "desc").onSnapshot(function (s) { leads = []; s.forEach(function (d) { var x = d.data(); x._id = d.id; leads.push(x); }); renderAll(); }, function (e) { console.warn(e.message); });
    db.collection("reviews").orderBy("createdAt", "desc").onSnapshot(function (s) { reviews = []; s.forEach(function (d) { var x = d.data(); x._id = d.id; reviews.push(x); }); renderAll(); }, function (e) { console.warn(e.message); });
  }
  function renderAll() { renderBadges(); renderKpis(); renderCharts(); renderActivity(); renderLeads(); renderReviews(); }

  function renderBadges() { $("[data-badge-leads]").textContent = leads.length; $("[data-badge-reviews]").textContent = reviews.length; }

  // ── KPIs (count-up) ──
  function countUp(el, target, suffix) {
    var dur = 900, start = null, from = 0;
    function step(ts) { if (start === null) start = ts; var p = Math.min(1, (ts - start) / dur); var e = 1 - Math.pow(1 - p, 3); var val = from + (target - from) * e; el.textContent = (target % 1 ? val.toFixed(1) : Math.round(val)) + (suffix || ""); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function renderKpis() {
    var nNew = leads.filter(function (l) { return (l.status || "new") === "new"; }).length;
    var nWon = leads.filter(function (l) { return l.status === "won"; }).length;
    var avg = reviews.length ? reviews.reduce(function (s, r) { return s + (r.rating || 0); }, 0) / reviews.length : 0;
    var weekAgo = Date.now() - 7 * 864e5, thisWeek = leads.filter(function (l) { return ms(l.createdAt) > weekAgo; }).length;
    var cards = [
      { n: leads.length, l: "Total enquiries", i: "inbox", c: "var(--ind)" },
      { n: nNew, l: "New / unactioned", i: "fiber_new", c: "var(--info)" },
      { n: nWon, l: "Won deals", i: "verified", c: "var(--ok)" },
      { n: thisWeek, l: "This week", i: "calendar_today", c: "var(--ind2)" },
      { n: reviews.length, l: "Reviews", i: "reviews", c: "var(--acc)" },
      { n: avg, l: "Avg. rating", i: "grade", c: "var(--warn)", suf: avg ? "★" : "" }
    ];
    $("[data-kpis]").innerHTML = cards.map(function (c) {
      return '<div class="kpi"><div class="kpi__ico" style="background:rgba(124,125,255,.14);color:' + c.c + '"><span class="msym">' + c.i + '</span></div>' +
        '<div class="kpi__num" data-cn="' + c.n + '" data-suf="' + (c.suf || "") + '">0</div><div class="kpi__lab">' + c.l + '</div></div>';
    }).join("");
    $$("[data-cn]").forEach(function (el) { countUp(el, parseFloat(el.getAttribute("data-cn")) || 0, el.getAttribute("data-suf")); });
  }

  // ── charts ──
  function baseOpts(extra) { return Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 800, easing: "easeOutCubic" } }, extra || {}); }
  function renderCharts() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.color = "rgba(255,255,255,.58)"; Chart.defaults.font.family = "Inter, sans-serif";
    var pal = ["#7c7dff", "#b07dff", "#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#22d3ee", "#a78bfa", "#f472b6"];
    function mk(key, el, conf) { if (!el) return; if (charts[key]) charts[key].destroy(); charts[key] = new Chart(el, conf); }

    // by type doughnut
    var byType = {}; leads.forEach(function (l) { var t = l.businessType || "other"; byType[t] = (byType[t] || 0) + 1; });
    mk("type", $("[data-chart-type]"), { type: "doughnut", data: { labels: Object.keys(byType), datasets: [{ data: Object.values(byType), backgroundColor: pal, borderColor: "#0c0c12", borderWidth: 3 }] }, options: baseOpts({ cutout: "64%", plugins: { legend: { position: "bottom", labels: { boxWidth: 11, padding: 12, font: { size: 11 } } } } }) });

    // over time bar (range weeks)
    var wl = [], wc = [], now = Date.now(), W = 7 * 864e5;
    for (var i = range - 1; i >= 0; i--) { var a = now - (i + 1) * W, b = now - i * W; wc.push(leads.filter(function (l) { var t = ms(l.createdAt); return t > a && t <= b; }).length); var d = new Date(b); wl.push((d.getMonth() + 1) + "/" + d.getDate()); }
    mk("time", $("[data-chart-time]"), { type: "line", data: { labels: wl, datasets: [{ data: wc, fill: true, tension: .4, borderColor: "#7c7dff", backgroundColor: "rgba(124,125,255,.15)", pointBackgroundColor: "#b07dff", pointRadius: 3 }] }, options: baseOpts({ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(255,255,255,.06)" } }, x: { grid: { display: false } } } }) });

    // pipeline status bar
    var st = ["new", "contacted", "won", "lost"], stc = ["#7c7dff", "#fbbf24", "#34d399", "#fb7185"];
    var stv = st.map(function (s) { return leads.filter(function (l) { return (l.status || "new") === s; }).length; });
    mk("status", $("[data-chart-status]"), { type: "bar", data: { labels: st, datasets: [{ data: stv, backgroundColor: stc, borderRadius: 6 }] }, options: baseOpts({ indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(255,255,255,.06)" } }, y: { grid: { display: false } } } }) });

    // rating distribution
    var rd = [1, 2, 3, 4, 5].map(function (n) { return reviews.filter(function (r) { return (r.rating | 0) === n; }).length; });
    mk("rating", $("[data-chart-rating]"), { type: "bar", data: { labels: ["1★", "2★", "3★", "4★", "5★"], datasets: [{ data: rd, backgroundColor: "#fbbf24", borderRadius: 6 }] }, options: baseOpts({ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(255,255,255,.06)" } }, x: { grid: { display: false } } } }) });

    // stacked type x status
    var types = Object.keys(byType);
    var ds = st.map(function (s, idx) { return { label: s, backgroundColor: stc[idx], borderRadius: 4, data: types.map(function (t) { return leads.filter(function (l) { return (l.businessType || "other") === t && (l.status || "new") === s; }).length; }) }; });
    mk("stack", $("[data-chart-stack]"), { type: "bar", data: { labels: types, datasets: ds }, options: baseOpts({ plugins: { legend: { position: "bottom", labels: { boxWidth: 11, font: { size: 11 } } } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(255,255,255,.06)" } } } }) });

    // conversion funnel (HTML)
    var total = leads.length, contacted = leads.filter(function (l) { return ["contacted", "won"].indexOf(l.status) >= 0; }).length, won = leads.filter(function (l) { return l.status === "won"; }).length;
    var rate = total ? Math.round(won / total * 100) : 0;
    var fEl = $("[data-funnel]");
    if (fEl) {
      function bar(lab, v, max, col) { var w = max ? Math.max(6, v / max * 100) : 6; return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px"><span style="color:var(--mut)">' + lab + '</span><b>' + v + '</b></div><div style="height:12px;border-radius:7px;background:rgba(255,255,255,.06)"><div style="height:100%;width:' + w + '%;border-radius:7px;background:' + col + ';transition:width .6s"></div></div></div>'; }
      fEl.innerHTML = bar("All enquiries", total, total, "linear-gradient(90deg,#7c7dff,#b07dff)") + bar("Contacted", contacted, total, "#fbbf24") + bar("Won", won, total, "#34d399") +
        '<div style="text-align:center;margin-top:14px"><div style="font-family:var(--serif);font-size:34px;color:#34d399">' + rate + '%</div><div style="font-size:12px;color:var(--mut)">win rate</div></div>';
    }
  }

  // ── recent activity ──
  function renderActivity() {
    var items = [];
    leads.slice(0, 6).forEach(function (l) { items.push({ t: ms(l.createdAt), html: '<span class="msym" style="color:var(--ind)">person_add</span> New enquiry from <b>' + esc(l.name) + '</b> · ' + esc(l.businessName) + ' <span style="color:var(--mut2)">' + ago(l.createdAt) + '</span>' }); });
    reviews.slice(0, 6).forEach(function (r) { items.push({ t: ms(r.createdAt), html: '<span class="msym" style="color:var(--warn)">star</span> ' + (r.rating | 0) + '★ review by <b>' + esc(r.name) + '</b> <span style="color:var(--mut2)">' + ago(r.createdAt) + '</span>' }); });
    items.sort(function (a, b) { return b.t - a.t; });
    var host = $("[data-activity]");
    host.innerHTML = items.length ? items.slice(0, 8).map(function (i) { return '<div style="display:flex;align-items:center;gap:10px;padding:11px 4px;border-bottom:1px solid rgba(255,255,255,.05);font-size:13.5px">' + i.html + '</div>'; }).join("") : '<div class="empty"><span class="msym">hourglass_empty</span>No activity yet.</div>';
  }

  // ── enquiries table ──
  $$("[data-sort]").forEach(function (th) { th.addEventListener("click", function () { var k = th.getAttribute("data-sort"); if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = k === "createdAt" ? -1 : 1; } renderLeads(); }); });
  function renderLeads() {
    var q = (($("[data-lead-search]").value || "") + " " + gq).trim().toLowerCase();
    var st = $("[data-lead-status]").value, ty = $("[data-lead-type]").value;
    // type filter options
    var sel = $("[data-lead-type]"), cur = sel.value, types = {}; leads.forEach(function (l) { if (l.businessType) types[l.businessType] = 1; });
    sel.innerHTML = '<option value="">All types</option>' + Object.keys(types).map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + '</option>'; }).join(""); sel.value = cur;

    var rows = leads.filter(function (l) {
      if (st && (l.status || "new") !== st) return false; if (ty && l.businessType !== ty) return false;
      if (q) { var blob = (l.name + " " + l.businessName + " " + l.email + " " + (l.brief || "")).toLowerCase(); if (q.split(/\s+/).some(function (w) { return w && blob.indexOf(w) < 0; })) return false; }
      return true;
    });
    rows.sort(function (a, b) { var av = a[sortKey], bv = b[sortKey]; if (sortKey === "createdAt") { av = ms(a.createdAt); bv = ms(b.createdAt); } av = (av == null ? "" : av); bv = (bv == null ? "" : bv); return (av > bv ? 1 : av < bv ? -1 : 0) * sortDir; });

    var host = $("[data-leads]");
    if (!rows.length) { host.innerHTML = '<tr><td colspan="6"><div class="empty"><span class="msym">inbox</span>No enquiries match these filters.</div></td></tr>'; return; }
    host.innerHTML = rows.map(function (l) {
      var status = l.status || "new";
      var body = "Hi " + (l.name || "there") + ",\n\nThank you for reaching out to SynergiaX about " + (l.businessName || "your project") + ". We'd love to help. ";
      return '<tr>' +
        '<td><div class="cellname">' + esc(l.name) + '</div><div class="cellsub">' + esc(l.businessName) + '</div><div class="cellsub"><a href="mailto:' + esc(l.email) + '" style="color:var(--info);text-decoration:none">' + esc(l.email) + '</a> · ' + esc(l.phone) + '</div></td>' +
        '<td><span class="badge b-type">' + esc(l.businessType || "other") + '</span></td>' +
        '<td><div class="brief-x">' + esc(l.brief || "—") + '</div></td>' +
        '<td style="white-space:nowrap;color:var(--mut)">' + when(l.createdAt) + '</td>' +
        '<td><span class="badge b-' + status + '">' + status + '</span></td>' +
        '<td><div class="rowbtns">' +
          '<a class="mini mini--reply" target="_blank" rel="noopener" href="' + gmail(l.email, "Re: Your project enquiry · SynergiaX", body) + '"><span class="msym" style="font-size:15px">reply</span>Reply</a>' +
          '<select class="select statussel" data-setstatus="' + l._id + '">' + ["new", "contacted", "won", "lost"].map(function (s) { return '<option' + (s === status ? " selected" : "") + '>' + s + '</option>'; }).join("") + '</select>' +
          '<button class="iconmini mini--del" data-dellead="' + l._id + '" title="Delete"><span class="msym" style="font-size:16px">delete</span></button>' +
        '</div></td></tr>';
    }).join("");
    $$("[data-setstatus]", host).forEach(function (s) { s.addEventListener("change", function () { db.collection("leads").doc(s.getAttribute("data-setstatus")).update({ status: s.value }).then(function () { toast("Status updated"); }); }); });
    $$("[data-dellead]", host).forEach(function (b) { b.addEventListener("click", function () { if (confirm("Delete this enquiry permanently?")) db.collection("leads").doc(b.getAttribute("data-dellead")).delete().then(function () { toast("Enquiry deleted"); }); }); });
  }

  // ── reviews ──
  function renderReviews() {
    var rt = $("[data-rev-rating]").value, sort = $("[data-rev-sort]").value;
    var rows = reviews.filter(function (r) { if (rt && (r.rating | 0) !== +rt) return false; if (gq) { var blob = (r.name + " " + r.biz + " " + r.text).toLowerCase(); if (blob.indexOf(gq.toLowerCase()) < 0) return false; } return true; });
    rows.sort(function (a, b) { if (sort === "high") return (b.rating || 0) - (a.rating || 0); if (sort === "low") return (a.rating || 0) - (b.rating || 0); return ms(b.createdAt) - ms(a.createdAt); });
    var host = $("[data-reviews]");
    if (!rows.length) { host.innerHTML = '<div class="empty"><span class="msym">reviews</span>No reviews match these filters.</div>'; return; }
    host.innerHTML = rows.map(function (r) {
      var av = r.photoURL ? ' style="background-image:url(\'' + esc(r.photoURL) + '\')"' : '';
      return '<div class="rev"><div class="rev__top"><div class="av"' + av + '>' + (r.photoURL ? '' : esc((r.name || "?").charAt(0).toUpperCase())) + '</div>' +
        '<div style="flex:1"><div class="cellname">' + esc(r.name) + '</div><div class="cellsub">' + esc(r.biz) + '</div></div><div class="stars">' + stars(r.rating) + '</div></div>' +
        '<div class="rev__txt">“' + esc(r.text) + '”</div>' +
        '<div class="rev__foot"><span>' + (r.email ? esc(r.email) : "") + '</span><span>' + when(r.createdAt) + ' · <a href="#" data-delrev="' + r._id + '" style="color:var(--bad);text-decoration:none">Remove</a></span></div></div>';
    }).join("");
    $$("[data-delrev]", host).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); if (confirm("Remove this review permanently?")) db.collection("reviews").doc(a.getAttribute("data-delrev")).delete().then(function () { toast("Review removed"); }); }); });
  }

  // filters
  ["[data-lead-search]", "[data-lead-status]", "[data-lead-type]"].forEach(function (s) { var e = $(s); if (e) e.addEventListener("input", renderLeads); });
  ["[data-rev-rating]", "[data-rev-sort]"].forEach(function (s) { var e = $(s); if (e) e.addEventListener("change", renderReviews); });
  $("[data-global-search]").addEventListener("input", function () { gq = this.value || ""; renderLeads(); renderReviews(); });
})();
