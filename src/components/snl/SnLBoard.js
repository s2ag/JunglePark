// SnLBoard — SVG Snake & Ladders 10x10 Board
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Rect, Circle, Text as SvgText, G, Line, Path, Defs, LinearGradient, Stop
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

const SNAKE_COLORS = ['#E74C3C', '#C0392B', '#E67E22', '#D35400', '#8E44AD', '#6C3483'];
const LADDER_COLORS = ['#27AE60', '#1E8449', '#2E86C1', '#1A5276', '#F39C12', '#D68910'];

export default function SnLBoard({ gameState, players }) {
  return (
    <View style={styles.container}>
      <Svg width={BOARD_SIZE} height={BOARD_SIZE}>
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#134E5E" />
            <Stop offset="1" stopColor="#1a1a2e" />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill="url(#bg)" rx={12} />

        {/* Grid cells — alternating colors */}
        {Array.from({ length: 100 }).map((_, i) => {
          const sq = i + 1;
          const { row, col } = squareToGrid(sq);
          const isLight = (row + col) % 2 === 0;
          return (
            <G key={sq}>
              <Rect
                x={col * CELL} y={row * CELL}
                width={CELL} height={CELL}
                fill={isLight ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={0.5}
              />
              <SvgText
                x={col * CELL + 3}
                y={row * CELL + 12}
                fontSize={8}
                fill="rgba(255,255,255,0.35)"
              >
                {sq}
              </SvgText>
            </G>
          );
        })}

        {/* START square */}
        {(() => {
          const { row, col } = squareToGrid(1);
          return (
            <Rect x={col * CELL} y={row * CELL} width={CELL} height={CELL}
              fill="rgba(46,213,115,0.2)" stroke={COLORS.success} strokeWidth={1.5} />
          );
        })()}

        {/* FINISH square (100) */}
        {(() => {
          const { row, col } = squareToGrid(100);
          return (
            <G>
              <Rect x={col * CELL} y={row * CELL} width={CELL} height={CELL}
                fill="rgba(255,215,0,0.25)" stroke={COLORS.accent} strokeWidth={2} />
              <SvgText x={col * CELL + CELL / 2} y={row * CELL + CELL / 2 + 5}
                fontSize={14} textAnchor="middle">🏆</SvgText>
            </G>
          );
        })()}

        {/* Snakes */}
        {Object.entries(SNAKES).map(([head, tail], i) => {
          const h = squareCenter(parseInt(head));
          const t = squareCenter(tail);
          const color = SNAKE_COLORS[i % SNAKE_COLORS.length];
          const mx = (h.x + t.x) / 2 + (i % 2 === 0 ? 20 : -20);
          const my = (h.y + t.y) / 2;
          return (
            <G key={`snake${head}`}>
              <Path
                d={`M${h.x},${h.y} Q${mx},${my} ${t.x},${t.y}`}
                stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.85}
              />
              <Path
                d={`M${h.x},${h.y} Q${mx},${my} ${t.x},${t.y}`}
                stroke="rgba(255,255,255,0.2)" strokeWidth={2} fill="none" strokeLinecap="round"
              />
              <SvgText x={h.x} y={h.y + 5} fontSize={14} textAnchor="middle">🐍</SvgText>
            </G>
          );
        })}

        {/* Ladders */}
        {Object.entries(LADDERS).map(([bottom, top], i) => {
          const b = squareCenter(parseInt(bottom));
          const t = squareCenter(top);
          const color = LADDER_COLORS[i % LADDER_COLORS.length];
          const angle = Math.atan2(t.y - b.y, t.x - b.x);
          const perp = { x: Math.sin(angle) * 6, y: -Math.cos(angle) * 6 };
          return (
            <G key={`lad${bottom}`}>
              {/* Left rail */}
              <Line x1={b.x - perp.x} y1={b.y - perp.y} x2={t.x - perp.x} y2={t.y - perp.y}
                stroke={color} strokeWidth={3.5} strokeLinecap="round" opacity={0.85} />
              {/* Right rail */}
              <Line x1={b.x + perp.x} y1={b.y + perp.y} x2={t.x + perp.x} y2={t.y + perp.y}
                stroke={color} strokeWidth={3.5} strokeLinecap="round" opacity={0.85} />
              {/* Rungs */}
              {Array.from({ length: 4 }).map((_, r) => {
                const frac = (r + 1) / 5;
                const rx = b.x + (t.x - b.x) * frac;
                const ry = b.y + (t.y - b.y) * frac;
                return (
                  <Line key={r} x1={rx - perp.x} y1={ry - perp.y} x2={rx + perp.x} y2={ry + perp.y}
                    stroke={color} strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
                );
              })}
              <SvgText x={b.x} y={b.y + 5} fontSize={12} textAnchor="middle">🪜</SvgText>
            </G>
          );
        })}

        {/* Player tokens */}
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
            <G key={p.uid}>
              <Circle
                cx={x + offset.dx} cy={y + offset.dy}
                r={CELL * 0.28}
                fill={color.primary} stroke="#fff" strokeWidth={2}
              />
              <SvgText
                x={x + offset.dx} y={y + offset.dy + 4}
                fontSize={8} textAnchor="middle" fill="#fff" fontWeight="bold"
              >
                {pi + 1}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
