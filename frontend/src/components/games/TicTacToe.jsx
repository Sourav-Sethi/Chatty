import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../store/useAuth";

const emptyBoard = Array(9).fill(null);
const beepUrl = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

export default function TicTacToe({ onClose, mode = "friend", gameId, playerIdx, state }) {
  const { authUser, socket } = useAuth();
  const [board, setBoard] = useState(emptyBoard);
  const [xIsNext, setXIsNext] = useState(true);
  const [rematchRequestedByMe, setRematchRequestedByMe] = useState(false);
  const [rematchRequestedByOpponent, setRematchRequestedByOpponent] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const beepRef = useRef(null);
  const [animIdx, setAnimIdx] = useState(null);

  // Multiplayer: sync board from state
  useEffect(() => {
    if (mode === "multiplayer" && state) {
      setBoard(state.board);
      setXIsNext(state.xIsNext);
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

  // Unbeatable Minimax AI for computer mode
  useEffect(() => {
    if (mode === "computer" && !xIsNext && !calculateWinner(board)) {
      const move = findBestMove(board);
      if (move !== null) {
        setTimeout(() => {
          const newBoard = board.slice();
          newBoard[move] = "O";
          setBoard(newBoard);
          setAnimIdx(move);
          setXIsNext(true);
        }, 500);
      }
    }
    // eslint-disable-next-line
  }, [board, xIsNext, mode]);

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

  function handleClick(idx) {
    if (mode === "multiplayer") {
      if (!state || state.winner) return;
      // Only allow move if it's your turn
      const isMyTurn = (state.xIsNext && playerIdx === 0) || (!state.xIsNext && playerIdx === 1);
      if (!isMyTurn) return;
      if (state.board[idx]) return;
      socket.emit("game:move", { gameId, userId: authUser._id, idx });
      return;
    }
    if (board[idx] || calculateWinner(board)) return;
    if (mode === "computer" && !xIsNext) return; // block user if not their turn
    const newBoard = board.slice();
    newBoard[idx] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setAnimIdx(idx);
    setXIsNext(!xIsNext);
  }

  function handleReset() {
    if (mode === "multiplayer") return; // multiplayer reset not supported yet
    setBoard(emptyBoard);
    setXIsNext(true);
    setAnimIdx(null);
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
    if (mode === "multiplayer" && state && !state.winner && state.board.every(cell => !cell)) {
      setRematchRequestedByMe(false);
      setRematchRequestedByOpponent(false);
      setCountdown(null);
      setAnimIdx(null);
    }
  }, [mode, state]);

  // Render board and winner from multiplayer state if present
  const renderBoard = mode === "multiplayer" && state ? state.board : board;
  const renderWinner = mode === "multiplayer" && state ? state.winner : calculateWinner(board);
  const renderXIsNext = mode === "multiplayer" && state ? state.xIsNext : xIsNext;

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-80 mx-auto text-center">
      <audio ref={beepRef} src={beepUrl} preload="auto" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Tic Tac Toe</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {renderBoard.map((cell, idx) => (
          <button
            key={idx}
            className={`w-16 h-16 text-2xl font-bold bg-gray-800 rounded-lg hover:bg-gray-700 text-white transition-all duration-300 ${animIdx === idx ? 'animate-fade-in' : ''}`}
            onClick={() => handleClick(idx)}
            disabled={!!cell || renderWinner || (mode === "computer" && !renderXIsNext) || (mode === "multiplayer" && (!state || state.winner || !((state.xIsNext && playerIdx === 0) || (!state.xIsNext && playerIdx === 1))))}
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="mb-2 text-white">
        {renderWinner
          ? renderWinner === "draw"
            ? "It's a draw!"
            : `Winner: ${renderWinner}`
          : mode === "computer"
            ? renderXIsNext ? "Your turn (X)" : "Computer's turn (O)"
            : mode === "multiplayer"
              ? state && ((state.xIsNext && playerIdx === 0) || (!state.xIsNext && playerIdx === 1))
                ? "Your turn"
                : "Opponent's turn"
              : `Next: ${renderXIsNext ? "X" : "O"}`}
      </div>
      {mode !== "multiplayer" && (
        <button onClick={handleReset} className="mt-2 px-4 py-2 bg-blue-600 rounded text-white font-bold">Reset</button>
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

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  if (squares.every(Boolean)) return "draw";
  return null;
}

// Minimax AI for unbeatable Tic Tac Toe
function findBestMove(board) {
  let bestVal = -Infinity;
  let bestMove = null;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = "O";
      let moveVal = minimax(board, 0, false);
      board[i] = null;
      if (moveVal > bestVal) {
        bestVal = moveVal;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function minimax(board, depth, isMax) {
  const winner = calculateWinner(board);
  if (winner === "O") return 10 - depth;
  if (winner === "X") return depth - 10;
  if (board.every(Boolean)) return 0;
  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "O";
        best = Math.max(best, minimax(board, depth + 1, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "X";
        best = Math.min(best, minimax(board, depth + 1, true));
        board[i] = null;
      }
    }
    return best;
  }
} 