const TicTacToeGame = require('./game');

const waitingQueue = [];
const activeGames = new Map(); // roomId -> { game, players: { X: socket, O: socket } }
const socketRooms = new Map(); // socketId -> roomId

function addToQueue(socket, io) {
  if (waitingQueue.length > 0) {
    const opponent = waitingQueue.shift();

    const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const game = new TicTacToeGame();

    const [xSocket, oSocket] = Math.random() < 0.5
      ? [socket, opponent]
      : [opponent, socket];

    xSocket.join(roomId);
    oSocket.join(roomId);

    activeGames.set(roomId, {
      game,
      players: { X: xSocket, O: oSocket },
    });
    socketRooms.set(xSocket.id, roomId);
    socketRooms.set(oSocket.id, roomId);

    xSocket.emit('game-start', { symbol: 'X', roomId });
    oSocket.emit('game-start', { symbol: 'O', roomId });
  } else {
    waitingQueue.push(socket);
    socket.emit('waiting');
  }
}

function removeFromQueue(socket) {
  const index = waitingQueue.indexOf(socket);
  if (index !== -1) {
    waitingQueue.splice(index, 1);
  }
}

function handleDisconnect(socket, io) {
  removeFromQueue(socket);

  const roomId = socketRooms.get(socket.id);
  if (!roomId) return;

  const room = activeGames.get(roomId);
  if (room) {
    const opponent = room.players.X.id === socket.id
      ? room.players.O
      : room.players.X;

    opponent.emit('opponent-left');
    activeGames.delete(roomId);
    socketRooms.delete(room.players.X.id);
    socketRooms.delete(room.players.O.id);
  }
}

module.exports = { addToQueue, removeFromQueue, handleDisconnect, activeGames, socketRooms };
