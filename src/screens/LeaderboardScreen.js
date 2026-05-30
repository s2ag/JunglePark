// LeaderboardScreen — Top players by wins
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS, SIZES, FONTS, SHADOWS } from '../config/theme';
import PlayerAvatar from '../components/PlayerAvatar';

export default function LeaderboardScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('stats.wins', 'desc'), limit(20));
        const snap = await getDocs(q);
        setPlayers(snap.docs.map((d) => d.data()));
      } catch (e) {
        console.log('Leaderboard error:', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const medals = ['🥇', '🥈', '🥉'];
  const rowColors = [COLORS.accent, '#C0C0C0', '#CD7F32'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 60 }} />
      ) : players.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyText}>No players yet!</Text>
          <Text style={styles.emptySubText}>Play some games to appear here</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Top 3 podium */}
          {players.length >= 3 && (
            <View style={styles.podiumRow}>
              {[1, 0, 2].map((i) => {
                const p = players[i];
                if (!p) return <View key={i} style={{ width: '30%' }} />;
                return (
                  <View key={i} style={[styles.podiumItem, i === 0 && styles.podiumFirst]}>
                    <Text style={{ fontSize: i === 0 ? 36 : 28 }}>{medals[i]}</Text>
                    <PlayerAvatar avatarId={p.avatarId || 1} size={i === 0 ? 64 : 48} showBorder borderColor={rowColors[i]} />
                    <Text style={[styles.podiumName, { color: rowColors[i] }]} numberOfLines={1}>{p.name}</Text>
                    <View style={styles.podiumWins}>
                      <Text style={styles.podiumWinsText}>{p.stats?.wins || 0} wins</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Rest of the list */}
          {players.slice(3).map((p, idx) => (
            <View key={p.uid} style={styles.listRow}>
              <Text style={styles.rank}>#{idx + 4}</Text>
              <PlayerAvatar avatarId={p.avatarId || 1} size={40} />
              <View style={styles.listInfo}>
                <Text style={styles.listName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.listSub}>{p.stats?.gamesPlayed || 0} games played</Text>
              </View>
              <View style={styles.winsBox}>
                <Text style={styles.winsNum}>{p.stats?.wins || 0}</Text>
                <Text style={styles.winsLabel}>wins</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SIZES.lg, paddingTop: SIZES.xl,
  },
  backText: { color: COLORS.textSecondary, fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd },
  headerTitle: { fontFamily: FONTS.heading, fontSize: SIZES.fontXxl, color: COLORS.textPrimary },
  list: { padding: SIZES.lg, gap: SIZES.sm, paddingBottom: SIZES.xxxl },
  podiumRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'flex-end', backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusXl, padding: SIZES.lg, marginBottom: SIZES.lg,
    borderWidth: 1, borderColor: COLORS.bgCardLight, ...SHADOWS.md,
  },
  podiumItem: { alignItems: 'center', width: '30%', gap: 6 },
  podiumFirst: { paddingBottom: SIZES.sm },
  podiumName: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontSm, textAlign: 'center' },
  podiumWins: {
    backgroundColor: COLORS.bgCardLight, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm, paddingVertical: 2,
  },
  podiumWinsText: { color: COLORS.textSecondary, fontSize: SIZES.fontXs, fontFamily: FONTS.bodySemiBold },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    padding: SIZES.md, borderWidth: 1, borderColor: COLORS.bgCardLight,
  },
  rank: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: SIZES.fontMd, width: 32, textAlign: 'center' },
  listInfo: { flex: 1 },
  listName: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd, color: COLORS.textPrimary },
  listSub: { fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontXs, color: COLORS.textMuted },
  winsBox: { alignItems: 'center' },
  winsNum: { fontFamily: FONTS.heading, fontSize: SIZES.fontXl, color: COLORS.accent },
  winsLabel: { fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontXs, color: COLORS.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SIZES.sm },
  emptyEmoji: { fontSize: 64 },
  emptyText: { fontFamily: FONTS.heading, fontSize: SIZES.fontXxl, color: COLORS.textPrimary },
  emptySubText: { fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd, color: COLORS.textSecondary },
});
