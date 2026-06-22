/**
 * Frontend API client – communicates with backend.
 * All requests include credentials (session cookies).
 */

const API_URL = "http://localhost:3000/api";

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetch(url, config);
  const contentLength = response.headers.get("content-length");
  const hasContent = contentLength && parseInt(contentLength, 10) > 0;

  if (!response.ok) {
    let errorMessage = "Network error";
    if (hasContent) {
      try {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } catch (_) {}
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204 || !hasContent) {
    return null;
  }
  return response.json();
}

// Auth endpoints
export const authAPI = {
  login: (email, password) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request("/logout", { method: "POST" }),
  getCurrentUser: () => request("/session/current"),
};

// Game endpoints
export const gameAPI = {
  getMetroData: () => request("/metro"),
  getEvents: () => request("/events"),
  startGame: () => request("/game/start", { method: "POST" }),
  getSession: () => request("/game/session"),
  submitRoute: (sessionId, route) =>
    request("/game/route", {
      method: "POST",
      body: JSON.stringify({ sessionId, route }),
    }),
  endGame: (sessionId) =>
    request("/game/end", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),
};

// Leaderboard endpoints
export const leaderboardAPI = {
  getTopScores: (limit = 10) => request(`/leaderboard?limit=${limit}`),
  getMyScores: () => request("/leaderboard/me"),
};
