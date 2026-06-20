// ============================================================
// SERVER – Race the Rails API
// ============================================================
// Two‑server pattern: this API runs on port 3000.
// React client runs on port 5173 (Vite).
// ============================================================

import express from "express";
import morgan from "morgan";
import cors from "cors";
import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import { check, validationResult } from "express-validator";

import db from "./db.mjs";
import { getUser } from "./dao-user.mjs";
import * as dao from "./dao.mjs";

const app = express();
const port = 3000;

// ---------- MIDDLEWARE ----------
app.use(express.json());
app.use(morgan("dev"));

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// ---------- PASSPORT ----------
passport.use(
  new LocalStrategy({ usernameField: "email" }, async function verify(
    email,
    password,
    cb,
  ) {
    const user = await getUser(email, password);
    if (!user) {
      return cb(null, false, "Credenziali non valide");
    }
    return cb(null, user);
  }),
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  cb(null, user);
});

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Non autenticato" });
};

// ---------- SESSION ----------
app.use(
  session({
    secret: "race-the-rails-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  }),
);
app.use(passport.authenticate("session"));

// ---------- AUTH ROUTES ----------
app.post("/api/login", function (req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info || "Credenziali non valide" });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(201).json(req.user);
    });
  })(req, res, next);
});

app.post("/api/logout", (req, res) => {
  req.logout(() => {
    res.end();
  });
});

app.get("/api/session/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Non autenticato" });
  }
});

// ---------- PUBLIC ROUTES ----------

// GET /api/metro – Full network data
app.get("/api/metro", async (req, res) => {
  try {
    const data = await dao.getFullMetroData();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore nel recupero della rete metro" });
  }
});

// GET /api/events – All events
app.get("/api/events", async (req, res) => {
  try {
    const events = await dao.getAllEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero degli eventi" });
  }
});

// GET /api/leaderboard – Top scores
app.get("/api/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const scores = await dao.getTopScores(limit);
    res.json({ scores });
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero della classifica" });
  }
});

// ---------- PROTECTED ROUTES ----------
app.use(isLoggedIn);

// POST /api/game/start – Start a new game
app.post("/api/game/start", async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all stations
    const stations = await dao.getAllStations();
    if (stations.length < 2) {
      return res.status(500).json({ error: "Non ci sono abbastanza stazioni" });
    }

    // Pick random origin
    const originIdx = Math.floor(Math.random() * stations.length);
    const origin = stations[originIdx];

    // Find reachable stations with distance >= 3
    const reachableIds = await dao.findReachableStations(origin.id, 3);
    if (reachableIds.length === 0) {
      return res.status(500).json({
        error: "Nessuna destinazione raggiungibile con distanza >= 3",
      });
    }

    // Pick random destination from reachable
    const destId =
      reachableIds[Math.floor(Math.random() * reachableIds.length)];
    const destination = await dao.getStationById(destId);

    // Create session
    const sessionId = await dao.createGameSession(
      userId,
      origin.id,
      destination.id,
    );

    const session = await dao.getGameSessionById(sessionId);
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore nell'avvio della partita" });
  }
});

// GET /api/game/session – Get active session
app.get("/api/game/session", async (req, res) => {
  try {
    const session = await dao.getActiveSessionForUser(req.user.id);
    if (!session) {
      return res.status(404).json({ error: "Nessuna partita attiva" });
    }
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero della sessione" });
  }
});

