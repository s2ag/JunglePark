// Snake & Ladders Game Engine — Full Rules

// Classic Snake & Ladders positions
// Key = head of snake / bottom of ladder, Value = tail / top
export const SNAKES = {
  99: 7,
  95: 13,
  87: 24,
  73: 16,
  63: 42,
  54: 34,
  17: 7,
};

export const LADDERS = {
  4: 56,
  12: 50,
  14: 55,
  22: 58,
  41: 79,
  44: 76,
  65: 84,
};

export const createInitialSnLState = (players) => {
  const positions = {};
  players.forEach((p) => { positions[p.uid] = 0; }); // 0 = start (before square 1)

  return {
    positions,
    currentPlayerIndex: 0,
    playerOrder: players.map((p) => p.uid),
    diceValue: null,
    diceRolled: false,
    phase: 'roll',        // 'roll' | 'move' | 'finished'
    winner: null,
    lastEvent: null,      // { type: 'snake'|'ladder'|'normal', from, to }
  };
};

export const rollDiceSnL = () => Math.floor(Math.random() * 6) + 1;

export const movePlayer = (state, uid, diceValue) => {
  const newState = JSON.parse(JSON.stringify(state));
  const currentPos = newState.positions[uid];
  let newPos = currentPos + diceValue;

  let event = { type: 'normal', from: currentPos, to: newPos };

  // Overshoot — bounce back (exact 100 needed to win)
  if (newPos > 100) {
    newPos = currentPos; // stay in place
    event = { type: 'bounce', from: currentPos, to: currentPos };
  } else if (newPos === 100) {
    // Winner!
    newState.positions[uid] = 100;
    newState.phase = 'finished';
    newState.winner = uid;
    newState.lastEvent = { type: 'win', from: currentPos, to: 100 };
    return newState;
  } else if (SNAKES[newPos]) {
    // Hit a snake!
    event = { type: 'snake', from: newPos, to: SNAKES[newPos] };
    newPos = SNAKES[newPos];
  } else if (LADDERS[newPos]) {
    // Hit a ladder!
    event = { type: 'ladder', from: newPos, to: LADDERS[newPos] };
    newPos = LADDERS[newPos];
  }

  newState.positions[uid] = newPos;
  newState.lastEvent = event;

  // Roll again on 6
  if (diceValue === 6) {
    newState.diceRolled = false;
    newState.diceValue = null;
    newState.phase = 'roll';
  } else {
    newState.currentPlayerIndex =
      (newState.currentPlayerIndex + 1) % newState.playerOrder.length;
    newState.diceRolled = false;
    newState.diceValue = null;
    newState.phase = 'roll';
  }

  return newState;
};

// Convert square number (1-100) to row/col on 10x10 board
export const squareToGrid = (square) => {
  if (square === 0) return { row: 9, col: -1 }; // off board
  const row = Math.floor((square - 1) / 10);
  const col = (square - 1) % 10;
  // Odd rows go right-to-left (serpentine board)
  const isReversed = row % 2 === 1;
  return {
    row: 9 - row,
    col: isReversed ? 9 - col : col,
  };
};
