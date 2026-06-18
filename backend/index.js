<<<<<<< HEAD
// index.js – Main server entry point
// Simple Express server with Passport authentication and SQLite database

import express from "express"; // Web framework
import cors from "cors"; // Enable CORS for frontend
import session from "express-session"; // Session handling
import passport from "passport"; // Authentication library
import "./passport-config.js"; // Passport strategy configuration (runs its side effects)

import { initDb } from "./db/db.js"; // Our simple SQLite wrapper

// Import route handlers
=======
import cors from "cors";
import session from "express-session";
import passport from "./passport-config.js";
import { initDb } from "./db/db.js";

// Import routes
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
import authRoutes from "./routes/auth-routes.js";
import gameRoutes from "./routes/game-routes.js";
import leaderboardRoutes from "./routes/leaderboard-routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

<<<<<<< HEAD
// ------------------------------------------------------------
// 1. Middleware
// ------------------------------------------------------------

// Enable CORS for the Vite frontend (http://localhost:5173)
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // Allow cookies to be sent
  }),
);

// Parse JSON request bodies
app.use(express.json());

// Session configuration (store session data in memory – for development)
=======
// CORS configuration for two-server pattern
app.use(
  cors({
    origin: "http://localhost:5173", // Vite dev server
    credentials: true, // Allow cookies
  }),
);

// Parse JSON bodies
app.use(express.json());

// Session configuration
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
app.use(
  session({
    secret: "last-race-torino-metro-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
<<<<<<< HEAD
      secure: false, // Set to true if using HTTPS
=======
      secure: false, // Set to true in production with HTTPS
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

<<<<<<< HEAD
// Initialize Passport and restore login state from session
app.use(passport.initialize());
app.use(passport.session());

// ------------------------------------------------------------
// 2. Routes
// ------------------------------------------------------------

=======
// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// API Routes
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
app.use("/api/sessions", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

<<<<<<< HEAD
// Health check
=======
// Health check endpoint
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Last Race API is running!" });
});

<<<<<<< HEAD
// 404 handler – endpoint not found
=======
// 404 handler
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint non trovato." });
});

<<<<<<< HEAD
// Global error handler
=======
// Error handler
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Errore interno del server." });
});

<<<<<<< HEAD
// ------------------------------------------------------------
// 3. Start the server
// ------------------------------------------------------------

async function start() {
  try {
    // Open the SQLite database and run the schema (if not already done)
    await initDb();
    console.log("✅ Database initialized");
=======
// Initialize database and start server
async function start() {
  try {
    await initDb();
    console.log("Database initialized");
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║     LAST RACE - Torino Metro Game         ║
<<<<<<< HEAD
║     Server running on port ${PORT}        ║
=======
║     Server running on port ${PORT}           ║
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (err) {
<<<<<<< HEAD
    console.error("❌ Failed to start server:", err);
=======
    console.error("Failed to start server:", err);
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
    process.exit(1);
  }
}

start();
