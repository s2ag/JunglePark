// TicTacToeGameScreen — Full multiplayer Tic Tac Toe with premium visuals
import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, Dimensions, Easing,
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';
import { listenToRoom, updateGameState, finishGame } from '../services/rooms';
import { makeMove, createInitialTTTState, normalizeState } from '../game/ttt/TicTacToeEngine';
import PlayerAvatar from '../components/PlayerAvatar';
import ReactionsBar from '../components/ReactionsBar';
import { ScreenTransition } from '../components/ui/AnimatedComponents';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 48, 340);
// Subtract 2px border on each side so 3 cells fit exactly in the content area
const CELL_SIZE = (BOARD_SIZE - 4) / 3;

const SYMBOLS = ['✕', '○'];
const SYMBOL_COLORS = [COLORS.primary, COLORS.accent];

// ─── Animated Cell — native driver optimized for 60fps ─────────────────────────
const Cell = memo(function Cell({ value, index, playerOrder, onPress, canPress, isWinCell }) {
  const scaleAnim = useMemo(() => new Animated.Value(0), []);
  const rotateAnim = useMemo(() => new Animated.Value(0), []);
  const glowOpacity = useMemo(() => new Animated.Value(0), []);
  const loopRef = useRef(null);

  useEffect(() => {
    if (value) {
      scaleAnim.setValue(0.2);
      rotateAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1, tension: 180, friction: 6, useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1, duration: 300, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [rotateAnim, scaleAnim, value]);

  useEffect(() => {
    if (loopRef.current) {
      loopRef.current.stop();
      loopRef.current = null;
    }
    if (isWinCell) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.15, duration: 450, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    } else {
      glowOpacity.setValue(0);
    }
    return () => { if (loopRef.current) loopRef.current.stop(); };
  }, [glowOpacity, isWinCell]);

  const playerIdx = value && Array.isArray(playerOrder)
    ? playerOrder.indexOf(value)
    : -1;
  const symbol = playerIdx >= 0 ? SYMBOLS[playerIdx] : null;
  const symbolColor = playerIdx >= 0 ? SYMBOL_COLORS[playerIdx] : COLORS.textMuted;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      onPress={() => canPress && onPress(index)}
      disabled={!canPress || !!value}
      activeOpacity={0.6}
      style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
    >
      {/* Win cell highlight */}
      {isWinCell && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.winHighlight,
            { opacity: glowOpacity },
          ]}
        />
      )}
      {/* Hover/pressable hint */}
      {canPress && !value && (
        <View style={styles.cellHoverHint} />
      )}
      {symbol && (
        <Animated.Text
          style={[
            styles.symbol,
            {
              color: symbolColor,
              fontSize: CELL_SIZE * 0.50,
              transform: [{ scale: scaleAnim }, { rotate }],
              textShadowColor: symbolColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            },
          ]}
        >
          {symbol}
        </Animated.Text>
      )}
    </TouchableOpacity>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function TicTacToeGameScreen({ navigation, route }) {
  const { code, user, players, isLocal } = route.params;
  const [gameState, setGameState] = useState(() => (isLocal ? createInitialTTTState(players) : null));
  const [reaction, setReaction] = useState(null);
  const reactionOpacity = useMemo(() => new Animated.Value(0), []);

  // Banner animation values
  const resultScale = useMemo(() => new Animated.Value(0.4), []);
  const resultOpacity = useMemo(() => new Animated.Value(0), []);

  // ── Normalise state before any read (Firebase array→object fix) ──────────
  const gs = normalizeState(gameState);

  const currentPlayerUid = gs?.playerOrder?.[gs?.currentPlayerIndex] ?? null;

  // For local play isMyTurn is always true (pass & play device); the engine
  // guards whose uid is actually used, so only the right player's tap registers.
  const isMyTurn = isLocal
    ? true
    : (gs ? currentPlayerUid === user.uid : false);

  const showReaction = useCallback((emoji) => {
    setReaction(emoji);
    reactionOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(reactionOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(reactionOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => setReaction(null));
  }, [reactionOpacity]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLocal) return undefined;

    const unsub = listenToRoom(code, (data) => {
      if (!data) return;
      if (data.gameState) setGameState(data.gameState);  // raw; normalised on read
      if (data.status === 'finished') {
        navigation.replace('Results', {
          winnerId: data.winnerId,
          players,
          game: { id: 'ttt', title: 'Tic Tac Toe', emoji: '✖️' },
          code,
          user,
        });
      }
      if (data.reactions) {
        const all = Object.values(data.reactions);
        const latest = all[all.length - 1];
        if (latest && latest.uid !== user.uid) showReaction(latest.emoji);
      }
    });

    return unsub;
  }, [code, isLocal, navigation, players, showReaction, user]);

  // ── Animate result banner whenever phase flips to 'finished' ─────────────
  const prevPhase = useRef(null);
  useEffect(() => {
    if (gs?.phase === 'finished' && prevPhase.current !== 'finished') {
      resultScale.setValue(0.4);
      resultOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(resultOpacity, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
        Animated.spring(resultScale,   { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      ]).start();

      // Online: push finish to Firebase so both players see Results screen
      if (!isLocal && gs.winner) {
        setTimeout(() => finishGame(code, gs.winner), 1800);
      }
    }
    prevPhase.current = gs?.phase ?? null;
  }, [code, gs?.phase, gs?.winner, isLocal, resultOpacity, resultScale]);

  // ── Handle cell tap ───────────────────────────────────────────────────────
  const handleCellPress = useCallback(async (cellIndex) => {
    if (!gs || gs.phase === 'finished') return;

    // Determine who is making this move
    const activeUid = isLocal ? currentPlayerUid : user.uid;
    if (!activeUid) return;
    // Online guard — must be your turn
    if (!isLocal && currentPlayerUid !== user.uid) return;

    const newState = makeMove(gs, activeUid, cellIndex);
    // makeMove returns same reference when no change
    if (newState === gs) return;

    if (isLocal) {
      setGameState(newState);
    } else {
      await updateGameState(code, newState);
    }
  }, [gs, isLocal, currentPlayerUid, user.uid, code]);

  // ── Derived display values ────────────────────────────────────────────────
  const currentPlayer    = players.find((p) => p.uid === currentPlayerUid);
  const activeSymbolIdx  = gs?.currentPlayerIndex ?? 0;
  const winnerUid        = gs?.winner ?? null;
  const winnerPlayer     = winnerUid ? players.find((p) => p.uid === winnerUid) : null;
  const winnerSymbolIdx  = winnerPlayer
    ? (gs?.playerOrder ?? []).indexOf(winnerPlayer.uid)
    : -1;
  const board            = gs?.board ?? Array(9).fill(null);
  const winLine          = Array.isArray(gs?.winLine) ? gs.winLine : [];

  const resetGame = () => {
    prevPhase.current = null;
    resultScale.setValue(0.4);
    resultOpacity.setValue(0);
    setGameState(createInitialTTTState(players));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScreenTransition>
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
        <Text style={styles.headerTitle}>Tic Tac Toe</Text>
        <Text style={styles.gameCode}>#{code}</Text>
      </View>

      {/* Player cards */}
      <View style={styles.playersRow}>
        {players.slice(0, 2).map((p, idx) => {
          const isActive = gs?.currentPlayerIndex === idx && gs?.phase === 'play';
          const color = SYMBOL_COLORS[idx];
          return (
            <View
              key={p.uid}
              style={[
                styles.playerCard,
                isActive && { borderColor: color, backgroundColor: color + '1A' },
              ]}
            >
              <PlayerAvatar avatarId={p.avatarId} size={36} isActive={isActive} />
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: isActive ? color : COLORS.textSecondary }]}>
                  {p.uid === user.uid ? 'You' : p.name}
                </Text>
                <Text style={[styles.playerSymbol, { color }]}>{SYMBOLS[idx]}</Text>
              </View>
              {isActive && <View style={[styles.activeDot, { backgroundColor: color }]} />}
            </View>
          );
        })}
      </View>

      {/* Turn label */}
      {gs?.phase === 'play' && (
        <View style={styles.turnRow}>
          <Text style={[styles.turnSymbol, { color: SYMBOL_COLORS[activeSymbolIdx] }]}>
            {SYMBOLS[activeSymbolIdx]}
          </Text>
          <Text style={styles.turnText}>
            {isMyTurn && !isLocal ? "Your turn!" : `${currentPlayer?.name || '...'}'s turn`}
          </Text>
        </View>
      )}

      {/* Board — premium neon grid */}
      <View style={[styles.boardWrap, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
        {/* Neon grid lines with glow */}
        <View style={[styles.gridLine, styles.gridLineV, styles.gridLineGlow, { left: CELL_SIZE - 1 }]} />
        <View style={[styles.gridLine, styles.gridLineV, { left: CELL_SIZE - 1 }]} />
        <View style={[styles.gridLine, styles.gridLineV, styles.gridLineGlow, { left: CELL_SIZE * 2 - 1 }]} />
        <View style={[styles.gridLine, styles.gridLineV, { left: CELL_SIZE * 2 - 1 }]} />
        <View style={[styles.gridLine, styles.gridLineH, styles.gridLineGlow, { top: CELL_SIZE - 1 }]} />
        <View style={[styles.gridLine, styles.gridLineH, { top: CELL_SIZE - 1 }]} />
        <View style={[styles.gridLine, styles.gridLineH, styles.gridLineGlow, { top: CELL_SIZE * 2 - 1 }]} />
        <View style={[styles.gridLine, styles.gridLineH, { top: CELL_SIZE * 2 - 1 }]} />

        {/* Explicit rows */}
        {[0, 1, 2].map(row => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {[0, 1, 2].map(col => {
              const i = row * 3 + col;
              return (
                <Cell
                  key={col}
                  index={i}
                  value={board[i]}
                  playerOrder={gs?.playerOrder ?? []}
                  onPress={handleCellPress}
                  canPress={isMyTurn && gs?.phase === 'play'}
                  isWinCell={winLine.includes(i)}
                />
              );
            })}
          </View>
        ))}

        {/* Floating reaction */}
        {reaction && (
          <Animated.Text style={[styles.floatReaction, { opacity: reactionOpacity }]}>
            {reaction}
          </Animated.Text>
        )}
      </View>

      {/* Result banner */}
      {gs?.phase === 'finished' && (
        <Animated.View
          style={[
            styles.resultBanner,
            { opacity: resultOpacity, transform: [{ scale: resultScale }] },
          ]}
        >
          {gs.draw ? (
            <>
              <Text style={styles.resultEmoji}>🤝</Text>
              <Text style={styles.resultTitle}>It{"'"}s a Draw!</Text>
              <Text style={styles.resultSub}>Well played!</Text>
            </>
          ) : (
            <>
              <Text style={styles.resultEmoji}>🎉</Text>
              <Text style={[styles.resultTitle, { color: SYMBOL_COLORS[Math.max(winnerSymbolIdx, 0)] }]}>
                {winnerPlayer?.uid === user.uid ? 'You Win!' : `${winnerPlayer?.name} Wins!`}
              </Text>
              <Text style={styles.resultSub}>
                {winnerSymbolIdx >= 0 ? SYMBOLS[winnerSymbolIdx] : ''} takes the board!
              </Text>
            </>
          )}
          <TouchableOpacity
            style={styles.resultBtn}
            onPress={() => {
              if (isLocal) {
                resetGame();
              } else {
                navigation.navigate('Home');
              }
            }}
          >
            <Text style={styles.resultBtnText}>
              {isLocal ? '🔄 Play Again' : '🏠 Home'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Bottom controls */}
      <View style={styles.controls}>
        {!isLocal && <ReactionsBar roomCode={code} uid={user.uid} />}
        {isLocal && (
          <TouchableOpacity style={styles.restartBtn} onPress={resetGame}>
            <Text style={styles.restartBtnText}>🔄 Restart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
    </ScreenTransition>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bgDark,
    alignItems: 'center', paddingBottom: 70,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg, paddingTop: SIZES.xl, paddingBottom: SIZES.sm,
    width: '100%',
  },
  leaveText: { color: COLORS.error, fontSize: SIZES.fontXl, fontFamily: FONTS.body },
  headerTitle: { fontFamily: FONTS.heading, fontSize: SIZES.fontXl, color: COLORS.textPrimary },
  gameCode: { color: COLORS.textMuted, fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontSm },

  playersRow: {
    flexDirection: 'row', gap: SIZES.md,
    paddingHorizontal: SIZES.lg, width: '100%', marginBottom: SIZES.md,
  },
  playerCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    padding: SIZES.md, borderWidth: 2, borderColor: COLORS.bgCardLight,
    position: 'relative',
  },
  playerInfo: { flex: 1 },
  playerName: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd },
  playerSymbol: { fontFamily: FONTS.heading, fontSize: SIZES.fontXl, lineHeight: 28 },
  activeDot: {
    width: 8, height: 8, borderRadius: 4,
    position: 'absolute', top: 8, right: 8,
  },

  turnRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.md,
  },
  turnText: {
    fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd, color: COLORS.textSecondary,
  },
  turnSymbol: { fontFamily: FONTS.heading, fontSize: SIZES.fontXl },

  // Board — premium dark with subtle border glow
  boardWrap: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXl,
    borderWidth: 2, borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  cellsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cellHoverHint: {
    position: 'absolute',
    width: '60%', height: '60%',
    borderRadius: SIZES.radiusMd,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  winHighlight: { backgroundColor: 'rgba(255,215,0,0.3)', borderRadius: 4 },
  symbol: { fontFamily: FONTS.heading, fontWeight: 'bold' },
  gridLine: { position: 'absolute', backgroundColor: COLORS.bgCardLight },
  gridLineGlow: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    // Slightly wider for glow backdrop
    zIndex: -1,
  },
  gridLineV: { width: 2, top: 0, bottom: 0 },
  gridLineH: { height: 2, left: 0, right: 0 },
  floatReaction: {
    position: 'absolute', fontSize: 56,
    alignSelf: 'center', top: '30%',
  },

  // Result banner
  resultBanner: {
    position: 'absolute',
    marginTop: BOARD_SIZE * 0.1,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
    minWidth: 240,
    zIndex: 20,
    ...SHADOWS.lg,
  },
  resultEmoji: { fontSize: 52, marginBottom: SIZES.sm },
  resultTitle: {
    fontFamily: FONTS.heading, fontSize: SIZES.fontXxl,
    color: COLORS.textPrimary, textAlign: 'center',
  },
  resultSub: {
    fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd,
    color: COLORS.textSecondary, marginTop: 4, textAlign: 'center',
  },
  resultBtn: {
    marginTop: SIZES.lg, backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.md,
  },
  resultBtnText: { color: '#fff', fontFamily: FONTS.body, fontSize: SIZES.fontMd },

  // Controls bar
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SIZES.xl, paddingVertical: SIZES.md,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1, borderTopColor: COLORS.bgCardLight,
  },
  restartBtn: {
    backgroundColor: COLORS.bgCardLight, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.xl, paddingVertical: SIZES.md,
  },
  restartBtnText: { color: COLORS.textPrimary, fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd },
});
