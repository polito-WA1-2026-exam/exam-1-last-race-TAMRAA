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
          Pianifica il percorso più veloce attraverso la rete metropolitana.
          Affronta eventi imprevisti, gestisci le tue monete e scala la
          classifica!
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
              Gioca Ora
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ fontSize: "18px", padding: "12px 32px" }}
            >
              Accedi per Giocare
            </Link>
          )}
          <Link
            to="/leaderboard"
            className="btn btn-outline"
            style={{ fontSize: "18px", padding: "12px 32px" }}
          >
            Classifica
          </Link>
        </div>
      </div>

      <div className="row" style={{ marginTop: "32px" }}>
        <div className="col-4">
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🗺️</div>
            <h3>1. Pianifica</h3>
            <p style={{ color: "#aaa", fontSize: "14px" }}>
              Hai 90 secondi per costruire il tuo percorso dal capolinea alla
              destinazione.
            </p>
          </div>
        </div>
        <div className="col-4">
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🚇</div>
            <h3>2. Viaggia</h3>
            <p style={{ color: "#aaa", fontSize: "14px" }}>
              Guarda l'animazione del tuo viaggio e affronta eventi casuali che
              influenzano le tue monete.
            </p>
          </div>
        </div>
        <div className="col-4">
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🏆</div>
            <h3>3. Vinci</h3>
            <p style={{ color: "#aaa", fontSize: "14px" }}>
              Accumula punti in ogni round. Arriva in cima alla classifica!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
