// TicTacToeEngine — Pure game logic, no UI
// ─────────────────────────────────────────

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

/**
 * Firebase RTDB serialises JS arrays as objects { "0": v, "1": v, ... }.
 * This helper converts any such object back to a proper JS array of length 9.
 */
function toArray(value, length) {
  if (Array.isArray(value)) return value;
  const arr = Array(length).fill(null);
  if (value && typeof value === 'object') {
    for (let i = 0; i < length; i++) {
      arr[i] = value[i] !== undefined ? value[i] : null;
    }
  }
  return arr;
}

/**
 * Normalise a game state that may have come back from Firebase
 * (arrays turned into objects).
 */
export function normalizeState(gs) {
  if (!gs) return gs;
  return {
    ...gs,
    board: toArray(gs.board, 9),
    playerOrder: toArray(gs.playerOrder, 2),
    winLine: gs.winLine ? toArray(gs.winLine, 3) : null,
  };
}

/**
 * Check all 8 win lines.
 * Returns { winner: uid | null, winLine: number[] | null }
 */
export function checkWinner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const va = board[a];
    if (va && va === board[b] && va === board[c]) {
      return { winner: va, winLine: line };
    }
  }
  return { winner: null, winLine: null };
}

/**
 * Create the initial game state for 2 players.
 * players: [{ uid, name, avatarId }, ...]
 */
export function createInitialTTTState(players) {
  return {
    board: Array(9).fill(null),
    playerOrder: [players[0].uid, players[1].uid],
    currentPlayerIndex: 0,
    winner: null,
    draw: false,
    winLine: null,
    phase: 'play',   // 'play' | 'finished'
    lastMove: null,
  };
}

/**
 * Place a mark for `uid` on `cellIndex`.
 * Always normalises the state first (safe for Firebase round-trips).
 * Returns a new state object (immutable).
 */
export function makeMove(rawState, uid, cellIndex) {
  const gameState = normalizeState(rawState);
  const { board, playerOrder, currentPlayerIndex } = gameState;

  // Guards
  if (gameState.phase === 'finished') return gameState;
  if (board[cellIndex] !== null) return gameState;
  if (playerOrder[currentPlayerIndex] !== uid) return gameState;

  const newBoard = [...board];
  newBoard[cellIndex] = uid;

  const { winner, winLine } = checkWinner(newBoard);
  const isDraw = !winner && newBoard.every((cell) => cell !== null);

  const nextIndex = (winner || isDraw)
    ? currentPlayerIndex
    : (currentPlayerIndex + 1) % playerOrder.length;

  return {
    ...gameState,
    board: newBoard,
    lastMove: cellIndex,
    winner: winner || null,
    draw: isDraw,
    winLine: winLine || null,
    currentPlayerIndex: nextIndex,
    phase: (winner || isDraw) ? 'finished' : 'play',
  };
}
