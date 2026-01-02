// mobile/src/components/AmountDisplay.tsx
/**
 * Amount display with currency formatting
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../theme';

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
      return isPositive ? colors.success : colors.error;
    }
    return colors.text.primary;
  };

  const formatAmount = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(2);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles[size], { color: getColor() }]}>
        {showSign && (isPositive ? '+' : '-')}
        {currency}
        {formatAmount(displayAmount)}
      </Text>
    </View>
  );
};

// ProgressBar Component
interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = colors.primary[500],
  backgroundColor = colors.gray[200],
  showLabel = false,
  style,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  // Change color based on progress
  const getProgressColor = () => {
    if (progress > 100) return colors.error;
    if (progress > 80) return colors.warning;
    return color;
  };

  return (
    <View style={style}>
      <View style={[styles.progressContainer, { height, backgroundColor }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, clampedProgress)}%`,
              backgroundColor: getProgressColor(),
              height,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.progressLabel}>{clampedProgress.toFixed(0)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  
  // Amount sizes
  small: {
    ...typography.body.medium,
    fontWeight: '600',
  },
  medium: {
    ...typography.title.medium,
  },
  large: {
    ...typography.headline.small,
  },
  xlarge: {
    ...typography.headline.large,
  },

  // Progress bar
  progressContainer: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 100,
  },
  progressLabel: {
    ...typography.label.small,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'right',
  },
});