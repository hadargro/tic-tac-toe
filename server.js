const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { addToQueue, handleDisconnect, activeGames, socketRooms } = require('./matchmaking');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('find-game', () => {
    addToQueue(socket, io);
  });

  socket.on('make-move', ({ index }) => {
    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;

    const room = activeGames.get(roomId);
    if (!room) return;

    const result = room.game.makeMove(index);
    if (!result.valid) return;

    io.to(roomId).emit('move-made', { index, symbol: result.symbol, board: result.board });

    if (result.winner) {
      io.to(roomId).emit('game-over', { winner: result.winner });
    } else if (result.isDraw) {
      io.to(roomId).emit('game-over', { draw: true });
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    handleDisconnect(socket, io);
  });
});

httpServer.listen(process.env.PORT || 3000);
