import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gameAPI } from "../lib/API.js";
import MetroMap from "../components/MetroMap.jsx";
import Timer from "../components/Timer.jsx";
import CoinCounter from "../components/CoinCounter.jsx";
import RouteBuilder from "../components/RouteBuilder.jsx";
import SegmentList from "../components/SegmentList.jsx";
import JourneyAnimation from "../components/JourneyAnimation.jsx";
import GameOverModal from "../components/GameOverModal.jsx";

const PHASES = {
  LOADING: "loading",
  SETUP: "setup",
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
  const [pendingGameOver, setPendingGameOver] = useState(null);

  const gameEndedRef = useRef(false);
  const mountedRef = useRef(true);
  const endedSessionRef = useRef(null);

  const handleCoinChange = (change) => {
    setCoinChange((prev) => prev + change);
    setCoins((prev) => prev + change);
  };

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
        gameAPI
          .endGame(sessionId)
          .then((result) => {
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
      setPendingGameOver(null);

      setCoins(20);
      setCoinChange(0);

      const metro = await gameAPI.getMetroData();
      setMetroData(metro);

      const { session: s } = await gameAPI.startGame();

      setCoins(20);
      setScore(s.score || 0);
      setRound(s.current_round || 1);
      setSession(s);
      setRoute([s.origin_station]);
      setCoinChange(0);

      setPhase(PHASES.SETUP);
    } catch (err) {
      console.error("initGame error:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleStartPlanning = () => {
    setPhase(PHASES.PLANNING);
  };

  const handleAddSegment = (newStationId) => {
    setRoute((prev) => {
      if (prev.length === 0) {
        if (newStationId === session.origin_station) {
          return [newStationId];
        }
        return prev;
      }
      const last = prev[prev.length - 1];
      if (newStationId === last) return prev;
      const connected = metroData.connections.some(
        (c) =>
          (c.station_a === last && c.station_b === newStationId) ||
          (c.station_b === last && c.station_a === newStationId),
      );
      if (!connected) return prev;
      return [...prev, newStationId];
    });
  };

  // No client-side validation – every submission goes to the server
  const handleConfirmRoute = async () => {
    if (submitting || gameEndedRef.current) return;

    setSubmitting(true);
    try {
      const result = await gameAPI.submitRoute(session.id, route);
      console.log("Route submission result:", result);

      // If game over but we have events, show journey first
      if (
        result.gameOver &&
        result.journeyEvents &&
        result.journeyEvents.length > 0
      ) {
        setJourneyEvents(result.journeyEvents);
        setCoinChange(0);
        setPhase(PHASES.JOURNEY);
        setPendingGameOver({
          score: result.finalScore ?? 0,
          rounds: result.roundsCompleted ?? round,
          coins: result.newCoins ?? 0,
          reason: result.reason || "Match finished",
        });
        setSubmitting(false);
        return;
      }

      // Immediate game over (no events)
      if (result.gameOver) {
        setCoins(0);
        gameEndedRef.current = true;
        setGameOverData({
          score: result.finalScore ?? 0,
          rounds: result.roundsCompleted ?? round,
          coins: result.newCoins ?? 0,
          reason: result.reason || "Match finished",
        });
        setPhase(PHASES.GAME_OVER);
        setSubmitting(false);
        return;
      }

      // Successful journey (game continues)
      const updated = result.session;
      setSession(updated);
      setScore(updated.score);
      setRound(updated.current_round);
      setJourneyEvents(result.journeyEvents);
      setCoinChange(0);
      setPhase(PHASES.JOURNEY);
    } catch (err) {
      console.error("handleConfirmRoute error:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJourneyComplete = () => {
    setCoinChange(0);

    if (pendingGameOver) {
      setGameOverData(pendingGameOver);
      setPhase(PHASES.GAME_OVER);
      setPendingGameOver(null);
      return;
    }

    if (session) {
      setRoute([session.origin_station]);
    }
    setPhase(PHASES.PLANNING);
  };

  const handleEndGame = async () => {
    if (submitting || gameEndedRef.current) return;

    setSubmitting(true);
    try {
      const result = await gameAPI.endGame(session.id);
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
    setPendingGameOver(null);
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

  // SETUP
  if (phase === PHASES.SETUP && metroData && session) {
    return (
      <div className="row">
        <div className="col-8">
          <div className="card">
            <div className="card-header">
              <span className="card-title">🗺️ Metro Network – Setup</span>
              <span className="badge badge-secondary">Round {round}</span>
            </div>
            <MetroMap
              metroData={metroData}
              route={route}
              origin={session.origin_station}
              destination={session.destination_station}
              showLines={true}
              disabled={true}
            />
            <div style={{ padding: "1rem", textAlign: "center" }}>
              <button
                className="btn btn-primary"
                onClick={handleStartPlanning}
                style={{ fontSize: "1.2rem", padding: "0.75rem 2rem" }}
              >
                Start Planning (90s)
              </button>
            </div>
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
            <div className="card-header">
              <span className="card-title">Instructions</span>
            </div>
            <p style={{ color: "#aaa", fontSize: "14px" }}>
              Study the metro network carefully. When you are ready, click the
              button above to start the planning phase. You will have 90 seconds
              to build your route.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PLANNING
  if (phase === PHASES.PLANNING && metroData && session) {
    const allSegments = [];
    const seen = new Set();
    metroData.connections.forEach((c) => {
      const key = [c.station_a, c.station_b].sort().join("|");
      if (!seen.has(key)) {
        seen.add(key);
        allSegments.push({ a: c.station_a, b: c.station_b });
      }
    });

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
                showLines={false}
                disabled={true}
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

            <div
              className="card"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              <div className="card-header">
                <span className="card-title">Segments</span>
              </div>
              <SegmentList
                segments={allSegments}
                stations={metroData.stations}
                route={route}
                origin={session.origin_station}
                onSelectSegment={handleAddSegment}
              />
            </div>

            <div className="card">
              <RouteBuilder
                route={route}
                stations={metroData.stations}
                onUndo={() =>
                  setRoute((prev) =>
                    prev.length > 1 ? prev.slice(0, -1) : prev,
                  )
                }
                onClear={() => setRoute([session.origin_station])}
                onConfirm={handleConfirmRoute}
                isValid={false} // Always allow submission; client validation removed
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

  // JOURNEY
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
              showLines={false}
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

  // GAME OVER
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
