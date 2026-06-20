import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gameAPI } from "../lib/API.js";
import MetroMap from "../components/MetroMap.jsx";
import Timer from "../components/Timer.jsx";
import CoinCounter from "../components/CoinCounter.jsx";
import RouteBuilder from "../components/RouteBuilder.jsx";
import JourneyAnimation from "../components/JourneyAnimation.jsx";
import GameOverModal from "../components/GameOverModal.jsx";

const PHASES = {
  LOADING: "loading",
  PLANNING: "planning",
  JOURNEY: "journey",
  GAME_OVER: "game_over",
};

export default function GamePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(PHASES.LOADING);
  const [metroData, setMetroData] = useState(null);
  const [session, setSession] = useState(null);
  const [route, setRoute] = useState([]);
  const [coins, setCoins] = useState(20);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [journeyEvents, setJourneyEvents] = useState([]);
  const [gameOverData, setGameOverData] = useState(null);
  const [error, setError] = useState("");
  const [coinChange, setCoinChange] = useState(0);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = async () => {
    try {
      setPhase(PHASES.LOADING);
      setError("");
      const metro = await gameAPI.getMetroData();
      setMetroData(metro);
      const { session: s } = await gameAPI.startGame();
      setSession(s);
      setCoins(s.coins);
      setScore(s.score);
      setRound(s.current_round);
      setRoute([s.origin_station]);
      setPhase(PHASES.PLANNING);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStationClick = useCallback(
    (stationId) => {
      if (phase !== PHASES.PLANNING) return;

      setRoute((prev) => {
        const last = prev[prev.length - 1];
        if (last === stationId) return prev;
        const idx = prev.indexOf(stationId);
        if (idx !== -1) return prev.slice(0, idx + 1);

        // Check connection
        const isConnected = metroData.connections.some(
          (c) =>
            (c.station_a === last && c.station_b === stationId) ||
            (c.station_b === last && c.station_a === stationId),
        );
        if (isConnected) return [...prev, stationId];
        return prev;
      });
    },
    [phase, metroData],
  );

  const isValidRoute =
    route.length >= 2 &&
    route[0] === session?.origin_station &&
    route[route.length - 1] === session?.destination_station;

  const handleConfirmRoute = async () => {
    if (!isValidRoute) return;

    try {
      const result = await gameAPI.submitRoute(session.id, route);

      if (result.gameOver) {
        setGameOverData({
          score: result.finalScore || 0,
          rounds: result.roundsCompleted || round,
          coins: result.newCoins || 0,
          reason: result.reason || "Match finished",
        });
        setPhase(PHASES.GAME_OVER);
      } else {
        setJourneyEvents(result.journeyEvents);
        setCoinChange(0);
        setPhase(PHASES.JOURNEY);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJourneyComplete = async () => {
    try {
      const { session: updated } = await gameAPI.getSession();
      setSession(updated);
      setScore(updated.score);
      setCoins(updated.coins);
      setRound(updated.current_round);
      setRoute([updated.origin_station]);
      setPhase(PHASES.PLANNING);
    } catch (err) {
      // If no session, game ended
      setGameOverData({
        score: score,
        rounds: round,
        coins: coins,
        reason: "Game ended",
      });
      setPhase(PHASES.GAME_OVER);
    }
  };

  const handleCoinChange = (change) => {
    setCoinChange((prev) => prev + change);
    setCoins((prev) => prev + change);
  };

  const handleEndGame = async () => {
    try {
      await gameAPI.endGame(session.id);
      setGameOverData({
        score: Math.max(0, coins),
        rounds: round,
        coins: coins,
        reason: "You finished the match",
      });
      setPhase(PHASES.GAME_OVER);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePlayAgain = () => {
    setGameOverData(null);
    initGame();
  };

  const handleGoHome = () => navigate("/");

  if (phase === PHASES.LOADING) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Caricamento...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" style={{ marginTop: "20px" }}>
        {error}
        <button
          className="btn btn-primary"
          onClick={initGame}
          style={{ marginLeft: "12px" }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (phase === PHASES.PLANNING && metroData && session) {
    return (
      <div>
        <div className="row">
          <div className="col-8">
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="badge badge-secondary">Round {round}</span>
                  <span
                    className="badge badge-primary"
                    style={{ marginLeft: "8px" }}
                  >
                    Points: {score}
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <CoinCounter coins={coins} change={coinChange} />
                  <Timer initialTime={90} onTimeUp={handleConfirmRoute} />
                </div>
              </div>
              <MetroMap
                metroData={metroData}
                route={route}
                origin={session.origin_station}
                destination={session.destination_station}
                onStationClick={handleStationClick}
              />
            </div>
          </div>

          <div className="col-4">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Mission</span>
              </div>
              <div className="mission">
                <div className="mission-item">
                  <span className="mission-label">From:</span>
                  <span className="mission-station start">
                    {session.origin_name}
                  </span>
                </div>
                <div className="mission-item">
                  <span className="mission-label">To:</span>
                  <span className="mission-station end">
                    {session.destination_name}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <RouteBuilder
                route={route}
                stations={metroData.stations}
                onClear={() => setRoute([session.origin_station])}
                onUndo={() =>
                  setRoute((prev) =>
                    prev.length > 1 ? prev.slice(0, -1) : prev,
                  )
                }
                onConfirm={handleConfirmRoute}
                isValid={isValidRoute}
              />
            </div>

            <button className="btn btn-danger w-100" onClick={handleEndGame}>
              Match finished
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === PHASES.JOURNEY) {
    return (
      <div className="row">
        <div className="col-8" style={{ margin: "0 auto" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <span className="badge badge-secondary">Round {round}</span>
                <span
                  className="badge badge-primary"
                  style={{ marginLeft: "8px" }}
                >
                  Points: {score}
                </span>
              </div>
              <CoinCounter coins={coins} change={coinChange} />
            </div>
            <MetroMap
              metroData={metroData}
              route={route}
              origin={session?.origin_station}
              destination={session?.destination_station}
              disabled
            />
            <JourneyAnimation
              journeyEvents={journeyEvents}
              stations={metroData.stations}
              onComplete={handleJourneyComplete}
              onCoinChange={handleCoinChange}
            />
          </div>
        </div>
      </div>
    );
  }

  if (phase === PHASES.GAME_OVER && gameOverData) {
    return (
      <GameOverModal
        data={gameOverData}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    );
  }

  return null;
}
