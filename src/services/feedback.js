import { Platform, Vibration } from 'react-native';

// Haptic feedback patterns optimized for game events
const TAP_MS = 10;
const SUCCESS_PATTERN = [0, 30, 40, 30];
const MOVE_PATTERN = [0, 15];
const DICE_PATTERN = [0, 8, 30, 8, 30, 8, 30, 12, 50, 15];
const WIN_PATTERN = [0, 50, 60, 50, 60, 80, 100, 120];
const SNAKE_PATTERN = [0, 40, 50, 30, 40, 20];
const LADDER_PATTERN = [0, 20, 30, 20, 30, 20, 30, 40];

export function tapFeedback() {
  if (Platform.OS !== 'android') return;
  Vibration.vibrate(TAP_MS);
}

export function successFeedback() {
  if (Platform.OS !== 'android') return;
  Vibration.vibrate(SUCCESS_PATTERN);
}

export function moveFeedback() {
  if (Platform.OS !== 'android') return;
  Vibration.vibrate(MOVE_PATTERN);
}

export function diceRollFeedback() {
  if (Platform.OS !== 'android') return;
  Vibration.vibrate(DICE_PATTERN);
}

export function winFeedback() {
  if (Platform.OS !== 'android') return;
  Vibration.vibrate(WIN_PATTERN);
}

export function snakeFeedback() {
  if (Platform.OS !== 'android') return;
  Vibration.vibrate(SNAKE_PATTERN);
}

export function ladderFeedback() {
  if (Platform.OS !== 'android') return;
  Vibration.vibrate(LADDER_PATTERN);
}
