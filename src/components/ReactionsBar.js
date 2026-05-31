// Emoji Reactions Bar — In-game quick reactions
import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../config/theme';
import { sendReaction } from '../services/rooms';

const EMOJIS = ['👍', '🎲', '🎉', '😭', '🔥', '😂', '👏', '💀'];

export default function ReactionsBar({ roomCode, uid }) {
  const scaleAnims = useMemo(() => EMOJIS.map(() => new Animated.Value(1)), []);

  const handleReact = async (emoji, idx) => {
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 1.5, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnims[idx], { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    try { await sendReaction(roomCode, uid, emoji); } catch (_e) {}
  };

  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        {EMOJIS.map((emoji, idx) => (
          <TouchableOpacity key={emoji} onPress={() => handleReact(emoji, idx)} style={styles.btn} activeOpacity={0.7}>
            <Animated.Text style={[styles.emoji, { transform: [{ scale: scaleAnims[idx] }] }]}>
              {emoji}
            </Animated.Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgGlass,
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
    paddingVertical: SIZES.xs,
    maxWidth: '100%',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    gap: 4,
  },
  btn: { padding: 6 },
  emoji: { fontSize: 22 },
});
