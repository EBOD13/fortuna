// src/components/lists/IncomeList.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import IncomeCard, { IncomeSource } from '../cards/IncomeCard';
import { useIncomes } from '../../hooks/useIncome';

const COLORS = {
  charcoalBlack: '#1B1B1B',
  emeraldGreen: '#046C4E',
  mediumText: '#8E8E93',
  white: '#FFFFFF',
};

type Props = {
  onItemPress?: (item: IncomeSource) => void;
};

export default function IncomeList({ onItemPress }: Props) {
  const { data: incomes = [], isLoading, isError, refetch } = useIncomes();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.emeraldGreen} />
        <Text style={styles.loadingText}>Loading income sources...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIcon}>
          <SFSymbol name="exclamationmark.triangle.fill" size={32} color="#F59E0B" />
        </View>
        <Text style={styles.errorTitle}>Unable to load income</Text>
        <Text style={styles.errorText}>
          There was an error loading your income sources
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <SFSymbol name="arrow.clockwise" size={16} color={COLORS.white} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!incomes || incomes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <SFSymbol name="dollarsign.circle" size={48} color={COLORS.mediumText} />
        </View>
        <Text style={styles.emptyTitle}>No Income Sources</Text>
        <Text style={styles.emptyText}>
          Add your first income source to start tracking your earnings
        </Text>
      </View>
    );
  }

  // Sort by priority level (ascending, so priority 1 comes first)
  const sortedIncomes = [...incomes].sort((a, b) => (a.priority_level || 5) - (b.priority_level || 5));

  return (
    <FlatList
      data={sortedIncomes}
      renderItem={({ item }) => (
        <IncomeCard item={item} onPress={onItemPress} />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.mediumText,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F59E0B15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.mediumText,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emeraldGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.charcoalBlack,
    borderWidth: 1,
    borderColor: COLORS.mediumText + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.mediumText,
    textAlign: 'center',
    lineHeight: 22,
  },
});