import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Rect, Path } from 'react-native-svg';
import { COLORS } from '../../config/theme';

const GLYPH_SIZE = 26;

function LudoGlyph() {
  return (
    <Svg width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 26 26">
      <Rect x="2" y="2" width="9" height="9" rx="2" fill={COLORS.red} />
      <Rect x="15" y="2" width="9" height="9" rx="2" fill={COLORS.blue} />
      <Rect x="2" y="15" width="9" height="9" rx="2" fill={COLORS.green} />
      <Rect x="15" y="15" width="9" height="9" rx="2" fill={COLORS.yellow} />
      <Circle cx="13" cy="13" r="2.5" fill="#FFFFFF" />
    </Svg>
  );
}

function SnlGlyph() {
  return (
    <Svg width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 26 26">
      <Line x1="4" y1="22" x2="11" y2="7" stroke="#F8D66D" strokeWidth="2.2" />
      <Line x1="9" y1="22" x2="16" y2="7" stroke="#F8D66D" strokeWidth="2.2" />
      <Line x1="6.5" y1="16.5" x2="13.5" y2="16.5" stroke="#F8D66D" strokeWidth="1.8" />
      <Line x1="8.4" y1="12.5" x2="15.4" y2="12.5" stroke="#F8D66D" strokeWidth="1.8" />
      <Path d="M18 5 C21 4 22 7 20 8 C18 9 17 11 19 12 C21 13 20 16 17 17" stroke="#53E2A9" strokeWidth="2.3" fill="none" strokeLinecap="round" />
      <Circle cx="17" cy="17.5" r="1.8" fill="#53E2A9" />
    </Svg>
  );
}

function TicTacToeGlyph() {
  return (
    <Svg width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 26 26">
      <Line x1="8" y1="8" x2="18" y2="18" stroke="#9EA8FF" strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="18" y1="8" x2="8" y2="18" stroke="#9EA8FF" strokeWidth="2.4" strokeLinecap="round" />
      <Circle cx="13" cy="13" r="7" stroke="#7CE0FF" strokeWidth="2.4" fill="none" />
    </Svg>
  );
}

export default function GameGlyph({ gameId, size = 54, backgroundColor = COLORS.bgCardLight }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      {gameId === 'ludo' && <LudoGlyph />}
      {gameId === 'snl' && <SnlGlyph />}
      {gameId === 'ttt' && <TicTacToeGlyph />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
});
