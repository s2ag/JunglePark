// Room Service — Firebase Realtime Database
// Manages game rooms for multiplayer

import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  remove,
  push,
  serverTimestamp,
} from 'firebase/database';
import { rtdb } from '../config/firebase';

// Generate a random 6-character room code
export const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Create a new room
export const createRoom = async (hostUser, gameType, maxPlayers) => {
  const code = generateRoomCode();
  const roomRef = ref(rtdb, `rooms/${code}`);

  const roomData = {
    code,
    gameType,       // 'ludo' | 'snl'
    maxPlayers,     // 2 | 3 | 4
    status: 'waiting',  // waiting | playing | finished
    hostId: hostUser.uid,
    createdAt: Date.now(),
    players: {
      [hostUser.uid]: {
        uid: hostUser.uid,
        name: hostUser.name,
        avatarId: hostUser.avatarId,
        isHost: true,
        playerIndex: 1,
        isReady: false,
        isConnected: true,
      }
    },
    gameState: null,
  };

  await set(roomRef, roomData);
  return code;
};

// Join an existing room
export const joinRoom = async (code, user) => {
  const roomRef = ref(rtdb, `rooms/${code}`);
  const snap = await get(roomRef);

  if (!snap.exists()) throw new Error('Room not found. Check the code and try again.');

  const room = snap.val();
  if (room.status !== 'waiting') throw new Error('This game has already started.');

  const playerCount = Object.keys(room.players).length;
  if (playerCount >= room.maxPlayers) throw new Error('Room is full!');

  if (room.players[user.uid]) {
    // Already in room, just reconnect
    await update(ref(rtdb, `rooms/${code}/players/${user.uid}`), { isConnected: true });
    return room;
  }

  const playerIndex = playerCount + 1;
  await update(ref(rtdb, `rooms/${code}/players/${user.uid}`), {
    uid: user.uid,
    name: user.name,
    avatarId: user.avatarId,
    isHost: false,
    playerIndex,
    isReady: false,
    isConnected: true,
  });

  return snap.val();
};

// Start the game (host only)
export const startGame = async (code, initialGameState) => {
  await update(ref(rtdb, `rooms/${code}`), {
    status: 'playing',
    gameState: initialGameState,
    startedAt: Date.now(),
  });
};

// Update game state
export const updateGameState = async (code, gameState) => {
  await update(ref(rtdb, `rooms/${code}/gameState`), gameState);
};

// Listen to room changes (real-time)
export const listenToRoom = (code, callback) => {
  const roomRef = ref(rtdb, `rooms/${code}`);
  onValue(roomRef, (snap) => callback(snap.val()));
  return () => off(roomRef);
};

// Leave a room
export const leaveRoom = async (code, uid) => {
  await remove(ref(rtdb, `rooms/${code}/players/${uid}`));
};

// Send a chat/emoji reaction
export const sendReaction = async (code, uid, emoji) => {
  const reactRef = ref(rtdb, `rooms/${code}/reactions`);
  await push(reactRef, { uid, emoji, at: Date.now() });
};

// Mark game finished
export const finishGame = async (code, winnerId) => {
  await update(ref(rtdb, `rooms/${code}`), {
    status: 'finished',
    winnerId,
    finishedAt: Date.now(),
  });
};
