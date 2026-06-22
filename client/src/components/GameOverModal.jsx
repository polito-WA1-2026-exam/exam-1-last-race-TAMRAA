export default function GameOverModal({ data, onPlayAgain, onGoHome }) {
  const { score, rounds, coins, reason } = data;

  const getTitle = () => {
    if (!reason) return "Match Aborted";
    const lower = reason.toLowerCase();
    if (lower.includes("complete") || lower.includes("finished"))
      return "🏁 Match Completed!";
    if (lower.includes("coin")) return "💸 Out of Coins";
    if (lower.includes("invalid")) return "🚫 Invalid Route";
    if (lower.includes("time")) return "⏱ Time's Up!";
    return "Match Aborted";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{getTitle()}</h2>
        <p style={{ color: "#888", fontSize: "14px", marginTop: "-8px" }}>
          {reason || ""}
        </p>
        <div className="score-display">{score}</div>
        <p style={{ color: "#888", marginBottom: "16px" }}>Final Points</p>
        <div className="stats">
          <div className="stat">
            <div className="label">Round Completed</div>
            <div className="value">{rounds}</div>
          </div>
          <div className="stat">
            <div className="label">Coins Remaining</div>
            <div className="value">{coins}</div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onPlayAgain}>
            Play More
          </button>
          <button className="btn btn-secondary" onClick={onGoHome}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
