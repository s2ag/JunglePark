// ProfileScreen — Player stats & settings
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS, AVATARS } from '../config/theme';
import { getUserProfile, signOut } from '../services/auth';
import PlayerAvatar from '../components/PlayerAvatar';

export default function ProfileScreen({ navigation, route }) {
  const { user } = route.params;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await getUserProfile(user.uid);
      setProfile(p);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const stats = profile?.stats || { wins: 0, losses: 0, gamesPlayed: 0 };
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <PlayerAvatar avatarId={user.avatarId || 1} size={96} showBorder borderColor={COLORS.primary} />
        <Text style={styles.playerName}>{profile?.name || user.name}</Text>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>🌴 Jungle Parker</Text>
          </View>
          {stats.wins >= 10 && (
            <View style={[styles.tag, { borderColor: COLORS.accent }]}>
              <Text style={[styles.tagText, { color: COLORS.accent }]}>🏆 Champion</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Games Played', value: stats.gamesPlayed, emoji: '🎮' },
          { label: 'Wins', value: stats.wins, emoji: '🏆', color: COLORS.success },
          { label: 'Losses', value: stats.losses, emoji: '💀', color: COLORS.error },
          { label: 'Win Rate', value: `${winRate}%`, emoji: '📊', color: COLORS.accent },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={[styles.statValue, s.color && { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Avatar section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Animal 🐾</Text>
        <View style={styles.avatarShowcase}>
          {AVATARS.map((av) => (
            <View
              key={av.id}
              style={[styles.avItem, av.id === (user.avatarId || 1) && styles.avItemActive]}
            >
              <Text style={styles.avEmoji}>{av.emoji}</Text>
              {av.id === (user.avatarId || 1) && (
                <View style={styles.avBadge}><Text style={styles.avBadgeText}>✓</Text></View>
              )}
            </View>
          ))}
        </View>
        <Text style={styles.avatarHint}>Avatar selected at signup. Re-register to change.</Text>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
        <Text style={styles.signOutText}>🚪 Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  scroll: { padding: SIZES.lg, paddingBottom: SIZES.xxxl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SIZES.xl,
  },
  backText: { color: COLORS.textSecondary, fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd },
  headerTitle: { fontFamily: FONTS.heading, fontSize: SIZES.fontXl, color: COLORS.textPrimary },
  profileCard: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXl,
    alignItems: 'center', padding: SIZES.xl, marginBottom: SIZES.lg,
    borderWidth: 1, borderColor: COLORS.bgCardLight, gap: SIZES.sm, ...SHADOWS.md,
  },
  playerName: { fontFamily: FONTS.heading, fontSize: SIZES.fontXxl, color: COLORS.textPrimary },
  tagRow: { flexDirection: 'row', gap: SIZES.sm },
  tag: {
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.md, paddingVertical: 4,
  },
  tagText: { color: COLORS.primary, fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontSm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginBottom: SIZES.lg },
  statCard: {
    width: '47%', backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLg,
    alignItems: 'center', paddingVertical: SIZES.lg, borderWidth: 1, borderColor: COLORS.bgCardLight,
  },
  statEmoji: { fontSize: 28, marginBottom: SIZES.xs },
  statValue: { fontFamily: FONTS.heading, fontSize: SIZES.fontXxl, color: COLORS.textPrimary },
  statLabel: { fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontSm, color: COLORS.textSecondary, marginTop: 4 },
  section: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXl,
    padding: SIZES.lg, marginBottom: SIZES.lg, borderWidth: 1, borderColor: COLORS.bgCardLight,
  },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: SIZES.fontXl, color: COLORS.textPrimary, marginBottom: SIZES.md },
  avatarShowcase: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SIZES.sm },
  avItem: {
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bgCardLight, borderRadius: SIZES.radiusMd,
    borderWidth: 2, borderColor: 'transparent', position: 'relative',
  },
  avItemActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(255,215,0,0.1)' },
  avEmoji: { fontSize: 28 },
  avBadge: {
    position: 'absolute', top: -4, right: -4, width: 16, height: 16,
    backgroundColor: COLORS.accent, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  avBadgeText: { fontSize: 9, color: COLORS.bgDark, fontFamily: FONTS.body },
  avatarHint: { color: COLORS.textMuted, fontSize: SIZES.fontXs, fontFamily: FONTS.bodyRegular },
  signOutBtn: {
    backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusFull, alignItems: 'center',
    paddingVertical: SIZES.md, borderWidth: 1, borderColor: COLORS.error,
  },
  signOutText: { color: COLORS.error, fontFamily: FONTS.bodySemiBold, fontSize: SIZES.fontMd },
});
