const API_URL = "http://localhost:3001/api";

// Helper function used for all API requests
async function request(endpoint, options = {}) {
  // Create the full API URL
  const url = `${API_URL}${endpoint}`;

  // Default configuration for every request
  const config = {
    credentials: "include", // Send cookies with requests
    headers: {
      "Content-Type": "application/json", // Data is sent as JSON
      ...options.headers, // Allow custom headers if needed
    },
    ...options, // Merge any extra options
  };

  // Send the request to the server
  const response = await fetch(url, config);

  // Convert the response into JSON format
  const data = await response.json();

  // If the request fails, throw an error
  if (!response.ok) {
    throw new Error(data.error || "error fetching");
  }

  // Return the response data
  return data;
}

// Authentication API functions
export const authAPI = {
  // Log in with username and password
  login: (username, password) =>
    request("/sessions", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

<<<<<<< HEAD
  // Log out the currently logged in user
=======
  // Log out the currently logged-in user
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
  logout: () => request("/sessions/current", { method: "DELETE" }),

  // Get information about the current user session
  getCurrentUser: () => request("/sessions/current"),
};

// Game API functions
export const gameAPI = {
  // Get metro station and route data
  getMetroData: () => request("/game/metro"),

  // Get the list of game events
  getEvents: () => request("/game/events"),

  // Start a new game session
  startGame: () => request("/game/start", { method: "POST" }),

  // Retrieve information about the current game session
  getSession: () => request("/game/session"),

  // Submit the player's route and remaining time
  submitRoute: (sessionId, route, timeRemaining) =>
    request("/game/route", {
      method: "POST",
      body: JSON.stringify({ sessionId, route, timeRemaining }),
    }),

  // End the current game session
  endGame: (sessionId) =>
    request("/game/end", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),
};

// Leaderboard API functions
export const leaderboardAPI = {
  // Get the top scores from the leaderboard
  // Default limit is 10 scores
  getTopScores: (limit = 10) => request(`/leaderboard?limit=${limit}`),

  // Get scores belonging to the logged-in user
  getMyScores: () => request("/leaderboard/me"),
};

// Export all API groups so they can be used in other files
export default { authAPI, gameAPI, leaderboardAPI };