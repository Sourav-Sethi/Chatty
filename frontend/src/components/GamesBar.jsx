import React from "react";

const games = [
  { name: "Tic Tac Toe" },
  { name: "Chess" },
  { name: "Rock Paper Scissors" },
  { name: "Connect Four" },
  // Add more games here
];

export default function GamesBar({ onChallenge }) {
  return (
    <div className="games-bar p-2 bg-gray-800 rounded shadow mt-2">
      <h3 className="text-white mb-2">Games</h3>
      <ul>
        {games.map((game, idx) => (
          <li key={idx} className="flex items-center justify-between mb-1">
            <span className="text-gray-200">{game.name}</span>
            <button
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => onChallenge(game.name)}
            >
              Challenge
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 