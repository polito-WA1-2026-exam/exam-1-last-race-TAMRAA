import express from "express";
import {
  getTopScores,
  getUserScores,
  getUserBestScore,
} from "../dao/game-dao.js";

const router = express.Router();

// GET /api/leaderboard - Get top scores (public)
router.get("/", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const scores = getTopScores(limit);
    res.json({ scores });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Errore nel recupero della classifica." });
  }
});

// GET /api/leaderboard/me - Get current user's scores (authenticated)
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Devi effettuare il login." });
  }

  try {
    const scores = getUserScores(req.user.id);
    const bestScore = getUserBestScore(req.user.id);

    res.json({
      scores,
      bestScore,
      totalGames: scores.length,
    });
  } catch (error) {
    console.error("Error fetching user scores:", error);
    res.status(500).json({ error: "Errore nel recupero dei tuoi punteggi." });
  }
});

export default router;
