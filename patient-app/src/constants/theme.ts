export const Colors = {
  // Brand colors matching AlzCare web system
  primary: '#0D9488', // Teal-600
  primaryLight: '#14B8A6', // Teal-500
  primaryDark: '#0F766E', // Teal-700
  primaryGlow: 'rgba(13, 148, 136, 0.25)',

  // Secondary & Accents
  emerald: '#10B981',
  emeraldLight: '#34D399',
  emeraldGlow: 'rgba(16, 185, 129, 0.2)',
  amber: '#F59E0B',
  amberLight: '#FBBF24',
  amberGlow: 'rgba(245, 158, 11, 0.2)',
  rose: '#F43F5E',
  indigo: '#6366F1',
  blue: '#3B82F6',

  // Backgrounds & Surface (Sleek, high-contrast dark mode tailored for cognitive clarity)
  background: '#070B14',
  card: '#0F172A',
  cardSecondary: '#1E293B',
  surfaceHighlight: '#1E293B',
  modalBackground: '#0B1120',

  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.1)',
  borderActive: 'rgba(13, 148, 136, 0.5)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',

  // High contrast text (large, clear, legible)
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#070B14',
  textTeal: '#2DD4BF',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#38BDF8',
};

export const Typography = {
  // Accessible, readable font sizes for elderly and cognitive care patients
  titleHero: 30,
  titleLarge: 24,
  titleMedium: 20,
  titleSmall: 18,
  bodyLarge: 16,
  bodyRegular: 14,
  bodySmall: 12,
  caption: 11,

  // Weights
  bold: '700' as const,
  semiBold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const TouchTarget = {
  minHeight: 48,
  borderRadius: 14,
};

export const theme = {
  colors: {
    primary: Colors.primary,
    primaryLight: Colors.primaryLight,
    primaryDark: Colors.primaryDark,
    accent: Colors.indigo,
    background: Colors.background,
    surface: Colors.card,
    surfaceLight: Colors.cardSecondary,
    border: Colors.border,
    borderSubtle: Colors.borderSubtle,
    textPrimary: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
    textMuted: Colors.textMuted,
    success: Colors.success,
    warning: Colors.warning,
    danger: Colors.danger,
    info: Colors.info,
  },
  typography: {
    sizes: {
      hero: Typography.titleHero,
      h1: Typography.titleLarge,
      h2: Typography.titleMedium,
      h3: Typography.titleSmall,
      body: Typography.bodyLarge,
      caption: Typography.caption,
    },
    weights: {
      bold: Typography.bold,
      semibold: Typography.semiBold,
      medium: Typography.medium,
      regular: Typography.regular,
    },
  },
  spacing: Spacing,
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
};

export default theme;
