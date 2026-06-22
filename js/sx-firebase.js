/* ──────────────────────────────────────────────────────────────────────────
 * sx-firebase.js — SX.fb / SX.db
 * Initialises Firebase (compat SDK loaded via CDN <script> before this file)
 * and exposes a tiny data layer for client-side Firestore writes/reads:
 *   - SX.db.addLead(data)      → Promise<id>   (project intake form)
 *   - SX.db.addReview(data)    → Promise<id>   (client reviews)
 *   - SX.db.listReviews(limit) → Promise<array>
 * The web config below is a PUBLIC Firebase client config (safe to ship) — all
 * access is governed by Firestore security rules (see firestore.rules).
 * If the SDK fails to load (offline / blocked), SX.db.ready rejects and callers
 * fall back gracefully. Plain classic <script>; never throws synchronously.
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";
  var SX = (window.SX = window.SX || {});

  var firebaseConfig = {
    apiKey: "AIzaSyBhORDIcJ1pLm63NcS1nw86OTJzi6NPPwo",
    authDomain: "synergiax-b9b76.firebaseapp.com",
    projectId: "synergiax-b9b76",
    storageBucket: "synergiax-b9b76.firebasestorage.app",
    messagingSenderId: "402801373488",
    appId: "1:402801373488:web:812a15a960b648adf5d8f5",
    measurementId: "G-634V58VYQZ"
  };

  var db = null, ready;

  function initNow(resolve, reject) {
    try {
      if (!window.firebase || !window.firebase.initializeApp) {
        reject(new Error("Firebase SDK not loaded"));
        return;
      }
      if (!window.firebase.apps || !window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }
      db = window.firebase.firestore();
      resolve(db);
    } catch (e) { reject(e); }
  }

  ready = new Promise(function (resolve, reject) {
    // SDK scripts are above this file, so firebase should already exist; guard anyway.
    if (window.firebase && window.firebase.initializeApp) {
      initNow(resolve, reject);
    } else {
      // give late-loading CDN scripts a brief chance
      var tries = 0;
      var iv = window.setInterval(function () {
        if (window.firebase && window.firebase.initializeApp) {
          window.clearInterval(iv); initNow(resolve, reject);
        } else if (++tries > 40) { // ~4s
          window.clearInterval(iv); reject(new Error("Firebase SDK unavailable"));
        }
      }, 100);
    }
  });
  ready.catch(function () { /* swallow — callers handle rejection */ });

  function ts() {
    try { return window.firebase.firestore.FieldValue.serverTimestamp(); }
    catch (e) { return new Date().toISOString(); }
  }

  function currentUser() { return (SX.auth && SX.auth.user) || null; }

  function addLead(data) {
    return ready.then(function () {
      var u = currentUser();
      return db.collection("leads").add({
        name: String(data.name || ""),
        businessName: String(data.businessName || ""),
        email: String(data.email || ""),
        phone: String(data.phone || ""),
        businessType: String(data.businessType || "other"),
        brief: String(data.brief || ""),
        status: "new",
        source: "website",
        uid: u ? u.uid : "",
        accountEmail: u ? (u.email || "") : "",
        photoURL: u ? (u.photoURL || "") : "",
        createdAt: ts()
      });
    }).then(function (ref) { return ref.id; });
  }

  function addReview(data) {
    return ready.then(function () {
      var u = currentUser();
      var rating = parseInt(data.rating, 10); if (isNaN(rating)) rating = 5;
      rating = Math.max(1, Math.min(5, rating));
      return db.collection("reviews").add({
        name: String(data.name || (u && u.displayName) || ""),
        biz: String(data.biz || ""),
        text: String(data.text || ""),
        rating: rating,
        approved: true,
        uid: u ? u.uid : "",
        email: u ? (u.email || "") : "",
        photoURL: u ? (u.photoURL || "") : "",
        createdAt: ts()
      });
    }).then(function (ref) { return ref.id; });
  }

  function listReviews(limit) {
    return ready.then(function () {
      var q = db.collection("reviews").orderBy("createdAt", "desc").limit(limit || 50);
      return q.get();
    }).then(function (snap) {
      var out = [];
      snap.forEach(function (doc) {
        var d = doc.data() || {};
        out.push({ name: d.name, biz: d.biz, text: d.text, rating: d.rating, photoURL: d.photoURL || "" });
      });
      return out;
    });
  }

  SX.fb = { ready: ready, config: firebaseConfig };
  SX.db = { addLead: addLead, addReview: addReview, listReviews: listReviews };
})(window, document);
