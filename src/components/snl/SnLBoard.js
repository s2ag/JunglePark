// SnLBoard — Premium SVG Snake & Ladders 10x10 Board with animated tokens
import React, { useState, useMemo, useEffect, memo } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, {
  Rect, Circle, Text as SvgText, G, Line, Path, Defs,
  LinearGradient, Stop, RadialGradient
} from 'react-native-svg';
import { PLAYER_COLORS, COLORS } from '../../config/theme';
import { squareToGrid, SNAKES, LADDERS } from '../../game/snl/SnLEngine';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 32, 380);
const CELL = BOARD_SIZE / 10;

// Get center pixel of a board square
const squareCenter = (sq) => {
  const { row, col } = squareToGrid(sq);
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
};

const SNAKE_COLORS = ['#FF4757', '#E74C3C', '#FF6B35', '#D35400', '#A855F7', '#8E44AD'];
const LADDER_COLORS = ['#2ED573', '#27AE60', '#3742FA', '#1E90FF', '#FFD700', '#FFA502'];

// Animated token with smooth position transitions
const AnimatedSnLToken = memo(function AnimatedSnLToken({ x, y, color, label, offset }) {
  const [translateX] = useState(() => new Animated.Value(x + offset.dx));
  const [translateY] = useState(() => new Animated.Value(y + offset.dy));
  const bounceScale = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    // Animate to new position with bounce
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: x + offset.dx,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.spring(translateY, {
        toValue: y + offset.dy,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
    ]).start();

    // Bounce scale on arrival
    Animated.sequence([
      Animated.timing(bounceScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(bounceScale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bounceScale, offset.dx, offset.dy, translateX, translateY, x, y]);

  const tokenR = CELL * 0.28;
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
          { scale: bounceScale },
        ],
      }}
    >
      <Svg width={tokenR * 2} height={tokenR * 2}>
        <Defs>
          <RadialGradient id={`snl-tg-${label}`} cx="40%" cy="35%" r="60%">
            <Stop offset="0" stopColor={color.light} />
            <Stop offset="1" stopColor={color.primary} />
          </RadialGradient>
        </Defs>
        <Circle cx={tokenR + 1} cy={tokenR + 2} r={tokenR * 0.85} fill="rgba(0,0,0,0.3)" />
        <Circle cx={tokenR} cy={tokenR} r={tokenR * 0.9}
          fill={`url(#snl-tg-${label})`} stroke="#fff" strokeWidth={2} />
        <Circle cx={tokenR - tokenR * 0.2} cy={tokenR - tokenR * 0.2} r={tokenR * 0.2}
          fill="rgba(255,255,255,0.35)" />
        <SvgText x={tokenR} y={tokenR + 4} fontSize={8} textAnchor="middle" fill="#fff" fontWeight="bold">
          {label}
        </SvgText>
      </Svg>
    </Animated.View>
  );
});

