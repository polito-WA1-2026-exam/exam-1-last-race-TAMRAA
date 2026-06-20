
// ============================================================
// FRONTEND API CLIENT – Talks to the backend server
// ============================================================

const API_URL = 'http://localhost:3000/api';

// ---------- Helper: request with error handling ----------
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);

  // Check if the response has a body
  const contentLength = response.headers.get('content-length');
  const hasContent = contentLength && parseInt(contentLength, 10) > 0;

  // Handle HTTP errors
  if (!response.ok) {
    let errorMessage = 'Errore di rete';
    if (hasContent) {
      try {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } catch {
        // If JSON parsing fails, keep default message
      }
    }
    throw new Error(errorMessage);
  }

  // If no content (204 No Content) or empty body, return null
  if (response.status === 204 || !hasContent) {
    return null;
  }

  // Otherwise parse JSON
  return response.json();
}

// ---------- AUTH API ----------
export const authAPI = {
  login: (email, password) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request('/logout', { method: 'POST' }),

  getCurrentUser: () => request('/session/current'),
};

// ---------- GAME API ----------
export const gameAPI = {
  getMetroData: () => request('/metro'),
  getEvents: () => request('/events'),
  startGame: () => request('/game/start', { method: 'POST' }),
  getSession: () => request('/game/session'),
  submitRoute: (sessionId, route) =>
    request('/game/route', {
      method: 'POST',
      body: JSON.stringify({ sessionId, route }),
    }),
  endGame: (sessionId) =>
    request('/game/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
};

// ---------- LEADERBOARD API ----------
export const leaderboardAPI = {
  getTopScores: (limit = 10) => request(`/leaderboard?limit=${limit}`),
  getMyScores: () => request('/leaderboard/me'),
};