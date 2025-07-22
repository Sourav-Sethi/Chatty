import http from "http"
import { Server } from "socket.io"
import express from "express"
import { v4 as uuidv4 } from "uuid"

const app = express()
const server = http.createServer(app)

const io = new Server(server,{
    cors:{
        origin:["http://localhost:5173"]
    }
})

export function getRecieverSocketId(userId){
    return userSocketMap[userId]
}
const userSocketMap = {}  //userId:socketId

// In-memory Tic Tac Toe games: { [gameId]: { id, players: [userA, userB], board, xIsNext, winner } }
const ticTacToeGames = {};

io.on("connection",(socket)=>{
    console.log("client connected: ",socket.id)
    const userId = socket.handshake.query.userId
    if(userId) userSocketMap[userId] = socket.id
    io.emit("getOnlineUser",Object.keys(userSocketMap))

    // --- Tic Tac Toe Real-Time Events ---
    socket.on("game:challenge", ({ from, to }) => {
        // Create a new game session
        const gameId = uuidv4();
        ticTacToeGames[gameId] = {
            id: gameId,
            players: [from, to],
            board: Array(9).fill(null),
            xIsNext: true,
            winner: null
        };
        // Notify the challenged user
        const toSocket = userSocketMap[to];
        if (toSocket) {
            io.to(toSocket).emit("game:invite", { from, gameId });
        }
    });

    socket.on("game:join", ({ gameId, userId }) => {
        // Notify both players the game has started
        const game = ticTacToeGames[gameId];
        if (game && game.players.includes(userId)) {
            game.joined = true;
            game.lastMove = null;
            game.winner = null;
            game.board = Array(9).fill(null);
            game.xIsNext = true;
            for (const playerId of game.players) {
                const sId = userSocketMap[playerId];
                if (sId) io.to(sId).emit("game:update", { ...game });
            }
        }
    });

    socket.on("game:move", ({ gameId, userId, idx }) => {
        const game = ticTacToeGames[gameId];
        if (!game || game.winner) return;
        const playerIdx = game.players.indexOf(userId);
        if (playerIdx === -1) return;
        // X is player 0, O is player 1
        if ((game.xIsNext && playerIdx !== 0) || (!game.xIsNext && playerIdx !== 1)) return;
        if (game.board[idx]) return;
        game.board[idx] = game.xIsNext ? "X" : "O";
        game.xIsNext = !game.xIsNext;
        game.winner = calculateWinner(game.board);
        game.lastMove = { idx, by: userId };
        // Notify both players
        for (const playerId of game.players) {
            const sId = userSocketMap[playerId];
            if (sId) io.to(sId).emit("game:update", { ...game });
        }
    });

    // --- Typing Indicator Events ---
    socket.on("typing", ({ to }) => {
        const toSocket = userSocketMap[to];
        if (toSocket) {
            io.to(toSocket).emit("typing", { from: userId });
        }
    });
    socket.on("stopTyping", ({ to }) => {
        const toSocket = userSocketMap[to];
        if (toSocket) {
            io.to(toSocket).emit("stopTyping", { from: userId });
        }
    });

    socket.on("disconnect",()=>{
        console.log("Client disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUser", Object.keys(userSocketMap));
    })
})

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

export { io, app, server }