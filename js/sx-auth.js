/* ──────────────────────────────────────────────────────────────────────────
 * sx-auth.js — SX.auth: Google sign-in / sign-out + auth state + admin check.
 * Requires firebase-app-compat + firebase-auth-compat (loaded before this) and
 * sx-firebase.js (which calls initializeApp). Exposes:
 *   SX.auth.user            → current firebase user (or null)
 *   SX.auth.isAdmin()       → true when signed in as the business account
 *   SX.auth.signIn()        → Promise (Google popup, redirect fallback)
 *   SX.auth.signOut()       → Promise
 *   SX.auth.requireLogin()  → Promise resolving with the user (prompts if needed)
 *   SX.auth.ready           → Promise resolving on first auth-state callback
 *   SX.auth.onChange(cb)    → subscribe to user changes
 * Renders the nav auth widget ([data-auth] / [data-auth-signin] / [data-auth-user]).
 * ────────────────────────────────────────────────────────────────────────── */
(function (window, document) {
  "use strict";
  var SX = (window.SX = window.SX || {});
  var ADMIN_EMAIL = "synergiax247@gmail.com";

  var auth = null, user = null, subs = [], resolveReady;
  var ready = new Promise(function (r) { resolveReady = r; });

  function getAuth() {
    if (auth) return auth;
    try { auth = window.firebase.auth(); } catch (e) { auth = null; }
    return auth;
  }

  function isAdmin() {
    return !!(user && user.email === ADMIN_EMAIL && user.emailVerified);
  }

  function signIn() {
    var a = getAuth();
    if (!a) return Promise.reject(new Error("Auth unavailable"));
    var provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return a.signInWithPopup(provider).then(function (res) { return res.user; })
      .catch(function (err) {
        // popup blocked / closed → fall back to redirect for robustness
        if (err && (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request")) {
          return a.signInWithRedirect(provider);
        }
        throw err;
      });
  }

  function signOut() {
    var a = getAuth();
    return a ? a.signOut() : Promise.resolve();
  }

  function requireLogin() {
    if (user) return Promise.resolve(user);
    return signIn().then(function () { return ready.then(function () { return user; }); });
  }

  function onChange(cb) { if (typeof cb === "function") { subs.push(cb); if (user !== undefined) cb(user); } }

  // ── nav widget rendering ────────────────────────────────────────────────────
  function render() {
    var wrap = SX.qs("[data-auth]");
    if (!wrap) return;
    var signinBtn = SX.qs("[data-auth-signin]", wrap);
    var userBox = SX.qs("[data-auth-user]", wrap);
    var avatar = SX.qs("[data-auth-avatar]", wrap);
    var nameEl = SX.qs("[data-auth-name]", wrap);
    var adminLink = SX.qs("[data-auth-admin]", wrap);

    if (user) {
      if (signinBtn) signinBtn.hidden = true;
      if (userBox) userBox.hidden = false;
      if (avatar) {
        if (user.photoURL) { avatar.style.backgroundImage = "url('" + user.photoURL + "')"; avatar.textContent = ""; }
        else { avatar.style.backgroundImage = "none"; avatar.textContent = (user.displayName || user.email || "?").charAt(0).toUpperCase(); }
      }
      if (nameEl) nameEl.textContent = (user.displayName || user.email || "Account").split(" ")[0];
      if (adminLink) adminLink.hidden = !isAdmin();
    } else {
      if (signinBtn) signinBtn.hidden = false;
      if (userBox) userBox.hidden = true;
      if (adminLink) adminLink.hidden = true;
    }
  }

  function wireUI() {
    var wrap = SX.qs("[data-auth]");
    if (!wrap) return;
    var signinBtn = SX.qs("[data-auth-signin]", wrap);
    var signoutBtn = SX.qs("[data-auth-signout]", wrap);
    if (signinBtn) SX.on(signinBtn, "click", function () {
      signinBtn.disabled = true;
      signIn().catch(function () {}).then(function () { signinBtn.disabled = false; });
    });
    if (signoutBtn) SX.on(signoutBtn, "click", function () { signOut(); });
  }

  function init() {
    var a = getAuth();
    if (!a) { user = null; resolveReady(null); return; }
    wireUI();
    a.onAuthStateChanged(function (u) {
      user = u || null;
      SX.auth.user = user;
      render();
      subs.forEach(function (cb) { try { cb(user); } catch (e) {} });
      resolveReady(user);
      // notify the rest of the app
      try { document.dispatchEvent(new CustomEvent("sx-auth-changed", { detail: { user: user } })); } catch (e) {}
    });
  }

  SX.auth = {
    user: null,
    ADMIN_EMAIL: ADMIN_EMAIL,
    isAdmin: isAdmin,
    signIn: signIn,
    signOut: signOut,
    requireLogin: requireLogin,
    onChange: onChange,
    ready: ready,
    init: init
  };

  SX.ready(init);
})(window, document);
