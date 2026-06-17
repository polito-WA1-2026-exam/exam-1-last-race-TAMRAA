import cors from "cors";
import session from "express-session";
import passport from "./passport-config.js";
import { initDb } from "./db/db.js";

// Import routes
import authRoutes from "./routes/auth-routes.js";
import gameRoutes from "./routes/game-routes.js";
import leaderboardRoutes from "./routes/leaderboard-routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

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
app.use(
  session({
    secret: "last-race-torino-metro-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use("/api/sessions", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Last Race API is running!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint non trovato." });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Errore interno del server." });
});

// Initialize database and start server
async function start() {
  try {
    await initDb();
    console.log("Database initialized");

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║     LAST RACE - Torino Metro Game         ║
║     Server running on port ${PORT}           ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
