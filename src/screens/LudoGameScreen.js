// LudoGameScreen — Full multiplayer Ludo game
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Alert, Dimensions
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS, PLAYER_COLORS } from '../config/theme';
import { listenToRoom, updateGameState, finishGame } from '../services/rooms';
import {
  rollDice, getMovableTokens, moveToken, skipTurn, createInitialLudoState
} from '../game/ludo/LudoEngine';
import LudoBoard from '../components/ludo/LudoBoard';
import Dice from '../components/Dice';
import PlayerAvatar from '../components/PlayerAvatar';
import ReactionsBar from '../components/ReactionsBar';
import { tapFeedback, successFeedback, diceRollFeedback, moveFeedback } from '../services/feedback';

const { width } = Dimensions.get('window');

export default function LudoGameScreen({ navigation, route }) {
  const { code, user, players, isLocal } = route.params;
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [reaction, setReaction] = useState(null);
  const reactionOpacity = useRef(new Animated.Value(0)).current;

  const myPlayerIndex = players.findIndex((p) => p.uid === user.uid);
  const isMyTurn = isLocal
    ? true
    : (gameState ? gameState.playerOrder[gameState.currentPlayerIndex] === user.uid : false);

  useEffect(() => {
    if (isLocal) {
      const initialState = createInitialLudoState(players);
      setGameState(initialState);
    } else {
      const unsub = listenToRoom(code, (data) => {
        if (!data) return;
        setRoom(data);
        if (data.gameState) setGameState(data.gameState);
        if (data.status === 'finished') {
          navigation.replace('Results', {
            winnerId: data.winnerId,
            players,
            game: { id: 'ludo', title: 'Ludo', emoji: '🎲' },
            code,
            user,
          });
        }
        // Show incoming reactions
        if (data.reactions) {
          const all = Object.values(data.reactions);
          const latest = all[all.length - 1];
          if (latest && latest.uid !== user.uid) showReaction(latest.emoji);
        }
      });
      return unsub;
    }
  }, [code, isLocal]);

  const showReaction = (emoji) => {
    setReaction(emoji);
    reactionOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(reactionOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(reactionOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => setReaction(null));
  };

  const currentPlayerUid = gameState?.playerOrder?.[gameState?.currentPlayerIndex];
  const currentPlayer = players.find((p) => p.uid === currentPlayerUid);
  // Use stored board index for correct color (e.g. Green=3 for player 2 in 2-player game)
  const currentBoardIdx = gameState?.playerBoardIndices?.[currentPlayerUid]
    ?? (players.findIndex((p) => p.uid === currentPlayerUid) + 1);
  const currentColor = PLAYER_COLORS[currentBoardIdx];

  const handleRoll = async () => {
    if (!isMyTurn || rolling || !gameState || gameState.diceRolled) return;
    diceRollFeedback();
    setRolling(true);
    const value = rollDice();
    const activeUid = isLocal ? currentPlayerUid : user.uid;
    const newState = { ...gameState, diceValue: value, diceRolled: true, phase: 'move' };

    const movable = getMovableTokens(newState, activeUid, value);
    if (movable.length === 0) {
      // Show rolled number on dice before skipping
      if (isLocal) setGameState(newState);
      // No moves — skip turn after short delay
      setTimeout(async () => {
        const skipped = skipTurn(newState);
        if (isLocal) {
          setGameState(skipped);
        } else {
          await updateGameState(code, skipped);
        }
        setRolling(false);
      }, 1200);
    } else {
      if (isLocal) {
        setGameState(newState);
      } else {
        await updateGameState(code, newState);
      }
      setRolling(false);
    }
  };

  const handleTokenPress = async (tokenId) => {
    if (!isMyTurn || !gameState || !gameState.diceRolled) return;
    moveFeedback();
    const activeUid = isLocal ? currentPlayerUid : user.uid;
    const movable = getMovableTokens(gameState, activeUid, gameState.diceValue);
    if (!movable.find((t) => t.id === tokenId)) return;

    const newState = moveToken(gameState, activeUid, tokenId, gameState.diceValue);
    if (newState.winner) {
      successFeedback();
      if (isLocal) {
        navigation.replace('Results', {
          winnerId: newState.winner,
          players,
          game: { id: 'ludo', title: 'Ludo', emoji: '🎲' },
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
  };

  const activeUidForMovable = isLocal ? currentPlayerUid : user.uid;
  const movable = isMyTurn && gameState?.diceRolled
    ? getMovableTokens(gameState, activeUidForMovable, gameState.diceValue)
    : [];
  const movableTokenIds = movable.map((t) => t.id);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => Alert.alert('Leave Game?', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', onPress: () => navigation.navigate('Home') },
          ])}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.leaveBtn}
        >
          <Text style={styles.leaveText}>✕</Text>
        </TouchableOpacity>
        <View style={[styles.turnBanner, isMyTurn && styles.turnBannerActive]}>
          <View style={[styles.turnDot, { backgroundColor: currentColor?.primary || COLORS.primary }]} />
          <Text style={styles.turnText}>
            {isLocal
              ? `${currentPlayer?.name || '...'}'s Turn`
              : (isMyTurn ? 'Your Turn' : `${currentPlayer?.name || '...'}'s Turn`)
            }
          </Text>
        </View>
        <Text style={styles.gameCode}>#{code}</Text>
      </View>

      {/* Players strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersStrip}
        contentContainerStyle={styles.playersContent}>
        {players.map((p, i) => {
          const boardIdx = gameState?.playerBoardIndices?.[p.uid] ?? (i + 1);
          const color = PLAYER_COLORS[boardIdx];
          const isActive = currentPlayerUid === p.uid;
          const tokens = gameState?.tokens?.[p.uid] || [];
          const finished = tokens.filter((t) => t.isFinished).length;
          return (
            <View key={p.uid} style={[styles.playerChip, isActive && { borderColor: color.primary }]}>
              <PlayerAvatar avatarId={p.avatarId} size={36} isActive={isActive} />
              <View>
                <Text style={[styles.chipName, isActive && { color: color.primary }]} numberOfLines={1}>
                  {p.uid === user.uid ? 'You' : p.name}
                </Text>
                <Text style={styles.chipTokens}>{'🏠'.repeat(finished)}{'⚫'.repeat(4 - finished)}</Text>
              </View>
              <View style={[styles.colorBar, { backgroundColor: color.primary }]} />
            </View>
          );
        })}
      </ScrollView>

      {/* Board */}
      <View style={styles.boardWrap}>
        <LudoBoard
          gameState={gameState}
          players={players}
          myUid={isLocal ? currentPlayerUid : user.uid}
          onTokenPress={handleTokenPress}
          movableTokenIds={movableTokenIds}
        />
        {/* Floating reaction */}
        {reaction && (
          <Animated.Text style={[styles.floatReaction, { opacity: reactionOpacity }]}>
            {reaction}
          </Animated.Text>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <View style={styles.controlsLeft}>
          <ReactionsBar roomCode={code} uid={user.uid} />
        </View>
        <View style={styles.controlsRight}>
          <Dice
            value={gameState?.diceValue}
            onRoll={handleRoll}
            disabled={rolling || gameState?.diceRolled}
            isMyTurn={isMyTurn}
          />
        </View>
      </View>

      {/* Move prompt */}
      {isMyTurn && gameState?.diceRolled && (
        <View style={styles.moveBanner}>
          <Text style={styles.moveBannerText}>Tap a token to move it</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg, paddingTop: SIZES.xl, paddingBottom: SIZES.sm,
  },
  leaveBtn: { padding: SIZES.sm },
  leaveText: { color: COLORS.error, fontSize: SIZES.fontXl, fontFamily: FONTS.body },
  turnBanner: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs, backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs },
  turnBannerActive: {
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.6)',
    ...SHADOWS.sm,
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
  chipTokens: { fontSize: 8, marginTop: 2 },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  floatReaction: { position: 'absolute', fontSize: 60, top: '30%' },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.md, backgroundColor: COLORS.bgCard,
    borderTopWidth: 1, borderTopColor: COLORS.bgCardLight,
  },
  controlsLeft: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  controlsRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  moveBanner: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm,
  },
  moveBannerText: { color: COLORS.bgDark, fontFamily: FONTS.body, fontSize: SIZES.fontMd },
});
