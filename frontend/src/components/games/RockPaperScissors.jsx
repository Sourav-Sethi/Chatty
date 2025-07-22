import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../store/useAuth";

const choices = ["Rock", "Paper", "Scissors"];
const beepUrl = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

export default function RockPaperScissors({ onClose, mode = "friend", gameId, playerIdx, state }) {
  const { authUser, socket } = useAuth();
  const [userChoice, setUserChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [result, setResult] = useState("");
  const [rematchRequestedByMe, setRematchRequestedByMe] = useState(false);
  const [rematchRequestedByOpponent, setRematchRequestedByOpponent] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const beepRef = useRef(null);
  const [lastAIMove, setLastAIMove] = useState(null);

  // Multiplayer: sync state
  useEffect(() => {
    if (mode === "multiplayer" && state) {
      setUserChoice(state.choices[playerIdx]);
      setOpponentChoice(state.choices[1 - playerIdx]);
      setResult(state.result);
    }
  }, [mode, state, playerIdx]);

  // Listen for rematch requests
  useEffect(() => {
    if (mode !== "multiplayer" || !socket) return;
    function onRematchRequest({ from }) {
      if (from !== authUser._id) {
        setRematchRequestedByOpponent(true);
      }
    }
    socket.on("game:rematch-request", onRematchRequest);
    return () => {
      socket.off("game:rematch-request", onRematchRequest);
    };
  }, [mode, socket, authUser]);

  // Countdown and beep for rematch
  useEffect(() => {
    if (rematchRequestedByMe && rematchRequestedByOpponent && countdown === null) {
      setCountdown(3);
    }
  }, [rematchRequestedByMe, rematchRequestedByOpponent, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      handleAcceptRematch();
      setCountdown(null);
      return;
    }
    if (countdown > 0) {
      beepRef.current && beepRef.current.play();
      countdownRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(countdownRef.current);
  }, [countdown]);

  // Multiplayer: send move
  function sendMove(choice) {
    if (mode === "multiplayer" && socket && authUser && gameId) {
      socket.emit("game:move", { gameId, userId: authUser._id, idx: choice });
    }
  }

  // Multiplayer: handle move
  function handleChoice(choice) {
    if (mode === "multiplayer") {
      if (userChoice || result) return;
      sendMove(choice);
      setUserChoice(choice);
      return;
    }
    // AI: never repeat last move
    let aiChoice;
    do {
      aiChoice = choices[Math.floor(Math.random() * 3)];
    } while (aiChoice === lastAIMove);
    setLastAIMove(aiChoice);
    setUserChoice(choice);
    setOpponentChoice(aiChoice);
    setResult(getResult(choice, aiChoice));
  }

  function getResult(user, comp) {
    if (user === comp) return "It's a draw!";
    if (
      (user === "Rock" && comp === "Scissors") ||
      (user === "Paper" && comp === "Rock") ||
      (user === "Scissors" && comp === "Paper")
    ) {
      return "You win!";
    }
    return "You lose!";
  }

  function reset() {
    setUserChoice(null);
    setOpponentChoice(null);
    setResult("");
  }

  function handleRematch() {
    if (mode === "multiplayer" && socket && authUser && gameId) {
      socket.emit("game:rematch-request", { gameId, from: authUser._id });
      setRematchRequestedByMe(true);
    }
    if (mode !== "multiplayer") reset();
  }

  function handleAcceptRematch() {
    if (mode === "multiplayer" && socket && authUser && gameId) {
      socket.emit("game:join", { gameId, userId: authUser._id });
      setRematchRequestedByMe(false);
      setRematchRequestedByOpponent(false);
    }
    if (mode !== "multiplayer") reset();
  }

  // Reset rematch state when a new game starts
  useEffect(() => {
    if (mode === "multiplayer" && state && !state.result && !state.choices.some(Boolean)) {
      setRematchRequestedByMe(false);
      setRematchRequestedByOpponent(false);
      setCountdown(null);
    }
  }, [mode, state]);

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-80 mx-auto text-center">
      <audio ref={beepRef} src={beepUrl} preload="auto" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Rock Paper Scissors</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>
      <div className="flex justify-center gap-4 mb-4">
        {choices.map((choice) => (
          <button
            key={choice}
            className="px-4 py-2 bg-gray-800 rounded-lg text-white font-bold hover:bg-gray-700"
            onClick={() => handleChoice(choice)}
            disabled={!!userChoice || !!result}
          >
            {choice}
          </button>
        ))}
      </div>
      {result && (
        <div className="mb-2 text-white">
          You: <b>{userChoice}</b> <br />
          Opponent: <b>{opponentChoice}</b> <br />
          <span className="font-bold">{result}</span>
        </div>
      )}
      {mode !== "multiplayer" && (
        <button onClick={reset} className="mt-2 px-4 py-2 bg-blue-600 rounded text-white font-bold">Reset</button>
      )}
      {mode === "multiplayer" && result && !rematchRequestedByMe && !rematchRequestedByOpponent && (
        <button onClick={handleRematch} className="mt-2 px-4 py-2 bg-green-600 rounded text-white font-bold">Rematch</button>
      )}
      {mode === "multiplayer" && result && rematchRequestedByMe && !rematchRequestedByOpponent && (
        <div className="mt-2 text-green-400 font-bold">Rematch requested. Waiting for opponent...</div>
      )}
      {mode === "multiplayer" && result && !rematchRequestedByMe && rematchRequestedByOpponent && (
        <div className="mt-2">
          <div className="text-yellow-300 font-bold mb-2">Opponent requested a rematch.</div>
          <button onClick={handleRematch} className="px-4 py-2 bg-green-600 rounded text-white font-bold">Accept Rematch</button>
        </div>
      )}
      {mode === "multiplayer" && result && rematchRequestedByMe && rematchRequestedByOpponent && countdown !== null && (
        <div className="mt-2 text-blue-400 font-bold">Rematch starting in {countdown}...</div>
      )}
    </div>
  );
} 