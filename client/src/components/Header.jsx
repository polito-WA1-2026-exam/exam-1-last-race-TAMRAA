import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="header">
      <div className="container">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h1>
            Ⓜ️ <span>Race the</span> Rails
          </h1>
        </Link>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          {isAuthenticated && <Link to="/game">Play</Link>}
          <Link to="/leaderboard">Leaderboard</Link>
          {isAuthenticated ? (
            <>
              <span style={{ color: "#888", marginLeft: "16px" }}>
                Welcome, {user.name}
              </span>
              <button
                className="btn"
                onClick={logout}
                style={{ marginLeft: "12px" }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
