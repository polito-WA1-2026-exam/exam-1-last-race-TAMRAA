import express from "express";
import { getFullMetroData } from "../dao/station-dao.js";
import {
  createGameSession,
  getGameSession,
  getActiveSessionForUser,
  updateGameSession,
  deleteGameSession,
  saveGameScore,
  generateNewRound,
} from "../dao/game-dao.js";
import { getRandomEvent, getAllEvents } from "../dao/event-dao.js";

const router = express.Router();

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Devi effettuare il login per giocare." });
}

// GET /api/game/metro - Get metro map data (public)
router.get("/metro", (req, res) => {
  try {
    const metroData = getFullMetroData();
    res.json(metroData);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Errore nel recupero dei dati della metro." });
  }
});

// GET /api/game/events - Get all events (public)
router.get("/events", (req, res) => {
  try {
    const events = getAllEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero degli eventi." });
  }
});

// POST /api/game/start - Start new game session (authenticated)
router.post("/start", isAuthenticated, (req, res) => {
  try {
    const session = createGameSession(req.user.id);
    res.json({
      message: "Nuova partita iniziata!",
      session,
    });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({ error: "Errore nell'avvio della partita." });
  }
});

// GET /api/game/session - Get current game session (authenticated)
router.get("/session", isAuthenticated, (req, res) => {
  try {
    const session = getActiveSessionForUser(req.user.id);
    if (!session) {
      return res.status(404).json({ error: "Nessuna partita attiva trovata." });
    }
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero della sessione." });
  }
});

// POST /api/game/route - Submit planned route and get journey result (authenticated)
router.post("/route", isAuthenticated, (req, res) => {
  try {
    const { sessionId, route, timeRemaining } = req.body;

    if (!sessionId || !route || !Array.isArray(route)) {
      return res.status(400).json({ error: "Dati della route non validi." });
    }

    const session = getGameSession(sessionId);
    if (!session || session.user_id !== req.user.id) {
      return res.status(404).json({ error: "Sessione di gioco non trovata." });
    }

    // Generate events for each step of the journey
    const journeyEvents = [];
    let totalCoinEffect = 0;

    for (let i = 1; i < route.length; i++) {
      const event = getRandomEvent();
      journeyEvents.push({
        step: i,
        from: route[i - 1],
        to: route[i],
        event,
      });
      totalCoinEffect += event.coin_effect;
    }

    // Calculate score
    const baseScore = 100;
    const timeBonus = Math.max(0, (timeRemaining || 0) * 2);
    const transferPenalty = route.length > 2 ? (route.length - 2) * 5 : 0;
    const roundScore = baseScore + timeBonus - transferPenalty;

    // Update session
    const newScore = session.score + roundScore;
    const newCoins = session.coins + totalCoinEffect;

    // Check if game over (coins below 0)
    if (newCoins < 0) {
      // Save final score and end game
      saveGameScore(
        req.user.id,
        session.score,
        session.current_round,
        session.coins,
      );
      deleteGameSession(sessionId);

      return res.json({
        success: false,
        gameOver: true,
        reason: "coins",
        finalScore: session.score,
        roundsCompleted: session.current_round,
        journeyEvents,
      });
    }

    // Generate new round
    const updatedSession = generateNewRound(sessionId);
    if (updatedSession) {
      updateGameSession(
        sessionId,
        newScore,
        newCoins,
        updatedSession.origin_station,
        updatedSession.destination_station,
        updatedSession.current_round,
      );
    }

    res.json({
      success: true,
      gameOver: false,
      roundScore,
      baseScore,
      timeBonus,
      transferPenalty,
      totalCoinEffect,
      journeyEvents,
      newScore,
      newCoins,
      nextRound: updatedSession
        ? {
            round: updatedSession.current_round,
            origin: {
              id: updatedSession.origin_station,
              name: updatedSession.origin_name,
            },
            destination: {
              id: updatedSession.destination_station,
              name: updatedSession.destination_name,
            },
          }
        : null,
    });
  } catch (error) {
    console.error("Error processing route:", error);
    res.status(500).json({ error: "Errore nell'elaborazione della route." });
  }
});

// POST /api/game/end - End game and save score (authenticated)
router.post("/end", isAuthenticated, (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = getGameSession(sessionId);
    if (!session || session.user_id !== req.user.id) {
      return res.status(404).json({ error: "Sessione di gioco non trovata." });
    }

    // Save final score
    const scoreId = saveGameScore(
      req.user.id,
      session.score,
      session.current_round - 1,
      session.coins,
    );

    // Delete game session
    deleteGameSession(sessionId);

    res.json({
      message: "Partita terminata!",
      finalScore: session.score,
      roundsCompleted: session.current_round - 1,
      coinsRemaining: session.coins,
      scoreId,
    });
  } catch (error) {
    console.error("Error ending game:", error);
    res.status(500).json({ error: "Errore nel terminare la partita." });
  }
});

export default router;
