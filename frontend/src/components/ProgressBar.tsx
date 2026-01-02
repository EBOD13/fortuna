// components/ProgressBar.tsx
/**
 * Progress Components for Fortuna
 * - ProgressBar: Visual progress indicator with glow effect
 * - AmountDisplay: Formatted currency display
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

// ============================================
// PROGRESS BAR
// ============================================

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  showAmount?: boolean;
  currentAmount?: number;
  targetAmount?: number;
  style?: ViewStyle;
  variant?: 'default' | 'gradient' | 'glow';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = colors.gold[500],
  backgroundColor = colors.charcoal[300],
  showLabel = false,
  showAmount = false,
  currentAmount,
  targetAmount,
  style,
  variant = 'default',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Dynamic color based on progress
  const getProgressColor = () => {
    if (progress > 100) return colors.burgundy[500];
    if (progress > 80) return colors.gold[500];
    return color;
  };

  const glowStyle = variant === 'glow' ? {
    shadowColor: getProgressColor(),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  } : {};

  return (
    <View style={style}>
      {showAmount && currentAmount !== undefined && targetAmount !== undefined && (
        <View style={styles.amountRow}>
          <AmountDisplay amount={currentAmount} size="small" />
          <Text style={styles.amountSeparator}>of</Text>
          <AmountDisplay amount={targetAmount} size="small" color={colors.text.tertiary} />
        </View>
      )}
      
      <View style={[styles.container, { height, backgroundColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, clampedProgress)}%`,
              backgroundColor: getProgressColor(),
              height,
            },
            glowStyle,
          ]}
        />
      </View>
      
      {showLabel && (
        <Text style={styles.label}>{clampedProgress.toFixed(0)}%</Text>
      )}
    </View>
  );
};

// ============================================
// AMOUNT DISPLAY
// ============================================

interface AmountDisplayProps {
  amount: number;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showSign?: boolean;
  positive?: boolean;
  currency?: string;
  style?: ViewStyle;
  color?: string;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  size = 'medium',
  showSign = false,
  positive,
  currency = '$',
  style,
  color,
}) => {
  const isPositive = positive !== undefined ? positive : amount >= 0;
  const displayAmount = Math.abs(amount);

  const getColor = () => {
    if (color) return color;
    if (showSign) {
      return isPositive ? colors.emerald[500] : colors.burgundy[400];
    }
    return colors.text.primary;
  };

  const formatAmount = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 10000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const sizeStyles: Record<string, any> = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
    xlarge: styles.xlarge,
  };

  return (
    <View style={[styles.amountContainer, style]}>
      <Text style={[sizeStyles[size], { color: getColor() }]}>
        {showSign && (isPositive ? '+' : '-')}
        {currency}
        {formatAmount(displayAmount)}
      </Text>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Progress Bar
  container: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
  label: {
    ...typography.label.small,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  amountSeparator: {
    ...typography.body.small,
    color: colors.text.muted,
    marginHorizontal: spacing.xs,
  },

  // Amount Display
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  small: {
    ...typography.body.medium,
    fontWeight: '600',
  },
  medium: {
    ...typography.title.large,
  },
  large: {
    ...typography.headline.medium,
  },
  xlarge: {
    ...typography.display.small,
  },
});