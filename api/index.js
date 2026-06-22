const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const cors = require("cors")({ origin: true });

initializeApp();
const db = getFirestore();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * HTTPS function mounted at /api/** via the Hosting rewrite.
 *   POST /leads   → save a project-intake lead to Firestore
 *   GET  /health  → uptime check
 */
exports.api = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const path = req.path; // e.g. "/leads"

    // ----- POST /leads -----
    if (req.method === "POST" && path === "/leads") {
      const body = req.body || {};
      const name = (body.name || "").toString().trim();
      const businessName = (body.businessName || "").toString().trim();
      const email = (body.email || "").toString().trim().toLowerCase();
      const phone = (body.phone || "").toString().trim();
      const businessType = (body.businessType || "other").toString().trim();
      const brief = (body.brief || "").toString().trim();

      if (!name || !businessName || !email || !brief) {
        return res.status(400).json({ error: "Missing required fields." });
      }
      if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ error: "Invalid email address." });
      }
      if (phone.replace(/\D/g, "").length < 8) {
        return res.status(400).json({ error: "Invalid phone number." });
      }
      if (brief.length < 10) {
        return res
          .status(400)
          .json({ error: "Brief must be at least 10 characters." });
      }

      try {
        const docRef = await db.collection("leads").add({
          name,
          businessName,
          email,
          phone,
          businessType,
          brief,
          createdAt: FieldValue.serverTimestamp(),
          status: "new",
          source: "website",
        });

        return res.status(201).json({
          success: true,
          id: docRef.id,
          message: "Thanks! We'll be in touch within 24 hours.",
        });
      } catch (err) {
        console.error("Firestore error:", err);
        return res
          .status(500)
          .json({ error: "Failed to save your submission. Please try again." });
      }
    }

    // ----- Health check -----
    if (req.method === "GET" && path === "/health") {
      return res.status(200).json({ status: "ok", service: "SynergiaX API" });
    }

    return res.status(404).json({ error: "Not found." });
  });
});
