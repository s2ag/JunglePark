// AuthScreen — Guest login (instant) + silent Firebase background auth
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator, TextInput, ScrollView
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS, AVATARS } from '../config/theme';
import { signInAsGuest } from '../services/auth';

const { width, height } = Dimensions.get('window');

const FloatingEmoji = ({ emoji, delay, startX }) => {
  const y = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      y.setValue(height + 50);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: -100, duration: 6000, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.6, duration: 500, useNativeDriver: false }),
            Animated.delay(4500),
            Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: false }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.Text style={[styles.floatingEmoji, { left: startX, transform: [{ translateY: y }], opacity }]}>
      {emoji}
    </Animated.Text>
  );
};

const FLOATING = [
  { emoji: '🎲', delay: 0, startX: 30 },
  { emoji: '🎮', delay: 1200, startX: width * 0.6 },
  { emoji: '🏆', delay: 2400, startX: width * 0.2 },
  { emoji: '🌴', delay: 3000, startX: width * 0.45 },
];

export default function AuthScreen({ navigation, setLocalUser }) {
  const [step, setStep] = useState('name'); // 'name' | 'avatar'
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    if (!name.trim()) return;

    if (step === 'name') {
      setStep('avatar');
      return;
    }

    // Create local guest user immediately — no waiting for Firebase
    const guestUid = `guest-${Date.now()}`;
    const guestUser = {
      uid: guestUid,
      name: name.trim(),
      avatarId: selectedAvatar,
      isGuest: true,
    };

    // Enter the app right away
    setLocalUser(guestUser);

    // Sign in to Firebase in the background (needed for online rooms)
    // Do NOT await — we don't block the user on this
    signInAsGuest(name.trim(), selectedAvatar).catch(() => {
      // Firebase sign-in failed — that's OK, user can still play offline
    });
  };

  return (
    <View style={styles.container}>
      {FLOATING.map((f, i) => <FloatingEmoji key={i} {...f} />)}

      {/* Logo */}
      <View style={styles.logoArea}>
        <Text style={styles.logoEmoji}>🌴🎮🌴</Text>
        <Text style={styles.logoTitle}>Jungle Park</Text>
        <Text style={styles.logoSub}>Board Games Online</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {step === 'name' && (
          <>
            <Text style={styles.cardTitle}>What's your name? 🦁</Text>
            <Text style={styles.cardSub}>This will show to other players</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name..."
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoFocus
              onSubmitEditing={handleStart}
            />
          </>
        )}

        {step === 'avatar' && (
          <>
            <Text style={styles.cardTitle}>Pick your animal! 🎭</Text>
            <Text style={styles.cardSub}>Choose your jungle character</Text>
            <ScrollView style={styles.avatarScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.avatarGrid}>
                {AVATARS.map(av => (
                  <TouchableOpacity
                    key={av.id}
                    onPress={() => setSelectedAvatar(av.id)}
                    style={[styles.avatarOption, selectedAvatar === av.id && styles.avatarSelected]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.avatarEmoji}>{av.emoji}</Text>
                    <Text style={styles.avatarName}>{av.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, (!name.trim()) && { opacity: 0.5 }]}
          onPress={handleStart}
          disabled={!name.trim() || loading}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {step === 'name' ? 'Next →' : '🚀 Start Playing!'}
          </Text>
        </TouchableOpacity>

        {step === 'avatar' && (
          <TouchableOpacity
            onPress={() => setStep('name')}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bgDark,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: SIZES.lg,
  },
  floatingEmoji: { position: 'absolute', fontSize: 32 },
  logoArea: { alignItems: 'center', marginBottom: SIZES.xl },
  logoEmoji: { fontSize: 56 },
  logoTitle: {
    fontFamily: FONTS.heading, fontSize: SIZES.fontDisplay,
    color: COLORS.textPrimary, marginTop: SIZES.sm,
  },
  logoSub: {
    fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontLg,
    color: COLORS.textSecondary, marginTop: 4,
  },
  card: {
    width: '100%', backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXl,
    padding: SIZES.xl, borderWidth: 1, borderColor: COLORS.bgCardLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
    maxHeight: height * 0.65,
  },
  cardTitle: {
    fontFamily: FONTS.heading, fontSize: SIZES.fontXxl,
    color: COLORS.textPrimary, textAlign: 'center', marginBottom: SIZES.xs,
  },
  cardSub: {
    fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd,
    color: COLORS.textSecondary, textAlign: 'center', marginBottom: SIZES.lg,
  },
  input: {
    backgroundColor: COLORS.bgCardLight, borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.md,
    color: COLORS.textPrimary, fontSize: SIZES.fontLg,
    fontFamily: FONTS.body, marginBottom: SIZES.lg,
    borderWidth: 1, borderColor: COLORS.bgGlass,
  },
  avatarScroll: { maxHeight: 220, marginBottom: SIZES.lg },
  avatarGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, justifyContent: 'center',
  },
  avatarOption: {
    width: 72, alignItems: 'center', backgroundColor: COLORS.bgCardLight,
    borderRadius: SIZES.radiusMd, padding: SIZES.sm,
    borderWidth: 2, borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: COLORS.accent, backgroundColor: 'rgba(255,215,0,0.12)',
  },
  avatarEmoji: { fontSize: 32 },
  avatarName: {
    fontSize: SIZES.fontXs, color: COLORS.textSecondary,
    marginTop: 4, fontFamily: FONTS.bodySemiBold,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull,
    paddingVertical: SIZES.md + 2, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: SIZES.fontLg, fontFamily: FONTS.body },
  backBtn: { alignItems: 'center', marginTop: SIZES.md },
  backBtnText: {
    color: COLORS.textSecondary, fontFamily: FONTS.bodyRegular, fontSize: SIZES.fontMd,
  },
});
