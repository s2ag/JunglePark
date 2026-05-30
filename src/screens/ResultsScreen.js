// ResultsScreen — Winner announcement with confetti
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS, PLAYER_COLORS, AVATARS } from '../config/theme';
import PlayerAvatar from '../components/PlayerAvatar';

const { width, height } = Dimensions.get('window');

// Simple confetti particle
const Particle = ({ color, delay }) => {
  const y = useRef(new Animated.Value(-20)).current;
  const x = useRef(new Animated.Value(Math.random() * width)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y, { toValue: height + 20, duration: 3000, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 5, duration: 3000, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 5], outputRange: ['0deg', '1800deg'] });
  const size = 8 + Math.random() * 10;

  return (
    <Animated.View style={{
      position: 'absolute', top: 0, width: size, height: size,
      backgroundColor: color, borderRadius: Math.random() > 0.5 ? size / 2 : 2,
      transform: [{ translateY: y }, { rotate: spin }],
      left: Math.random() * width,
      opacity,
    }} />
  );
};

const CONFETTI_COLORS = ['#FF6B35', '#FFD700', '#2ED573', '#3742FA', '#FF4757', '#A855F7', '#FF69B4'];

export default function ResultsScreen({ navigation, route }) {
  const { winnerId, players, game, code, user, isLocal } = route.params;
  const winner = players.find((p) => p.uid === winnerId);
  const winnerIndex = players.findIndex((p) => p.uid === winnerId);
  const winnerColor = PLAYER_COLORS[winnerIndex + 1];
  const isWinner = isLocal || winnerId === user.uid;

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const crown = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 6, delay: 300, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: false }),
      Animated.spring(crown, { toValue: 0, tension: 60, friction: 7, delay: 500, useNativeDriver: false }),
    ]).start();
  }, []);

  const leaderboard = [...players].sort((a, b) => {
    if (a.uid === winnerId) return -1;
    if (b.uid === winnerId) return 1;
    return 0;
  });

  return (
    <View style={styles.container}>
      {/* Confetti */}
      {isWinner && Array.from({ length: 40 }).map((_, i) => (
        <Particle
          key={i}
          color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
          delay={i * 60}
        />
      ))}

      <Animated.View style={[styles.content, { opacity, pointerEvents: 'box-none' }]}>
        {/* Crown */}
        <Animated.Text style={[styles.crown, { transform: [{ translateY: crown }] }]}>👑</Animated.Text>

        {/* Winner card */}
        <Animated.View style={[styles.winnerCard, {
          transform: [{ scale }],
          borderColor: winnerColor?.primary || COLORS.accent,
          pointerEvents: 'box-none',
        }]}>
          <Text style={styles.resultLabel}>{isWinner ? '🎉 You Won!' : `${winner?.name} Won!`}</Text>
          <PlayerAvatar avatarId={winner?.avatarId || 1} size={96} showBorder borderColor={winnerColor?.primary} />
          <Text style={[styles.winnerName, { color: winnerColor?.primary || COLORS.accent }]}>
            {winner?.name || 'Player'}
          </Text>
          <Text style={styles.gameLabel}>{game.emoji} {game.title}</Text>
        </Animated.View>

        {/* Podium */}
        <View style={styles.podium}>
          {leaderboard.map((p, i) => {
            const color = PLAYER_COLORS[players.findIndex((pl) => pl.uid === p.uid) + 1];
            const medals = ['🥇', '🥈', '🥉', '4️⃣'];
            return (
              <View key={p.uid} style={styles.podiumRow}>
                <Text style={styles.medal}>{medals[i]}</Text>
                <PlayerAvatar avatarId={p.avatarId} size={32} />
                <Text style={[styles.podiumName, { color: color?.primary }]} numberOfLines={1}>
                  {p.uid === user.uid ? 'You' : p.name}
                </Text>
                {i === 0 && <Text style={styles.winnerBadge}>WINNER</Text>}
              </View>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.playAgainBtn}
            onPress={() => navigation.navigate('Lobby', { game, user })}>
            <Text style={styles.playAgainText}>🔄 Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn}
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeBtnText}>🏠 Home</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark, overflow: 'hidden' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.lg },
  crown: { fontSize: 64, marginBottom: -SIZES.sm },
  winnerCard: {
    alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXl,
    padding: SIZES.xl, width: '100%', borderWidth: 2, marginBottom: SIZES.xl, ...SHADOWS.lg,
    gap: SIZES.sm,
  },
  resultLabel: { fontFamily: FONTS.heading, fontSize: SIZES.fontXxl, color: COLORS.textPrimary },
  winnerName: { fontFamily: FONTS.heading, fontSize: SIZES.fontXxl },
  gameLabel: { fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd, color: COLORS.textSecondary },
  podium: {
    width: '100%', backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXl,
    padding: SIZES.lg, gap: SIZES.sm, marginBottom: SIZES.xl, borderWidth: 1, borderColor: COLORS.bgCardLight,
  },
  podiumRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md },
  medal: { fontSize: 24, width: 32 },
  podiumName: { flex: 1, fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd },
  winnerBadge: {
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm, paddingVertical: 2,
    fontSize: SIZES.fontXs, color: COLORS.bgDark, fontFamily: FONTS.body,
  },
  actions: { flexDirection: 'row', gap: SIZES.md, width: '100%' },
  playAgainBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull,
    paddingVertical: SIZES.md, alignItems: 'center', ...SHADOWS.md,
  },
  playAgainText: { color: '#fff', fontFamily: FONTS.body, fontSize: SIZES.fontMd },
  homeBtn: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusFull,
    paddingVertical: SIZES.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.bgCardLight,
  },
  homeBtnText: { color: COLORS.textSecondary, fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd },
});
