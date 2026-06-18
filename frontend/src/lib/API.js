const API_URL = "http://localhost:3001/api";

// Helper function for API calls
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const config = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Errore di rete");
  }

  return data;
}

// Auth API
export const authAPI = {
  login: (username, password) =>
    request("/sessions", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request("/sessions/current", { method: "DELETE" }),

  getCurrentUser: () => request("/sessions/current"),
};

// Game API
export const gameAPI = {
  getMetroData: () => request("/game/metro"),

  getEvents: () => request("/game/events"),

  startGame: () => request("/game/start", { method: "POST" }),

  getSession: () => request("/game/session"),

  submitRoute: (sessionId, route, timeRemaining) =>
    request("/game/route", {
      method: "POST",
      body: JSON.stringify({ sessionId, route, timeRemaining }),
    }),

  endGame: (sessionId) =>
    request("/game/end", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),
};

// Leaderboard API
export const leaderboardAPI = {
  getTopScores: (limit = 10) => request(`/leaderboard?limit=${limit}`),

  getMyScores: () => request("/leaderboard/me"),
};

export default { authAPI, gameAPI, leaderboardAPI };
