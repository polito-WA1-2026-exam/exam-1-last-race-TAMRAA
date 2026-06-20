export default function GameOverModal({ data, onPlayAgain, onGoHome }) {
  const { score, rounds, coins, reason } = data;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Match aborted</h2>
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
