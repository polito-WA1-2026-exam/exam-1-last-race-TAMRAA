import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext.jsx";

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <div className="hero">
        <h1>
          <span className="highlight">Race</span> the Rails
        </h1>
        <p>
          Plan the fastest route through the subway system. Deal with unexpected
          events, manage your coins, and climb the leaderboard!
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {isAuthenticated ? (
            <Link
              to="/game"
              className="btn btn-primary"
              style={{ fontSize: "18px", padding: "12px 32px" }}
            >
              Play the Game
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ fontSize: "18px", padding: "12px 32px" }}
            >
              Login to Play
            </Link>
          )}
          <Link
            to="/leaderboard"
            className="btn btn-outline"
            style={{ fontSize: "18px", padding: "12px 32px" }}
          >
            Standings
          </Link>
        </div>
      </div>

      <div className="row" style={{ marginTop: "32px" }}>
        <div className="col-4">
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🗺️</div>
            <h3>1. Plan</h3>
            <p style={{ color: "#aaa", fontSize: "14px" }}>
              You have 90 seconds to plan your route from the terminal to your
              destination
            </p>
          </div>
        </div>
        <div className="col-4">
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🚇</div>
            <h3>2. Travel</h3>
            <p style={{ color: "#aaa", fontSize: "14px" }}>
              Watch the animation of your journey and face random events that
              affect your coins
            </p>
          </div>
        </div>
        <div className="col-4">
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🏆</div>
            <h3>3. Win</h3>
            <p style={{ color: "#aaa", fontSize: "14px" }}>
              Earn points in every round. Make it to the top of the leaderboard!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
