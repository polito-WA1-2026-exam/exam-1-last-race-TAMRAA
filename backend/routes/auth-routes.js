import express from "express";
import passport from "../passport-config.js";

const router = express.Router();

// POST /api/sessions - Login
router.post("/", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: "Errore interno del server." });
    }
    if (!user) {
      return res
        .status(401)
        .json({ error: info.message || "Credenziali non valide." });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Errore durante il login." });
      }
      return res.json({
        message: "Login effettuato con successo!",
        user: user,
      });
    });
  })(req, res, next);
});

// DELETE /api/sessions/current - Logout
router.delete("/current", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Non sei autenticato." });
  }

  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Errore durante il logout." });
    }
    res.json({ message: "Logout effettuato con successo!" });
  });
});

// GET /api/sessions/current - Get current user
router.get("/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "Non autenticato." });
  }
});

export default router;
