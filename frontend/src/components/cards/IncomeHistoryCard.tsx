// src/components/cards/IncomeHistoryCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

// ============ TYPES ============
export type IncomeStatus = 'confirmed' | 'pending' | 'expected' | 'missed';

export type IncomeType = 
  | 'salary'
  | 'hourly'
  | 'freelance'
  | 'bonus'
  | 'commission'
  | 'tips'
  | 'rental'
  | 'investment'
  | 'refund'
  | 'gift'
  | 'other';

export type Deduction = {
  label: string;
  amount: number;
  type?: 'tax' | 'retirement' | 'insurance' | 'other';
};

export type IncomeHistoryEntry = {
  entry_id: string;
  source_id: string;
  source_name: string;
  income_type: IncomeType;
  gross_amount: number;
  net_amount: number;
  deductions?: Deduction[];
  date: string;
  pay_period?: string;
  status: IncomeStatus;
  notes?: string;
  confirmed_at?: string;
  is_recurring: boolean;
};

// ============ CONFIG ============
const statusConfig: Record<IncomeStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  confirmed: {
    label: 'Confirmed',
    color: '#046C4E',
    bgColor: '#D1FAE5',
    icon: 'checkmark.circle.fill',
  },
  pending: {
    label: 'Pending',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'clock.fill',
  },
  expected: {
    label: 'Expected',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    icon: 'calendar',
  },
  missed: {
    label: 'Missed',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    icon: 'exclamationmark.circle.fill',
  },
};

const incomeTypeConfig: Record<IncomeType, {
  label: string;
  icon: string;
  color: string;
}> = {
  salary: { label: 'Salary', icon: 'building.2.fill', color: '#2563EB' },
  hourly: { label: 'Hourly', icon: 'clock.fill', color: '#7C3AED' },
  freelance: { label: 'Freelance', icon: 'laptopcomputer', color: '#0891B2' },
  bonus: { label: 'Bonus', icon: 'gift.fill', color: '#F59E0B' },
  commission: { label: 'Commission', icon: 'chart.line.uptrend.xyaxis', color: '#046C4E' },
  tips: { label: 'Tips', icon: 'hand.thumbsup.fill', color: '#EC4899' },
  rental: { label: 'Rental', icon: 'house.fill', color: '#6B7280' },
  investment: { label: 'Investment', icon: 'chart.pie.fill', color: '#8B5CF6' },
  refund: { label: 'Refund', icon: 'arrow.uturn.backward.circle.fill', color: '#0891B2' },
  gift: { label: 'Gift', icon: 'gift.fill', color: '#EC4899' },
  other: { label: 'Other', icon: 'dollarsign.circle.fill', color: '#6B7280' },
};

// ============ PROPS ============
export type IncomeHistoryCardProps = {
  entry: IncomeHistoryEntry;
  variant?: 'default' | 'compact' | 'detailed';
  onPress?: () => void;
  onConfirm?: () => void;
  onEdit?: () => void;
  showDeductions?: boolean;
};

