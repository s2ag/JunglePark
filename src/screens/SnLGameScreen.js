// SnLGameScreen — Full multiplayer Snake & Ladders game
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Alert
} from 'react-native';
import { COLORS, SIZES, FONTS, PLAYER_COLORS } from '../config/theme';
import { listenToRoom, updateGameState, finishGame } from '../services/rooms';
import { rollDiceSnL, movePlayer, createInitialSnLState } from '../game/snl/SnLEngine';
import SnLBoard from '../components/snl/SnLBoard';
import Dice from '../components/Dice';
import PlayerAvatar from '../components/PlayerAvatar';
import ReactionsBar from '../components/ReactionsBar';
import { diceRollFeedback, snakeFeedback, ladderFeedback, winFeedback } from '../services/feedback';

export default function SnLGameScreen({ navigation, route }) {
  const { code, user, players, isLocal } = route.params;
  const [gameState, setGameState] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [eventMsg, setEventMsg] = useState(null);
  const eventOpacity = useRef(new Animated.Value(0)).current;
  const eventScale = useRef(new Animated.Value(0.5)).current;

  // Derived turn info
  const currentPlayerUid = gameState?.playerOrder?.[gameState?.currentPlayerIndex];
  const currentPlayer = players.find((p) => p.uid === currentPlayerUid);
  const currentColor = PLAYER_COLORS[players.findIndex((p) => p.uid === currentPlayerUid) + 1];

  const isMyTurn = isLocal
    ? true
    : (gameState ? gameState.playerOrder[gameState.currentPlayerIndex] === user.uid : false);

  // ── Initialise game ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isLocal) {
      setGameState(createInitialSnLState(players));
    } else {
      const unsub = listenToRoom(code, (data) => {
        if (!data) return;
        if (data.gameState) {
          setGameState((prev) => {
            // Show event if it just changed
            if (
              data.gameState.lastEvent &&
              (!prev || JSON.stringify(prev.lastEvent) !== JSON.stringify(data.gameState.lastEvent))
            ) {
              showEvent(data.gameState.lastEvent);
            }
            return data.gameState;
          });
        }
        if (data.status === 'finished') {
          navigation.replace('Results', {
            winnerId: data.winnerId,
            players,
            game: { id: 'snl', title: 'Snake & Ladders', emoji: '🐍' },
            code,
            user,
          });
        }
      });
      return unsub;
    }
  }, [code, isLocal]);

  // ── Auto-move after dice roll (1.5 s delay so player can see value) ───────
  useEffect(() => {
    if (!isMyTurn || gameState?.phase !== 'move' || !gameState?.diceRolled) return;

    const timer = setTimeout(async () => {
      const activeUid = isLocal ? currentPlayerUid : user.uid;
      if (!activeUid) return;

      const newState = movePlayer(gameState, activeUid, gameState.diceValue);

      if (isLocal && newState.lastEvent) {
        showEvent(newState.lastEvent);
        // Contextual haptics for snake/ladder events
        if (newState.lastEvent.type === 'snake') snakeFeedback();
        else if (newState.lastEvent.type === 'ladder') ladderFeedback();
      }

      if (newState.winner) {
        winFeedback();
        if (isLocal) {
          navigation.replace('Results', {
            winnerId: newState.winner,
            players,
            game: { id: 'snl', title: 'Snake & Ladders', emoji: '🐍' },
            code: 'LOCAL',
            user,
            isLocal: true,
          });
        } else {
          await finishGame(code, newState.winner);
        }
      } else {
        if (isLocal) {
          setGameState(newState);
        } else {
          await updateGameState(code, newState);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameState?.phase, gameState?.diceRolled, isMyTurn, currentPlayerUid]);

  // ── Show event popup ──────────────────────────────────────────────────────
  const showEvent = (event) => {
    let msg = '';
    if (event.type === 'snake')   msg = `🐍 Oh no! Snake from ${event.from} → ${event.to}!`;
    else if (event.type === 'ladder') msg = `🪜 Ladder! Up from ${event.from} → ${event.to}!`;
    else if (event.type === 'bounce') msg = `↩ Too far! Stay at ${event.to}`;
    else return;

    setEventMsg(msg);
    eventOpacity.setValue(0);
    eventScale.setValue(0.5);

    Animated.parallel([
      Animated.spring(eventScale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
      Animated.timing(eventOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(eventOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(
          () => setEventMsg(null)
        );
      }, 2000);
    });
  };

  // ── Roll dice ─────────────────────────────────────────────────────────────
  const handleRoll = async () => {
    if (!isMyTurn || rolling || !gameState || gameState.diceRolled) return;
    diceRollFeedback();
    setRolling(true);

    const value = rollDiceSnL();
    const newState = {
      ...gameState,
      diceValue: value,
      diceRolled: true,
      phase: 'move',
    };

    if (isLocal) {
      setGameState(newState);
    } else {
      await updateGameState(code, newState);
    }
    setRolling(false);
  };

  // ── Turn label ────────────────────────────────────────────────────────────
  const turnLabel = isLocal
    ? `${currentPlayer?.name || '...'}'s Turn`
    : (isMyTurn ? '🎯 Your Turn!' : `${currentPlayer?.name || '...'}'s Turn`);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() =>
          Alert.alert('Leave?', 'Leave this game?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', onPress: () => navigation.navigate('Home') },
          ])
        }>
          <Text style={styles.leaveText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.turnBanner}>
          <View style={[styles.turnDot, { backgroundColor: currentColor?.primary || COLORS.primary }]} />
          <Text style={styles.turnText}>{turnLabel}</Text>
        </View>

        <Text style={styles.gameCode}>#{code}</Text>
      </View>

      {/* Players strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.playersStrip}
        contentContainerStyle={styles.playersContent}
      >
        {players.map((p, i) => {
          const color = PLAYER_COLORS[i + 1];
          const isActive = currentPlayerUid === p.uid;
          const pos = gameState?.positions?.[p.uid] || 0;
          return (
            <View key={p.uid} style={[styles.playerChip, isActive && { borderColor: color.primary }]}>
              <PlayerAvatar avatarId={p.avatarId} size={36} isActive={isActive} />
              <View>
                <Text style={[styles.chipName, isActive && { color: color.primary }]} numberOfLines={1}>
                  {p.uid === user.uid ? 'You' : p.name}
                </Text>
                <Text style={styles.chipPos}>
                  Square: <Text style={{ color: color.primary }}>{pos}</Text>/100
                </Text>
              </View>
              <View style={[styles.colorBar, { backgroundColor: color.primary }]} />
            </View>
          );
        })}
      </ScrollView>

      {/* Board */}
      <View style={styles.boardWrap}>
        <SnLBoard gameState={gameState} players={players} />

        {/* Event popup */}
        {eventMsg && (
          <Animated.View style={[
            styles.eventBubble,
            { opacity: eventOpacity, transform: [{ scale: eventScale }] },
          ]}>
            <Text style={styles.eventText}>{eventMsg}</Text>
          </Animated.View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!isLocal && <ReactionsBar roomCode={code} uid={user.uid} />}
        <Dice
          value={gameState?.diceValue}
          onRoll={handleRoll}
          disabled={rolling || (gameState?.phase === 'move' && gameState?.diceRolled)}
          isMyTurn={isMyTurn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg, paddingTop: SIZES.xl, paddingBottom: SIZES.sm,
  },
  leaveText: { color: COLORS.error, fontSize: SIZES.fontXl, fontFamily: FONTS.body },
  turnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs,
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs,
  },
  turnDot: { width: 10, height: 10, borderRadius: 5 },
  turnText: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd, color: COLORS.textPrimary },
  gameCode: { color: COLORS.textMuted, fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontSm },
  playersStrip: { maxHeight: 70, marginHorizontal: SIZES.lg, marginBottom: SIZES.sm },
  playersContent: { gap: SIZES.sm, paddingRight: SIZES.lg },
  playerChip: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusMd, padding: SIZES.sm,
    borderWidth: 1.5, borderColor: COLORS.bgCardLight, position: 'relative', overflow: 'hidden',
  },
  chipName: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontSm, color: COLORS.textSecondary, maxWidth: 60 },
  chipPos: { fontSize: SIZES.fontXs, color: COLORS.textMuted, fontFamily: FONTS.bodyRegular },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  eventBubble: {
    position: 'absolute', backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md, borderWidth: 1.5,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 12, elevation: 10,
  },
  eventText: { fontFamily: FONTS.body, fontSize: SIZES.fontLg, color: COLORS.textPrimary },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: SIZES.xl, paddingVertical: SIZES.md, backgroundColor: COLORS.bgCard,
    borderTopWidth: 1, borderTopColor: COLORS.bgCardLight,
  },
});
