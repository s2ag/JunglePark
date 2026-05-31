// LudoBoard — Premium SVG-based Ludo board with 60fps native-driver token animations
import React, { useState, useMemo, useEffect, memo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, {
  Rect, Circle, Text as SvgText, G, Polygon, Defs,
  LinearGradient, Stop, RadialGradient
} from 'react-native-svg';
import { PLAYER_COLORS } from '../../config/theme';
import { getBoardSquare } from '../../game/ludo/LudoEngine';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 32, 380);
const CELL = BOARD_SIZE / 15;
const S = CELL;

/**
 * Generate SVG polygon points string for a 5-pointed star.
 * cx, cy = center; R = outer radius; r = inner radius
 */
function starPoints(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    // Start pointing up: offset by -90 deg
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const PLAYER_ZONES = {
  1: { row: 0, col: 0, color: PLAYER_COLORS[1].primary, light: '#FFD0D5' },
  2: { row: 0, col: 9, color: PLAYER_COLORS[2].primary, light: '#D0D5FF' },
  3: { row: 9, col: 9, color: PLAYER_COLORS[3].primary, light: '#D0FFE0' },
  4: { row: 9, col: 0, color: PLAYER_COLORS[4].primary, light: '#FFECD0' },
};

const GRID_PATH = [
  { row: 6, col: 0 },
  { row: 6, col: 1 },
  { row: 6, col: 2 },
  { row: 6, col: 3 },
  { row: 6, col: 4 },
  { row: 6, col: 5 },
  { row: 5, col: 6 },
  { row: 4, col: 6 },
  { row: 3, col: 6 },
  { row: 2, col: 6 },
  { row: 1, col: 6 },
  { row: 0, col: 6 },
  { row: 0, col: 7 },
  { row: 0, col: 8 },
  { row: 1, col: 8 },
  { row: 2, col: 8 },
  { row: 3, col: 8 },
  { row: 4, col: 8 },
  { row: 5, col: 8 },
  { row: 6, col: 9 },
  { row: 6, col: 10 },
  { row: 6, col: 11 },
  { row: 6, col: 12 },
  { row: 6, col: 13 },
  { row: 6, col: 14 },
  { row: 7, col: 14 },
  { row: 8, col: 14 },
  { row: 8, col: 13 },
  { row: 8, col: 12 },
  { row: 8, col: 11 },
  { row: 8, col: 10 },
  { row: 8, col: 9 },
  { row: 9, col: 8 },
  { row: 10, col: 8 },
  { row: 11, col: 8 },
  { row: 12, col: 8 },
  { row: 13, col: 8 },
  { row: 14, col: 8 },
  { row: 14, col: 7 },
  { row: 14, col: 6 },
  { row: 13, col: 6 },
  { row: 12, col: 6 },
  { row: 11, col: 6 },
  { row: 10, col: 6 },
  { row: 9, col: 6 },
  { row: 8, col: 5 },
  { row: 8, col: 4 },
  { row: 8, col: 3 },
  { row: 8, col: 2 },
  { row: 8, col: 1 },
  { row: 8, col: 0 },
  { row: 7, col: 0 },
];

const getTokenCoords = (playerIndex, tokenId, position) => {
  if (position === -1) {
    const zone = PLAYER_ZONES[playerIndex];
    const yardOffsets = [
      { col: 1.75, row: 1.75 },
      { col: 3.75, row: 1.75 },
      { col: 1.75, row: 3.75 },
      { col: 3.75, row: 3.75 },
    ];
    const offset = yardOffsets[tokenId];
    return { x: (zone.col + offset.col) * S, y: (zone.row + offset.row) * S };
  }

  if (position === 56) {
    const centers = {
      1: { x: 7 * S, y: 7.5 * S },
      2: { x: 7.5 * S, y: 7 * S },
      3: { x: 8 * S, y: 7.5 * S },
      4: { x: 7.5 * S, y: 8 * S },
    };
    return centers[playerIndex];
  }

  if (position >= 51 && position <= 55) {
    const progress = position - 50;
    let row, col;
    if (playerIndex === 1) { row = 7; col = progress; }
    else if (playerIndex === 2) { row = progress; col = 7; }
    else if (playerIndex === 3) { row = 7; col = 14 - progress; }
    else { row = 14 - progress; col = 7; }
    return { x: col * S + S / 2, y: row * S + S / 2 };
  }

  const boardSquare = getBoardSquare(playerIndex, position);
  const cell = GRID_PATH[boardSquare === 52 ? 0 : boardSquare];
  return { x: cell.col * S + S / 2, y: cell.row * S + S / 2 };
};

// Animated token — uses native driver (translateX/Y + scale) for 60fps on Android
const AnimatedToken = memo(function AnimatedToken({ item, onPress }) {
  // Use translateX/Y so we can enable useNativeDriver: true
  const [translateX] = useState(() => new Animated.Value(item.x));
  const [translateY] = useState(() => new Animated.Value(item.y));
  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  const glowOpacity = useMemo(() => new Animated.Value(0), []);

  // Animate to new position (spring with native driver)
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: item.x,
        useNativeDriver: true,
        tension: 140,
        friction: 12,
      }),
      Animated.spring(translateY, {
        toValue: item.y,
        useNativeDriver: true,
        tension: 140,
        friction: 12,
      }),
    ]).start();
  }, [item.x, item.y, translateX, translateY]);

  // Pulse loop for movable tokens (scale + glow, native driver)
  useEffect(() => {
    let loop;
    if (item.isMovable) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.3,
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.7,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      loop.start();
    } else {
      scaleAnim.setValue(1);
      glowOpacity.setValue(0);
    }
    return () => loop && loop.stop();
  }, [glowOpacity, item.isMovable, scaleAnim]);

  const tokenR = S * 0.38;
  const color = PLAYER_COLORS[item.playerIndex].primary;
  const lightColor = PLAYER_COLORS[item.playerIndex].light;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: tokenR * 2,
        height: tokenR * 2,
        transform: [
          { translateX: Animated.subtract(translateX, tokenR) },
          { translateY: Animated.subtract(translateY, tokenR) },
        ],
      }}
    >
      {/* Glow ring behind token (native driver opacity) */}
      <Animated.View
        style={[
          styles.tokenGlow,
          {
            width: tokenR * 2.6,
            height: tokenR * 2.6,
            borderRadius: tokenR * 1.3,
            backgroundColor: color,
            left: -(tokenR * 0.3),
            top: -(tokenR * 0.3),
            opacity: glowOpacity,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Svg width={tokenR * 2} height={tokenR * 2} onPress={onPress}>
          <Defs>
            <RadialGradient id={`tg-${item.playerIndex}-${item.tokenId}`} cx="40%" cy="35%" r="60%">
              <Stop offset="0" stopColor={lightColor} />
              <Stop offset="1" stopColor={color} />
            </RadialGradient>
          </Defs>
          {/* Token shadow */}
          <Circle cx={tokenR + 1} cy={tokenR + 2} r={tokenR * 0.9} fill="rgba(0,0,0,0.3)" />
          {/* Main token with gradient */}
          <Circle
            cx={tokenR}
            cy={tokenR}
            r={tokenR * 0.9}
            fill={`url(#tg-${item.playerIndex}-${item.tokenId})`}
            stroke="#fff"
            strokeWidth={2.5}
          />
          {/* Highlight shine */}
          <Circle cx={tokenR - tokenR * 0.2} cy={tokenR - tokenR * 0.25} r={tokenR * 0.25}
            fill="rgba(255,255,255,0.4)" />
          {/* Token number */}
          <SvgText
            x={tokenR}
            y={tokenR + 4}
            fontSize={11}
            fontWeight="bold"
            textAnchor="middle"
            fill="#fff"
          >
            {item.tokenId + 1}
          </SvgText>
        </Svg>
      </Animated.View>
    </Animated.View>
  );
});

