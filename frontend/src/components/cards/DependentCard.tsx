// src/components/cards/DependentCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

export type Dependent = {
  dependent_id: string;
  dependent_name: string;
  relationship: string;
  dependent_type: 'human' | 'animal' | 'other';
  dependent_category: string;
  date_of_birth?: string;
  age?: number;
  monthly_cost_estimate?: number;
  shared_responsibility: boolean;
  cost_sharing_partners?: string[];
  partner_contribution_amount?: number;
  special_needs?: string;
  notes?: string;
};

type Props = {
  item: Dependent;
  onPress?: (item: Dependent) => void;
};

export default function DependentCard({ item, onPress }: Props) {
  const getTypeIcon = () => {
    switch (item.dependent_type) {
      case 'human':
        return item.dependent_category === 'child'
          ? 'figure.child'
          : item.dependent_category === 'elderly'
            ? 'figure.roll'
            : 'person.fill';
      case 'animal':
        return 'pawprint.fill';
      default:
        return 'questionmark.circle.fill';
    }
  };

  const getTypeColor = () => {
    switch (item.dependent_type) {
      case 'human':
        return '#2563EB';
      case 'animal':
        return '#F59E0B';
      default:
        return '#8E8E93';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: getTypeColor() + '15' }]}>
          <SFSymbol name={getTypeIcon()} size={24} color={getTypeColor()} />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.dependent_name}</Text>
          <Text style={styles.cardSubtitle}>{item.relationship}</Text>
        </View>
        {item.shared_responsibility && (
          <View style={styles.sharedBadge}>
            <SFSymbol name="person.2.fill" size={12} color="#7C3AED" />
            <Text style={styles.sharedBadgeText}>Shared</Text>
          </View>
        )}
      </View>

    <View style={styles.cardDetails}>
  {item.age !== undefined && (
    <View style={styles.detailItem}>
      <View style={styles.iconWrapper}>
        <SFSymbol name="calendar" size={14} color="#8E8E93" />
      </View>
      <Text style={styles.detailText}>{item.age} years old</Text>
    </View>
  )}
  {item.monthly_cost_estimate !== undefined && (
    <View style={styles.detailItem}>
      <View style={styles.iconWrapper}>
        <SFSymbol name="dollarsign.circle" size={14} color="#8E8E93" />
      </View>
      <Text style={styles.detailText}>
        ${item.monthly_cost_estimate.toLocaleString()}/mo
      </Text>
    </View>
  )}
  {item.special_needs && (
    <View style={styles.detailItem}>
      <View style={styles.iconWrapper}>
        <SFSymbol name="heart.fill" size={14} color="#DC2626" />
      </View>
      <Text style={styles.detailText}>{item.special_needs}</Text>
    </View>
  )}
</View>


      {item.shared_responsibility && item.partner_contribution_amount !== undefined && (
        <View style={styles.cardFooter}>
          <Text style={styles.footerLabel}>Partner contributes:</Text>
          <Text style={styles.footerValue}>
            ${item.partner_contribution_amount.toLocaleString()}/mo
          </Text>
        </View>
      )}
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
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20, // spacing between detail items
  },
  iconWrapper: {
    width: 20, // ensures consistent spacing between icon and text
    alignItems: 'center',
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  footerLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8, // spacing from title container
  },
  sharedBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7C3AED',
  },
});
