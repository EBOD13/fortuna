// theme/typography.ts
/**
 * Typography and spacing system for Fortuna
 */

import { Platform } from 'react-native';

export const typography = {
  // Display - Large amounts, hero numbers
  display: {
    large: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: '300' as const,
      letterSpacing: -1,
    },
    medium: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '300' as const,
      letterSpacing: -0.5,
    },
    small: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '300' as const,
    },
  },

  // Headlines
  headline: {
    large: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '600' as const,
    },
    medium: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    small: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
  },

  // Titles
  title: {
    large: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    medium: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '600' as const,
    },
    small: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
    },
  },

  // Body text
  body: {
    large: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    medium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    small: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
  },

  // Labels
  label: {
    large: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
    },
    medium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
    },
    small: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
  },

  // Caption
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  // Special glow shadows for accents
  emerald: {
    shadowColor: '#046C4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  gold: {
    shadowColor: '#BFA46F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Screen padding
export const screenPadding = {
  horizontal: spacing.lg,
  vertical: spacing.md,
};