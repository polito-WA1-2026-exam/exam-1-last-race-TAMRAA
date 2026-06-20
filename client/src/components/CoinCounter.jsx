export default function CoinCounter({ coins, change = 0 }) {

  const getChangeClass = () => {
    if (change > 0) {
      return "positive";
    }
    if (change < 0) {
      return "negative";
    }
    return "";
  };

  return (
    <div className="coin-display">
      <span className="coin-icon">🪙</span>
      <span>{coins}</span>
      {change !== 0 && (
        <span className={`coin-change ${getChangeClass()}`}>
          {change > 0 ? "+" : ""}
          {change}
        </span>
      )}
    </div>
  );
}
