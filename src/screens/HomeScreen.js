// HomeScreen — Game Selection Hub
import React, { useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, StatusBar, Pressable
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../config/theme';
import { signOut } from '../services/auth';
import PlayerAvatar from '../components/PlayerAvatar';
import GameGlyph from '../components/ui/GameGlyph';
import { tapFeedback } from '../services/feedback';

const GAMES = [
  {
    id: 'ludo',
    title: 'Ludo',
    emoji: '🎲',
    desc: '2–4 players • Classic strategy',
    players: '2-4',
    duration: '15-30 min',
    color: COLORS.purple,
  },
  {
    id: 'snl',
    title: 'Snake & Ladders',
    emoji: '🐍',
    desc: '2–4 players • Fun for everyone',
    players: '2-4',
    duration: '10-20 min',
    color: COLORS.green,
  },
  {
    id: 'ttt',
    title: 'Tic Tac Toe',
    emoji: '✖️',
    desc: '2 players • Quick & tactical',
    players: '2',
    duration: '2-5 min',
    color: COLORS.info,
  },
];

// Use Animated.createAnimatedComponent so animations apply to the pressable itself
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GameCard = ({ game, onPress, index }) => {
  const scale = useMemo(() => new Animated.Value(0.9), []);
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1, tension: 60, friction: 7,
        delay: index * 120, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 400,
        delay: index * 120, useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, scale]);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, tension: 80, friction: 5, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }).start();

  return (
    <AnimatedPressable
      style={[
        styles.gameCard,
        { borderColor: game.color, opacity, transform: [{ scale }] },
      ]}
      onPress={() => onPress(game)}
      onPressIn={() => {
        tapFeedback();
        handlePressIn();
      }}
      onPressOut={handlePressOut}
    >
      <View style={[styles.spark, { top: '20%', right: '12%', backgroundColor: `${game.color}40` }]} />
      <View style={[styles.spark, { top: '62%', right: '52%', backgroundColor: `${game.color}30` }]} />
      <View style={[styles.spark, { top: '35%', right: '70%', backgroundColor: `${game.color}25` }]} />

      <View style={styles.cardInner}>
        <View style={[styles.gameIconWrap, { borderColor: game.color + '44' }]}>
          <GameGlyph gameId={game.id} size={56} backgroundColor="rgba(255,255,255,0.03)" />
        </View>
        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle}>{game.title}</Text>
          <Text style={styles.gameDesc}>{game.desc}</Text>
          <View style={styles.gameMeta}>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>👥 {game.players}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>⏱ {game.duration}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.playBtn, { backgroundColor: game.color }]}>
          <Text style={styles.playArrow}>▶</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
};

export default function HomeScreen({ navigation, route, user: propUser, setLocalUser }) {
  const user = propUser || route?.params?.user;

  const handleGameSelect = (game) => {
    navigation.navigate('Lobby', { game, user });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good game! 🎮</Text>
          <Text style={styles.headerName}>{user?.name || 'Player'}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile', { user })}
          activeOpacity={0.8}
        >
          <PlayerAvatar avatarId={user?.avatarId || 1} size={52} showBorder borderColor={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerGlyph}>
            <GameGlyph gameId="ludo" size={48} />
            <GameGlyph gameId="snl" size={48} />
            <GameGlyph gameId="ttt" size={48} />
          </View>
          <Text style={styles.bannerTitle}>Jungle Park</Text>
          <Text style={styles.bannerSub}>Challenge friends online!</Text>
        </View>

        {/* Game Cards */}
        <Text style={styles.sectionTitle}>Choose a Game</Text>
        {GAMES.map((game, i) => (
          <GameCard key={game.id} game={game} onPress={handleGameSelect} index={i} />
        ))}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Leaderboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statLabel}>Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Profile', { user })}
            activeOpacity={0.8}
          >
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statLabel}>My Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => {
              signOut();
              if (setLocalUser) setLocalUser(null);
            }}
          >
            <Text style={styles.statEmoji}>🚪</Text>
            <Text style={styles.statLabel}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg, paddingTop: SIZES.xl + 8, paddingBottom: SIZES.md,
  },
  greeting: { fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontSm, color: COLORS.textSecondary },
  headerName: { fontFamily: FONTS.heading, fontSize: SIZES.fontXxl, color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES.xxxl },
  banner: {
    alignItems: 'center', paddingVertical: SIZES.xl, backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusXl, marginBottom: SIZES.xl,
    borderWidth: 1, borderColor: COLORS.bgCardLight,
  },
  bannerGlyph: {
    flexDirection: 'row',
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  bannerTitle: { fontFamily: FONTS.heading, fontSize: SIZES.fontXxxl, color: COLORS.textPrimary },
  bannerSub: {
    fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd,
    color: COLORS.textSecondary, marginTop: 4,
  },
  sectionTitle: {
    fontFamily: FONTS.heading, fontSize: SIZES.fontXl,
    color: COLORS.textPrimary, marginBottom: SIZES.md,
  },
  gameCard: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXl,
    overflow: 'hidden', borderWidth: 1.5, marginBottom: SIZES.md,
    position: 'relative',
    // shadow
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  spark: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  cardInner: {
    flexDirection: 'row', alignItems: 'center',
    padding: SIZES.lg, gap: SIZES.md,
  },
  gameIconWrap: {
    width: 68, height: 68, borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.bgCardLight, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  gameInfo: { flex: 1 },
  gameTitle: {
    fontFamily: FONTS.heading, fontSize: SIZES.fontXxl, color: COLORS.textPrimary,
  },
  gameDesc: {
    fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontSm,
    color: COLORS.textSecondary, marginTop: 2,
  },
  gameMeta: { flexDirection: 'row', gap: 8, marginTop: SIZES.sm },
  metaPill: {
    backgroundColor: COLORS.bgCardLight, borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  metaText: {
    color: COLORS.textSecondary, fontSize: SIZES.fontXs, fontFamily: FONTS.bodySemiBold,
  },
  playBtn: {
    width: 44, height: 44, borderRadius: SIZES.radiusFull,
    alignItems: 'center', justifyContent: 'center',
  },
  playArrow: { color: '#fff', fontSize: SIZES.fontMd, marginLeft: 3 },
  statsRow: { flexDirection: 'row', gap: SIZES.md, marginTop: SIZES.md },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    alignItems: 'center', paddingVertical: SIZES.md,
    borderWidth: 1, borderColor: COLORS.bgCardLight,
  },
  statEmoji: { fontSize: 28 },
  statLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontXs,
    color: COLORS.textSecondary, marginTop: 4,
  },
});
