import { useState, useEffect, useCallback, useRef } from "react";
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
  const [submitting, setSubmitting] = useState(false);

  const gameEndedRef = useRef(false);
  const mountedRef = useRef(true);
  const endedSessionRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const sessionId = session?.id;
    const isActive =
      phase !== PHASES.GAME_OVER && session?.is_active && !gameEndedRef.current;

    return () => {
      if (
        !mountedRef.current &&
        sessionId &&
        isActive &&
        endedSessionRef.current !== sessionId
      ) {
        console.log("Auto‑end on unmount for session", sessionId);
        gameAPI
          .endGame(sessionId)
          .then((result) => {
            console.log("Auto‑end result:", result);
            gameEndedRef.current = true;
            endedSessionRef.current = sessionId;
          })
          .catch((err) => console.warn("Auto‑end failed:", err));
      }
    };
  }, [session, phase]);

  const initGame = async () => {
    try {
      setPhase(PHASES.LOADING);
      setError("");
      gameEndedRef.current = false;
      endedSessionRef.current = null;
      setSubmitting(false);

      // Reset coins to 20
      setCoins(20);
      setCoinChange(0);

      const metro = await gameAPI.getMetroData();
      setMetroData(metro);

      const { session: s } = await gameAPI.startGame();
      console.log("New session from server:", s);

      // Force coins to 20 (ignore server's coins)
      setCoins(20);
      setScore(s.score || 0);
      setRound(s.current_round || 1);
      setSession(s);
      setRoute([s.origin_station]);
      setCoinChange(0);

      setPhase(PHASES.PLANNING);
    } catch (err) {
      console.error("initGame error:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleStationClick = useCallback(
    (stationId) => {
      if (phase !== PHASES.PLANNING) return;
      setRoute((prev) => {
        const last = prev[prev.length - 1];
        if (last === stationId) return prev;
        const idx = prev.indexOf(stationId);
        if (idx !== -1) return prev.slice(0, idx + 1);
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
    session &&
    route.length >= 2 &&
    route[0] === session.origin_station &&
    route[route.length - 1] === session.destination_station;

  useEffect(() => {
    console.log("State:", {
      phase,
      coins,
      coinChange,
      route,
      sessionId: session?.id,
    });
  }, [phase, coins, coinChange, route, session]);

  const handleConfirmRoute = async () => {
    if (!isValidRoute || submitting || gameEndedRef.current) return;

    setSubmitting(true);
    try {
      const result = await gameAPI.submitRoute(session.id, route);
      console.log("Route submission result:", result);

      if (result.gameOver) {
        // Game over – set coins to 0 (the server returns 0 anyway)
        setCoins(0);
        gameEndedRef.current = true;
        setGameOverData({
          score: result.finalScore ?? 0,
          rounds: result.roundsCompleted ?? round,
          coins: result.newCoins ?? 0, // will be 0
          reason: result.reason || "Match finished",
        });
        setPhase(PHASES.GAME_OVER);
      } else {
        // Successful journey: do NOT update coins from server – let animation apply events
        const updated = result.session;
        setSession(updated);
        setScore(updated.score);
        setRound(updated.current_round);
        setJourneyEvents(result.journeyEvents);
        setCoinChange(0);
        setPhase(PHASES.JOURNEY);
      }
    } catch (err) {
      console.error("handleConfirmRoute error:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJourneyComplete = () => {
    console.log("Journey complete. Current coins:", coins);
    if (session) {
      setRoute([session.origin_station]);
    }
    setPhase(PHASES.PLANNING);
  };

  const handleCoinChange = (change) => {
    console.log(`Coin change: ${change > 0 ? "+" : ""}${change}`);
    setCoinChange((prev) => prev + change);
    setCoins((prev) => {
      const newCoins = prev + change;
      console.log(`Coins updated: ${prev} → ${newCoins}`);
      return newCoins;
    });
  };

  const handleEndGame = async () => {
    if (submitting || gameEndedRef.current) return;

    setSubmitting(true);
    try {
      const result = await gameAPI.endGame(session.id);
      console.log("End game result:", result);
      gameEndedRef.current = true;
      setGameOverData({
        score: result.finalScore,
        rounds: result.roundsCompleted,
        coins: result.coinsRemaining,
        reason: "You finished the match",
      });
      setPhase(PHASES.GAME_OVER);
    } catch (err) {
      console.error("handleEndGame error:", err);
      gameEndedRef.current = true;
      setGameOverData({
        score: score,
        rounds: round,
        coins: coins,
        reason: "Game ended (error)",
      });
      setPhase(PHASES.GAME_OVER);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayAgain = () => {
    setGameOverData(null);
    gameEndedRef.current = false;
    endedSessionRef.current = null;
    initGame();
  };

  const handleGoHome = () => navigate("/");

  // ---------- RENDER ----------
  if (phase === PHASES.LOADING) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" style={{ marginTop: "20px" }}>
        {error}
        <button className="btn btn-primary" onClick={initGame}>
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
                onClear={() => {
                  setRoute([session.origin_station]);
                  setCoinChange(0);
                }}
                onUndo={() =>
                  setRoute((prev) =>
                    prev.length > 1 ? prev.slice(0, -1) : prev,
                  )
                }
                onConfirm={handleConfirmRoute}
                isValid={isValidRoute && !submitting}
              />
            </div>

            <button
              className="btn btn-danger w-100"
              onClick={handleEndGame}
              disabled={submitting}
            >
              Finish Match
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