export default function LudoBoard({ gameState, players, myUid, onTokenPress, movableTokenIds = [] }) {
  if (!gameState) return null;

  const boardPad = 2;

  // Build token list — use stored boardIndex for correct zone/path placement
  const tokenList = [];
  players.forEach((p, pi) => {
    // Use the engine-assigned board index (handles opposite-side 2-player layout)
    // Fall back to sequential index for states without playerBoardIndices
    const boardIndex = gameState.playerBoardIndices?.[p.uid] ?? (pi + 1);
    const tokens = gameState.tokens?.[p.uid] || [];
    tokens.forEach((token, ti) => {
      if (token.isFinished) return;
      const baseCoords = getTokenCoords(boardIndex, ti, token.position);
      tokenList.push({
        playerIndex: boardIndex,   // drives color + zone rendering
        tokenId: ti,
        uid: p.uid,
        position: token.position,
        baseX: baseCoords.x,
        baseY: baseCoords.y,
        token,
      });
    });
  });

  // Offset overlapping tokens
  const groups = {};
  tokenList.forEach((item) => {
    const key = `${Math.round(item.baseX)},${Math.round(item.baseY)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const renderedTokens = [];
  Object.values(groups).forEach((group) => {
    const count = group.length;
    group.forEach((item, idx) => {
      let dx = 0, dy = 0;
      if (count > 1 && item.position !== -1) {
        const angle = (idx / count) * 2 * Math.PI;
        const radius = S * 0.28;
        dx = Math.cos(angle) * radius;
        dy = Math.sin(angle) * radius;
      }
      renderedTokens.push({
        ...item,
        x: item.baseX + dx,
        y: item.baseY + dy,
        isMovable: item.uid === myUid && movableTokenIds.includes(item.tokenId),
      });
    });
  });

  return (
    <View style={styles.container}>
      {/* Static SVG board — premium art */}
      <Svg width={BOARD_SIZE} height={BOARD_SIZE}>
        <Defs>
          <LinearGradient id="boardGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1a1a2e" />
            <Stop offset="0.5" stopColor="#16213e" />
            <Stop offset="1" stopColor="#0f0e17" />
          </LinearGradient>
          <LinearGradient id="boardEdge" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFD700" stopOpacity="0.6" />
            <Stop offset="0.5" stopColor="#FF6B35" stopOpacity="0.4" />
            <Stop offset="1" stopColor="#FFD700" stopOpacity="0.6" />
          </LinearGradient>
          <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFD700" stopOpacity="0.15" />
            <Stop offset="1" stopColor="#FFD700" stopOpacity="0" />
          </RadialGradient>
          {/* Zone gradients for premium look */}
          {Object.entries(PLAYER_ZONES).map(([pid, zone]) => (
            <LinearGradient key={`zg-${pid}`} id={`zoneGrad${pid}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={zone.color} stopOpacity="0.95" />
              <Stop offset="1" stopColor={zone.color} stopOpacity="0.7" />
            </LinearGradient>
          ))}
        </Defs>

        {/* Board background with depth */}
        <Rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill="url(#boardGrad)" rx={14} />
        {/* Center ambient glow */}
        <Circle cx={BOARD_SIZE / 2} cy={BOARD_SIZE / 2} r={BOARD_SIZE * 0.3} fill="url(#centerGlow)" />
        {/* Decorative border — double-line gold */}
        <Rect x={boardPad} y={boardPad} width={BOARD_SIZE - boardPad * 2} height={BOARD_SIZE - boardPad * 2}
          fill="none" stroke="url(#boardEdge)" strokeWidth={2} rx={12} />
        <Rect x={boardPad + 4} y={boardPad + 4} width={BOARD_SIZE - boardPad * 2 - 8} height={BOARD_SIZE - boardPad * 2 - 8}
          fill="none" stroke="rgba(255,215,0,0.12)" strokeWidth={1} rx={10} />

        {/* Home zones — premium gradient fill */}
        {Object.entries(PLAYER_ZONES).map(([pid, zone]) => (
          <G key={pid}>
            <Rect
              x={zone.col * S + boardPad} y={zone.row * S + boardPad}
              width={S * 6 - boardPad} height={S * 6 - boardPad}
              fill={`url(#zoneGrad${pid})`} rx={10}
            />
            {/* Inner yard — frosted glass effect */}
            <Rect
              x={zone.col * S + S + boardPad} y={zone.row * S + S + boardPad}
              width={S * 4 - boardPad} height={S * 4 - boardPad}
              fill="rgba(255,255,255,0.88)" rx={8}
              stroke="rgba(255,255,255,0.4)" strokeWidth={1}
            />
            {/* Token home circles with soft shadow */}
            {[
              [zone.col + 1.75, zone.row + 1.75],
              [zone.col + 3.75, zone.row + 1.75],
              [zone.col + 1.75, zone.row + 3.75],
              [zone.col + 3.75, zone.row + 3.75],
            ].map(([cx, cy], i) => (
              <G key={i}>
                <Circle cx={cx * S + 1} cy={cy * S + 2} r={S * 0.6}
                  fill="rgba(0,0,0,0.15)" />
                <Circle cx={cx * S} cy={cy * S} r={S * 0.65}
                  fill={zone.color} opacity={0.35} stroke={zone.color} strokeWidth={2.5} />
              </G>
            ))}
          </G>
        ))}

        {/* Center winning triangles with enhanced colors */}
        <G>
          <Polygon points={`${6.5 * S},${6.5 * S} ${8.5 * S},${6.5 * S} ${7.5 * S},${7.5 * S}`}
            fill={PLAYER_COLORS[1].primary} opacity={0.92} />
          <Polygon points={`${8.5 * S},${6.5 * S} ${8.5 * S},${8.5 * S} ${7.5 * S},${7.5 * S}`}
            fill={PLAYER_COLORS[2].primary} opacity={0.92} />
          <Polygon points={`${6.5 * S},${8.5 * S} ${8.5 * S},${8.5 * S} ${7.5 * S},${7.5 * S}`}
            fill={PLAYER_COLORS[3].primary} opacity={0.92} />
          <Polygon points={`${6.5 * S},${6.5 * S} ${6.5 * S},${8.5 * S} ${7.5 * S},${7.5 * S}`}
            fill={PLAYER_COLORS[4].primary} opacity={0.92} />
          {/* Center star — larger, brighter */}
          <Polygon
            points={starPoints(7.5 * S, 7.5 * S, S * 0.5, S * 0.2)}
            fill="#FFD700"
            opacity={1}
          />
          <Circle cx={7.5 * S} cy={7.5 * S} r={S * 0.18} fill="#FFF5D6" opacity={0.8} />
        </G>

        {/* Path grid cells — subtle with rounded edges */}
        {GRID_PATH.map((cell, idx) => {
          const cellNum = idx === 0 ? 52 : idx;
          const isRedStart = cellNum === 1;
          const isBlueStart = cellNum === 14;
          const isGreenStart = cellNum === 27;
          const isYellowStart = cellNum === 40;
          const isStart = isRedStart || isBlueStart || isGreenStart || isYellowStart;

          let fill = 'rgba(255,255,255,0.04)';
          if (isRedStart) fill = PLAYER_COLORS[1].primary;
          else if (isBlueStart) fill = PLAYER_COLORS[2].primary;
          else if (isGreenStart) fill = PLAYER_COLORS[3].primary;
          else if (isYellowStart) fill = PLAYER_COLORS[4].primary;

          return (
            <Rect key={`path-${idx}`}
              x={cell.col * S + 0.5} y={cell.row * S + 0.5} width={S - 1} height={S - 1}
              fill={fill}
              opacity={isStart ? 0.9 : 1}
              stroke={isStart ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={isStart ? 1.5 : 0.5}
              rx={2}
            />
          );
        })}

        {/* Home stretches — gradient opacity toward center */}
        {Array.from({ length: 5 }).map((_, step) => {
          const opacity = 0.6 + (step * 0.06);
          return (
            <G key={`homestretch-${step}`}>
              <Rect x={(step + 1) * S + 0.5} y={7 * S + 0.5} width={S - 1} height={S - 1}
                fill={PLAYER_COLORS[1].primary} opacity={opacity} rx={2}
                stroke="rgba(255,255,255,0.18)" strokeWidth={0.5} />
              <Rect x={7 * S + 0.5} y={(step + 1) * S + 0.5} width={S - 1} height={S - 1}
                fill={PLAYER_COLORS[2].primary} opacity={opacity} rx={2}
                stroke="rgba(255,255,255,0.18)" strokeWidth={0.5} />
              <Rect x={(13 - step) * S + 0.5} y={7 * S + 0.5} width={S - 1} height={S - 1}
                fill={PLAYER_COLORS[3].primary} opacity={opacity} rx={2}
                stroke="rgba(255,255,255,0.18)" strokeWidth={0.5} />
              <Rect x={7 * S + 0.5} y={(13 - step) * S + 0.5} width={S - 1} height={S - 1}
                fill={PLAYER_COLORS[4].primary} opacity={opacity} rx={2}
                stroke="rgba(255,255,255,0.18)" strokeWidth={0.5} />
            </G>
          );
        })}

        {/* Safe square star markers — premium gold with glow */}
        {[
          { row: 6, col: 1 },
          { row: 2, col: 6 },
          { row: 1, col: 8 },
          { row: 6, col: 12 },
          { row: 8, col: 13 },
          { row: 12, col: 8 },
          { row: 13, col: 6 },
          { row: 8, col: 2 },
        ].map((pos, idx) => {
          const cx = pos.col * S + S / 2;
          const cy = pos.row * S + S / 2;
          return (
            <G key={`safe-star-${idx}`}>
              <Circle cx={cx} cy={cy} r={S * 0.32} fill="rgba(255,215,0,0.12)" />
              <Polygon
                points={starPoints(cx, cy, S * 0.3, S * 0.12)}
                fill="rgba(255,215,0,0.7)"
              />
            </G>
          );
        })}
      </Svg>

      {/* Animated tokens — native driver layer */}
      <View style={[StyleSheet.absoluteFillObject, { width: BOARD_SIZE, height: BOARD_SIZE }]}
        pointerEvents="box-none">
        {renderedTokens.map((item) => (
          <AnimatedToken
            key={`t-${item.playerIndex}-${item.tokenId}`}
            item={item}
            onPress={() => onTokenPress && onTokenPress(item.tokenId)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  tokenGlow: {
    position: 'absolute',
  },
});
