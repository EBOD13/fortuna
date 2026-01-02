// src/screens/BillDetailScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Switch,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useBill } from '../hooks/useBill';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TYPES ============
type BillCategory = 
  | 'housing' 
  | 'utilities' 
  | 'insurance' 
  | 'subscriptions' 
  | 'loans' 
  | 'phone' 
  | 'internet' 
  | 'other';

type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'scheduled' | 'failed';
type BillStatus = 'active' | 'paused' | 'cancelled';

type PaymentHistory = {
  payment_id: string;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  payment_method?: string;
  confirmation_number?: string;
  notes?: string;
  was_late: boolean;
  late_fee?: number;
};

type UpcomingPayment = {
  due_date: string;
  amount: number;
  days_until: number;
  is_overdue: boolean;
};

type BillStats = {
  total_paid_ytd: number;
  total_paid_all_time: number;
  average_payment: number;
  on_time_percentage: number;
  total_late_fees: number;
  payments_count: number;
  streak_on_time: number;
};

type Bill = {
  bill_id: string;
  bill_name: string;
  payee: string;
  category: BillCategory;
  amount: number;
  frequency: BillFrequency;
  due_day: number; // Day of month (1-31)
  is_auto_pay: boolean;
  is_variable_amount: boolean;
  reminder_days: number;
  account_number?: string;
  website?: string;
  status: BillStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  next_payment: UpcomingPayment;
  payment_history: PaymentHistory[];
  stats: BillStats;
};

// ============ CATEGORY CONFIG ============
const categoryConfig: Record<BillCategory, { icon: string; color: string; label: string }> = {
  housing: { icon: 'house.fill', color: '#2563EB', label: 'Housing' },
  utilities: { icon: 'bolt.fill', color: '#F59E0B', label: 'Utilities' },
  insurance: { icon: 'shield.fill', color: '#046C4E', label: 'Insurance' },
  subscriptions: { icon: 'repeat.circle.fill', color: '#7C3AED', label: 'Subscriptions' },
  loans: { icon: 'banknote.fill', color: '#DC2626', label: 'Loans & Debt' },
  phone: { icon: 'phone.fill', color: '#0891B2', label: 'Phone' },
  internet: { icon: 'wifi', color: '#6366F1', label: 'Internet' },
  other: { icon: 'ellipsis.circle.fill', color: '#6B7280', label: 'Other' },
};

// ============ FREQUENCY CONFIG ============
const frequencyLabels: Record<BillFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

// ============ HEADER ============
type HeaderProps = {
  bill: Bill | null;
  onEdit: () => void;
  onDelete: () => void;
};

const Header = ({ bill, onEdit, onDelete }: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="chevron.left" size={20} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Bill Details</Text>
      <TouchableOpacity 
        style={styles.headerButton} 
        onPress={() => setShowMenu(!showMenu)}
      >
        <SFSymbol name="ellipsis" size={20} color="#000" />
      </TouchableOpacity>

      {showMenu && (
        <View style={[styles.menuDropdown, { top: insets.top + 56 }]}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { setShowMenu(false); onEdit(); }}
          >
            <SFSymbol name="pencil" size={18} color="#000" />
            <Text style={styles.menuItemText}>Edit Bill</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { setShowMenu(false); }}
          >
            <SFSymbol name="doc.text" size={18} color="#000" />
            <Text style={styles.menuItemText}>Export History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, styles.menuItemDanger]} 
            onPress={() => { setShowMenu(false); onDelete(); }}
          >
            <SFSymbol name="trash" size={18} color="#DC2626" />
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete Bill</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============ NEXT PAYMENT CARD ============
type NextPaymentCardProps = {
  payment: UpcomingPayment;
  billName: string;
  isAutoPay: boolean;
  onMarkPaid: () => void;
};

