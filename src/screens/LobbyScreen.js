// LobbyScreen — Create or Join a Room
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';
import { createRoom, joinRoom } from '../services/rooms';
import GameGlyph from '../components/ui/GameGlyph';
import { tapFeedback } from '../services/feedback';

export default function LobbyScreen({ navigation, route }) {
  const { game, user } = route.params;
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [playerCount, setPlayerCount] = useState(2);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const tabAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(0), []);

  const switchTab = (t) => {
    setTab(t);
    Animated.parallel([
      Animated.timing(tabAnim, { toValue: t === 'create' ? 0 : 1, duration: 250, useNativeDriver: false }),
      Animated.spring(slideAnim, { toValue: t === 'create' ? 0 : 1, tension: 60, friction: 8, useNativeDriver: false }),
    ]).start();
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const count = game.id === 'ttt' ? 2 : playerCount;
      const code = await createRoom(user, game.id, count);
      navigation.navigate('WaitingRoom', { code, game, user, isHost: true });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayLocally = () => {
    const mockNames = ['Jungle Lion', 'Happy Monkey', 'Speedy Zebra', 'Lazy Panda'];
    // TTT is always 2 players
    const count = game.id === 'ttt' ? 2 : playerCount;
    const localPlayers = Array.from({ length: count }).map((_, idx) => {
      if (idx === 0) {
        return {
          uid: user?.uid || 'offline-host',
          name: user?.name || 'Player 1',
          avatarId: user?.avatarId || 1,
          playerIndex: 1,
        };
      }
      return {
        uid: `local-player-${idx + 1}`,
        name: `${mockNames[idx % mockNames.length]}`,
        avatarId: (idx + 2) > 8 ? (idx % 8) + 1 : idx + 2,
        playerIndex: idx + 1,
      };
    });

    const screenName = game.id === 'ludo'
      ? 'LudoGame'
      : game.id === 'snl'
        ? 'SnLGame'
        : 'TicTacToeGame';

    navigation.navigate(screenName, {
      code: 'LOCAL',
      user: localPlayers[0],
      players: localPlayers,
      isLocal: true,
    });
  };

  const handleJoin = async () => {
    if (joinCode.length < 4) { Alert.alert('Enter a valid room code'); return; }
    setLoading(true);
    try {
      await joinRoom(joinCode.toUpperCase(), user);
      navigation.navigate('WaitingRoom', { code: joinCode.toUpperCase(), game, user, isHost: false });
    } catch (e) {
      Alert.alert('Cannot Join', e.message);
    } finally {
      setLoading(false);
    }
  };

  const indicatorLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ['2%', '52%'] });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Game Banner */}
        <View style={styles.gameBanner}>
          <GameGlyph gameId={game.id} size={58} />
          <View>
            <Text style={styles.bannerTitle}>{game.title}</Text>
            <Text style={styles.bannerSub}>{game.desc}</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
          <TouchableOpacity style={styles.tab} onPress={() => switchTab('create')}>
            <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>
              Create Room
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => switchTab('join')}>
            <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>
              Join Room
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Room Panel */}
        {tab === 'create' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Set Up Your Game</Text>
            {game.id !== 'ttt' && (
              <>
                <Text style={styles.label}>Number of Players</Text>
                <View style={styles.playerCountRow}>
                  {[2, 3, 4].map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.countBtn, playerCount === n && styles.countBtnActive]}
                      onPress={() => setPlayerCount(n)}
                    >
                      <Text style={[styles.countBtnText, playerCount === n && styles.countBtnTextActive]}>
                        {n} Players
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {game.id === 'ttt' && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Tic Tac Toe is a 2-player game</Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>A 6-digit room code will be generated for you to share with friends</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                tapFeedback();
                handleCreate();
              }}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Play Online (Create Room)</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: COLORS.accent, marginTop: 12 }]}
              onPress={() => {
                tapFeedback();
                handlePlayLocally();
              }}
              disabled={loading}
            >
              <Text style={[styles.primaryBtnText, { color: COLORS.bgDark }]}>Play Offline (Pass & Play)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Join Room Panel */}
        {tab === 'join' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Join a Friend{"'"}s Game</Text>
            <Text style={styles.label}>Room Code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. ABC123"
              placeholderTextColor={COLORS.textMuted}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Ask your friend to share their room code with you</Text>
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                tapFeedback();
                handleJoin();
              }}
              disabled={loading || joinCode.length < 4}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Join Room</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  scroll: { padding: SIZES.lg, paddingBottom: SIZES.xxxl },
  backBtn: { marginBottom: SIZES.md },
  backText: { color: COLORS.textSecondary, fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd },
  gameBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXl,
    padding: SIZES.lg, marginBottom: SIZES.xl, borderWidth: 1, borderColor: COLORS.bgCardLight,
  },
  bannerTitle: { fontFamily: FONTS.heading, fontSize: SIZES.fontXxl, color: COLORS.textPrimary },
  bannerSub: { fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontSm, color: COLORS.textSecondary },
  tabContainer: {
    flexDirection: 'row', backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusFull, padding: 4, marginBottom: SIZES.lg, position: 'relative',
  },
  tabIndicator: {
    position: 'absolute', top: 4, width: '48%', height: '100%',
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SIZES.sm, zIndex: 1 },
  tabText: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd, color: COLORS.textMuted },
  tabTextActive: { color: '#fff' },
  panel: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXl,
    padding: SIZES.lg, borderWidth: 1, borderColor: COLORS.bgCardLight,
  },
  panelTitle: { fontFamily: FONTS.heading, fontSize: SIZES.fontXl, color: COLORS.textPrimary, marginBottom: SIZES.lg },
  label: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd, color: COLORS.textSecondary, marginBottom: SIZES.sm },
  playerCountRow: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.lg },
  countBtn: {
    flex: 1, backgroundColor: COLORS.bgCardLight, borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  countBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(255,107,53,0.15)' },
  countBtnText: { color: COLORS.textSecondary, fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontSm },
  countBtnTextActive: { color: COLORS.primary },
  infoBox: {
    backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.lg, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
  },
  infoText: { color: COLORS.accent, fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontSm },
  codeInput: {
    backgroundColor: COLORS.bgCardLight, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, color: COLORS.textPrimary, fontSize: SIZES.fontXxl + 4,
    fontFamily: FONTS.heading, textAlign: 'center', letterSpacing: 8, marginBottom: SIZES.lg,
    borderWidth: 1, borderColor: COLORS.bgGlass,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull,
    paddingVertical: SIZES.md + 2, alignItems: 'center', ...SHADOWS.lg,
  },
  primaryBtnText: { color: '#fff', fontSize: SIZES.fontLg, fontFamily: FONTS.body },
});
