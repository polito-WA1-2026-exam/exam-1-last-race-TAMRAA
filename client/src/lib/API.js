const API_URL = "http://localhost:3000/api";

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Errore di rete");
  }
  return data;
}

// ---------- AUTH ----------
export const authAPI = {
  login: (email, password) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request("/logout", { method: "POST" }),
  getCurrentUser: () => request("/session/current"),
};

// ---------- GAME ----------
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

// ---------- LEADERBOARD ----------
export const leaderboardAPI = {
  getTopScores: (limit = 10) => request(`/leaderboard?limit=${limit}`),
  getMyScores: () => request("/leaderboard/me"),
};