// ============ COMPONENT ============
export default function IncomeHistoryCard({
  entry,
  variant = 'default',
  onPress,
  onConfirm,
  onEdit,
  showDeductions = false,
}: IncomeHistoryCardProps) {
  const statusCfg = statusConfig[entry.status];
  const typeCfg = incomeTypeConfig[entry.income_type];
  const hasDeductions = entry.deductions && entry.deductions.length > 0;
  const totalDeductions = entry.gross_amount - entry.net_amount;

  // ============ COMPACT VARIANT ============
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={[styles.compactIcon, { backgroundColor: typeCfg.color + '15' }]}>
          <SFSymbol name={typeCfg.icon} size={16} color={typeCfg.color} />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactSource} numberOfLines={1}>{entry.source_name}</Text>
          <Text style={styles.compactDate}>{entry.date}</Text>
        </View>
        <View style={styles.compactRight}>
          <Text style={styles.compactAmount}>+${entry.net_amount.toLocaleString()}</Text>
          <View style={[styles.compactStatus, { backgroundColor: statusCfg.bgColor }]}>
            <View style={[styles.compactStatusDot, { backgroundColor: statusCfg.color }]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ============ DETAILED VARIANT ============
  if (variant === 'detailed') {
    return (
      <TouchableOpacity
        style={styles.detailedCard}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        {/* Header */}
        <View style={styles.detailedHeader}>
          <View style={[styles.detailedIcon, { backgroundColor: typeCfg.color + '15' }]}>
            <SFSymbol name={typeCfg.icon} size={24} color={typeCfg.color} />
          </View>
          <View style={styles.detailedHeaderContent}>
            <Text style={styles.detailedSource}>{entry.source_name}</Text>
            <View style={styles.detailedMeta}>
              <Text style={styles.detailedType}>{typeCfg.label}</Text>
              {entry.pay_period && (
                <>
                  <Text style={styles.detailedSeparator}>•</Text>
                  <Text style={styles.detailedPeriod}>{entry.pay_period}</Text>
                </>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bgColor }]}>
            <SFSymbol name={statusCfg.icon} size={12} color={statusCfg.color} />
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Amounts */}
        <View style={styles.detailedAmounts}>
          <View style={styles.detailedAmountRow}>
            <Text style={styles.detailedAmountLabel}>Gross</Text>
            <Text style={styles.detailedGrossAmount}>
              ${entry.gross_amount.toLocaleString()}
            </Text>
          </View>
          {hasDeductions && (
            <View style={styles.detailedAmountRow}>
              <Text style={styles.detailedAmountLabel}>Deductions</Text>
              <Text style={styles.detailedDeductionAmount}>
                -${totalDeductions.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={styles.detailedDivider} />
          <View style={styles.detailedAmountRow}>
            <Text style={styles.detailedNetLabel}>Net Income</Text>
            <Text style={styles.detailedNetAmount}>
              ${entry.net_amount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Deductions Breakdown */}
        {showDeductions && hasDeductions && (
          <View style={styles.deductionsSection}>
            <Text style={styles.deductionsTitle}>Deductions</Text>
            {entry.deductions!.map((deduction, index) => (
              <View key={index} style={styles.deductionRow}>
                <Text style={styles.deductionLabel}>{deduction.label}</Text>
                <Text style={styles.deductionAmount}>
                  -${deduction.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Date & Notes */}
        <View style={styles.detailedFooter}>
          <View style={styles.detailedDateRow}>
            <SFSymbol name="calendar" size={14} color="#8E8E93" />
            <Text style={styles.detailedDate}>{entry.date}</Text>
          </View>
          {entry.notes && (
            <Text style={styles.detailedNotes} numberOfLines={2}>
              {entry.notes}
            </Text>
          )}
        </View>

        {/* Actions */}
        {(entry.status === 'pending' || entry.status === 'expected') && onConfirm && (
          <View style={styles.detailedActions}>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={onConfirm}
            >
              <SFSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirm Received</Text>
            </TouchableOpacity>
            {onEdit && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={onEdit}
              >
                <SFSymbol name="pencil" size={16} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Recurring Badge */}
        {entry.is_recurring && (
          <View style={styles.recurringBadge}>
            <SFSymbol name="repeat" size={10} color="#7C3AED" />
            <Text style={styles.recurringText}>Recurring</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ============ DEFAULT VARIANT ============
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Left Icon */}
      <View style={[styles.iconContainer, { backgroundColor: typeCfg.color + '15' }]}>
        <SFSymbol name={typeCfg.icon} size={20} color={typeCfg.color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.sourceName} numberOfLines={1}>{entry.source_name}</Text>
          <Text style={styles.netAmount}>+${entry.net_amount.toLocaleString()}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.metaRow}>
            <Text style={styles.date}>{entry.date}</Text>
            {entry.is_recurring && (
              <View style={styles.recurringTag}>
                <SFSymbol name="repeat" size={10} color="#7C3AED" />
              </View>
            )}
          </View>
          <View style={[styles.statusBadgeSmall, { backgroundColor: statusCfg.bgColor }]}>
            <SFSymbol name={statusCfg.icon} size={10} color={statusCfg.color} />
            <Text style={[styles.statusBadgeSmallText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Gross vs Net (if different) */}
        {hasDeductions && (
          <View style={styles.grossNetRow}>
            <Text style={styles.grossLabel}>Gross: ${entry.gross_amount.toLocaleString()}</Text>
            <Text style={styles.deductionsLabel}>
              (-${totalDeductions.toLocaleString()})
            </Text>
          </View>
        )}
      </View>

      {/* Confirm Button for Pending */}
      {entry.status === 'pending' && onConfirm && (
        <TouchableOpacity 
          style={styles.miniConfirmButton}
          onPress={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
        >
          <SFSymbol name="checkmark" size={14} color="#046C4E" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ============ INCOME HISTORY LIST ============
export type IncomeHistoryListProps = {
  entries: IncomeHistoryEntry[];
  title?: string;
  variant?: 'default' | 'compact' | 'detailed';
  onEntryPress?: (entry: IncomeHistoryEntry) => void;
  onConfirm?: (entry: IncomeHistoryEntry) => void;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  emptyMessage?: string;
};

export function IncomeHistoryList({
  entries,
  title,
  variant = 'default',
  onEntryPress,
  onConfirm,
  showSeeAll = false,
  onSeeAll,
  emptyMessage = 'No income recorded yet',
}: IncomeHistoryListProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <SFSymbol name="banknote" size={32} color="#C7C7CC" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {title && (
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{title}</Text>
          {showSeeAll && onSeeAll && (
            <TouchableOpacity onPress={onSeeAll}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.listContent}>
        {entries.map((entry) => (
          <IncomeHistoryCard
            key={entry.entry_id}
            entry={entry}
            variant={variant}
            onPress={() => onEntryPress?.(entry)}
            onConfirm={() => onConfirm?.(entry)}
          />
        ))}
      </View>
    </View>
  );
}

// ============ INCOME SUMMARY CARD ============
export type IncomeSummaryProps = {
  period: string;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  entryCount: number;
  comparedToLastPeriod?: number;
};

export function IncomeSummaryCard({
  period,
  totalGross,
  totalNet,
  totalDeductions,
  entryCount,
  comparedToLastPeriod,
}: IncomeSummaryProps) {
  const isPositiveChange = comparedToLastPeriod && comparedToLastPeriod > 0;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryPeriod}>{period}</Text>
        {comparedToLastPeriod !== undefined && (
          <View style={[
            styles.summaryChange,
            { backgroundColor: isPositiveChange ? '#D1FAE5' : '#FEF2F2' }
          ]}>
            <SFSymbol 
              name={isPositiveChange ? 'arrow.up' : 'arrow.down'} 
              size={10} 
              color={isPositiveChange ? '#046C4E' : '#DC2626'} 
            />
            <Text style={[
              styles.summaryChangeText,
              { color: isPositiveChange ? '#046C4E' : '#DC2626' }
            ]}>
              {Math.abs(comparedToLastPeriod)}%
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.summaryNetAmount}>${totalNet.toLocaleString()}</Text>
      <Text style={styles.summaryNetLabel}>Net Income</Text>

      <View style={styles.summaryDetails}>
        <View style={styles.summaryDetailItem}>
          <Text style={styles.summaryDetailLabel}>Gross</Text>
          <Text style={styles.summaryDetailValue}>${totalGross.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryDetailDivider} />
        <View style={styles.summaryDetailItem}>
          <Text style={styles.summaryDetailLabel}>Deductions</Text>
          <Text style={[styles.summaryDetailValue, { color: '#DC2626' }]}>
            -${totalDeductions.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryDetailDivider} />
        <View style={styles.summaryDetailItem}>
          <Text style={styles.summaryDetailLabel}>Entries</Text>
          <Text style={styles.summaryDetailValue}>{entryCount}</Text>
        </View>
      </View>
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  // Default Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  netAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#046C4E',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    fontSize: 13,
    color: '#8E8E93',
  },
  recurringTag: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7C3AED15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  statusBadgeSmallText: {
    fontSize: 10,
    fontWeight: '600',
  },
  grossNetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  grossLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  deductionsLabel: {
    fontSize: 12,
    color: '#DC2626',
  },
  miniConfirmButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Compact Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    gap: 10,
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactSource: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  compactDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  compactRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  compactAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#046C4E',
  },
  compactStatus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Detailed Card
  detailedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    position: 'relative',
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailedIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailedHeaderContent: {
    flex: 1,
  },
  detailedSource: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  detailedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedType: {
    fontSize: 13,
    color: '#8E8E93',
  },
  detailedSeparator: {
    fontSize: 13,
    color: '#C7C7CC',
    marginHorizontal: 6,
  },
  detailedPeriod: {
    fontSize: 13,
    color: '#8E8E93',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailedAmounts: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  detailedAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailedAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailedGrossAmount: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  detailedDeductionAmount: {
    fontSize: 15,
    fontWeight: '500',
    color: '#DC2626',
  },
  detailedDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  detailedNetLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  detailedNetAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#046C4E',
  },
  deductionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 14,
    marginBottom: 14,
  },
  deductionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
  },
  deductionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  deductionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  deductionAmount: {
    fontSize: 14,
    color: '#DC2626',
  },
  detailedFooter: {
    gap: 8,
  },
  detailedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailedDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  detailedNotes: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  detailedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#046C4E',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  recurringText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },

  // List
  listContainer: {
    marginBottom: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  listContent: {
    gap: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryPeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  summaryChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryNetAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#046C4E',
  },
  summaryNetLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  summaryDetails: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  summaryDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDetailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  summaryDetailDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 12,
  },
});