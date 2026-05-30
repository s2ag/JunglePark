// 🎨 Jungle Park — Global Theme & Design System

export const COLORS = {
  // Primary Palette
  primary: '#FF6B35',        // Warm orange
  primaryDark: '#E84A0C',
  primaryLight: '#FF9A6C',

  // Accent
  accent: '#FFD700',         // Golden yellow
  accentDark: '#FFA500',

  // Game Colors (player tokens)
  red: '#FF4757',
  blue: '#3742FA',
  green: '#2ED573',
  yellow: '#FFA502',
  purple: '#A855F7',
  pink: '#FF69B4',

  // Background
  bgDark: '#0F0E17',
  bgMid: '#1A1A2E',
  bgCard: '#16213E',
  bgCardLight: '#1E2D4E',
  bgGlass: 'rgba(255,255,255,0.08)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A8B2D8',
  textMuted: '#5A6A8A',

  // Status
  success: '#2ED573',
  warning: '#FFD700',
  error: '#FF4757',
  info: '#1E90FF',

  // Board
  boardLight: '#F0D9B5',
  boardDark: '#B58863',
  boardBorder: '#8B6914',

  // Gradients (used as array pairs for LinearGradient)
  gradientPrimary: ['#FF6B35', '#FF3CAC'],
  gradientAccent: ['#FFD700', '#FF6B35'],
  gradientBg: ['#0F0E17', '#1A1A2E', '#16213E'],
  gradientCard: ['#1E2D4E', '#16213E'],
  gradientLudo: ['#2D1B69', '#11998E'],
  gradientSnake: ['#134E5E', '#71B280'],
};

export const FONTS = {
  heading: 'Fredoka_400Regular',
  body: 'Nunito_700Bold',
  bodyRegular: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Border radius
  radiusSm: 8,
  radiusMd: 16,
  radiusLg: 24,
  radiusXl: 32,
  radiusFull: 999,

  // Font sizes
  fontXs: 10,
  fontSm: 12,
  fontMd: 14,
  fontLg: 16,
  fontXl: 20,
  fontXxl: 24,
  fontXxxl: 32,
  fontDisplay: 48,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  }),
};

// Player token colors for Ludo/S&L
export const PLAYER_COLORS = {
  1: { primary: '#FF4757', light: '#FF6B7A', name: 'Red', emoji: '🔴' },
  2: { primary: '#3742FA', light: '#5E6CFF', name: 'Blue', emoji: '🔵' },
  3: { primary: '#2ED573', light: '#54E891', name: 'Green', emoji: '🟢' },
  4: { primary: '#FFA502', light: '#FFBA3E', name: 'Yellow', emoji: '🟡' },
};

export const AVATARS = [
  { id: 1, emoji: '🦁', name: 'Lion' },
  { id: 2, emoji: '🐘', name: 'Elephant' },
  { id: 3, emoji: '🐒', name: 'Monkey' },
  { id: 4, emoji: '🦊', name: 'Fox' },
  { id: 5, emoji: '🐯', name: 'Tiger' },
  { id: 6, emoji: '🦓', name: 'Zebra' },
  { id: 7, emoji: '🦒', name: 'Giraffe' },
  { id: 8, emoji: '🐸', name: 'Frog' },
  { id: 9, emoji: '🦜', name: 'Parrot' },
  { id: 10, emoji: '🐢', name: 'Turtle' },
  { id: 11, emoji: '🦋', name: 'Butterfly' },
  { id: 12, emoji: '🐼', name: 'Panda' },
];