const NextPaymentCard = ({ payment, billName, isAutoPay, onMarkPaid }: NextPaymentCardProps) => {
  const getUrgencyColor = () => {
    if (payment.is_overdue) return '#DC2626';
    if (payment.days_until <= 3) return '#F59E0B';
    if (payment.days_until <= 7) return '#2563EB';
    return '#046C4E';
  };

  const getUrgencyBg = () => {
    if (payment.is_overdue) return '#FEF2F2';
    if (payment.days_until <= 3) return '#FEF3C7';
    if (payment.days_until <= 7) return '#DBEAFE';
    return '#D1FAE5';
  };

  const getUrgencyLabel = () => {
    if (payment.is_overdue) return 'OVERDUE';
    if (payment.days_until === 0) return 'DUE TODAY';
    if (payment.days_until === 1) return 'DUE TOMORROW';
    if (payment.days_until <= 3) return 'DUE SOON';
    return 'UPCOMING';
  };

  return (
    <View style={[styles.nextPaymentCard, { backgroundColor: getUrgencyBg() }]}>
      <View style={styles.nextPaymentHeader}>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor() }]}>
          <Text style={styles.urgencyBadgeText}>{getUrgencyLabel()}</Text>
        </View>
        {isAutoPay && (
          <View style={styles.autoPayBadge}>
            <SFSymbol name="checkmark.circle.fill" size={14} color="#046C4E" />
            <Text style={styles.autoPayBadgeText}>Auto-Pay</Text>
          </View>
        )}
      </View>

      <View style={styles.nextPaymentMain}>
        <View style={styles.nextPaymentAmount}>
          <Text style={styles.nextPaymentLabel}>Next Payment</Text>
          <Text style={[styles.nextPaymentValue, { color: getUrgencyColor() }]}>
            ${payment.amount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.nextPaymentDate}>
          <Text style={styles.nextPaymentLabel}>Due Date</Text>
          <Text style={styles.nextPaymentDateValue}>{payment.due_date}</Text>
          <Text style={[styles.nextPaymentDays, { color: getUrgencyColor() }]}>
            {payment.is_overdue 
              ? `${Math.abs(payment.days_until)} days overdue`
              : payment.days_until === 0 
                ? 'Today'
                : `in ${payment.days_until} days`
            }
          </Text>
        </View>
      </View>

      {!isAutoPay && (
        <TouchableOpacity 
          style={[styles.markPaidButton, { backgroundColor: getUrgencyColor() }]}
          onPress={onMarkPaid}
        >
          <SFSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
          <Text style={styles.markPaidButtonText}>Mark as Paid</Text>
        </TouchableOpacity>
      )}

      {isAutoPay && (
        <View style={styles.autoPayNote}>
          <SFSymbol name="info.circle" size={14} color="#046C4E" />
          <Text style={styles.autoPayNoteText}>
            This bill will be automatically paid on the due date
          </Text>
        </View>
      )}
    </View>
  );
};

// ============ STATS CARD ============
type StatsCardProps = {
  stats: BillStats;
  frequency: BillFrequency;
  amount: number;
};

const StatsCard = ({ stats, frequency, amount }: StatsCardProps) => {
  // Calculate yearly estimate
  const getYearlyEstimate = () => {
    switch (frequency) {
      case 'weekly': return amount * 52;
      case 'biweekly': return amount * 26;
      case 'monthly': return amount * 12;
      case 'quarterly': return amount * 4;
      case 'yearly': return amount;
    }
  };

  return (
    <View style={styles.statsCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: '#7C3AED15' }]}>
            <SFSymbol name="chart.bar.fill" size={16} color="#7C3AED" />
          </View>
          <Text style={styles.sectionTitle}>Statistics</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${stats.total_paid_ytd.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Paid YTD</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${getYearlyEstimate().toLocaleString()}</Text>
          <Text style={styles.statLabel}>Yearly Est.</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#046C4E' }]}>
            {stats.on_time_percentage}%
          </Text>
          <Text style={styles.statLabel}>On Time</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.streak_on_time}</Text>
          <Text style={styles.statLabel}>Streak 🔥</Text>
        </View>
      </View>

      {stats.total_late_fees > 0 && (
        <View style={styles.lateFeeWarning}>
          <SFSymbol name="exclamationmark.triangle.fill" size={14} color="#DC2626" />
          <Text style={styles.lateFeeWarningText}>
            ${stats.total_late_fees.toLocaleString()} paid in late fees
          </Text>
        </View>
      )}
    </View>
  );
};

// ============ PAYMENT HISTORY ITEM ============
type PaymentItemProps = {
  payment: PaymentHistory;
  onPress: () => void;
};

