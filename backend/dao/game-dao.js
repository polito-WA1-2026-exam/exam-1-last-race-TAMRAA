import { all, get, run } from "../db/db.js";
import crypto from "crypto";

// Create a new game session
export function createGameSession(userId) {
  const sessionId = crypto.randomUUID();
  const stations = all("SELECT id FROM stations");

  // Pick random origin and destination
  const origin = stations[Math.floor(Math.random() * stations.length)].id;
  let destination = stations[Math.floor(Math.random() * stations.length)].id;

  // Make sure origin and destination are different
  while (destination === origin) {
    destination = stations[Math.floor(Math.random() * stations.length)].id;
  }

  run(
    `
    INSERT INTO game_sessions (id, user_id, current_round, score, coins, origin_station, destination_station)
    VALUES (?, ?, 1, 0, 50, ?, ?)
  `,
    [sessionId, userId, origin, destination],
  );

  return getGameSession(sessionId);
}

// Get game session by ID
export function getGameSession(sessionId) {
  return get(
    `
    SELECT gs.*,
           os.name as origin_name, os.pos_x as origin_x, os.pos_y as origin_y,
           ds.name as destination_name, ds.pos_x as destination_x, ds.pos_y as destination_y
    FROM game_sessions gs
    JOIN stations os ON gs.origin_station = os.id
    JOIN stations ds ON gs.destination_station = ds.id
    WHERE gs.id = ?
  `,
    [sessionId],
  );
}

// Get active game session for user
export function getActiveSessionForUser(userId) {
  return get(
    `
    SELECT gs.*,
           os.name as origin_name, os.pos_x as origin_x, os.pos_y as origin_y,
           ds.name as destination_name, ds.pos_x as destination_x, ds.pos_y as destination_y
    FROM game_sessions gs
    JOIN stations os ON gs.origin_station = os.id
    JOIN stations ds ON gs.destination_station = ds.id
    WHERE gs.user_id = ?
    ORDER BY gs.started_at DESC
    LIMIT 1
  `,
    [userId],
  );
}

// Update game session after a round
export function updateGameSession(
  sessionId,
  score,
  coins,
  newOrigin,
  newDestination,
  round,
) {
  run(
    `
    UPDATE game_sessions
    SET score = ?, coins = ?, origin_station = ?, destination_station = ?, current_round = ?
    WHERE id = ?
  `,
    [score, coins, newOrigin, newDestination, round, sessionId],
  );

  return getGameSession(sessionId);
}

// Delete game session (when game ends)
export function deleteGameSession(sessionId) {
  run("DELETE FROM game_sessions WHERE id = ?", [sessionId]);
}

// Save final score
export function saveGameScore(userId, score, roundsCompleted, coinsRemaining) {
  const result = run(
    `
    INSERT INTO game_scores (user_id, score, rounds_completed, coins_remaining)
    VALUES (?, ?, ?, ?)
  `,
    [userId, score, roundsCompleted, coinsRemaining],
  );

  return result.lastInsertRowid;
}

// Get top scores (leaderboard)
export function getTopScores(limit = 10) {
  return all(
    `
    SELECT gs.*, u.username
    FROM game_scores gs
    JOIN users u ON gs.user_id = u.id
    ORDER BY gs.score DESC
    LIMIT ?
  `,
    [limit],
  );
}

// Get scores for a specific user
export function getUserScores(userId) {
  return all(
    `
    SELECT * FROM game_scores
    WHERE user_id = ?
    ORDER BY played_at DESC
  `,
    [userId],
  );
}

// Get user's best score
export function getUserBestScore(userId) {
  return get(
    `
    SELECT * FROM game_scores
    WHERE user_id = ?
    ORDER BY score DESC
    LIMIT 1
  `,
    [userId],
  );
}

// Generate new round destinations
export function generateNewRound(sessionId) {
  const session = getGameSession(sessionId);
  if (!session) return null;

  const stations = all("SELECT id FROM stations");

  // Pick new random destination (origin becomes previous destination)
  const newOrigin = session.destination_station;
  let newDestination = stations[Math.floor(Math.random() * stations.length)].id;

  while (newDestination === newOrigin) {
    newDestination = stations[Math.floor(Math.random() * stations.length)].id;
  }

  run(
    `
    UPDATE game_sessions
    SET origin_station = ?, destination_station = ?, current_round = current_round + 1
    WHERE id = ?
  `,
    [newOrigin, newDestination, sessionId],
  );

  return getGameSession(sessionId);
}
