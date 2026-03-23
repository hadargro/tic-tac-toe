# Tic Tac Toe

Real-time two-player tic-tac-toe in the browser, powered by WebSockets.

## How to Play

1. Open the game and click **Find Game** — you'll be matched with the next available player.
2. X always goes first. Each player clicks a cell on their turn.
3. First to get three in a row (horizontal, vertical, or diagonal) wins. If all nine cells fill with no winner, it's a draw.
4. Click **Play Again** after a game ends to jump back into the queue.

## Tech Stack

- **Node.js + Express** — serves static files and hosts the HTTP server
- **Socket.io** — real-time bidirectional communication between players
- **Vanilla HTML/CSS/JS** — no frontend framework; just a single page and a stylesheet

## Run Locally

```bash
git clone <repo-url>
cd tic-tac-toe
npm install
node server.js
```

Then open [http://localhost:3000](http://localhost:3000) in two browser tabs to play against yourself.

## How It Works

The server maintains a **waiting queue**. When a second player clicks Find Game, the server pairs them into a private Socket.io room, randomly assigns X and O, and emits `game-start` to both clients.

From there, all moves go through the server: the client emits `make-move`, the server validates it via the `TicTacToeGame` class, then broadcasts `move-made` (or `game-over`) to everyone in the room. The client never trusts its own turn state — the server is the single source of truth.

If a player disconnects mid-game, the opponent receives `opponent-left` and is returned to the lobby.