const PaymentItem = ({ payment, onPress }: PaymentItemProps) => {
  const getStatusConfig = () => {
    switch (payment.status) {
      case 'paid':
        return { icon: 'checkmark.circle.fill', color: '#046C4E', label: 'Paid' };
      case 'pending':
        return { icon: 'clock.fill', color: '#F59E0B', label: 'Pending' };
      case 'overdue':
        return { icon: 'exclamationmark.circle.fill', color: '#DC2626', label: 'Overdue' };
      case 'scheduled':
        return { icon: 'calendar.badge.clock', color: '#2563EB', label: 'Scheduled' };
      case 'failed':
        return { icon: 'xmark.circle.fill', color: '#DC2626', label: 'Failed' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <TouchableOpacity style={styles.paymentItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.paymentStatusIcon, { backgroundColor: statusConfig.color + '15' }]}>
        <SFSymbol name={statusConfig.icon} size={20} color={statusConfig.color} />
      </View>
      
      <View style={styles.paymentInfo}>
        <View style={styles.paymentInfoTop}>
          <Text style={styles.paymentDate}>{payment.payment_date}</Text>
          {payment.was_late && (
            <View style={styles.lateBadge}>
              <Text style={styles.lateBadgeText}>Late</Text>
            </View>
          )}
        </View>
        <View style={styles.paymentInfoBottom}>
          <Text style={styles.paymentMethod}>
            {payment.payment_method || 'Manual Payment'}
          </Text>
          {payment.confirmation_number && (
            <Text style={styles.paymentConfirmation}>
              #{payment.confirmation_number}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.paymentRight}>
        <Text style={[styles.paymentAmount, { color: statusConfig.color }]}>
          ${payment.amount.toLocaleString()}
        </Text>
        {payment.late_fee && payment.late_fee > 0 && (
          <Text style={styles.paymentLateFee}>
            +${payment.late_fee} fee
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ============ BILL DETAILS CARD ============
type BillDetailsCardProps = {
  bill: Bill;
  onToggleAutoPay: (value: boolean) => void;
};

const BillDetailsCard = ({ bill, onToggleAutoPay }: BillDetailsCardProps) => {
  const config = categoryConfig[bill.category];

  return (
    <View style={styles.detailsCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: '#6B728015' }]}>
            <SFSymbol name="info.circle.fill" size={16} color="#6B7280" />
          </View>
          <Text style={styles.sectionTitle}>Bill Details</Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailRow}>
          <View style={styles.detailRowLeft}>
            <SFSymbol name="building.2" size={16} color="#8E8E93" />
            <Text style={styles.detailLabel}>Payee</Text>
          </View>
          <Text style={styles.detailValue}>{bill.payee}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailRowLeft}>
            <SFSymbol name={config.icon} size={16} color={config.color} />
            <Text style={styles.detailLabel}>Category</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: config.color + '15' }]}>
            <Text style={[styles.categoryBadgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailRowLeft}>
            <SFSymbol name="repeat" size={16} color="#8E8E93" />
            <Text style={styles.detailLabel}>Frequency</Text>
          </View>
          <Text style={styles.detailValue}>{frequencyLabels[bill.frequency]}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailRowLeft}>
            <SFSymbol name="calendar" size={16} color="#8E8E93" />
            <Text style={styles.detailLabel}>Due Day</Text>
          </View>
          <Text style={styles.detailValue}>
            {bill.due_day}{getOrdinalSuffix(bill.due_day)} of each {getFrequencyPeriod(bill.frequency)}
          </Text>
        </View>

        {bill.account_number && (
          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <SFSymbol name="number" size={16} color="#8E8E93" />
              <Text style={styles.detailLabel}>Account</Text>
            </View>
            <Text style={styles.detailValue}>****{bill.account_number.slice(-4)}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <View style={styles.detailRowLeft}>
            <SFSymbol name="bell" size={16} color="#8E8E93" />
            <Text style={styles.detailLabel}>Reminder</Text>
          </View>
          <Text style={styles.detailValue}>
            {bill.reminder_days} days before
          </Text>
        </View>

        <View style={styles.detailRowToggle}>
          <View style={styles.detailRowLeft}>
            <SFSymbol name="arrow.triangle.2.circlepath" size={16} color="#046C4E" />
            <Text style={styles.detailLabel}>Auto-Pay</Text>
          </View>
          <Switch
            value={bill.is_auto_pay}
            onValueChange={onToggleAutoPay}
            trackColor={{ false: '#E5E5EA', true: '#046C4E' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {bill.is_variable_amount && (
          <View style={styles.variableAmountNote}>
            <SFSymbol name="dollarsign.arrow.circlepath" size={14} color="#F59E0B" />
            <Text style={styles.variableAmountText}>
              Amount varies each billing cycle
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ============ HELPER FUNCTIONS ============
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

const getFrequencyPeriod = (frequency: BillFrequency): string => {
  switch (frequency) {
    case 'weekly': return 'week';
    case 'biweekly': return '2 weeks';
    case 'monthly': return 'month';
    case 'quarterly': return 'quarter';
    case 'yearly': return 'year';
  }
};

// ============ YEARLY CHART ============
type YearlyChartProps = {
  payments: PaymentHistory[];
  amount: number;
};

const YearlyChart = ({ payments, amount }: YearlyChartProps) => {
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const currentMonth = new Date().getMonth();

  // Group payments by month
  const paymentsByMonth = payments.reduce((acc, p) => {
    const date = new Date(p.payment_date);
    const month = date.getMonth();
    if (!acc[month]) acc[month] = [];
    acc[month].push(p);
    return acc;
  }, {} as Record<number, PaymentHistory[]>);

  return (
    <View style={styles.yearlyChartCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: '#2563EB15' }]}>
            <SFSymbol name="calendar" size={16} color="#2563EB" />
          </View>
          <Text style={styles.sectionTitle}>2025 Overview</Text>
        </View>
      </View>

      <View style={styles.yearlyChartGrid}>
        {months.map((month, index) => {
          const monthPayments = paymentsByMonth[index] || [];
          const isPaid = monthPayments.some(p => p.status === 'paid');
          const isOverdue = monthPayments.some(p => p.status === 'overdue' || p.was_late);
          const isFuture = index > currentMonth;
          const isCurrent = index === currentMonth;

          return (
            <View key={month} style={styles.yearlyChartMonth}>
              <View style={[
                styles.yearlyChartDot,
                isPaid && styles.yearlyChartDotPaid,
                isOverdue && styles.yearlyChartDotLate,
                isFuture && styles.yearlyChartDotFuture,
                isCurrent && styles.yearlyChartDotCurrent,
              ]}>
                {isPaid && !isOverdue && (
                  <SFSymbol name="checkmark" size={10} color="#FFFFFF" />
                )}
                {isOverdue && (
                  <SFSymbol name="exclamationmark" size={10} color="#FFFFFF" />
                )}
              </View>
              <Text style={[
                styles.yearlyChartLabel,
                isCurrent && styles.yearlyChartLabelCurrent,
              ]}>
                {month}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.yearlyChartLegend}>
        <View style={styles.yearlyChartLegendItem}>
          <View style={[styles.yearlyChartLegendDot, { backgroundColor: '#046C4E' }]} />
          <Text style={styles.yearlyChartLegendText}>Paid</Text>
        </View>
        <View style={styles.yearlyChartLegendItem}>
          <View style={[styles.yearlyChartLegendDot, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.yearlyChartLegendText}>Late</Text>
        </View>
        <View style={styles.yearlyChartLegendItem}>
          <View style={[styles.yearlyChartLegendDot, { backgroundColor: '#E5E5EA' }]} />
          <Text style={styles.yearlyChartLegendText}>Upcoming</Text>
        </View>
      </View>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function BillDetailScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'BillDetailScreen'>>();
  const billId = route.params?.billId;
  
  const { 
    bill: apiBill, 
    payments,
    isLoading, 
    error,
    deleteBill,
    markAsPaid,
    pauseBill,
    resumeBill,
    updateBill,
  } = useBill(billId);

  // Transform API bill to local format for display
  const bill: Bill | null = apiBill ? {
    bill_id: apiBill.bill_id,
    bill_name: apiBill.bill_name,
    payee: apiBill.payee,
    category: apiBill.category as unknown as BillCategory,
    amount: apiBill.amount,
    frequency: apiBill.frequency as unknown as BillFrequency,
    due_day: apiBill.due_day || new Date(apiBill.next_due_date).getDate(),
    is_auto_pay: apiBill.is_auto_pay,
    is_variable_amount: apiBill.is_variable_amount || false,
    reminder_days: apiBill.reminder_days || 3,
    account_number: apiBill.account_number,
    website: apiBill.website,
    status: apiBill.status as BillStatus,
    notes: apiBill.notes,
    created_at: apiBill.created_at,
    updated_at: apiBill.updated_at,
    next_payment: {
      due_date: apiBill.next_due_date,
      amount: apiBill.amount,
      days_until: Math.ceil((new Date(apiBill.next_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      is_overdue: new Date(apiBill.next_due_date) < new Date(),
    },
    payment_history: payments.map(p => ({
      payment_id: p.payment_id,
      amount: p.amount,
      payment_date: p.payment_date,
      status: p.status as PaymentStatus,
      payment_method: p.payment_method,
      confirmation_number: p.confirmation_number,
      notes: p.notes,
      was_late: p.was_late || false,
      late_fee: p.late_fee,
    })),
    stats: {
      total_paid_ytd: 0,
      total_paid_all_time: payments.reduce((sum, p) => sum + p.amount, 0),
      average_payment: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
      on_time_percentage: 100,
      total_late_fees: payments.reduce((sum, p) => sum + (p.late_fee || 0), 0),
      payments_count: payments.length,
      streak_on_time: 0,
    },
  } : null;

  const handleEdit = () => {
    navigation.navigate('EditBillScreen', { billId: route.params?.billId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete "${bill?.bill_name}"? This will also delete all payment history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteBill();
            if (success) {
              Alert.alert('Deleted', 'Bill has been deleted.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            }
          }
        },
      ]
    );
  };

  const handleMarkPaid = () => {
    Alert.alert(
      'Mark as Paid',
      `Record payment of $${bill?.next_payment.amount.toLocaleString()} for ${bill?.bill_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Payment', 
          onPress: async () => {
            const payment = await markAsPaid({ amount: bill?.next_payment.amount });
            if (payment) {
              Alert.alert('Success', 'Payment recorded successfully!');
            }
          }
        },
      ]
    );
  };

  const handleToggleAutoPay = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Auto-Pay',
        'This will automatically pay this bill on the due date. Make sure your payment method is set up.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: async () => {
              await updateBill({ is_auto_pay: true });
            }
          },
        ]
      );
    } else {
      await updateBill({ is_auto_pay: false });
    }
  };

  const handlePaymentPress = (payment: PaymentHistory) => {
    Alert.alert(
      `Payment - ${payment.payment_date}`,
      `Amount: $${payment.amount.toLocaleString()}\nMethod: ${payment.payment_method || 'Manual'}\nConfirmation: ${payment.confirmation_number || 'N/A'}${payment.notes ? `\n\nNotes: ${payment.notes}` : ''}${payment.late_fee ? `\n\nLate Fee: $${payment.late_fee}` : ''}`
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header bill={null} onEdit={handleEdit} onDelete={handleDelete} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Loading bill details...</Text>
        </View>
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.container}>
        <Header bill={null} onEdit={handleEdit} onDelete={handleDelete} />
        <View style={styles.errorContainer}>
          <SFSymbol name="exclamationmark.triangle.fill" size={48} color="#DC2626" />
          <Text style={styles.errorText}>Bill not found</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const config = categoryConfig[bill.category];

  return (
    <View style={styles.container}>
      <Header bill={bill} onEdit={handleEdit} onDelete={handleDelete} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: config.color + '10' }]}>
          <View style={[styles.billIcon, { backgroundColor: config.color + '20' }]}>
            <SFSymbol name={config.icon} size={32} color={config.color} />
          </View>
          
          <Text style={styles.billName}>{bill.bill_name}</Text>
          <Text style={styles.billPayee}>{bill.payee}</Text>

          <View style={styles.billAmountContainer}>
            <Text style={styles.billAmountLabel}>
              {bill.is_variable_amount ? 'Typical Amount' : 'Amount'}
            </Text>
            <Text style={[styles.billAmount, { color: config.color }]}>
              ${bill.amount.toLocaleString()}
            </Text>
            <Text style={styles.billFrequency}>{frequencyLabels[bill.frequency]}</Text>
          </View>

          {bill.status !== 'active' && (
            <View style={[
              styles.statusBanner,
              { backgroundColor: bill.status === 'paused' ? '#F59E0B' : '#DC2626' }
            ]}>
              <SFSymbol 
                name={bill.status === 'paused' ? 'pause.circle.fill' : 'xmark.circle.fill'} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusBannerText}>
                {bill.status === 'paused' ? 'Bill Paused' : 'Bill Cancelled'}
              </Text>
            </View>
          )}
        </View>

        {/* Next Payment Card */}
        {bill.status === 'active' && (
          <NextPaymentCard
            payment={bill.next_payment}
            billName={bill.bill_name}
            isAutoPay={bill.is_auto_pay}
            onMarkPaid={handleMarkPaid}
          />
        )}

        {/* Stats Card */}
        <StatsCard stats={bill.stats} frequency={bill.frequency} amount={bill.amount} />

        {/* Yearly Overview */}
        <YearlyChart payments={bill.payment_history} amount={bill.amount} />

        {/* Bill Details */}
        <BillDetailsCard bill={bill} onToggleAutoPay={handleToggleAutoPay} />

        {/* Payment History */}
        <View style={styles.paymentHistorySection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionHeaderIcon, { backgroundColor: '#046C4E15' }]}>
                <SFSymbol name="clock.fill" size={16} color="#046C4E" />
              </View>
              <Text style={styles.sectionTitle}>Payment History</Text>
            </View>
            <Text style={styles.sectionCount}>{bill.payment_history.length}</Text>
          </View>

          {bill.payment_history.map((payment) => (
            <PaymentItem
              key={payment.payment_id}
              payment={payment}
              onPress={() => handlePaymentPress(payment)}
            />
          ))}
        </View>

        {/* Notes */}
        {bill.notes && (
          <View style={styles.notesCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionHeaderIcon, { backgroundColor: '#6B728015' }]}>
                  <SFSymbol name="note.text" size={16} color="#6B7280" />
                </View>
                <Text style={styles.sectionTitle}>Notes</Text>
              </View>
            </View>
            <Text style={styles.notesText}>{bill.notes}</Text>
          </View>
        )}

        {/* Website Link */}
        {bill.website && (
          <TouchableOpacity style={styles.websiteButton}>
            <SFSymbol name="globe" size={18} color="#2563EB" />
            <Text style={styles.websiteButtonText}>Visit {bill.payee} Website</Text>
            <SFSymbol name="arrow.up.right" size={14} color="#2563EB" />
          </TouchableOpacity>
        )}

        {/* Meta Info */}
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>Added: {bill.created_at}</Text>
          <Text style={styles.metaText}>Last updated: {bill.updated_at}</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    zIndex: 100,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  menuDropdown: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 170,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
  },
  menuItemTextDanger: {
    color: '#DC2626',
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
  },
  errorButton: {
    backgroundColor: '#046C4E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  billIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  billName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  billPayee: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  billAmountContainer: {
    alignItems: 'center',
  },
  billAmountLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 36,
    fontWeight: '700',
  },
  billFrequency: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Next Payment Card
  nextPaymentCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  nextPaymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  urgencyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  autoPayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoPayBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#046C4E',
  },
  nextPaymentMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nextPaymentAmount: {
    flex: 1,
  },
  nextPaymentLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  nextPaymentValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  nextPaymentDate: {
    alignItems: 'flex-end',
  },
  nextPaymentDateValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  nextPaymentDays: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  markPaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  markPaidButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  autoPayNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoPayNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#046C4E',
  },

  // Stats Card
  statsCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  lateFeeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  lateFeeWarningText: {
    fontSize: 13,
    color: '#DC2626',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sectionCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },

  // Yearly Chart
  yearlyChartCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  yearlyChartGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  yearlyChartMonth: {
    alignItems: 'center',
  },
  yearlyChartDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  yearlyChartDotPaid: {
    backgroundColor: '#046C4E',
  },
  yearlyChartDotLate: {
    backgroundColor: '#DC2626',
  },
  yearlyChartDotFuture: {
    backgroundColor: '#E5E5EA',
  },
  yearlyChartDotCurrent: {
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  yearlyChartLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  yearlyChartLabelCurrent: {
    color: '#2563EB',
    fontWeight: '600',
  },
  yearlyChartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  yearlyChartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yearlyChartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  yearlyChartLegendText: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // Details Card
  detailsCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRowToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  variableAmountNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  variableAmountText: {
    fontSize: 13,
    color: '#92400E',
  },

  // Payment History
  paymentHistorySection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  paymentStatusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  lateBadge: {
    backgroundColor: '#DC262615',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  paymentInfoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  paymentMethod: {
    fontSize: 13,
    color: '#8E8E93',
  },
  paymentConfirmation: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  paymentRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentLateFee: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 2,
  },

  // Notes Card
  notesCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },

  // Website Button
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    backgroundColor: '#DBEAFE',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  websiteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },

  // Meta Info
  metaInfo: {
    paddingHorizontal: 20,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Bottom
  bottomSpacer: {
    height: 40,
  },
});