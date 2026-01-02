// theme/colors.ts
/**
 * Fortuna Color Palette
 * An elegant, sophisticated dark palette for financial wellness
 */

export const colors = {
  // Primary Colors
  charcoal: {
    50: '#3D3D3D',
    100: '#353535',
    200: '#2D2D2D',
    300: '#252525',
    400: '#1F1F1F',
    500: '#1B1B1B', // Main charcoal
    600: '#171717',
    700: '#131313',
    800: '#0F0F0F',
    900: '#0A0A0A',
  },

  emerald: {
    50: '#E8F5F0',
    100: '#C6E6DA',
    200: '#9FD4C3',
    300: '#78C2AC',
    400: '#5AB499',
    500: '#046C4E', // Main emerald
    600: '#035F44',
    700: '#025239',
    800: '#02452F',
    900: '#013824',
  },

  gold: {
    50: '#F9F6EF',
    100: '#F0E9D8',
    200: '#E5D9BE',
    300: '#D9C9A3',
    400: '#CCBA8A',
    500: '#BFA46F', // Main matte gold
    600: '#A89056',
    700: '#8E793F',
    800: '#74622A',
    900: '#5A4B18',
  },

  slate: {
    50: '#E8EAEC',
    100: '#C5CBCF',
    200: '#9EA8B0',
    300: '#778591',
    400: '#5A6B79',
    500: '#2E3A46', // Main slate
    600: '#27323C',
    700: '#202A32',
    800: '#1A2228',
    900: '#131A1F',
  },

  burgundy: {
    50: '#F2E6E8',
    100: '#DFC0C6',
    200: '#C9969F',
    300: '#B36C78',
    400: '#A24C5A',
    500: '#5A1E2B', // Main burgundy
    600: '#4E1A25',
    700: '#42161F',
    800: '#361219',
    900: '#2A0E13',
  },

  // Semantic Colors
  success: '#046C4E', // Use emerald
  warning: '#BFA46F', // Use gold
  error: '#5A1E2B', // Use burgundy
  info: '#2E3A46', // Use slate

  // Background
  background: {
    primary: '#1B1B1B', // Charcoal
    secondary: '#252525', // Slightly lighter
    tertiary: '#2E3A46', // Slate for cards
    elevated: '#2D2D2D', // Elevated surfaces
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#C5CBCF', // Light slate
    tertiary: '#778591', // Medium slate
    muted: '#5A6B79', // Dark slate
    accent: '#BFA46F', // Gold for highlights
    success: '#046C4E',
    error: '#A24C5A', // Lighter burgundy for readability
  },

  // Borders
  border: {
    light: '#3D3D3D',
    default: '#2E3A46',
    dark: '#252525',
  },

  // Emotion colors (adjusted for dark theme)
  emotions: {
    happy: '#046C4E', // Emerald
    excited: '#BFA46F', // Gold
    celebratory: '#D9C9A3', // Light gold
    neutral: '#778591', // Slate
    planned: '#5AB499', // Light emerald
    bored: '#5A6B79', // Dark slate
    tired: '#4E1A25', // Dark burgundy
    stressed: '#5A1E2B', // Burgundy
    anxious: '#A24C5A', // Light burgundy
    frustrated: '#5A1E2B', // Burgundy
    sad: '#4E1A25', // Dark burgundy
    guilty: '#42161F', // Darker burgundy
    impulsive: '#BFA46F', // Gold (attention)
  },

  // Category colors
  categories: {
    food: '#046C4E',
    transport: '#2E3A46',
    entertainment: '#BFA46F',
    shopping: '#A24C5A',
    utilities: '#5A6B79',
    healthcare: '#5A1E2B',
    education: '#5AB499',
    housing: '#778591',
    other: '#3D3D3D',
  },
};

export type ColorScheme = typeof colors;