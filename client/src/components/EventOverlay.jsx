export default function EventOverlay({
  event,
  show,
  onClose,
  fromStation,
  toStation,
}) {
  if (!show || !event) return null;

  const getIcon = () => {
    if (event.coin_effect > 0) return "🎉";
    if (event.coin_effect < 0) return "⚠️";
    return "Ⓜ️";
  };

  const getEffectClass = () => {
    if (event.coin_effect > 0) return "positive";
    if (event.coin_effect < 0) return "negative";
    return "zero";
  };

  return (
    <div className="event-overlay" onClick={onClose}>
      <div className="event-card" onClick={(e) => e.stopPropagation()}>
        <div className="event-icon">{getIcon()}</div>
        <div className="event-name">{event.name}</div>
        <div style={{ fontSize: "14px", color: "#888", marginBottom: "4px" }}>
          {fromStation} → {toStation}
        </div>
        <div className={`event-effect ${getEffectClass()}`}>
          {event.coin_effect > 0 ? "+" : ""}
          {event.coin_effect} 🪙
        </div>
        <div className="event-desc">{event.description}</div>
        <button className="btn btn-primary" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
}
