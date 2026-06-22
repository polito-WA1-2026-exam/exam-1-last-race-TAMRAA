/**
 * Last Race – Backend Server
 * Handles authentication, game logic, and API endpoints
 * Uses Express, Passport (local), and SQLite
 */

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

// ----- App setup -----
const app = express();
const port = 3000;

app.use(express.json());
app.use(morgan("dev"));

// CORS: allow frontend origin with credentials
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// ----- Passport authentication (local) -----
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, cb) => {
    const user = await getUser(email, password);
    if (!user) return cb(null, false, "Invalid credentials");
    return cb(null, user);
  }),
);

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Not authenticated" });
};

// ----- Session configuration -----
app.use(
  session({
    secret: "race-the-rails-secret-key-2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: false, // set to true in production with HTTPS
    },
  }),
);
app.use(passport.authenticate("session"));

// ----- Authentication endpoints -----
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info || "Login failed" });
    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(201).json(req.user);
    });
  })(req, res, next);
});

app.post("/api/logout", (req, res) => {
  req.logout(() => res.end());
});

app.get("/api/session/current", (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  return res.status(401).json({ error: "Not authenticated" });
});

// ----- Public endpoints (no login required) -----
app.get("/api/metro", async (req, res) => {
  try {
    const data = await dao.getFullMetroData();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch metro data" });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await dao.getAllEvents();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const scores = await dao.getTopScores(limit);
    res.json({ scores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ----- Protected endpoints (require login) -----
app.use(isLoggedIn);

// Start a new game
app.post("/api/game/start", async (req, res) => {
  try {
    const userId = req.user.id;
    const stations = await dao.getAllStations();
    if (stations.length < 2) {
      return res.status(500).json({ error: "Not enough stations" });
    }

    // Pick random origin
    const originIdx = Math.floor(Math.random() * stations.length);
    const origin = stations[originIdx];

    // Find reachable stations (distance >= 3), fallback to any other station
    let reachableIds = await dao.findReachableStations(origin.id, 3);
    if (reachableIds.length === 0) {
      reachableIds = stations
        .filter((s) => s.id !== origin.id)
        .map((s) => s.id);
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
    console.error(err);
    res.status(500).json({ error: "Failed to start game" });
  }
});

// Get current session
app.get("/api/game/session", async (req, res) => {
  try {
    const session = await dao.getActiveSessionForUser(req.user.id);
    if (!session) return res.status(404).json({ error: "No active game" });
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Submit a route
app.post(
  "/api/game/route",
  [check("route").isArray({ min: 1 }), check("sessionId").isInt()],
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
        return res.status(400).json({ error: "Game already ended" });
      }

      // Helper: end game with zero score (no events)
      const endWithZero = async (reason) => {
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(req.user.id, 0, gameSession.current_round, 0);
        return res.json({
          success: false,
          gameOver: true,
          reason,
          finalScore: 0,
          roundsCompleted: gameSession.current_round,
          newCoins: 0,
          journeyEvents: [],
          coinChange: 0,
        });
      };

      // Validate start and end
      if (route[0] !== gameSession.origin_station) {
        return await endWithZero("Route does not start at departure station");
      }
      if (route[route.length - 1] !== gameSession.destination_station) {
        return await endWithZero("Route does not end at destination station");
      }
      if (route.length < 2) {
        return await endWithZero("Incomplete route (too few stations)");
      }

      // Check each segment is connected
      for (let i = 1; i < route.length; i++) {
        const connected = await dao.areStationsConnected(
          route[i - 1],
          route[i],
        );
        if (!connected) {
          return await endWithZero(
            `Invalid segment: ${route[i - 1]} → ${route[i]}`,
          );
        }
      }

      // ----- Valid route: generate events for each segment -----
      const journeyEvents = [];
      let coinChange = 0;
      for (let i = 1; i < route.length; i++) {
        const event = await dao.getRandomEvent();
        journeyEvents.push({ from: route[i - 1], to: route[i], event });
        coinChange += event.coin_effect;
      }

      let newCoins = gameSession.coins + coinChange;
      const roundsCompleted = gameSession.current_round;
      const finalScore = Math.max(0, newCoins);

      // If coins go negative, game over (but show events)
      if (newCoins < 0) {
        await dao.endGameSession(sessionId);
        await dao.saveGameScore(req.user.id, 0, roundsCompleted, 0);
        return res.json({
          success: false,
          gameOver: true,
          reason: "Out of coins",
          finalScore: 0,
          roundsCompleted,
          newCoins: 0,
          journeyEvents,
          coinChange,
        });
      }

      // Prepare next round
      const newOrigin = gameSession.destination_station;
      const stations = await dao.getAllStations();
      let reachable = await dao.findReachableStations(newOrigin, 3);
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

      // Max 10 rounds
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
          reason: "Match completed!",
          finalScore,
          roundsCompleted: newRound - 1,
          newCoins,
          journeyEvents,
          coinChange,
        });
      }

      // Success – game continues
      res.json({
        success: true,
        gameOver: false,
        journeyEvents,
        coinChange,
        newCoins,
        finalScore,
        session: updatedSession,
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
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Manually end game
app.post("/api/game/end", async (req, res) => {
  try {
    const { sessionId } = req.body;
    const gameSession = await dao.getGameSessionById(sessionId);

    if (!gameSession || gameSession.user_id !== req.user.id) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!gameSession.is_active) {
      return res.json({
        finalScore: gameSession.score || 0,
        roundsCompleted: gameSession.current_round || 0,
        coinsRemaining: gameSession.coins || 0,
        message: "Already ended",
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

    res.json({
      finalScore,
      roundsCompleted: gameSession.current_round,
      coinsRemaining: gameSession.coins,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to end game" });
  }
});

// Get current user's leaderboard data
app.get("/api/leaderboard/me", async (req, res) => {
  try {
    const scores = await dao.getUserScores(req.user.id);
    const best = await dao.getUserBestScore(req.user.id);
    res.json({ scores, bestScore: best, totalGames: scores.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch your scores" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
