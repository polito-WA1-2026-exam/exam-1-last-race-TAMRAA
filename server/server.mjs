// ============================================================
// SERVER – Race the Rails API
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
      return cb(null, false, "credential not valid");
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
  return res.status(401).json({ error: "not authenticated" });
};

// ---------- SESSION ----------
app.use(
  session({
    secret: "race-the-rails-secret-key-2026",
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
      return res.status(401).json({ error: info || "credential not valid" });
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
    res.status(401).json({ error: "Not authenticated" });
  }
});

// ---------- PUBLIC ROUTES ----------
app.get("/api/metro", async (req, res) => {
  try {
    const data = await dao.getFullMetroData();
    res.json(data);
  } catch (err) {
    console.error("Error in /api/metro:", err);
    res.status(500).json({ error: "Error retrieving the metro network" });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await dao.getAllEvents();
    res.json(events);
  } catch (err) {
    console.error("Error in /api/events:", err);
    res.status(500).json({ error: "Error retrieving the events" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const scores = await dao.getTopScores(limit);
    res.json({ scores });
  } catch (err) {
    console.error("Error in /api/leaderboard:", err);
    res.status(500).json({ error: "Error retrieving the leaderboard data" });
  }
});

// ---------- PROTECTED ROUTES ----------
app.use(isLoggedIn);

app.post("/api/game/start", async (req, res) => {
  try {
    const userId = req.user.id;
    const stations = await dao.getAllStations();
    if (stations.length < 2) {
      return res.status(500).json({ error: "Not enough stations" });
    }
    const originIdx = Math.floor(Math.random() * stations.length);
    const origin = stations[originIdx];
    const reachableIds = await dao.findReachableStations(origin.id, 3);
    if (reachableIds.length === 0) {
      return res.status(500).json({
        error: "No destinations can be reached within this distance >= 3",
      });
    }
    const destId =
      reachableIds[Math.floor(Math.random() * reachableIds.length)];
    const destination = await dao.getStationById(destId);
    const sessionId = await dao.createGameSession(
      userId,
      origin.id,
      destination.id,
    );
    const gameSession = await dao.getGameSessionById(sessionId);
    res.json({ session: gameSession });
  } catch (err) {
    console.error("Error in /api/game/start:", err);
    res.status(500).json({ error: "Error starting the game" });
  }
});

app.get("/api/game/session", async (req, res) => {
  try {
    const gameSession = await dao.getActiveSessionForUser(req.user.id);
    if (!gameSession) {
      return res.status(404).json({ error: "No active matches" });
    }
    res.json({ session: gameSession });
  } catch (err) {
    console.error("Error in /api/game/session:", err);
    res.status(500).json({ error: "Error retrieving the session" });
  }
});

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
      const gameSession = await dao.getGameSessionById(sessionId);

      if (!gameSession || gameSession.user_id !== req.user.id) {
        return res.status(404).json({ error: "Session not found" });
      }
      if (!gameSession.is_active) {
        return res.status(400).json({ error: "The game is already over" });
      }

      // Validate route start and end
      if (route[0] !== gameSession.origin_station) {
        return res
          .status(400)
          .json({ error: "The route does not start at the departure station" });
      }
      if (route[route.length - 1] !== gameSession.destination_station) {
        return res.status(400).json({
          error: "The journey does not end at the destination station",
        });
      }

      // --- INCOMPLETE ROUTE ---
      if (route.length < 2) {
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(req.user.id, 0, gameSession.current_round, 0);
        console.log(
          `Score saved (incomplete route): user ${req.user.id}, score 0`,
        );
        return res.json({
          success: false,
          gameOver: true,
          reason: "Incomplete route (time ran out)",
          finalScore: 0,
          roundsCompleted: gameSession.current_round,
          newCoins: 0,
        });
      }

      // Check each segment for connectivity
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

      // --- INVALID ROUTE ---
      if (invalid) {
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(req.user.id, 0, gameSession.current_round, 0);
        console.log(
          `Score saved (invalid route): user ${req.user.id}, score 0`,
        );
        return res.json({
          success: false,
          gameOver: true,
          reason: "Invalid path",
          finalScore: 0,
          roundsCompleted: gameSession.current_round,
          newCoins: 0,
          message: `Segment not valid: ${invalidSegment}`,
        });
      }

      // --- VALID ROUTE: execute journey (random events per segment) ---
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

      let newCoins = gameSession.coins + coinChange;
      const roundsCompleted = gameSession.current_round;
      let finalScore = Math.max(0, newCoins);

      // If coins go negative, game ends with 0 score
      if (newCoins < 0) {
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(req.user.id, 0, roundsCompleted, 0);
        console.log(
          `Score saved (negative coins): user ${req.user.id}, score 0`,
        );
        return res.json({
          success: false,
          gameOver: true,
          reason: "Out-of-stock coins",
          finalScore: 0,
          roundsCompleted,
          newCoins: 0,
          journeyEvents,
          coinChange,
        });
      }

      // Generate next round: new origin = previous destination
      const newOrigin = gameSession.destination_station;
      const stations = await dao.getAllStations();
      const reachable = await dao.findReachableStations(newOrigin, 3);
      const filtered = reachable.filter((id) => id !== newOrigin);
      if (filtered.length === 0) {
        // No reachable destination → game ends
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(
          req.user.id,
          finalScore,
          roundsCompleted,
          newCoins,
        );
        console.log(
          `Score saved (no destinations): user ${req.user.id}, score ${finalScore}`,
        );
        return res.json({
          success: true,
          gameOver: true,
          reason: "No destinations available",
          finalScore,
          roundsCompleted,
          newCoins,
          journeyEvents,
          coinChange,
        });
      }

      const newDestId = filtered[Math.floor(Math.random() * filtered.length)];
      const newRound = gameSession.current_round + 1;
      await dao.updateGameSession(
        sessionId,
        newCoins,
        finalScore,
        newRound,
        newOrigin,
        newDestId,
      );
      const updatedSession = await dao.getGameSessionById(sessionId);

      // End after 10 rounds
      if (newRound > 10) {
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(
          req.user.id,
          finalScore,
          newRound - 1,
          newCoins,
        );
        console.log(
          `Score saved (round limit): user ${req.user.id}, score ${finalScore}`,
        );
        return res.json({
          success: true,
          gameOver: true,
          reason: "Match completed!",
          finalScore,
          roundsCompleted: newRound - 1,
          newCoins,
          journeyEvents,
          coinChange,
        });
      }

      // --- SUCCESSFUL JOURNEY (game continues) ---
      res.json({
        success: true,
        gameOver: false,
        journeyEvents,
        coinChange,
        newCoins,
        finalScore,
        session: updatedSession, // full session with new origin/dest and coins
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
      console.error("Error in /api/game/route:", err);
      res.status(500).json({ error: "Error executing the path" });
    }
  },
);

app.post("/api/game/end", async (req, res) => {
  try {
    const { sessionId } = req.body;
    const gameSession = await dao.getGameSessionById(sessionId);

    if (!gameSession || gameSession.user_id !== req.user.id) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!gameSession.is_active) {
      // Already ended – return the saved data
      return res.json({
        finalScore: gameSession.score || 0,
        roundsCompleted: gameSession.current_round || 0,
        coinsRemaining: gameSession.coins || 0,
        message: "Game already ended",
      });
    }

    const finalScore = Math.max(0, gameSession.coins);
    await dao.endGameSession(sessionId);
    await dao.saveGameScore(
      req.user.id,
      finalScore,
      gameSession.current_round,
      gameSession.coins,
    );
    console.log(
      `Score saved (manual end): user ${req.user.id}, score ${finalScore}`,
    );

    res.json({
      finalScore,
      roundsCompleted: gameSession.current_round,
      coinsRemaining: gameSession.coins,
    });
  } catch (err) {
    console.error("Error in /api/game/end:", err);
    res.status(500).json({ error: "Error ending the game" });
  }
});

app.get("/api/leaderboard/me", async (req, res) => {
  try {
    const scores = await dao.getUserScores(req.user.id);
    const best = await dao.getUserBestScore(req.user.id);
    res.json({ scores, bestScore: best, totalGames: scores.length });
  } catch (err) {
    console.error("Error in /api/leaderboard/me:", err);
    res.status(500).json({ error: "Error retrieving scores" });
  }
});

app.listen(port, () => {
  console.log(`Ⓜ️ Race the Rails API running at http://localhost:${port}`);
});