export default function SnLBoard({ gameState, players }) {
  return (
    <View style={styles.container}>
      <Svg width={BOARD_SIZE} height={BOARD_SIZE}>
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#134E5E" />
            <Stop offset="0.5" stopColor="#1a1a2e" />
            <Stop offset="1" stopColor="#0f3443" />
          </LinearGradient>
          <LinearGradient id="snlBorderGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#71B280" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#134E5E" stopOpacity="0.6" />
          </LinearGradient>
          <RadialGradient id="snlCenterGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#71B280" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#71B280" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Background */}
        <Rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill="url(#bg)" rx={14} />
        <Circle cx={BOARD_SIZE / 2} cy={BOARD_SIZE / 2} r={BOARD_SIZE * 0.35} fill="url(#snlCenterGlow)" />
        {/* Decorative border */}
        <Rect x={2} y={2} width={BOARD_SIZE - 4} height={BOARD_SIZE - 4}
          fill="none" stroke="url(#snlBorderGrad)" strokeWidth={2} rx={12} />

        {/* Grid cells — premium alternating with subtle depth */}
        {Array.from({ length: 100 }).map((_, i) => {
          const sq = i + 1;
          const { row, col } = squareToGrid(sq);
          const isLight = (row + col) % 2 === 0;
          return (
            <G key={sq}>
              <Rect
                x={col * CELL + 0.5} y={row * CELL + 0.5}
                width={CELL - 1} height={CELL - 1}
                fill={isLight ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)'}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.5}
                rx={2}
              />
              <SvgText
                x={col * CELL + 4}
                y={row * CELL + 12}
                fontSize={7}
                fill="rgba(255,255,255,0.3)"
                fontWeight="bold"
              >
                {sq}
              </SvgText>
            </G>
          );
        })}

        {/* START square — highlighted */}
        {(() => {
          const { row, col } = squareToGrid(1);
          return (
            <G>
              <Rect x={col * CELL + 1} y={row * CELL + 1} width={CELL - 2} height={CELL - 2}
                fill="rgba(46,213,115,0.2)" stroke={COLORS.success} strokeWidth={1.5} rx={3} />
              <SvgText x={col * CELL + CELL / 2} y={row * CELL + CELL / 2 + 3}
                fontSize={8} textAnchor="middle" fill={COLORS.success} fontWeight="bold">START</SvgText>
            </G>
          );
        })()}

        {/* FINISH square (100) — premium gold */}
        {(() => {
          const { row, col } = squareToGrid(100);
          return (
            <G>
              <Rect x={col * CELL + 1} y={row * CELL + 1} width={CELL - 2} height={CELL - 2}
                fill="rgba(255,215,0,0.2)" stroke={COLORS.accent} strokeWidth={2} rx={3} />
              <SvgText x={col * CELL + CELL / 2} y={row * CELL + CELL / 2 + 4}
                fontSize={10} textAnchor="middle" fill={COLORS.accent} fontWeight="bold">★</SvgText>
            </G>
          );
        })()}

        {/* Snakes — styled curves with head markers */}
        {Object.entries(SNAKES).map(([head, tail], i) => {
          const h = squareCenter(parseInt(head));
          const t = squareCenter(tail);
          const color = SNAKE_COLORS[i % SNAKE_COLORS.length];
          const mx = (h.x + t.x) / 2 + (i % 2 === 0 ? 22 : -22);
          const my = (h.y + t.y) / 2;
          return (
            <G key={`snake${head}`}>
              {/* Snake body shadow */}
              <Path
                d={`M${h.x + 1},${h.y + 2} Q${mx + 1},${my + 2} ${t.x + 1},${t.y + 2}`}
                stroke="rgba(0,0,0,0.3)" strokeWidth={7} fill="none" strokeLinecap="round"
              />
              {/* Snake body */}
              <Path
                d={`M${h.x},${h.y} Q${mx},${my} ${t.x},${t.y}`}
                stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.9}
              />
              {/* Snake body highlight */}
              <Path
                d={`M${h.x},${h.y} Q${mx},${my} ${t.x},${t.y}`}
                stroke="rgba(255,255,255,0.2)" strokeWidth={2} fill="none" strokeLinecap="round"
              />
              {/* Snake head dot */}
              <Circle cx={h.x} cy={h.y} r={5} fill={color} stroke="#fff" strokeWidth={1.5} />
              {/* Snake eyes */}
              <Circle cx={h.x - 2} cy={h.y - 1} r={1.5} fill="#fff" />
              <Circle cx={h.x + 2} cy={h.y - 1} r={1.5} fill="#fff" />
              <Circle cx={h.x - 2} cy={h.y - 1} r={0.7} fill="#000" />
              <Circle cx={h.x + 2} cy={h.y - 1} r={0.7} fill="#000" />
            </G>
          );
        })}

        {/* Ladders — premium styled with wood-tone colors */}
        {Object.entries(LADDERS).map(([bottom, top], i) => {
          const b = squareCenter(parseInt(bottom));
          const t = squareCenter(top);
          const color = LADDER_COLORS[i % LADDER_COLORS.length];
          const angle = Math.atan2(t.y - b.y, t.x - b.x);
          const perp = { x: Math.sin(angle) * 7, y: -Math.cos(angle) * 7 };
          return (
            <G key={`lad${bottom}`}>
              {/* Rail shadow */}
              <Line x1={b.x - perp.x + 1} y1={b.y - perp.y + 2} x2={t.x - perp.x + 1} y2={t.y - perp.y + 2}
                stroke="rgba(0,0,0,0.25)" strokeWidth={4.5} strokeLinecap="round" />
              <Line x1={b.x + perp.x + 1} y1={b.y + perp.y + 2} x2={t.x + perp.x + 1} y2={t.y + perp.y + 2}
                stroke="rgba(0,0,0,0.25)" strokeWidth={4.5} strokeLinecap="round" />
              {/* Left rail */}
              <Line x1={b.x - perp.x} y1={b.y - perp.y} x2={t.x - perp.x} y2={t.y - perp.y}
                stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
              {/* Right rail */}
              <Line x1={b.x + perp.x} y1={b.y + perp.y} x2={t.x + perp.x} y2={t.y + perp.y}
                stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
              {/* Rungs */}
              {Array.from({ length: 5 }).map((_, r) => {
                const frac = (r + 1) / 6;
                const rx = b.x + (t.x - b.x) * frac;
                const ry = b.y + (t.y - b.y) * frac;
                return (
                  <Line key={r} x1={rx - perp.x} y1={ry - perp.y} x2={rx + perp.x} y2={ry + perp.y}
                    stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
                );
              })}
              {/* Arrow indicator at top */}
              <Circle cx={t.x} cy={t.y} r={4} fill={color} opacity={0.7} />
            </G>
          );
        })}
      </Svg>

      {/* Animated token overlay (native driver for 60fps) */}
      <View style={[StyleSheet.absoluteFillObject, { width: BOARD_SIZE, height: BOARD_SIZE }]}
        pointerEvents="none">
        {gameState && players && players.map((p, pi) => {
          const pos = gameState.positions?.[p.uid];
          if (!pos || pos === 0) return null;
          const { x, y } = squareCenter(pos);
          const color = PLAYER_COLORS[pi + 1];
          const offset = [
            { dx: -CELL * 0.2, dy: -CELL * 0.2 },
            { dx: CELL * 0.2, dy: -CELL * 0.2 },
            { dx: -CELL * 0.2, dy: CELL * 0.2 },
            { dx: CELL * 0.2, dy: CELL * 0.2 },
          ][pi];
          return (
            <AnimatedSnLToken
              key={p.uid}
              x={x}
              y={y}
              color={color}
              label={pi + 1}
              offset={offset}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
