import { Platform, Vibration } from 'react-native';

const TAP_MS = 12;
const SUCCESS_PATTERN = [0, 20, 30, 25];

export function tapFeedback() {
  if (Platform.OS !== 'android') return;
  Vibration.vibrate(TAP_MS);
}

export function successFeedback() {
  if (Platform.OS !== 'android') return;
  Vibration.vibrate(SUCCESS_PATTERN);
}