// POST /api/game/route – Submit route and execute journey
app.post(
  "/api/game/route",
  [check("route").isArray({ min: 2 }), check("sessionId").isInt()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { route, sessionId } = req.body;
      const session = await dao.getGameSessionById(sessionId);

      if (!session || session.user_id !== req.user.id) {
        return res.status(404).json({ error: "Sessione non trovata" });
      }

      if (!session.is_active) {
        return res.status(400).json({ error: "Partita già terminata" });
      }

      // Validate route: start = origin, end = destination
      if (route[0] !== session.origin_station) {
        return res
          .status(400)
          .json({ error: "Il percorso non parte dalla stazione di partenza" });
      }
      if (route[route.length - 1] !== session.destination_station) {
        return res.status(400).json({
          error: "Il percorso non termina alla stazione di destinazione",
        });
      }

      // Validate each segment: must be connected
      let invalid = false;
      let invalidSegment = "";
      for (let i = 1; i < route.length; i++) {
        const connected = await dao.areStationsConnected(
          route[i - 1],
          route[i],
        );
        if (!connected) {
          invalid = true;
          invalidSegment = `${route[i - 1]} → ${route[i]}`;
          break;
        }
      }

      if (invalid) {
        // Invalid route: lose all coins, score = 0
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(req.user.id, 0, session.current_round, 0);
        return res.json({
          success: false,
          gameOver: true,
          reason: "Percorso non valido",
          finalScore: 0,
          roundsCompleted: session.current_round,
          message: `Segmento non valido: ${invalidSegment}`,
        });
      }

      // Execute journey: for each segment, pick a random event
      const journeyEvents = [];
      let coinChange = 0;

      for (let i = 1; i < route.length; i++) {
        const event = await dao.getRandomEvent();
        journeyEvents.push({
          from: route[i - 1],
          to: route[i],
          event,
        });
        coinChange += event.coin_effect;
      }

      let newCoins = session.coins + coinChange;
      const roundsCompleted = session.current_round;
      let finalScore = Math.max(0, newCoins);

      if (newCoins < 0) {
        // Game over: coins ran out
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(req.user.id, 0, roundsCompleted, 0);
        return res.json({
          success: false,
          gameOver: true,
          reason: "Monete esaurite",
          finalScore: 0,
          roundsCompleted,
          journeyEvents,
          coinChange,
        });
      }

      // Generate next round: new origin = previous destination
      const newOrigin = session.destination_station;
      const stations = await dao.getAllStations();
      const reachable = await dao.findReachableStations(newOrigin, 3);
      const filtered = reachable.filter((id) => id !== newOrigin);
      if (filtered.length === 0) {
        // No reachable destination → end game
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(
          req.user.id,
          finalScore,
          roundsCompleted,
          newCoins,
        );
        return res.json({
          success: true,
          gameOver: true,
          reason: "Nessuna destinazione raggiungibile",
          finalScore,
          roundsCompleted,
          journeyEvents,
          coinChange,
          newCoins,
        });
      }

      const newDestId = filtered[Math.floor(Math.random() * filtered.length)];
      const newRound = session.current_round + 1;

      // Update session
      await dao.updateGameSession(
        sessionId,
        newCoins,
        finalScore,
        newRound,
        newOrigin,
        newDestId,
      );

      const updatedSession = await dao.getGameSessionById(sessionId);

      // Check if we should end (optional: end after a certain number of rounds)
      // Let's end after 10 rounds as a reasonable limit
      if (newRound > 10) {
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(
          req.user.id,
          finalScore,
          newRound - 1,
          newCoins,
        );
        return res.json({
          success: true,
          gameOver: true,
          reason: "Partita completata!",
          finalScore,
          roundsCompleted: newRound - 1,
          journeyEvents,
          coinChange,
          newCoins,
        });
      }

      res.json({
        success: true,
        gameOver: false,
        journeyEvents,
        coinChange,
        newCoins,
        finalScore,
        nextRound: {
          round: newRound,
          origin: {
            id: updatedSession.origin_station,
            name: updatedSession.origin_name,
          },
          destination: {
            id: updatedSession.destination_station,
            name: updatedSession.destination_name,
          },
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Errore nell'esecuzione del percorso" });
    }
  },
);

// POST /api/game/end – End game manually
app.post("/api/game/end", async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await dao.getGameSessionById(sessionId);

    if (!session || session.user_id !== req.user.id) {
      return res.status(404).json({ error: "Sessione non trovata" });
    }

    const finalScore = Math.max(0, session.coins);
    await dao.endGameSession(sessionId);
    await dao.saveGameScore(
      req.user.id,
      finalScore,
      session.current_round,
      session.coins,
    );

    res.json({
      finalScore,
      roundsCompleted: session.current_round,
      coinsRemaining: session.coins,
    });
  } catch (err) {
    res.status(500).json({ error: "Errore nel terminare la partita" });
  }
});

// GET /api/leaderboard/me – User's scores
app.get("/api/leaderboard/me", async (req, res) => {
  try {
    const scores = await dao.getUserScores(req.user.id);
    const best = await dao.getUserBestScore(req.user.id);
    res.json({ scores, bestScore: best, totalGames: scores.length });
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dei punteggi" });
  }
});

// ---------- START SERVER ----------
app.listen(port, () => {
  console.log(`🚇 Race the Rails API running at http://localhost:${port}`);
});
