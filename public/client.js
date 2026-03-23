const socket = io();

let mySymbol = null;
let myRoomId = null;
let myTurn = false;

const statusEl = document.getElementById('status');
const findGameBtn = document.getElementById('find-game-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const cells = document.querySelectorAll('.cell');

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// --- helpers ---

function setStatus(text, turnSymbol = null) {
  statusEl.textContent = text;
  statusEl.classList.remove('turn-x', 'turn-o');
  if (turnSymbol === 'X') statusEl.classList.add('turn-x');
  if (turnSymbol === 'O') statusEl.classList.add('turn-o');
}

function setSearching(isSearching) {
  if (isSearching) {
    findGameBtn.disabled = true;
    findGameBtn.innerHTML = '<span class="spinner"></span>Searching...';
  } else {
    findGameBtn.disabled = false;
    findGameBtn.textContent = 'Find Game';
  }
}

function setBoardEnabled(enabled) {
  cells.forEach((cell) => {
    cell.disabled = !enabled;
  });
}

function resetBoard() {
  cells.forEach((cell) => {
    cell.textContent = '';
    cell.className = 'cell';
    cell.disabled = true;
  });
  playAgainBtn.hidden = true;
  mySymbol = null;
  myRoomId = null;
  myTurn = false;
}

function highlightWinner(board, winner) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] === winner && board[b] === winner && board[c] === winner) {
      [a, b, c].forEach((i) => cells[i].classList.add('winner'));
      break;
    }
  }
}

// --- UI events ---

findGameBtn.addEventListener('click', () => {
  resetBoard();
  setSearching(true);
  setStatus('Searching for opponent...');
  socket.emit('find-game');
});

playAgainBtn.addEventListener('click', () => {
  resetBoard();
  setSearching(true);
  setStatus('Searching for opponent...');
  socket.emit('find-game');
});

cells.forEach((cell) => {
  cell.addEventListener('click', () => {
    if (!myTurn || cell.textContent !== '') return;
    const index = parseInt(cell.dataset.index, 10);
    socket.emit('make-move', { index, roomId: myRoomId });
  });
});

// --- socket events ---

socket.on('waiting', () => {
  setStatus('Waiting for another player...');
});

socket.on('game-start', ({ symbol, roomId }) => {
  mySymbol = symbol;
  myRoomId = roomId;
  myTurn = symbol === 'X';
  setSearching(false);
  findGameBtn.disabled = true;
  setBoardEnabled(myTurn);
  const turnSymbol = myTurn ? 'X' : 'O';
  setStatus(myTurn ? 'Your turn (X goes first)' : `Opponent's turn (X goes first) — you are ${symbol}`, turnSymbol);
});

socket.on('move-made', ({ index, symbol, board: _ }) => {
  const cell = cells[index];
  cell.textContent = symbol;
  cell.classList.add(symbol.toLowerCase());

  myTurn = symbol !== mySymbol;
  setBoardEnabled(myTurn);

  cells.forEach((c) => {
    if (c.textContent !== '') c.disabled = true;
  });

  const nextSymbol = myTurn ? mySymbol : (mySymbol === 'X' ? 'O' : 'X');
  setStatus(myTurn ? 'Your turn' : "Opponent's turn", nextSymbol);
});

socket.on('game-over', ({ winner, draw, board }) => {
  setBoardEnabled(false);
  setSearching(false);
  if (draw) {
    setStatus("It's a draw!");
  } else if (winner === mySymbol) {
    setStatus('You win!');
    highlightWinner(board, winner);
  } else {
    setStatus('You lose.');
    highlightWinner(board, winner);
  }
  playAgainBtn.hidden = false;
});

socket.on('opponent-left', () => {
  setBoardEnabled(false);
  setSearching(false);
  setStatus('Opponent disconnected.');
  playAgainBtn.hidden = false;
});
