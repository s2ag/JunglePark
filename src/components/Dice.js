// Animated 2D Dice Component — step-by-step tumbling roll
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../config/theme';
import { tapFeedback } from '../services/feedback';

const { width: SCREEN_W } = Dimensions.get('window');

const DICE_SIZE = Math.min(64, SCREEN_W * 0.15);

// Pip layout positions for each face 1–6
// Each entry is an array of [row, col] on a 3×3 grid (0-indexed)
const PIP_LAYOUTS = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DiceFace({ value, size }) {
  const pips = value ? PIP_LAYOUTS[value] : [];
  const pipSize = size * 0.17;
  const cellSize = size / 3;
  const radius = size * 0.18;

  return (
    <View style={[styles.diceFace, { width: size, height: size, borderRadius: radius }]}>
      <View style={styles.faceHighlight} />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const active = pips.some(([r, c]) => r === row && c === col);
          return (
            <View
              key={`${row}-${col}`}
              style={[styles.pipCell, {
                width: cellSize, height: cellSize,
                top: row * cellSize, left: col * cellSize,
              }]}
            >
              {active && (
                <View style={[styles.pip, { width: pipSize, height: pipSize, borderRadius: pipSize / 2 }]} />
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

export default function Dice({ value, onRoll, disabled, isMyTurn }) {
  // Persist the last real value so dice never goes blank
  const lastValueRef = useRef(null);
  if (value) lastValueRef.current = value;

  // cycleValue: the face shown during the step animation
  const [cycleValue, setCycleValue] = useState(null);
  const timersRef = useRef([]);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // When the real value arrives from parent after onRoll, stop cycling
  useEffect(() => {
    if (value) {
      clearTimers();
      setCycleValue(null);
    }
  }, [value]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const shake = () => {
    if (disabled || !isMyTurn) return;
    tapFeedback();
    clearTimers();

    // Step delays in ms — fast start, decelerates to a stop (like a real tumbling die)
    const stepDelays = [55, 55, 65, 75, 90, 110, 135, 165, 200, 250];
    let elapsed = 0;

    stepDelays.forEach((delay) => {
      const t = setTimeout(() => {
        setCycleValue(Math.ceil(Math.random() * 6));
      }, elapsed);
      timersRef.current.push(t);
      elapsed += delay;
    });

    // After all steps finish, fire the actual roll
    const finalT = setTimeout(() => {
      onRoll && onRoll();
    }, elapsed);
    timersRef.current.push(finalT);

    // Shake animation: multiple bounces during the roll
    Animated.sequence([
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 12,  duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -12, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 9,   duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -9,  duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6,   duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6,  duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 3,   duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0,   duration: 45, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.28, duration: 140, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.92, duration: 110, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 90,  useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1,    duration: 80,  useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  };

  // Show cycling face during animation, fall back to last real value
  const displayValue = cycleValue ?? lastValueRef.current;

  return (
    <TouchableOpacity onPress={shake} disabled={disabled || !isMyTurn} activeOpacity={0.85}>
      <Animated.View
        style={{
          transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
          opacity: isMyTurn ? 1 : 0.5,
          ...SHADOWS.lg,
          alignSelf: 'center',
        }}
      >
        <DiceFace value={displayValue} size={DICE_SIZE} />
        {!isMyTurn && (
          <View style={[styles.lockOverlay, { borderRadius: DICE_SIZE * 0.18 }]}>
            <View style={styles.lockDot} />
          </View>
        )}
      </Animated.View>

      <Text style={styles.label}>
        {isMyTurn ? (disabled ? 'Moving...' : 'Tap to Roll!') : "Opponent's turn"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  diceFace: {
    backgroundColor: '#FFF5D6',
    borderWidth: 2.5,
    borderColor: '#F0B94D',
    position: 'relative',
    overflow: 'hidden',
  },
  faceHighlight: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  pipCell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pip: {
    backgroundColor: '#1A1A2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: SIZES.fontXs,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Nunito_600SemiBold',
  },
});
