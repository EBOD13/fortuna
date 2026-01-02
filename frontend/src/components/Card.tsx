// components/Card.tsx
/**
 * Card Components for Fortuna
 * - Card: Base card container
 * - StatsBox: Stats display for dashboard
 * - SectionHeader: Section title with optional action
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

// ============================================
// CARD
// ============================================

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
}) => {
  const cardStyles = [styles.card, styles[`card_${variant}`], style];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

// ============================================
// STATS BOX
// ============================================

interface StatsBoxProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: string;
  style?: ViewStyle;
}

export const StatsBox: React.FC<StatsBoxProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  accentColor = colors.emerald[500],
  style,
}) => {
  const getTrendColor = () => {
    if (trend === 'up') return colors.emerald[500];
    if (trend === 'down') return colors.burgundy[500];
    return colors.text.tertiary;
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return `$${val.toLocaleString()}`;
    }
    return val;
  };

  return (
    <View style={[styles.statsBox, style]}>
      <View style={styles.statsHeader}>
        {icon && <Text style={styles.statsIcon}>{icon}</Text>}
        <Text style={styles.statsLabel}>{label}</Text>
      </View>
      <Text style={[styles.statsValue, { color: accentColor }]}>
        {formatValue(value)}
      </Text>
      {subValue && (
        <Text style={[styles.statsSubValue, { color: getTrendColor() }]}>
          {subValue}
        </Text>
      )}
    </View>
  );
};

// ============================================
// SECTION HEADER
// ============================================

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
  onAction,
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Card styles
  card: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  card_default: {},
  card_elevated: {
    backgroundColor: colors.background.elevated,
    ...shadows.md,
  },
  card_outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  card_glass: {
    backgroundColor: 'rgba(46, 58, 70, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Stats Box
  statsBox: {
    flex: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statsIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  statsLabel: {
    ...typography.label.small,
    color: colors.text.tertiary,
  },
  statsValue: {
    ...typography.headline.medium,
    color: colors.text.primary,
  },
  statsSubValue: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title.medium,
    color: colors.text.primary,
  },
  sectionAction: {
    ...typography.label.medium,
    color: colors.gold[500],
  },
});