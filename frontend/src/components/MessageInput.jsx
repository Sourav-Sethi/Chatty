import { useRef, useState, useEffect } from "react";
import { useChat } from "../store/useChat";
import { Image, Send, X, Gamepad2, Paperclip, Smile } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../store/useAuth";
import TicTacToe from "./games/TicTacToe";
import Chess from "./games/Chess";
import RockPaperScissors from "./games/RockPaperScissors";
import ConnectFour from "./games/ConnectFour";

export const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessages, selectedUser, emitTyping, emitStopTyping } = useChat();
  const { authUser, socket } = useAuth();
  const [showGames, setShowGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [multiplayerGame, setMultiplayerGame] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const games = [
    "Tic Tac Toe",
    "Chess",
    "Rock Paper Scissors",
    "Connect Four",
  ];
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!socket) return;
    // Listen for game invites
    socket.on("game:invite", ({ from, gameId }) => {
      setPendingInvite({ from, gameId });
    });
    // Listen for game updates
    socket.on("game:update", (game) => {
      if (multiplayerGame && game.id === multiplayerGame.gameId) {
        setMultiplayerGame((prev) => ({ ...prev, state: game }));
      }
    });
    return () => {
      socket.off("game:invite");
      socket.off("game:update");
    };
    // eslint-disable-next-line
  }, [socket, multiplayerGame]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
      setFileMeta({
        name: file.name,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFilePreview(null);
    setFileMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  function handleGameClick(game) {
    setSelectedGame(game);
  }

  function handleGameMode(mode) {
    setShowGames(false);
    setSelectedGame(null);
    if (selectedGame === "Tic Tac Toe" && mode === "friend" && selectedUser) {
      // Challenge friend via socket
      socket.emit("game:challenge", { from: authUser._id, to: selectedUser._id });
      toast.success("Challenge sent!");
      setWaitingForOpponent(true);
      return;
    }
    setActiveGame({ name: selectedGame, mode });
  }

  function acceptInvite() {
    if (!pendingInvite) return;
    socket.emit("game:join", { gameId: pendingInvite.gameId, userId: authUser._id });
    // Player 0 is challenger, player 1 is invitee
    setMultiplayerGame({
      gameId: pendingInvite.gameId,
      game: "Tic Tac Toe",
      playerIdx: 1,
      state: null,
    });
    setPendingInvite(null);
  }

  function startMultiplayer(game) {
    // Determine if this user is player 0 or 1
    const idx = game.players[0] === authUser._id ? 0 : 1;
    setMultiplayerGame({
      gameId: game.id,
      game: "Tic Tac Toe",
      playerIdx: idx,
      state: game,
    });
  }

  function cancelWaiting() {
    setWaitingForOpponent(false);
  }

  // Listen for own challenge accepted (game:update)
  useEffect(() => {
    if (!socket) return;
    socket.on("game:update", (game) => {
      if (multiplayerGame && game.id === multiplayerGame.gameId) {
        setMultiplayerGame((prev) => ({ ...prev, state: game }));
      } else if (game.players.includes(authUser._id)) {
        setWaitingForOpponent(false);
        startMultiplayer(game);
      }
    });
    return () => {
      socket.off("game:update");
    };
    // eslint-disable-next-line
  }, [socket, multiplayerGame, authUser]);

  function closeGame() {
    setActiveGame(null);
    setMultiplayerGame(null);
  }

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (!selectedUser) return;
    emitTyping();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitStopTyping();
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !filePreview) return;
    emitStopTyping();

    try {
      await sendMessages({
        text: text.trim(),
        file: filePreview,
        fileType: fileMeta?.type,
        fileName: fileMeta?.name,
      });
      setText("");
      setFilePreview(null);
      setFileMeta(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const fetchGifs = async (query) => {
    setIsLoadingGifs(true);
    try {
      const apiKey = "dc6zaTOxFJmzC"; // Giphy public beta key
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&api_key=${apiKey}&limit=16`);
      const data = await res.json();
      setGifResults(data.data || []);
    } catch (e) {
      setGifResults([]);
    }
    setIsLoadingGifs(false);
  };

  useEffect(() => {
    if (showGifPicker && gifSearch.length > 1) {
      fetchGifs(gifSearch);
    } else if (showGifPicker) {
      setGifResults([]);
    }
  }, [gifSearch, showGifPicker]);

  const handleGifSelect = async (gifUrl) => {
    await sendMessages({ text: "", file: gifUrl, fileType: "image/gif", fileName: "GIF" });
    setShowGifPicker(false);
    setGifSearch("");
    setGifResults([]);
  };

  return (
    <div className="p-4 w-full relative">
      {/* Multiplayer Tic Tac Toe modal */}
      {multiplayerGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <TicTacToe
            onClose={closeGame}
            mode="multiplayer"
            gameId={multiplayerGame.gameId}
            playerIdx={multiplayerGame.playerIdx}
            state={multiplayerGame.state}
          />
        </div>
      )}
      {/* Game modal */}
      {activeGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          {activeGame.name === "Tic Tac Toe" && <TicTacToe onClose={closeGame} mode={activeGame.mode} />}
          {activeGame.name === "Chess" && <Chess onClose={closeGame} />}
          {activeGame.name === "Rock Paper Scissors" && <RockPaperScissors onClose={closeGame} />}
          {activeGame.name === "Connect Four" && <ConnectFour onClose={closeGame} mode={activeGame.mode} />}
        </div>
      )}
      {/* Waiting for opponent modal (Tic Tac Toe only) */}
      {waitingForOpponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 p-8 rounded-xl shadow-xl w-96 text-center">
            <h2 className="text-xl font-bold text-white mb-4">Waiting for Opponent</h2>
            <p className="text-white mb-6">Challenge sent! Waiting for your friend to accept...</p>
            <button
              className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-bold text-lg"
              onClick={cancelWaiting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Invite modal (Tic Tac Toe only) */}
      {pendingInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 p-8 rounded-xl shadow-xl w-96 text-center">
            <h2 className="text-xl font-bold text-white mb-4">Game Invite</h2>
            <p className="text-white mb-6">You have been challenged to Tic Tac Toe!</p>
            <button
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg"
              onClick={acceptInvite}
            >
              Accept
            </button>
            <button
              className="ml-4 px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-bold text-lg"
              onClick={() => setPendingInvite(null)}
            >
              Decline
            </button>
          </div>
        </div>
      )}
      {filePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {fileMeta?.type?.startsWith("image/") ? (
              <img
                src={filePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
            ) : fileMeta?.type?.startsWith("video/") ? (
              <video src={filePreview} controls className="w-24 h-20 rounded-lg border border-zinc-700" />
            ) : (
              <div className="flex flex-col items-center justify-center w-24 h-20 rounded-lg border border-zinc-700 bg-zinc-100 text-zinc-700">
                <Paperclip className="w-6 h-6 mb-1" />
                <span className="text-xs truncate w-20">{fileMeta?.name}</span>
              </div>
            )}
            <button
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2 relative">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={handleInputChange}
          />
          <input
            type="file"
            accept="*/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${filePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={20} />
          </button>
          <button
            type="button"
            className="hidden sm:flex btn btn-circle text-zinc-400"
            onClick={() => setShowGames((v) => !v)}
            tabIndex={-1}
          >
            <Gamepad2 size={20} />
          </button>
          <button
            type="button"
            className="hidden sm:flex btn btn-circle text-zinc-400"
            onClick={() => setShowGifPicker(true)}
            tabIndex={-1}
            aria-label="Send GIF"
          >
            <Smile size={20} />
          </button>
          {showGames && !selectedGame && (
            <div className="absolute right-0 top-12 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl p-5 w-64 border border-gray-700 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-extrabold text-xl tracking-wide">Games</h4>
                <button
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                  onClick={() => setShowGames(false)}
                  aria-label="Close games menu"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="border-b border-gray-700 mb-3" />
              <ul className="space-y-3">
                {games.map((game, idx) => (
                  <li key={idx}>
                    <button
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-bold text-lg tracking-tight"
                      onClick={() => handleGameClick(game)}
                    >
                      {game}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showGames && selectedGame && (
            <div className="absolute right-0 top-12 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl p-5 w-72 border border-gray-700 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-extrabold text-xl tracking-wide">{selectedGame}</h4>
                <button
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                  onClick={() => setSelectedGame(null)}
                  aria-label="Back to games list"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="border-b border-gray-700 mb-3" />
              <div className="flex flex-col gap-4 mt-2">
                <button
                  className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-lg transition-colors"
                  onClick={() => handleGameMode("friend")}
                >
                  Challenge Friend (1v1)
                </button>
                <button
                  className="w-full px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 font-bold text-lg transition-colors"
                  onClick={() => handleGameMode("computer")}
                >
                  Play with Computer
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !filePreview}
        >
          <Send size={22} />
        </button>
      </form>

      {/* GIF Picker Modal */}
      {showGifPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg flex flex-col items-center relative">
            <button
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-blue-600 text-2xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full hover:bg-gray-100 shadow-sm z-20"
              aria-label="Close GIF picker"
              onClick={() => setShowGifPicker(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4 text-gray-800">Send a GIF</h3>
            <input
              type="text"
              className="input input-bordered w-full mb-4"
              placeholder="Search GIFs..."
              value={gifSearch}
              onChange={e => setGifSearch(e.target.value)}
              autoFocus
            />
            <div className="w-full grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
              {isLoadingGifs && <div className="col-span-4 text-center text-blue-500">Loading...</div>}
              {!isLoadingGifs && gifResults.length === 0 && gifSearch.length > 1 && (
                <div className="col-span-4 text-center text-gray-400">No GIFs found.</div>
              )}
              {gifResults.map(gif => (
                <button
                  key={gif.id}
                  className="rounded-lg overflow-hidden border border-gray-200 hover:scale-105 transition-transform"
                  onClick={() => handleGifSelect(gif.images.fixed_height.url)}
                  tabIndex={-1}
                >
                  <img src={gif.images.fixed_height.url} alt={gif.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};