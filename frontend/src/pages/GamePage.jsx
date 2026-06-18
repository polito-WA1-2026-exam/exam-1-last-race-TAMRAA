import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Alert,
  Spinner,
  Card,
} from "react-bootstrap";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext.jsx";
import NavBar from "../components/layout/NavBar.jsx";
import MetroMap from "../components/game/MetroMap.jsx";
import Timer from "../components/game/Timer.jsx";
import CoinCounter from "../components/game/CoinCounter.jsx";
import RouteBuilder from "../components/game/RouteBuilder.jsx";
import JourneyAnimation from "../components/game/JourneyAnimation.jsx";
import GameOver from "../components/game/GameOver.jsx";
import { gameAPI } from "../lib/API.js";

const GAME_PHASES = {
  LOADING: "loading",
  PLANNING: "planning",
  JOURNEY: "journey",
  GAME_OVER: "game_over",
};

export default function GamePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Game state
  const [phase, setPhase] = useState(GAME_PHASES.LOADING);
  const [metroData, setMetroData] = useState(null);
  const [session, setSession] = useState(null);
  const [route, setRoute] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [coins, setCoins] = useState(50);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [journeyEvents, setJourneyEvents] = useState([]);
  const [error, setError] = useState("");
  const [coinChange, setCoinChange] = useState(0);
  const [gameOverReason, setGameOverReason] = useState("");

  // Load metro data and start the game
  useEffect(() => {
    if (isAuthenticated) {
      initializeGame();
    }
  }, [isAuthenticated]);

  const initializeGame = async () => {
    try {
      setPhase(GAME_PHASES.LOADING);
      setError("");

      // Load metro data
      const metro = await gameAPI.getMetroData();
      setMetroData(metro);

      // Start new game session
      const { session: newSession } = await gameAPI.startGame();
      setSession(newSession);
      setCoins(newSession.coins);
      setScore(newSession.score);
      setRound(newSession.current_round);

      // Initialize route with origin
      setRoute([newSession.origin_station]);
      setTimeRemaining(30);
      setPhase(GAME_PHASES.PLANNING);
    } catch (err) {
      console.error("Error initializing game:", err);
      setError(err.message || "Errore initializing game");
    }
  };

  // Handle station click during planning
  const handleStationClick = useCallback(
    (station) => {
      if (phase !== GAME_PHASES.PLANNING) return;

      setRoute((prevRoute) => {
        // If clicking on the last station in route, do nothing
        if (prevRoute[prevRoute.length - 1] === station.id) {
          return prevRoute;
        }

        // If station is already in route (but not last), remove everything after it
        const existingIndex = prevRoute.indexOf(station.id);
        if (existingIndex !== -1) {
          return prevRoute.slice(0, existingIndex + 1);
        }

        // Check if station is connected to the last station in route
        const lastStation = prevRoute[prevRoute.length - 1];
        const isConnected = metroData.connections.some(
          (conn) =>
            (conn.station_a === lastStation && conn.station_b === station.id) ||
            (conn.station_b === lastStation && conn.station_a === station.id),
        );

        if (isConnected) {
          return [...prevRoute, station.id];
        }

        // Not connected - show feedback could be added here
        return prevRoute;
      });
    },
    [phase, metroData],
  );

  // Check if route is valid (reaches destination)
  const isRouteValid =
    route.length >= 2 &&
    route[0] === session?.origin_station &&
    route[route.length - 1] === session?.destination_station;

  // Handle time up
  const handleTimeUp = async () => {
    if (phase !== GAME_PHASES.PLANNING) {
      return;
    }

    // Game over due to time
    try {
      await gameAPI.endGame(session.id);
      setGameOverReason("time");
      setPhase(GAME_PHASES.GAME_OVER);
    } catch (err) {
      console.error("Error ending game:", err);
    }
  };

  // Confirm route and start journey
  const handleConfirmRoute = async () => {
    if (!isRouteValid) {
      return;
    }

    try {
      const result = await gameAPI.submitRoute(
        session.id,
        route,
        timeRemaining,
      );

      if (result.gameOver) {
        setGameOverReason(result.reason);
        setScore(result.finalScore);
        setPhase(GAME_PHASES.GAME_OVER);
      } else {
        setJourneyEvents(result.journeyEvents);
        setPhase(GAME_PHASES.JOURNEY);
      }
    } catch (err) {
      console.error("Error submitting route:", err);
      setError(err.message || "Errore nell'invio del percorso");
    }
  };

  // Handle journey completion
  const handleJourneyComplete = async () => {
    try {
      // Get updated session
      const { session: updatedSession } = await gameAPI.getSession();

      setSession(updatedSession);
      setScore(updatedSession.score);
      setCoins(updatedSession.coins);
      setRound(updatedSession.current_round);

      // Start next round
      setRoute([updatedSession.origin_station]);
      setTimeRemaining(30);
      setCoinChange(0);
      setPhase(GAME_PHASES.PLANNING);
    } catch (err) {
      console.error("Error getting updated session:", err);
    }
  };

  // Handle coin change during journey
  const handleCoinChange = (change) => {
    setCoinChange((prev) => prev + change);
    setCoins((prev) => prev + change);
  };

  // Clear route
  const handleClearRoute = () => {
    if (session) {
      setRoute([session.origin_station]);
    }
  };

  // Undo last station
  const handleUndoRoute = () => {
    if (route.length > 1) {
      setRoute((prev) => prev.slice(0, -1));
    }
  };

  // End game voluntarily
  const handleEndGame = async () => {
    try {
      const result = await gameAPI.endGame(session.id);
      setScore(result.finalScore);
      setGameOverReason("quit");
      setPhase(GAME_PHASES.GAME_OVER);
    } catch (err) {
      console.error("Error ending game:", err);
    }
  };

  // Play again
  const handlePlayAgain = () => {
    initializeGame();
  };

  // Go home
  const handleGoHome = () => {
    navigate("/");
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="game-loading">
        <Spinner animation="border" />
        <p>Caricamento...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="game-page">
      <NavBar />

      <Container fluid className="game-container py-3">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {phase === GAME_PHASES.LOADING && (
          <div className="game-loading text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Preparazione del gioco...</p>
          </div>
        )}

        {phase === GAME_PHASES.PLANNING && metroData && session && (
          <Row>
            <Col lg={8}>
              <Card className="game-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="badge bg-secondary me-2">
                      Round {round}
                    </span>
                    <span className="badge bg-primary">Points: {score}</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <CoinCounter coins={coins} change={coinChange} />
                    <Timer
                      initialTime={30}
                      onTimeUp={handleTimeUp}
                      onTick={setTimeRemaining}
                    />
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <MetroMap
                    metroData={metroData}
                    route={route}
                    origin={session.origin_station}
                    destination={session.destination_station}
                    onStationClick={handleStationClick}
                  />
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="game-card mb-3">
                <Card.Header>
                  <h5 className="mb-0 text-white">Mission</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mission-info">
                    <div className="mission-from">
                      <span className="mission-label">From:</span>
                      <span className="mission-station text-success">
                        {session.origin_name}
                      </span>
                    </div>
                    <div className="mission-to">
                      <span className="mission-label">To:</span>
                      <span className="mission-station text-danger">
                        {session.destination_name}
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card className="game-card mb-3">
                <Card.Body>
                  <RouteBuilder
                    route={route}
                    stations={metroData.stations}
                    onClear={handleClearRoute}
                    onUndo={handleUndoRoute}
                    onConfirm={handleConfirmRoute}
                    isValid={isRouteValid}
                  />
                </Card.Body>
              </Card>

              <Button
                variant="outline-danger"
                className="w-100"
                onClick={handleEndGame}
              >
                Finish the match
              </Button>
            </Col>
          </Row>
        )}

        {phase === GAME_PHASES.JOURNEY && metroData && (
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="game-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="badge bg-secondary me-2">
                      Round {round}
                    </span>
                    <span className="badge bg-primary">Points: {score}</span>
                  </div>
                  <CoinCounter coins={coins} change={coinChange} />
                </Card.Header>
                <Card.Body>
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
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <GameOver
          show={phase === GAME_PHASES.GAME_OVER}
          score={score}
          rounds={round - 1}
          coins={coins}
          reason={gameOverReason}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
        />
      </Container>
    </div>
  );
}
