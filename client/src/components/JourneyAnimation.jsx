import { useState, useEffect } from "react";
import EventOverlay from "./EventOverlay.jsx";

export default function JourneyAnimation({
  journeyEvents,
  stations,
  onComplete,
  onCoinChange,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showEvent, setShowEvent] = useState(false);

  const stationLookup = {};
  stations.forEach((s) => (stationLookup[s.id] = s));

  useEffect(() => {
    if (currentStep >= journeyEvents.length) {
      if (onComplete) onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setShowEvent(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [currentStep, journeyEvents.length]);

  const handleEventClose = () => {
    const evt = journeyEvents[currentStep];
    if (evt && evt.event.coin_effect !== 0 && onCoinChange) {
      onCoinChange(evt.event.coin_effect);
    }
    setShowEvent(false);
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 300);
  };

  const currentEvent = journeyEvents[currentStep];
  const progress =
    journeyEvents.length > 0
      ? ((currentStep + 1) / journeyEvents.length) * 100
      : 0;

  const getFromName = () => {
    if (!currentEvent) return "";
    const s = stationLookup[currentEvent.from];
    return s ? s.name : currentEvent.from;
  };

  const getToName = () => {
    if (!currentEvent) return "";
    const s = stationLookup[currentEvent.to];
    return s ? s.name : currentEvent.to;
  };

  if (journeyEvents.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#888", padding: "20px" }}>
        Nessun evento nel viaggio.
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 0" }}>
      <div className="journey-progress">
        <div className="bar">
          <div
            className="fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <div className="label">
          <span>
            Passo {currentStep + 1} / {journeyEvents.length}
          </span>
          <span>{Math.round(Math.min(progress, 100))}%</span>
        </div>
      </div>

      {currentEvent && (
        <div className="segment-display">
          <span className="station">{getFromName()}</span>
          <span className="arrow">Ⓜ️ →</span>
          <span className="station">{getToName()}</span>
        </div>
      )}

      <EventOverlay
        event={currentEvent?.event}
        show={showEvent}
        onClose={handleEventClose}
        fromStation={getFromName()}
        toStation={getToName()}
      />
    </div>
  );
}
