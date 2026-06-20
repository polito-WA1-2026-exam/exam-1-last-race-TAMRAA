import { useState, useEffect, useRef } from "react";

export default function Timer({ initialTime = 90, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const getClass = () => {
    if (timeLeft <= 5) return "timer-critical";
    if (timeLeft <= 10) return "timer-warning";
    return "timer-normal";
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return <div className={`timer ${getClass()}`}>⏱ {formatTime(timeLeft)}</div>;
}
