// WaitingRoomScreen — Real-time player lobby before game starts
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Share, Alert, ActivityIndicator
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS, PLAYER_COLORS, AVATARS } from '../config/theme';
import { listenToRoom, startGame, leaveRoom } from '../services/rooms';
import { createInitialLudoState } from '../game/ludo/LudoEngine';
import { createInitialSnLState } from '../game/snl/SnLEngine';
import { createInitialTTTState } from '../game/ttt/TicTacToeEngine';
import PlayerAvatar from '../components/PlayerAvatar';

const PulseDot = () => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.dot, { transform: [{ scale: pulse }] }]} />;
};

export default function WaitingRoomScreen({ navigation, route }) {
  const { code, game, user, isHost } = route.params;
  const [room, setRoom] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const unsub = listenToRoom(code, (data) => {
      if (!data) { navigation.navigate('Home'); return; }
      setRoom(data);
      // Navigate to game if host started
      if (data.status === 'playing') {
        const players = Object.values(data.players).sort((a, b) => a.playerIndex - b.playerIndex);
        const screenName = game.id === 'ludo'
          ? 'LudoGame'
          : game.id === 'snl'
            ? 'SnLGame'
            : 'TicTacToeGame';
        navigation.replace(screenName, {
          code, user, room: data, players,
        });
      }
    });
    return unsub;
  }, [code]);

  const handleShare = async () => {
    await Share.share({
      message: `Join my Jungle Park game!\nRoom Code: ${code}\nGame: ${game.title}\n\nDownload Jungle Park to play! 🌴🎮`,
    });
  };

  const handleStart = async () => {
    if (!room) return;
    const players = Object.values(room.players).sort((a, b) => a.playerIndex - b.playerIndex);
    if (players.length < 2) { Alert.alert('Need at least 2 players to start!'); return; }
    setStarting(true);
    try {
      const initialState = game.id === 'ludo'
        ? createInitialLudoState(players)
        : game.id === 'snl'
          ? createInitialSnLState(players)
          : createInitialTTTState(players);
      await startGame(code, initialState);
    } catch (e) {
      Alert.alert('Error', e.message);
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    await leaveRoom(code, user.uid);
    navigation.goBack();
  };

  const players = room ? Object.values(room.players).sort((a, b) => a.playerIndex - b.playerIndex) : [];
  const maxPlayers = room?.maxPlayers || 4;
  const canStart = isHost && players.length >= 2;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeave}>
          <Text style={styles.leaveText}>✕ Leave</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{game.emoji} {game.title}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Room Code */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Room Code</Text>
        <Text style={styles.codeText}>{code}</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>📤 Share with Friends</Text>
        </TouchableOpacity>
      </View>

      {/* Waiting indicator */}
      <View style={styles.waitingRow}>
        <PulseDot />
        <Text style={styles.waitingText}>
          Waiting for players... ({players.length}/{maxPlayers})
        </Text>
      </View>

      {/* Player slots */}
      <View style={styles.playersGrid}>
        {Array.from({ length: maxPlayers }).map((_, i) => {
          const p = players[i];
          const color = PLAYER_COLORS[i + 1];
          return (
            <View key={i} style={[styles.playerSlot, { borderColor: p ? color.primary : COLORS.bgCardLight }]}>
              {p ? (
                <>
                  <PlayerAvatar avatarId={p.avatarId} size={52} showBorder borderColor={color.primary} />
                  <Text style={[styles.slotName, { color: color.primary }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  {p.isHost && <Text style={styles.hostBadge}>👑 Host</Text>}
                  <View style={[styles.colorDot, { backgroundColor: color.primary }]} />
                </>
              ) : (
                <>
                  <View style={styles.emptySlot}><Text style={styles.emptyPlus}>+</Text></View>
                  <Text style={styles.emptyText}>Waiting...</Text>
                </>
              )}
            </View>
          );
        })}
      </View>

      {/* Start Button (host only) */}
      {isHost ? (
        <TouchableOpacity
          style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={!canStart || starting}
        >
          {starting
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={styles.startBtnText}>
                  {canStart ? '🚀 Start Game!' : `Need ${2 - players.length} more player(s)`}
                </Text>
              </>
          }
        </TouchableOpacity>
      ) : (
        <View style={styles.waitingHost}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.waitingHostText}>Waiting for host to start...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark, paddingHorizontal: SIZES.lg, paddingTop: SIZES.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SIZES.xl },
  leaveText: { color: COLORS.error, fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd },
  headerTitle: { fontFamily: FONTS.heading, fontSize: SIZES.fontXl, color: COLORS.textPrimary },
  codeCard: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXl,
    alignItems: 'center', padding: SIZES.xl, marginBottom: SIZES.lg,
    borderWidth: 2, borderColor: COLORS.accent, ...SHADOWS.lg,
  },
  codeLabel: { fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd, color: COLORS.textSecondary, marginBottom: SIZES.xs },
  codeText: { fontFamily: FONTS.heading, fontSize: 52, color: COLORS.accent, letterSpacing: 8 },
  shareBtn: {
    marginTop: SIZES.md, backgroundColor: COLORS.bgCardLight,
    borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm,
  },
  shareBtnText: { color: COLORS.textPrimary, fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.lg },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  waitingText: { color: COLORS.textSecondary, fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd },
  playersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.md, marginBottom: SIZES.xl },
  playerSlot: {
    width: '47%', backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    alignItems: 'center', padding: SIZES.md, borderWidth: 2, gap: 6, minHeight: 120,
    justifyContent: 'center',
  },
  slotName: { fontFamily: FONTS.body, fontSize: SIZES.fontMd, textAlign: 'center' },
  hostBadge: { fontSize: SIZES.fontXs, color: COLORS.accent },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  emptySlot: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    borderColor: COLORS.bgCardLight, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  emptyPlus: { fontSize: 24, color: COLORS.textMuted },
  emptyText: { color: COLORS.textMuted, fontSize: SIZES.fontSm, fontFamily: FONTS.bodyRegular },
  startBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull,
    paddingVertical: SIZES.md + 4, alignItems: 'center', ...SHADOWS.lg,
  },
  startBtnDisabled: { backgroundColor: COLORS.bgCardLight },
  startBtnText: { color: '#fff', fontSize: SIZES.fontLg, fontFamily: FONTS.body },
  waitingHost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.md },
  waitingHostText: { color: COLORS.textSecondary, fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd },
});
