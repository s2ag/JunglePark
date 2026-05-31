// AnimatedComponents — Reusable, 60fps-optimized animation primitives
// All animations use useNativeDriver: true for Android performance
import React, { useMemo, useEffect, memo } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { COLORS } from '../../config/theme';

/**
 * PulseGlow — Looping glow/pulse around a child element.
 * Uses opacity + scale (native driver) for 60fps on Android.
 */
export const PulseGlow = memo(function PulseGlow({
  children,
  active = true,
  color = COLORS.accent,
  size = 60,
  intensity = 0.6,
  duration = 1200,
}) {
  const pulseAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (!active) {
      pulseAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, duration, pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });
  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [intensity, 0],
  });

  return (
    <>
      {active && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: color,
              transform: [{ scale }],
              opacity,
            },
          ]}
        />
      )}
      {children}
    </>
  );
});

/**
 * FadeInScale — Entrance animation for any UI element.
 * Fades in and scales from small to full size.
 */
export const FadeInScale = memo(function FadeInScale({
  children,
  delay = 0,
  duration = 400,
  style,
}) {
  const anim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  }, [anim, delay, duration]);

  const opacity = anim;
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
});

/**
 * FloatingElement — Subtle idle bob animation for decorative elements.
 * Keeps UI feeling alive without expensive re-renders.
 */
export const FloatingElement = memo(function FloatingElement({
  children,
  amplitude = 4,
  duration = 2500,
  style,
}) {
  const anim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -amplitude],
  });

  return (
    <Animated.View style={[style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
});

/**
 * ScreenTransition — Wrap screen content for smooth enter/exit animations.
 */
export const ScreenTransition = memo(function ScreenTransition({
  children,
  style,
}) {
  const opacity = useMemo(() => new Animated.Value(0), []);
  const translateY = useMemo(() => new Animated.Value(30), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={[{ flex: 1, opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
});

/**
 * ParticleEffect — Lightweight particle burst for win/celebration moments.
 * Spawns N animated dots that fly outward and fade.
 */
export const ParticleEffect = memo(function ParticleEffect({
  active = false,
  count = 12,
  colors = [COLORS.accent, COLORS.primary, COLORS.green, COLORS.pink],
  origin = { x: 0, y: 0 },
  radius = 100,
}) {
  const anims = useMemo(
    () => Array.from({ length: count }, () => new Animated.Value(0)),
    [count]
  );

  useEffect(() => {
    if (!active) {
      anims.forEach((a) => a.setValue(0));
      return;
    }
    Animated.stagger(
      40,
      anims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [active, anims]);

  if (!active) return null;

  return anims.map((a, i) => {
    const angle = (i / count) * Math.PI * 2;
    const tx = Math.cos(angle) * radius;
    const ty = Math.sin(angle) * radius;
    const color = colors[i % colors.length];

    const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [0, tx] });
    const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, ty] });
    const opacity = a.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.8, 0] });
    const scale = a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.2, 0.5] });

    return (
      <Animated.View
        key={i}
        style={[
          styles.particle,
          {
            backgroundColor: color,
            left: origin.x - 4,
            top: origin.y - 4,
            transform: [{ translateX }, { translateY }, { scale }],
            opacity,
          },
        ]}
      />
    );
  });
});

const styles = StyleSheet.create({
  pulseRing: {
    position: 'absolute',
    borderWidth: 3,
    alignSelf: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
