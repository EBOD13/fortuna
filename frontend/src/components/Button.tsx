// components/Button.tsx
/**
 * Elegant Button Component for Fortuna
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
    textStyle,
  ];

  const getLoaderColor = () => {
    if (variant === 'outline' || variant === 'ghost') return colors.emerald[500];
    if (variant === 'gold') return colors.charcoal[500];
    return colors.text.primary;
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },

  // Variants
  primary: {
    backgroundColor: colors.emerald[500],
    ...shadows.emerald,
  },
  secondary: {
    backgroundColor: colors.slate[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.emerald[500],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  gold: {
    backgroundColor: colors.gold[500],
    ...shadows.gold,
  },

  // Sizes
  smallSize: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  mediumSize: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  largeSize: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },

  // Text
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: colors.text.primary,
  },
  secondaryText: {
    color: colors.text.primary,
  },
  outlineText: {
    color: colors.emerald[500],
  },
  ghostText: {
    color: colors.emerald[500],
  },
  goldText: {
    color: colors.charcoal[500],
  },

  // Text sizes
  smallText: {
    ...typography.label.medium,
  },
  mediumText: {
    ...typography.label.large,
  },
  largeText: {
    ...typography.body.large,
    fontWeight: '600',
  },

  // States
  disabled: {
    opacity: 0.4,
  },
  disabledText: {},
  fullWidth: {
    width: '100%',
  },
});