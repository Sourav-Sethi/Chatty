import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../store/useAuth";

const ROWS = 6;
const COLS = 7;
function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}
const beepUrl = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

export default function ConnectFour({ onClose, mode = "friend", gameId, playerIdx, state }) {
  const { authUser, socket } = useAuth();
  const [board, setBoard] = useState(createBoard());
  const [redIsNext, setRedIsNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [rematchRequestedByMe, setRematchRequestedByMe] = useState(false);
  const [rematchRequestedByOpponent, setRematchRequestedByOpponent] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const beepRef = useRef(null);
  const [animCol, setAnimCol] = useState(null);

  // Multiplayer: sync board from state
  useEffect(() => {
    if (mode === "multiplayer" && state) {
      setBoard(state.board);
      setRedIsNext(state.redIsNext);
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

  function drop(col, isComputer = false) {
    if (winner) return;
    if (mode === "multiplayer" && !isComputer) {
      if (!state || state.winner) return;
      const isMyTurn = (state.redIsNext && playerIdx === 0) || (!state.redIsNext && playerIdx === 1);
      if (!isMyTurn) return;
      if (state.board[0][col]) return;
      socket.emit("game:move", { gameId, userId: authUser._id, idx: col });
      return;
    }
    if (mode === "computer" && !redIsNext && !isComputer) return;
    const newBoard = board.map((row) => row.slice());
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        newBoard[row][col] = redIsNext ? "R" : "Y";
        setBoard(newBoard);
        setAnimCol(col);
        const win = checkWinner(newBoard, row, col);
        if (win) setWinner(win);
        setRedIsNext(!redIsNext);
        return;
      }
    }
  }

  // Improved AI for computer mode
  useEffect(() => {
    if (mode === "computer" && !redIsNext && !winner) {
      // 1. Win if possible
      let col = findWinningMove(board, "Y");
      // 2. Block if needed
      if (col === null) col = findWinningMove(board, "R");
      // 3. Otherwise random
      if (col === null) {
        const validCols = [];
        for (let c = 0; c < COLS; c++) {
          if (!board[0][c]) validCols.push(c);
        }
        if (validCols.length > 0) {
          col = validCols[Math.floor(Math.random() * validCols.length)];
        }
      }
      if (col !== null) {
        setTimeout(() => {
          drop(col, true);
        }, 700);
      }
    }
    // eslint-disable-next-line
  }, [board, redIsNext, winner, mode]);

  function reset() {
    setBoard(createBoard());
    setRedIsNext(true);
    setWinner(null);
    setAnimCol(null);
  }

  function handleRematch() {
    if (mode === "multiplayer" && socket && authUser && gameId) {
      socket.emit("game:rematch-request", { gameId, from: authUser._id });
      setRematchRequestedByMe(true);
    }
  }

  function handleAcceptRematch() {
    if (mode === "multiplayer" && socket && authUser && gameId) {
      socket.emit("game:join", { gameId, userId: authUser._id });
      setRematchRequestedByMe(false);
      setRematchRequestedByOpponent(false);
    }
  }

  // Reset rematch state when a new game starts
  useEffect(() => {
    if (mode === "multiplayer" && state && !state.winner && state.board.every(row => row.every(cell => !cell))) {
      setRematchRequestedByMe(false);
      setRematchRequestedByOpponent(false);
      setCountdown(null);
      setAnimCol(null);
    }
  }, [mode, state]);

  // Render board and winner from multiplayer state if present
  const renderBoard = mode === "multiplayer" && state ? state.board : board;
  const renderWinner = mode === "multiplayer" && state ? state.winner : winner;
  const renderRedIsNext = mode === "multiplayer" && state ? state.redIsNext : redIsNext;

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-[350px] mx-auto text-center">
      <audio ref={beepRef} src={beepUrl} preload="auto" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Connect Four</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {renderBoard.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <div
              key={rIdx + '-' + cIdx}
              className={`w-8 h-8 flex items-center justify-center bg-gray-800 rounded-full border border-gray-700 transition-all duration-300 ${animCol === cIdx && rIdx === findDropRow(renderBoard, cIdx) ? 'animate-fade-in' : ''}`}
              style={{ backgroundColor: cell === "R" ? "#ef4444" : cell === "Y" ? "#facc15" : undefined }}
              onClick={() => !cell && drop(cIdx)}
            >
              {cell ? "" : <span className="opacity-30">•</span>}
            </div>
          ))
        )}
      </div>
      <div className="mb-2 text-white">
        {renderWinner
          ? renderWinner === "draw"
            ? "It's a draw!"
            : `Winner: ${renderWinner === "R" ? "Red" : "Yellow"}`
          : mode === "computer"
            ? renderRedIsNext ? "Your turn (Red)" : "Computer's turn (Yellow)"
            : mode === "multiplayer"
              ? state && ((state.redIsNext && playerIdx === 0) || (!state.redIsNext && playerIdx === 1))
                ? "Your turn"
                : "Opponent's turn"
              : `Next: ${renderRedIsNext ? "Red" : "Yellow"}`}
      </div>
      {mode !== "multiplayer" && (
        <button onClick={reset} className="mt-2 px-4 py-2 bg-blue-600 rounded text-white font-bold">Reset</button>
      )}
      {mode === "multiplayer" && renderWinner && !rematchRequestedByMe && !rematchRequestedByOpponent && (
        <button onClick={handleRematch} className="mt-2 px-4 py-2 bg-green-600 rounded text-white font-bold">Rematch</button>
      )}
      {mode === "multiplayer" && renderWinner && rematchRequestedByMe && !rematchRequestedByOpponent && (
        <div className="mt-2 text-green-400 font-bold">Rematch requested. Waiting for opponent...</div>
      )}
      {mode === "multiplayer" && renderWinner && !rematchRequestedByMe && rematchRequestedByOpponent && (
        <div className="mt-2">
          <div className="text-yellow-300 font-bold mb-2">Opponent requested a rematch.</div>
          <button onClick={handleRematch} className="px-4 py-2 bg-green-600 rounded text-white font-bold">Accept Rematch</button>
        </div>
      )}
      {mode === "multiplayer" && renderWinner && rematchRequestedByMe && rematchRequestedByOpponent && countdown !== null && (
        <div className="mt-2 text-blue-400 font-bold">Rematch starting in {countdown}...</div>
      )}
    </div>
  );
}

function checkWinner(board, row, col) {
  const player = board[row][col];
  if (!player) return null;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let [dr, dc] of directions) {
    let count = 1;
    for (let d = 1; d < 4; d++) {
      const r = row + dr * d;
      const c = col + dc * d;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
      count++;
    }
    for (let d = 1; d < 4; d++) {
      const r = row - dr * d;
      const c = col - dc * d;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
      count++;
    }
    if (count >= 4) return player;
  }
  if (board.every(row => row.every(cell => cell))) return "draw";
  return null;
}

// Find a winning/blocking move for the given player
function findWinningMove(board, player) {
  for (let c = 0; c < COLS; c++) {
    const row = findDropRow(board, c);
    if (row === -1) continue;
    const newBoard = board.map((r) => r.slice());
    newBoard[row][c] = player;
    if (checkWinner(newBoard, row, c) === player) return c;
  }
  return null;
}

// Find the row where a piece would drop in a column
function findDropRow(board, col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!board[row][col]) return row;
  }
  return -1;
} 