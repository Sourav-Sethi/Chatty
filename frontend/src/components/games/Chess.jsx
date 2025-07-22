import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../store/useAuth";

const beepUrl = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

export default function Chess({ onClose, mode = "friend", gameId, playerIdx, state }) {
  const { authUser, socket } = useAuth();
  const [rematchRequestedByMe, setRematchRequestedByMe] = useState(false);
  const [rematchRequestedByOpponent, setRematchRequestedByOpponent] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const beepRef = useRef(null);
  // Placeholder: just track whose turn and winner
  const [turn, setTurn] = useState(0); // 0 = White, 1 = Black
  const [winner, setWinner] = useState(null);

  // Multiplayer: sync state
  useEffect(() => {
    if (mode === "multiplayer" && state) {
      setTurn(state.turn);
      setWinner(state.winner);
    }
  }, [mode, state]);

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

  function reset() {
    setTurn(0);
    setWinner(null);
  }

  // Reset rematch state when a new game starts
  useEffect(() => {
    if (mode === "multiplayer" && state && !state.winner && state.turn === 0) {
      setRematchRequestedByMe(false);
      setRematchRequestedByOpponent(false);
      setCountdown(null);
    }
  }, [mode, state]);

  // Placeholder board
  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-80 mx-auto text-center">
      <audio ref={beepRef} src={beepUrl} preload="auto" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Chess</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>
      <div className="grid grid-cols-8 gap-1 mb-4">
        {[...Array(64)].map((_, idx) => (
          <div key={idx} className={`w-6 h-6 ${((Math.floor(idx / 8) + idx) % 2 === 0) ? 'bg-gray-700' : 'bg-gray-500'}`}></div>
        ))}
      </div>
      <div className="mb-2 text-white">
        {winner
          ? `Winner: ${winner === 0 ? "White" : "Black"}`
          : mode === "multiplayer"
            ? turn === playerIdx
              ? "Your turn"
              : "Opponent's turn"
            : `Next: ${turn === 0 ? "White" : "Black"}`}
      </div>
      {mode !== "multiplayer" && (
        <button onClick={reset} className="mt-2 px-4 py-2 bg-blue-600 rounded text-white font-bold">Reset</button>
      )}
      {mode === "multiplayer" && winner && !rematchRequestedByMe && !rematchRequestedByOpponent && (
        <button onClick={handleRematch} className="mt-2 px-4 py-2 bg-green-600 rounded text-white font-bold">Rematch</button>
      )}
      {mode === "multiplayer" && winner && rematchRequestedByMe && !rematchRequestedByOpponent && (
        <div className="mt-2 text-green-400 font-bold">Rematch requested. Waiting for opponent...</div>
      )}
      {mode === "multiplayer" && winner && !rematchRequestedByMe && rematchRequestedByOpponent && (
        <div className="mt-2">
          <div className="text-yellow-300 font-bold mb-2">Opponent requested a rematch.</div>
          <button onClick={handleRematch} className="px-4 py-2 bg-green-600 rounded text-white font-bold">Accept Rematch</button>
        </div>
      )}
      {mode === "multiplayer" && winner && rematchRequestedByMe && rematchRequestedByOpponent && countdown !== null && (
        <div className="mt-2 text-blue-400 font-bold">Rematch starting in {countdown}...</div>
      )}
    </div>
  );
} 