// src/components/cards/BillCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

export type Bill = {
  bill_id: string;
  bill_name: string;
  category: 'insurance' | 'utility' | 'subscription' | 'loan' | 'other';
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  due_date: string;
  is_autopay: boolean;
  is_paid: boolean;
  provider?: string;
  notes?: string;
};

type Props = {
  item: Bill;
  onPress?: (item: Bill) => void;
};

export default function BillCard({ item, onPress }: Props) {
  const getCategoryIcon = () => {
    switch (item.category) {
      case 'insurance':
        return 'shield.fill';
      case 'utility':
        return 'bolt.fill';
      case 'subscription':
        return 'play.rectangle.fill';
      case 'loan':
        return 'building.columns.fill';
      default:
        return 'doc.fill';
    }
  };

  const getCategoryColor = () => {
    switch (item.category) {
      case 'insurance':
        return '#2563EB';
      case 'utility':
        return '#F59E0B';
      case 'subscription':
        return '#7C3AED';
      case 'loan':
        return '#DC2626';
      default:
        return '#8E8E93';
    }
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const dueDate = new Date(item.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();
  const isUrgent = daysUntilDue <= 7 && daysUntilDue > 0;
  const isOverdue = daysUntilDue < 0;

  const getDueText = () => {
    if (isOverdue) return `Overdue by ${Math.abs(daysUntilDue)} days`;
    if (daysUntilDue === 0) return 'Due today';
    return `Due in ${daysUntilDue} days`;
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: getCategoryColor() + '15' }]}>
          <SFSymbol name={getCategoryIcon()} size={24} color={getCategoryColor()} />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.bill_name}</Text>
          <Text style={styles.cardSubtitle}>{item.provider || item.category}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>${item.amount.toLocaleString()}</Text>
          <Text style={styles.frequencyText}>/{item.frequency}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <SFSymbol
            name="calendar"
            size={14}
            color={isOverdue ? '#DC2626' : isUrgent ? '#F59E0B' : '#8E8E93'}
          />
          <Text
            style={[
              styles.detailText,
              isOverdue && styles.overdueText,
              isUrgent && styles.urgentText,
            ]}
          >
            {getDueText()}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusBadges}>
          {item.is_autopay && (
            <View style={styles.autoBadge}>
              <SFSymbol name="arrow.triangle.2.circlepath" size={12} color="#046C4E" />
              <Text style={styles.autoBadgeText}>Auto-pay</Text>
            </View>
          )}
          {item.is_paid ? (
            <View style={styles.paidBadge}>
              <SFSymbol name="checkmark.circle.fill" size={12} color="#046C4E" />
              <Text style={styles.paidBadgeText}>Paid</Text>
            </View>
          ) : (
            <View style={styles.unpaidBadge}>
              <SFSymbol name="clock.fill" size={12} color="#F59E0B" />
              <Text style={styles.unpaidBadgeText}>Pending</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  frequencyText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  overdueText: {
    color: '#DC2626',
    fontWeight: '500',
  },
  urgentText: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 10,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#046C4E15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  autoBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#046C4E',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#046C4E15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#046C4E',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  unpaidBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
  },
});