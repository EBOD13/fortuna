// src/components/cards/SummaryCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

type Props = {
  title: string;
  mainValue: string;
  subtitle: string;
  icon: string;
  color: string;
};

export default function SummaryCard({ title, mainValue, subtitle, icon, color }: Props) {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={[styles.summaryValue, { color }]}>{mainValue}</Text>
        <Text style={styles.summarySubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.summaryIcon, { backgroundColor: color + '15' }]}>
        <SFSymbol name={icon} size={28} color={color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});