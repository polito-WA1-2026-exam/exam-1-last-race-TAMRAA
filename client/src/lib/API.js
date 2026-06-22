// ============================================================
// FRONTEND API CLIENT – Talks to the backend server
// ============================================================

/**
 * Base URL for all API requests.
 * In production, this would be replaced with the actual deployment URL.
 */
const API_URL = "http://localhost:3000/api";

// ---------- Helper: request with error handling ----------
/**
 * Generic fetch wrapper that handles:
 * - setting credentials (for session cookies)
 * - JSON content type
 * - checking for empty responses (204 No Content)
 * - parsing JSON or returning null
 * - throwing a meaningful error with the backend's error message
 *
 * @param {string} endpoint - API path (e.g., "/game/start")
 * @param {object} options - fetch options (method, body, etc.)
 * @returns {Promise<object|null>} - parsed JSON response or null
 * @throws {Error} - if the request fails or the response is not ok
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    credentials: "include", // send cookies (session) with every request
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetch(url, config);

  // Check if the response has a body (some endpoints return 204 No Content)
  const contentLength = response.headers.get("content-length");
  const hasContent = contentLength && parseInt(contentLength, 10) > 0;

  // If the server responded with an error status (4xx, 5xx)
  if (!response.ok) {
    let errorMessage = "Errore di rete";
    if (hasContent) {
      try {
        const data = await response.json();
        errorMessage = data.error || errorMessage; // use the server's error message if present
      } catch {
        // JSON parsing failed – keep the default message
      }
    }
    throw new Error(errorMessage);
  }

  // No content (e.g., 204) or empty body – return null
  if (response.status === 204 || !hasContent) {
    return null;
  }

  // Otherwise parse and return JSON
  return response.json();
}

// ---------- AUTH API ----------
/**
 * Authentication-related endpoints.
 * All return promises that resolve to the server's JSON response.
 */
export const authAPI = {
  login: (email, password) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request("/logout", { method: "POST" }),

  getCurrentUser: () => request("/session/current"),
};

// ---------- GAME API ----------
/**
 * Game-related endpoints
 * All endpoints are relative to the API base URL
 */
export const gameAPI = {
  // Get the static metro network data (stations, lines, connections)
  getMetroData: () => request("/metro"),

  // Get all possible events (for the journey animation, maybe)
  getEvents: () => request("/events"),

  // Start a new game session – returns session object with origin/destination, coins, etc.
  startGame: () => request("/game/start", { method: "POST" }),

  // Get the current session data (used after a journey to update state)
  getSession: () => request("/game/session"),

  // Submit the route chosen by the user for the current round
  // Expects { sessionId, route } and returns journey events or gameOver flag
  submitRoute: (sessionId, route) =>
    request("/game/route", {
      method: "POST",
      body: JSON.stringify({ sessionId, route }),
    }),

  // End the game voluntarily.
  endGame: (sessionId) =>
    request("/game/end", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),
};

// ---------- LEADERBOARD API ----------
/**
 * Leaderboard endpoints
 */
export const leaderboardAPI = {
  // Get top N scores
  getTopScores: (limit = 10) => request(`/leaderboard?limit=${limit}`),
  // Get scores of the current user
  getMyScores: () => request("/leaderboard/me"),
};