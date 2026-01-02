// src/screens/IncomeDetailScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useIncomeSource } from '../hooks/useIncome';
import type { IncomeSource, IncomeHistoryEntry, IncomeType, PayStructure, PayFrequency } from '../api/types/income';

// ============ CONFIGS ============

const incomeTypeConfig: Record<IncomeType, { icon: string; color: string; label: string }> = {
  employment: { icon: 'building.2.fill', color: '#2563EB', label: 'Employment' },
  freelance: { icon: 'laptopcomputer', color: '#7C3AED', label: 'Freelance' },
  business: { icon: 'storefront.fill', color: '#046C4E', label: 'Business' },
  investment: { icon: 'chart.line.uptrend.xyaxis', color: '#0891B2', label: 'Investment' },
  rental: { icon: 'house.fill', color: '#F59E0B', label: 'Rental' },
  scholarship: { icon: 'graduationcap.fill', color: '#EC4899', label: 'Scholarship' },
  other: { icon: 'dollarsign.circle.fill', color: '#6B7280', label: 'Other' },
};

const payStructureLabels: Record<PayStructure, string> = {
  salary: 'Salary', hourly: 'Hourly', commission: 'Commission', contract: 'Contract', variable: 'Variable',
};

const payFrequencyLabels: Record<PayFrequency, string> = {
  weekly: 'Weekly', biweekly: 'Every 2 Weeks', semimonthly: 'Twice Monthly',
  monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually', irregular: 'Irregular',
};

// ============ HEADER ============

