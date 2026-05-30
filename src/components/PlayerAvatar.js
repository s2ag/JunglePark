// Player Avatar Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AVATARS, COLORS, SIZES } from '../config/theme';

export default function PlayerAvatar({ avatarId = 1, size = 48, showBorder = false, borderColor = COLORS.primary, name, isActive = false }) {
  const avatar = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          showBorder && { borderColor, borderWidth: 3 },
          isActive && styles.activePulse,
        ]}
      >
        <Text style={{ fontSize: size * 0.55 }}>{avatar.emoji}</Text>
      </View>
      {name ? <Text style={styles.name} numberOfLines={1}>{name}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  avatar: {
    backgroundColor: COLORS.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePulse: {
    borderColor: COLORS.accent,
    borderWidth: 3,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },
  name: {
    color: COLORS.textSecondary,
    fontSize: SIZES.fontXs,
    marginTop: 4,
    fontFamily: 'Nunito_600SemiBold',
    maxWidth: 60,
    textAlign: 'center',
  },
});
