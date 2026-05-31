// LudoBoard — SVG-based Ludo board with animated token movement
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, {
  Rect, Circle, Text as SvgText, G, Polygon, Defs, LinearGradient, Stop
} from 'react-native-svg';
import { PLAYER_COLORS, COLORS } from '../../config/theme';
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

// Animated token that smoothly slides to new positions
function AnimatedToken({ item, onPress }) {
  const animX = useRef(new Animated.Value(item.x)).current;
  const animY = useRef(new Animated.Value(item.y)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate to new position whenever x/y changes
  useEffect(() => {
    Animated.parallel([
      Animated.spring(animX, {
        toValue: item.x,
        useNativeDriver: false,
        tension: 120,
        friction: 10,
      }),
      Animated.spring(animY, {
        toValue: item.y,
        useNativeDriver: false,
        tension: 120,
        friction: 10,
      }),
    ]).start();
  }, [item.x, item.y]);

  // Pulse loop for movable tokens
  useEffect(() => {
    let pulseLoop;
    if (item.isMovable) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.35, duration: 450, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 450, useNativeDriver: false }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => pulseLoop && pulseLoop.stop();
  }, [item.isMovable]);

  const tokenR = S * 0.35;
  const pulseR = animX.constructor === Animated.Value
    ? pulseAnim.interpolate({ inputRange: [1, 1.35], outputRange: [S * 0.44, S * 0.59] })
    : S * 0.44;

  const color = PLAYER_COLORS[item.playerIndex].primary;

  // We render using plain SVG elements driven by JS-animated values via a wrapper
  // Since react-native-svg doesn't support Animated.Value directly on cx/cy,
  // we use an Animated.View absolutely positioned over the SVG layer.
  return (
    <Animated.View
      style={{
        position: 'absolute',
        // Centre the token circle on the animated coords
        left: Animated.subtract(animX, tokenR),
        top: Animated.subtract(animY, tokenR),
        width: tokenR * 2,
        height: tokenR * 2,
      }}
    >
      <Svg width={tokenR * 2} height={tokenR * 2} onPress={onPress}>
        {/* Pulse ring */}
        {item.isMovable && (
          <Circle
            cx={tokenR}
            cy={tokenR}
            r={tokenR * 1.25}
            fill={color}
            opacity={0.35}
          />
        )}
        {/* Main token */}
        <Circle cx={tokenR} cy={tokenR} r={tokenR} fill={color} stroke="#fff" strokeWidth={2} />
        {/* Token number */}
        <SvgText
          x={tokenR}
          y={tokenR + 3.5}
          fontSize={10}
          fontWeight="bold"
          textAnchor="middle"
          fill="#fff"
        >
          {item.tokenId + 1}
        </SvgText>
      </Svg>
    </Animated.View>
  );
}

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
      {/* Static SVG board */}
      <Svg width={BOARD_SIZE} height={BOARD_SIZE}>
        <Defs>
          <LinearGradient id="boardGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1a1a2e" />
            <Stop offset="1" stopColor="#16213e" />
          </LinearGradient>
        </Defs>

        {/* Board background */}
        <Rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill="url(#boardGrad)" rx={12} />
        <Rect x={boardPad} y={boardPad} width={BOARD_SIZE - boardPad * 2} height={BOARD_SIZE - boardPad * 2}
          fill="none" stroke={COLORS.accent} strokeWidth={1.5} rx={10} />

        {/* Home zones */}
        {Object.entries(PLAYER_ZONES).map(([pid, zone]) => (
          <G key={pid}>
            <Rect
              x={zone.col * S + boardPad} y={zone.row * S + boardPad}
              width={S * 6 - boardPad} height={S * 6 - boardPad}
              fill={zone.color} opacity={0.85} rx={8}
            />
            <Rect
              x={zone.col * S + S + boardPad} y={zone.row * S + S + boardPad}
              width={S * 4 - boardPad} height={S * 4 - boardPad}
              fill="rgba(255,255,255,0.92)" rx={6}
            />
            {[
              [zone.col + 1.75, zone.row + 1.75],
              [zone.col + 3.75, zone.row + 1.75],
              [zone.col + 1.75, zone.row + 3.75],
              [zone.col + 3.75, zone.row + 3.75],
            ].map(([cx, cy], i) => (
              <Circle key={i} cx={cx * S} cy={cy * S} r={S * 0.65}
                fill={zone.color} opacity={0.4} stroke={zone.color} strokeWidth={2} />
            ))}
          </G>
        ))}

        {/* Center winning triangles */}
        <G>
          <Polygon points={`${6.5 * S},${6.5 * S} ${8.5 * S},${6.5 * S} ${7.5 * S},${7.5 * S}`}
            fill={PLAYER_COLORS[1].primary} opacity={0.9} />
          <Polygon points={`${8.5 * S},${6.5 * S} ${8.5 * S},${8.5 * S} ${7.5 * S},${7.5 * S}`}
            fill={PLAYER_COLORS[2].primary} opacity={0.9} />
          <Polygon points={`${6.5 * S},${8.5 * S} ${8.5 * S},${8.5 * S} ${7.5 * S},${7.5 * S}`}
            fill={PLAYER_COLORS[3].primary} opacity={0.9} />
          <Polygon points={`${6.5 * S},${6.5 * S} ${6.5 * S},${8.5 * S} ${7.5 * S},${7.5 * S}`}
            fill={PLAYER_COLORS[4].primary} opacity={0.9} />
          {/* Center SVG star */}
          <Polygon
            points={starPoints(7.5 * S, 7.5 * S, S * 0.42, S * 0.17)}
            fill="#FFD700"
            opacity={0.95}
          />
        </G>

        {/* Path grid cells */}
        {GRID_PATH.map((cell, idx) => {
          const cellNum = idx === 0 ? 52 : idx;
          // Only start squares get player color; all other path cells are plain
          const isRedStart = cellNum === 1;
          const isBlueStart = cellNum === 14;
          const isGreenStart = cellNum === 27;
          const isYellowStart = cellNum === 40;
          const isStart = isRedStart || isBlueStart || isGreenStart || isYellowStart;

          let fill = 'rgba(255,255,255,0.03)';
          if (isRedStart) fill = PLAYER_COLORS[1].primary;
          else if (isBlueStart) fill = PLAYER_COLORS[2].primary;
          else if (isGreenStart) fill = PLAYER_COLORS[3].primary;
          else if (isYellowStart) fill = PLAYER_COLORS[4].primary;

          return (
            <Rect key={`path-${idx}`}
              x={cell.col * S} y={cell.row * S} width={S} height={S}
              fill={fill}
              opacity={isStart ? 0.88 : 1}
              stroke={isStart ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={isStart ? 1.2 : 0.5}
            />
          );
        })}

        {/* Home stretches */}
        {Array.from({ length: 5 }).map((_, step) => (
          <G key={`homestretch-${step}`}>
            <Rect x={(step + 1) * S} y={7 * S} width={S} height={S} fill={PLAYER_COLORS[1].primary} opacity={0.8} stroke="rgba(255,255,255,0.15)" />
            <Rect x={7 * S} y={(step + 1) * S} width={S} height={S} fill={PLAYER_COLORS[2].primary} opacity={0.8} stroke="rgba(255,255,255,0.15)" />
            <Rect x={(13 - step) * S} y={7 * S} width={S} height={S} fill={PLAYER_COLORS[3].primary} opacity={0.8} stroke="rgba(255,255,255,0.15)" />
            <Rect x={7 * S} y={(13 - step) * S} width={S} height={S} fill={PLAYER_COLORS[4].primary} opacity={0.8} stroke="rgba(255,255,255,0.15)" />
          </G>
        ))}

        {/* Safe square star markers — matches LUDO_SAFE_SQUARES [1,9,14,22,27,35,40,48] */}
        {[
          { row: 6, col: 1 },  // idx=1  Red start
          { row: 2, col: 6 },  // idx=9  safe
          { row: 1, col: 8 },  // idx=14 Blue start
          { row: 6, col: 12 },  // idx=22 safe
          { row: 8, col: 13 },  // idx=27 Green start
          { row: 12, col: 8 },  // idx=35 safe
          { row: 13, col: 6 },  // idx=40 Yellow start
          { row: 8, col: 2 },  // idx=48 safe
        ].map((pos, idx) => {
          const cx = pos.col * S + S / 2;
          const cy = pos.row * S + S / 2;
          return (
            <Polygon
              key={`safe-star-${idx}`}
              points={starPoints(cx, cy, S * 0.28, S * 0.11)}
              fill="rgba(255,215,0,0.55)"
            />
          );
        })}
      </Svg>

      {/* Animated tokens rendered as Animated.View layer on top of SVG */}
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
});
