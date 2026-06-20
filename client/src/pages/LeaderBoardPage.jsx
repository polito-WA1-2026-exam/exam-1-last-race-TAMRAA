import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext.jsx";
import { leaderboardAPI } from "../lib/API.js";

export default function LeaderboardPage() {
  const { isAuthenticated, user } = useAuth();
  const [topScores, setTopScores] = useState([]);
  const [myScores, setMyScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { scores } = await leaderboardAPI.getTopScores(10);
      setTopScores(scores);

      if (isAuthenticated) {
        const myData = await leaderboardAPI.getMyScores();
        setMyScores(myData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRankClass = (idx) => {
    if (idx === 0) return "rank-1";
    if (idx === 1) return "rank-2";
    if (idx === 2) return "rank-3";
    return "";
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Downloading Standings...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>🏆 General Standings</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        {topScores.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center", padding: "20px 0" }}>
            No scores have been recorded. Be the first to play!
          </p>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Player</th>
                <th>Points</th>
                <th>Round</th>
                <th>Coins</th>
              </tr>
            </thead>
            <tbody>
              {topScores.map((s, idx) => (
                <tr key={s.id}>
                  <td className={getRankClass(idx)}>
                    {idx === 0 && "🥇"}
                    {idx === 1 && "🥈"}
                    {idx === 2 && "🥉"}
                    {idx > 2 && `#${idx + 1}`}
                  </td>
                  <td>
                    <strong>{s.username}</strong>
                  </td>
                  <td style={{ fontWeight: "bold", color: "#e94560" }}>
                    {s.score}
                  </td>
                  <td>{s.rounds_completed}</td>
                  <td>💰 {s.coins_remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isAuthenticated && myScores && (
        <div style={{ marginTop: "32px" }}>
          <h3 style={{ marginBottom: "16px" }}>📊 My Points</h3>
          <div className="row" style={{ marginBottom: "16px" }}>
            <div className="col-4">
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ color: "#888", fontSize: "13px" }}>
                  Games Played
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                  {myScores.totalGames}
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ color: "#888", fontSize: "13px" }}>
                  Best Score
                </div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#e94560",
                  }}
                >
                  {myScores.bestScore?.score || 0}
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ color: "#888", fontSize: "13px" }}>
                  Best Round
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                  {myScores.bestScore?.rounds_completed || 0}
                </div>
              </div>
            </div>
          </div>

          {myScores.scores.length > 0 && (
            <div className="card">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Points</th>
                    <th>Round</th>
                    <th>Coins</th>
                  </tr>
                </thead>
                <tbody>
                  {myScores.scores.map((s, idx) => (
                    <tr key={s.id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: "bold" }}>{s.score}</td>
                      <td>{s.rounds_completed}</td>
                      <td>💰 {s.coins_remaining}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
