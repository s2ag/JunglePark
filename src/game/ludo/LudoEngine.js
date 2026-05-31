// Ludo Game Engine — Full Rules Implementation

export const LUDO_TOKENS_PER_PLAYER = 4;
export const LUDO_BOARD_SIZE = 52; // total path squares

// Starting positions for each player (index on the main path)
export const LUDO_START_POSITIONS = { 1: 1, 2: 14, 3: 27, 4: 40 };

// Safe squares on the main path (index)
export const LUDO_SAFE_SQUARES = [1, 9, 14, 22, 27, 35, 40, 48];

export const createInitialLudoState = (players) => {
  const tokens = {};
  players.forEach((p) => {
    tokens[p.uid] = [
      { id: 0, position: -1, isFinished: false },
      { id: 1, position: -1, isFinished: false },
      { id: 2, position: -1, isFinished: false },
      { id: 3, position: -1, isFinished: false },
    ];
  });

  // Assign board zone indices so players are placed on OPPOSITE sides.
  // Zone layout:  1=Red(top-left)  2=Blue(top-right)
  //               4=Yellow(bot-left) 3=Green(bot-right)
  //
  //   2-player  →  1 & 3  (diagonal: top-left vs bottom-right)
  //   3-player  →  1, 2 & 4
  //   4-player  →  1, 2, 3 & 4
  const ZONE_MAPS = {
    2: [1, 3],
    3: [1, 2, 4],
    4: [1, 2, 3, 4],
  };
  const zoneAssignment = ZONE_MAPS[players.length] || ZONE_MAPS[4];
  const playerBoardIndices = {};
  players.forEach((p, idx) => {
    playerBoardIndices[p.uid] = zoneAssignment[idx];
  });

  return {
    tokens,
    playerBoardIndices,          // { uid: boardIndex (1-4) }
    currentPlayerIndex: 0,
    playerOrder: players.map((p) => p.uid),
    diceValue: null,
    diceRolled: false,
    phase: 'roll',
    winner: null,
    sixCount: 0,
  };
};

// Roll dice (returns 1-6)
export const rollDice = () => Math.floor(Math.random() * 6) + 1;

// Get the actual board cell index (1..52) for a given player and progress (0..50)
export const getBoardSquare = (playerIndex, progress) => {
  const startPos = LUDO_START_POSITIONS[playerIndex];
  return (startPos + progress - 1) % 52 + 1;
};

// Check if a token can move
export const canTokenMove = (token, diceValue) => {
  if (token.isFinished) return false;
  if (token.position === -1) {
    // Token is in yard — needs a 6 to come out
    return diceValue === 6;
  }
  // Check if moving would overshoot home (56 is home)
  const newPos = token.position + diceValue;
  if (newPos > 56) return false; // overshoot
  return true;
};

// Get movable tokens for current player
export const getMovableTokens = (state, uid, diceValue) => {
  const tokens = state.tokens[uid];
  return tokens.filter((t) => canTokenMove(t, diceValue));
};

// Move a token
export const moveToken = (state, uid, tokenId, diceValue) => {
  const newState = JSON.parse(JSON.stringify(state)); // deep clone
  const token = newState.tokens[uid][tokenId];

  // Use stored board index (supports opposite-side placement for 2-player)
  // Fall back gracefully for older states without playerBoardIndices.
  const boardIndex = newState.playerBoardIndices?.[uid]
    ?? (newState.playerOrder.indexOf(uid) + 1);

  if (token.position === -1 && diceValue === 6) {
    token.position = 0;
  } else {
    token.position = token.position + diceValue;
  }

  if (token.position === 56) {
    token.isFinished = true;
  }

  // Capture check — compare board squares using each player's board index
  if (token.position >= 0 && token.position <= 50) {
    const boardSquare = getBoardSquare(boardIndex, token.position);

    if (!LUDO_SAFE_SQUARES.includes(boardSquare)) {
      Object.keys(newState.tokens).forEach((otherUid) => {
        if (otherUid === uid) return;
        const otherBoardIndex = newState.playerBoardIndices?.[otherUid]
          ?? (newState.playerOrder.indexOf(otherUid) + 1);
        newState.tokens[otherUid].forEach((otherToken) => {
          if (otherToken.position >= 0 && otherToken.position <= 50 && !otherToken.isFinished) {
            const otherBoardSquare = getBoardSquare(otherBoardIndex, otherToken.position);
            if (otherBoardSquare === boardSquare) {
              otherToken.position = -1;
              otherToken.isFinished = false;
            }
          }
        });
      });
    }
  }

  const allFinished = newState.tokens[uid].every((t) => t.isFinished);
  if (allFinished) {
    newState.phase = 'finished';
    newState.winner = uid;
    return newState;
  }

  if (diceValue === 6 && newState.sixCount < 2) {
    newState.sixCount += 1;
    newState.diceRolled = false;
    newState.diceValue = null;
    newState.phase = 'roll';
  } else {
    newState.sixCount = 0;
    newState.currentPlayerIndex =
      (newState.currentPlayerIndex + 1) % newState.playerOrder.length;
    newState.diceRolled = false;
    newState.diceValue = null;
    newState.phase = 'roll';
  }

  return newState;
};

// Skip turn if no moves available
export const skipTurn = (state) => {
  const newState = JSON.parse(JSON.stringify(state));
  newState.currentPlayerIndex =
    (newState.currentPlayerIndex + 1) % newState.playerOrder.length;
  newState.diceRolled = false;
  newState.diceValue = null;
  newState.phase = 'roll';
  newState.sixCount = 0;
  return newState;
};