const Header = ({ onEdit, onDelete, onLogIncome }: { onEdit: () => void; onDelete: () => void; onLogIncome: () => void }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="chevron.left" size={20} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Income Details</Text>
      <TouchableOpacity style={styles.headerButton} onPress={() => setShowMenu(!showMenu)}>
        <SFSymbol name="ellipsis" size={20} color="#000" />
      </TouchableOpacity>
      {showMenu && (
        <View style={[styles.menuDropdown, { top: insets.top + 56 }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onLogIncome(); }}>
            <SFSymbol name="plus.circle" size={18} color="#046C4E" />
            <Text style={[styles.menuItemText, { color: '#046C4E' }]}>Log Income</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onEdit(); }}>
            <SFSymbol name="pencil" size={18} color="#000" />
            <Text style={styles.menuItemText}>Edit Source</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={() => { setShowMenu(false); onDelete(); }}>
            <SFSymbol name="trash" size={18} color="#DC2626" />
            <Text style={[styles.menuItemText, { color: '#DC2626' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============ STATS CARD ============

const StatsCard = ({ income }: { income: IncomeSource }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Income Summary</Text>
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Per Period (Gross)</Text>
        <Text style={[styles.statValue, { color: '#046C4E' }]}>${income.gross_per_period.toFixed(2)}</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Per Period (Net)</Text>
        <Text style={[styles.statValue, { color: '#2563EB' }]}>${income.net_per_period.toFixed(2)}</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Taxes</Text>
        <Text style={[styles.statValue, { color: '#DC2626' }]}>${income.taxes_per_period.toFixed(2)}</Text>
      </View>
    </View>
    <View style={styles.statsGrid}>
      <View style={styles.gridItem}>
        <Text style={styles.gridValue}>${income.monthly_gross.toFixed(0)}</Text>
        <Text style={styles.gridLabel}>Monthly Gross</Text>
      </View>
      <View style={styles.gridItem}>
        <Text style={styles.gridValue}>${income.monthly_net.toFixed(0)}</Text>
        <Text style={styles.gridLabel}>Monthly Net</Text>
      </View>
      <View style={styles.gridItem}>
        <Text style={styles.gridValue}>${income.annual_gross.toFixed(0)}</Text>
        <Text style={styles.gridLabel}>Annual Gross</Text>
      </View>
      <View style={styles.gridItem}>
        <Text style={styles.gridValue}>{income.total_tax_rate.toFixed(1)}%</Text>
        <Text style={styles.gridLabel}>Tax Rate</Text>
      </View>
    </View>
  </View>
);

// ============ TAX BREAKDOWN ============

const TaxBreakdown = ({ income }: { income: IncomeSource }) => {
  if (!income.is_taxable || income.total_tax_rate === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tax Status</Text>
        <View style={styles.nonTaxable}>
          <SFSymbol name="checkmark.circle.fill" size={20} color="#046C4E" />
          <Text style={styles.nonTaxableText}>Non-taxable income</Text>
        </View>
      </View>
    );
  }

  const gross = income.gross_per_period;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tax Breakdown (Per Period)</Text>
      <View style={styles.taxRow}><Text style={styles.taxLabel}>Gross Pay</Text><Text style={styles.taxValue}>${gross.toFixed(2)}</Text></View>
      {income.federal_tax_rate > 0 && (
        <View style={styles.taxRow}><Text style={styles.taxLabelSm}>Federal ({income.federal_tax_rate}%)</Text><Text style={styles.taxNeg}>-${(gross * income.federal_tax_rate / 100).toFixed(2)}</Text></View>
      )}
      {income.state_tax_rate > 0 && (
        <View style={styles.taxRow}><Text style={styles.taxLabelSm}>State ({income.state_tax_rate}%)</Text><Text style={styles.taxNeg}>-${(gross * income.state_tax_rate / 100).toFixed(2)}</Text></View>
      )}
      {income.local_tax_rate > 0 && (
        <View style={styles.taxRow}><Text style={styles.taxLabelSm}>Local ({income.local_tax_rate}%)</Text><Text style={styles.taxNeg}>-${(gross * income.local_tax_rate / 100).toFixed(2)}</Text></View>
      )}
      {income.fica_rate > 0 && (
        <View style={styles.taxRow}><Text style={styles.taxLabelSm}>FICA ({income.fica_rate}%)</Text><Text style={styles.taxNeg}>-${(gross * income.fica_rate / 100).toFixed(2)}</Text></View>
      )}
      <View style={styles.taxTotal}><Text style={styles.taxTotalLabel}>Net Pay</Text><Text style={styles.taxTotalValue}>${income.net_per_period.toFixed(2)}</Text></View>
    </View>
  );
};

// ============ DETAILS CARD ============

const DetailsCard = ({ income }: { income: IncomeSource }) => {
  const type = income.income_type || income.source_type;
  const config = incomeTypeConfig[type] || incomeTypeConfig.other;
  const structure = income.pay_structure;
  const freq = income.pay_frequency || income.frequency;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Source Details</Text>
      {income.employer_name && (
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Employer</Text><Text style={styles.detailValue}>{income.employer_name}</Text></View>
      )}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Type</Text>
        <View style={[styles.badge, { backgroundColor: config.color + '20' }]}><Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text></View>
      </View>
      <View style={styles.detailRow}><Text style={styles.detailLabel}>Pay Structure</Text><Text style={styles.detailValue}>{payStructureLabels[structure]}</Text></View>
      <View style={styles.detailRow}><Text style={styles.detailLabel}>Frequency</Text><Text style={styles.detailValue}>{payFrequencyLabels[freq]}</Text></View>
      {income.hourly_rate && (
        <View style={styles.detailRow}><Text style={styles.detailLabel}>Hourly Rate</Text><Text style={styles.detailValue}>${income.hourly_rate.toFixed(2)}/hr</Text></View>
      )}
      <View style={styles.detailRow}><Text style={styles.detailLabel}>Guaranteed</Text><Text style={styles.detailValue}>{income.is_guaranteed ? 'Yes' : 'No'}</Text></View>
    </View>
  );
};

// ============ HISTORY CARD ============

const HistoryCard = ({ entry, onConfirm }: { entry: IncomeHistoryEntry; onConfirm?: () => void }) => {
  const date = new Date(entry.payment_date).toLocaleDateString();
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyMain}>
        <Text style={styles.historyDate}>{date}</Text>
        <Text style={styles.historyAmount}>+${entry.net_amount.toFixed(2)}</Text>
      </View>
      <Text style={styles.historyGross}>Gross: ${entry.gross_amount.toFixed(2)}</Text>
      {entry.status === 'pending' && onConfirm && (
        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
          <Text style={styles.confirmBtnText}>Confirm</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============ MAIN ============

export default function IncomeDetailScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'IncomeDetailScreen'>>();
  const incomeId = route.params?.incomeId;

  const { source: income, history, isLoading, error, deleteSource, confirmPayment } = useIncomeSource(incomeId);

  const handleEdit = () => income && navigation.navigate('EditIncomeScreen', { incomeId: income.income_id });
  const handleLogIncome = () => navigation.navigate('LogIncomeScreen');
  const handleDelete = () => {
    if (!income) return;
    Alert.alert('Delete Income', `Delete "${income.source_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (await deleteSource(true)) navigation.goBack();
      }},
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header onEdit={handleEdit} onDelete={handleDelete} onLogIncome={handleLogIncome} />
        <View style={styles.center}><ActivityIndicator size="large" color="#046C4E" /></View>
      </View>
    );
  }

  if (error || !income) {
    return (
      <View style={styles.container}>
        <Header onEdit={handleEdit} onDelete={handleDelete} onLogIncome={handleLogIncome} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Not found'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Text style={styles.backBtnText}>Go Back</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  const type = income.income_type || income.source_type;
  const config = incomeTypeConfig[type] || incomeTypeConfig.other;
  const structure = income.pay_structure;
  const freq = income.pay_frequency || income.frequency;

  return (
    <View style={styles.container}>
      <Header onEdit={handleEdit} onDelete={handleDelete} onLogIncome={handleLogIncome} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: config.color + '10' }]}>
          <View style={[styles.heroIcon, { backgroundColor: config.color + '20' }]}>
            <SFSymbol name={config.icon} size={32} color={config.color} />
          </View>
          <Text style={styles.heroName}>{income.source_name}</Text>
          {income.employer_name && <Text style={styles.heroEmployer}>{income.employer_name}</Text>}
          <Text style={styles.heroLabel}>{structure === 'hourly' ? 'Hourly Rate' : 'Per Pay Period'}</Text>
          <Text style={[styles.heroAmount, { color: config.color }]}>
            ${structure === 'hourly' ? income.hourly_rate?.toFixed(2) : income.base_amount.toFixed(2)}
          </Text>
          <Text style={styles.heroFreq}>{payFrequencyLabels[freq]}</Text>
          {income.status !== 'active' && (
            <View style={[styles.statusBanner, { backgroundColor: income.status === 'paused' ? '#F59E0B' : '#DC2626' }]}>
              <Text style={styles.statusText}>{income.status === 'paused' ? 'Paused' : 'Ended'}</Text>
            </View>
          )}
        </View>

        {/* Log Income Button */}
        {income.status === 'active' && (
          <TouchableOpacity style={styles.logBtn} onPress={handleLogIncome}>
            <SFSymbol name="plus.circle.fill" size={20} color="#FFF" />
            <Text style={styles.logBtnText}>Log Income Received</Text>
          </TouchableOpacity>
        )}

        <StatsCard income={income} />
        <TaxBreakdown income={income} />
        <DetailsCard income={income} />

        {/* History */}
        {history.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment History ({history.length})</Text>
            {history.map(entry => (
              <HistoryCard
                key={entry.history_id}
                entry={entry}
                onConfirm={entry.status === 'pending' ? () => confirmPayment(entry.history_id) : undefined}
              />
            ))}
          </View>
        )}

        {/* Notes */}
        {income.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notes}>{income.notes}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA', zIndex: 100 },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  menuDropdown: { position: 'absolute', right: 20, backgroundColor: '#FFF', borderRadius: 14, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, minWidth: 160, zIndex: 1000 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  menuItemText: { fontSize: 16 },
  menuItemDanger: { borderTopWidth: 1, borderTopColor: '#F2F2F7' },

  // Hero
  hero: { alignItems: 'center', paddingVertical: 28, borderRadius: 20, marginBottom: 16 },
  heroIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroName: { fontSize: 24, fontWeight: '700' },
  heroEmployer: { fontSize: 16, color: '#8E8E93', marginBottom: 16 },
  heroLabel: { fontSize: 13, color: '#8E8E93', marginTop: 8 },
  heroAmount: { fontSize: 36, fontWeight: '700' },
  heroFreq: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  statusBanner: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16 },
  statusText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

  // Log Button
  logBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#046C4E', paddingVertical: 14, borderRadius: 14, gap: 10, marginBottom: 16 },
  logBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },

  // Card
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginBottom: 4, textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: '700' },
  statDivider: { width: 1, backgroundColor: '#E5E5EA' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 16 },
  gridItem: { width: '25%', alignItems: 'center', paddingVertical: 8 },
  gridValue: { fontSize: 14, fontWeight: '700' },
  gridLabel: { fontSize: 10, color: '#8E8E93', textAlign: 'center' },

  // Tax
  nonTaxable: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', padding: 14, borderRadius: 12, gap: 12 },
  nonTaxableText: { fontSize: 14, color: '#046C4E', fontWeight: '500' },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  taxLabel: { fontSize: 15, fontWeight: '600' },
  taxLabelSm: { fontSize: 14, color: '#6B7280' },
  taxValue: { fontSize: 15, fontWeight: '600' },
  taxNeg: { fontSize: 14, color: '#DC2626' },
  taxTotal: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#E5E5EA', paddingTop: 12, marginTop: 8 },
  taxTotalLabel: { fontSize: 16, fontWeight: '700' },
  taxTotalValue: { fontSize: 18, fontWeight: '700', color: '#046C4E' },

  // Details
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailLabel: { fontSize: 15, color: '#8E8E93' },
  detailValue: { fontSize: 15, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 13, fontWeight: '600' },

  // History
  historyCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 10 },
  historyMain: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  historyDate: { fontSize: 14, color: '#6B7280' },
  historyAmount: { fontSize: 16, fontWeight: '700', color: '#046C4E' },
  historyGross: { fontSize: 12, color: '#8E8E93' },
  confirmBtn: { backgroundColor: '#046C4E', paddingVertical: 8, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

  // Notes
  notes: { fontSize: 15, lineHeight: 22 },

  // Error
  errorText: { fontSize: 18, fontWeight: '600', color: '#DC2626' },
  backBtn: { backgroundColor: '#046C4E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});