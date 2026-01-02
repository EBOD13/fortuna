// src/screens/EditBillScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import DatePickerComponent from '../components/inputs/DatePickerComponent';

// ============ TYPES ============
type BillCategory = 
  | 'utilities' | 'housing' | 'insurance' | 'subscriptions' | 'phone'
  | 'internet' | 'streaming' | 'loan' | 'credit_card' | 'healthcare'
  | 'education' | 'membership' | 'other';

type BillFrequency = 
  | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

type PaymentMethod = 
  | 'bank_account' | 'credit_card' | 'debit_card' | 'check' | 'cash' | 'other';

type ReminderTiming = 
  | 'day_of' | '1_day_before' | '3_days_before' | '1_week_before' | '2_weeks_before';

type BillStatus = 'active' | 'paused' | 'cancelled';

type Bill = {
  bill_id: string;
  name: string;
  description?: string;
  category: BillCategory;
  amount: number;
  is_variable_amount: boolean;
  estimated_amount?: number;
  
  // Schedule
  frequency: BillFrequency;
  due_date: Date;
  next_due_date: Date;
  day_of_month?: number;
  
  // Payment
  payment_method?: PaymentMethod;
  account_number?: string;
  is_auto_pay: boolean;
  auto_pay_date?: Date;
  
  // Reminders
  reminders_enabled: boolean;
  reminder_timing: ReminderTiming;
  
  // Provider
  provider_name?: string;
  provider_website?: string;
  provider_phone?: string;
  
  // Status
  status: BillStatus;
  
  // Budget
  budget_id?: string;
  budget_name?: string;
  
  // Notes
  notes?: string;
  
  // Meta
  created_at: string;
  updated_at: string;
  
  // History
  payment_history?: {
    payment_id: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'failed' | 'late';
  }[];
};

// ============ CONFIG ============
const categoryConfig: Record<BillCategory, { label: string; icon: string; color: string }> = {
  utilities: { label: 'Utilities', icon: 'bolt.fill', color: '#F59E0B' },
  housing: { label: 'Housing', icon: 'house.fill', color: '#78716C' },
  insurance: { label: 'Insurance', icon: 'shield.fill', color: '#14B8A6' },
  subscriptions: { label: 'Subscriptions', icon: 'repeat', color: '#7C3AED' },
  phone: { label: 'Phone', icon: 'phone.fill', color: '#3B82F6' },
  internet: { label: 'Internet', icon: 'wifi', color: '#0EA5E9' },
  streaming: { label: 'Streaming', icon: 'play.tv.fill', color: '#DC2626' },
  loan: { label: 'Loan', icon: 'banknote.fill', color: '#046C4E' },
  credit_card: { label: 'Credit Card', icon: 'creditcard.fill', color: '#8B5CF6' },
  healthcare: { label: 'Healthcare', icon: 'heart.fill', color: '#EF4444' },
  education: { label: 'Education', icon: 'graduationcap.fill', color: '#6366F1' },
  membership: { label: 'Membership', icon: 'person.crop.circle.badge.checkmark', color: '#EC4899' },
  other: { label: 'Other', icon: 'ellipsis.circle.fill', color: '#6B7280' },
};

const frequencyConfig: Record<BillFrequency, { label: string; description: string }> = {
  weekly: { label: 'Weekly', description: 'Every week' },
  biweekly: { label: 'Bi-weekly', description: 'Every 2 weeks' },
  monthly: { label: 'Monthly', description: 'Once a month' },
  quarterly: { label: 'Quarterly', description: 'Every 3 months' },
  semi_annual: { label: 'Semi-Annual', description: 'Every 6 months' },
  annual: { label: 'Annual', description: 'Once a year' },
};

const paymentMethodConfig: Record<PaymentMethod, { label: string; icon: string }> = {
  bank_account: { label: 'Bank Account', icon: 'building.columns.fill' },
  credit_card: { label: 'Credit Card', icon: 'creditcard.fill' },
  debit_card: { label: 'Debit Card', icon: 'creditcard.fill' },
  check: { label: 'Check', icon: 'doc.text.fill' },
  cash: { label: 'Cash', icon: 'banknote.fill' },
  other: { label: 'Other', icon: 'ellipsis.circle.fill' },
};

const reminderTimingConfig: Record<ReminderTiming, { label: string }> = {
  day_of: { label: 'Day of due date' },
  '1_day_before': { label: '1 day before' },
  '3_days_before': { label: '3 days before' },
  '1_week_before': { label: '1 week before' },
  '2_weeks_before': { label: '2 weeks before' },
};

const statusConfig: Record<BillStatus, { label: string; color: string; icon: string }> = {
  active: { label: 'Active', color: '#22C55E', icon: 'checkmark.circle.fill' },
  paused: { label: 'Paused', color: '#F59E0B', icon: 'pause.circle.fill' },
  cancelled: { label: 'Cancelled', color: '#DC2626', icon: 'xmark.circle.fill' },
};

// ============ COMPONENTS ============
type SectionHeaderProps = {
  title: string;
  icon?: string;
  color?: string;
};

const SectionHeader = ({ title, icon, color = '#8E8E93' }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    {icon && (
      <View style={[styles.sectionHeaderIcon, { backgroundColor: color + '15' }]}>
        <SFSymbol name={icon} size={14} color={color} />
      </View>
    )}
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad' | 'url';
  prefix?: string;
  suffix?: string;
  multiline?: boolean;
  optional?: boolean;
  disabled?: boolean;
};

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  prefix,
  suffix,
  multiline = false,
  optional = false,
  disabled = false,
}: InputFieldProps) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputLabelRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      {optional && <Text style={styles.optionalBadge}>Optional</Text>}
    </View>
    <View style={[
      styles.inputWrapper,
      multiline && styles.inputWrapperMultiline,
      disabled && styles.inputWrapperDisabled,
    ]}>
      {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={!disabled}
      />
      {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
    </View>
  </View>
);

type ToggleRowProps = {
  icon: string;
  iconColor?: string;
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
};

const ToggleRow = ({
  icon,
  iconColor = '#8E8E93',
  label,
  description,
  value,
  onToggle,
}: ToggleRowProps) => (
  <View style={styles.toggleRow}>
    <View style={[styles.toggleRowIcon, { backgroundColor: iconColor + '15' }]}>
      <SFSymbol name={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.toggleRowContent}>
      <Text style={styles.toggleRowLabel}>{label}</Text>
      {description && <Text style={styles.toggleRowDescription}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#E5E5EA', true: '#046C4E' }}
      thumbColor="#FFFFFF"
    />
  </View>
);

type SelectionRowProps = {
  icon: string;
  iconColor?: string;
  label: string;
  value: string;
  onPress: () => void;
};

const SelectionRow = ({
  icon,
  iconColor = '#8E8E93',
  label,
  value,
  onPress,
}: SelectionRowProps) => (
  <TouchableOpacity style={styles.selectionRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.selectionRowIcon, { backgroundColor: iconColor + '15' }]}>
      <SFSymbol name={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.selectionRowContent}>
      <Text style={styles.selectionRowLabel}>{label}</Text>
    </View>
    <Text style={styles.selectionRowValue}>{value}</Text>
    <SFSymbol name="chevron.right" size={14} color="#C7C7CC" />
  </TouchableOpacity>
);

// ============ SELECTION MODAL ============
type SelectionModalProps<T> = {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { value: T; label: string; description?: string; icon?: string; color?: string }[];
  selectedValue: T;
  onSelect: (value: T) => void;
};

function SelectionModal<T extends string>({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: SelectionModalProps<T>) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.modalOption,
                selectedValue === option.value && styles.modalOptionSelected,
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              {option.icon && (
                <View style={[
                  styles.modalOptionIcon,
                  { backgroundColor: (option.color || '#6B7280') + '15' },
                ]}>
                  <SFSymbol name={option.icon} size={20} color={option.color || '#6B7280'} />
                </View>
              )}
              <View style={styles.modalOptionContent}>
                <Text style={[
                  styles.modalOptionLabel,
                  selectedValue === option.value && styles.modalOptionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                {option.description && (
                  <Text style={styles.modalOptionDescription}>{option.description}</Text>
                )}
              </View>
              {selectedValue === option.value && (
                <SFSymbol name="checkmark.circle.fill" size={22} color="#046C4E" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============ MAIN COMPONENT ============
export default function EditBillScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditBillScreen'>>();
  const insets = useSafeAreaInsets();

  const billId = route.params?.billId;
  const isNewBill = !billId;

  const [loading, setLoading] = useState(!isNewBill);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BillCategory>('utilities');
  const [amount, setAmount] = useState('');
  const [isVariableAmount, setIsVariableAmount] = useState(false);
  const [estimatedAmount, setEstimatedAmount] = useState('');
  
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [dayOfMonth, setDayOfMonth] = useState('1');
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_account');
  const [accountNumber, setAccountNumber] = useState('');
  const [isAutoPay, setIsAutoPay] = useState(false);
  
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTiming, setReminderTiming] = useState<ReminderTiming>('3_days_before');
  
  const [providerName, setProviderName] = useState('');
  const [providerWebsite, setProviderWebsite] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  
  const [status, setStatus] = useState<BillStatus>('active');
  const [notes, setNotes] = useState('');

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showReminderTimingModal, setShowReminderTimingModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (!isNewBill) {
      fetchBill();
    }
  }, [billId]);

  const fetchBill = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Mock bill data
      const mockBill: Bill = {
        bill_id: billId || '1',
        name: 'Electric Bill',
        description: 'Monthly electricity service',
        category: 'utilities',
        amount: 120,
        is_variable_amount: true,
        estimated_amount: 120,
        
        frequency: 'monthly',
        due_date: new Date('2025-01-15'),
        next_due_date: new Date('2025-01-15'),
        day_of_month: 15,
        
        payment_method: 'bank_account',
        account_number: '****4567',
        is_auto_pay: true,
        
        reminders_enabled: true,
        reminder_timing: '3_days_before',
        
        provider_name: 'Pacific Gas & Electric',
        provider_website: 'https://pge.com',
        provider_phone: '1-800-743-5000',
        
        status: 'active',
        notes: 'Budget billing available if needed',
        
        created_at: '2024-06-15',
        updated_at: '2024-12-28',
        
        payment_history: [
          { payment_id: '1', amount: 118.45, date: '2024-12-15', status: 'paid' },
          { payment_id: '2', amount: 125.32, date: '2024-11-15', status: 'paid' },
          { payment_id: '3', amount: 112.89, date: '2024-10-15', status: 'paid' },
        ],
      };

      // Populate form
      setName(mockBill.name);
      setDescription(mockBill.description || '');
      setCategory(mockBill.category);
      setAmount(mockBill.amount.toString());
      setIsVariableAmount(mockBill.is_variable_amount);
      setEstimatedAmount(mockBill.estimated_amount?.toString() || '');
      setFrequency(mockBill.frequency);
      setDueDate(mockBill.due_date);
      setDayOfMonth(mockBill.day_of_month?.toString() || '1');
      setPaymentMethod(mockBill.payment_method || 'bank_account');
      setAccountNumber(mockBill.account_number || '');
      setIsAutoPay(mockBill.is_auto_pay);
      setRemindersEnabled(mockBill.reminders_enabled);
      setReminderTiming(mockBill.reminder_timing);
      setProviderName(mockBill.provider_name || '');
      setProviderWebsite(mockBill.provider_website || '');
      setProviderPhone(mockBill.provider_phone || '');
      setStatus(mockBill.status);
      setNotes(mockBill.notes || '');

    } catch (error) {
      console.error('Error fetching bill:', error);
      Alert.alert('Error', 'Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  const markChanged = () => {
    if (!hasChanges) setHasChanges(true);
  };

  const canSave = () => {
    return name.trim() !== '' && (amount.trim() !== '' || isVariableAmount);
  };

  const handleSave = async () => {
    if (!canSave()) {
      Alert.alert('Missing Information', 'Please fill in the bill name and amount.');
      return;
    }

    setSaving(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        isNewBill ? 'Bill Created' : 'Bill Updated',
        `${name} has been ${isNewBill ? 'added to' : 'updated in'} your bills.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save bill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete "${name}"? This will also remove all payment history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await new Promise<void>(resolve => setTimeout(resolve, 500));
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bill');
            }
          },
        },
      ]
    );
  };

  const handleMarkPaid = () => {
    Alert.alert(
      'Mark as Paid',
      `Mark ${name} as paid for this period?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: () => {
            Alert.alert('Success', 'Bill marked as paid!');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <SFSymbol name="chevron.left" size={20} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
        </View>
      </View>
    );
  }

  const catConfig = categoryConfig[category];
  const statConfig = statusConfig[status];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <SFSymbol name="chevron.left" size={20} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNewBill ? 'Add Bill' : 'Edit Bill'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || !canSave()}>
          {saving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[styles.saveText, !canSave() && styles.saveTextDisabled]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Status Banner (for existing bills) */}
        {!isNewBill && (
          <TouchableOpacity
            style={[styles.statusBanner, { backgroundColor: statConfig.color + '15' }]}
            onPress={() => setShowStatusModal(true)}
          >
            <SFSymbol name={statConfig.icon} size={20} color={statConfig.color} />
            <Text style={[styles.statusBannerText, { color: statConfig.color }]}>
              {statConfig.label}
            </Text>
            <SFSymbol name="chevron.right" size={14} color={statConfig.color} />
          </TouchableOpacity>
        )}

        {/* Bill Info */}
        <SectionHeader title="Bill Information" icon="doc.text.fill" color="#3B82F6" />

        <View style={styles.card}>
          <InputField
            label="Bill Name"
            value={name}
            onChangeText={(text) => { setName(text); markChanged(); }}
            placeholder="e.g., Electric Bill, Netflix"
          />

          <InputField
            label="Description"
            value={description}
            onChangeText={(text) => { setDescription(text); markChanged(); }}
            placeholder="Optional description"
            optional
          />

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={[styles.categorySelectorIcon, { backgroundColor: catConfig.color + '15' }]}>
                <SFSymbol name={catConfig.icon} size={20} color={catConfig.color} />
              </View>
              <Text style={styles.categorySelectorText}>{catConfig.label}</Text>
              <SFSymbol name="chevron.right" size={14} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount */}
        <SectionHeader title="Amount" icon="dollarsign.circle.fill" color="#22C55E" />

        <View style={styles.card}>
          <ToggleRow
            icon="arrow.up.arrow.down"
            iconColor="#F59E0B"
            label="Variable Amount"
            description="Amount changes each billing cycle"
            value={isVariableAmount}
            onToggle={(value) => { setIsVariableAmount(value); markChanged(); }}
          />

          {isVariableAmount ? (
            <InputField
              label="Estimated Amount"
              value={estimatedAmount}
              onChangeText={(text) => { setEstimatedAmount(text); markChanged(); }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              prefix="$"
            />
          ) : (
            <InputField
              label="Bill Amount"
              value={amount}
              onChangeText={(text) => { setAmount(text); markChanged(); }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              prefix="$"
            />
          )}
        </View>

        {/* Schedule */}
        <SectionHeader title="Schedule" icon="calendar" color="#8B5CF6" />

        <View style={styles.card}>
          <SelectionRow
            icon="repeat"
            iconColor="#7C3AED"
            label="Frequency"
            value={frequencyConfig[frequency].label}
            onPress={() => setShowFrequencyModal(true)}
          />

          <View style={styles.datePickerContainer}>
            <DatePickerComponent
              label="Next Due Date"
              value={dueDate}
              onChange={(date) => { setDueDate(date); markChanged(); }}
              variant="field"
              format="medium"
            />
          </View>

          {frequency === 'monthly' && (
            <InputField
              label="Day of Month"
              value={dayOfMonth}
              onChangeText={(text) => { setDayOfMonth(text); markChanged(); }}
              placeholder="1-31"
              keyboardType="numeric"
            />
          )}
        </View>

        {/* Payment */}
        <SectionHeader title="Payment" icon="creditcard.fill" color="#EC4899" />

        <View style={styles.card}>
          <SelectionRow
            icon={paymentMethodConfig[paymentMethod].icon}
            iconColor="#EC4899"
            label="Payment Method"
            value={paymentMethodConfig[paymentMethod].label}
            onPress={() => setShowPaymentMethodModal(true)}
          />

          <InputField
            label="Account/Card Number"
            value={accountNumber}
            onChangeText={(text) => { setAccountNumber(text); markChanged(); }}
            placeholder="Last 4 digits"
            optional
          />

          <ToggleRow
            icon="arrow.triangle.2.circlepath"
            iconColor="#046C4E"
            label="Auto-Pay"
            description="Automatically pay when due"
            value={isAutoPay}
            onToggle={(value) => { setIsAutoPay(value); markChanged(); }}
          />
        </View>

        {/* Reminders */}
        <SectionHeader title="Reminders" icon="bell.fill" color="#F59E0B" />

        <View style={styles.card}>
          <ToggleRow
            icon="bell.badge.fill"
            iconColor="#F59E0B"
            label="Payment Reminders"
            description="Get notified before due date"
            value={remindersEnabled}
            onToggle={(value) => { setRemindersEnabled(value); markChanged(); }}
          />

          {remindersEnabled && (
            <SelectionRow
              icon="clock.fill"
              iconColor="#F59E0B"
              label="Remind Me"
              value={reminderTimingConfig[reminderTiming].label}
              onPress={() => setShowReminderTimingModal(true)}
            />
          )}
        </View>

        {/* Provider */}
        <SectionHeader title="Provider Details" icon="building.2.fill" color="#0EA5E9" />

        <View style={styles.card}>
          <InputField
            label="Provider Name"
            value={providerName}
            onChangeText={(text) => { setProviderName(text); markChanged(); }}
            placeholder="Company name"
            optional
          />

          <InputField
            label="Website"
            value={providerWebsite}
            onChangeText={(text) => { setProviderWebsite(text); markChanged(); }}
            placeholder="https://"
            keyboardType="url"
            optional
          />

          <InputField
            label="Phone Number"
            value={providerPhone}
            onChangeText={(text) => { setProviderPhone(text); markChanged(); }}
            placeholder="Customer service number"
            keyboardType="phone-pad"
            optional
          />
        </View>

        {/* Notes */}
        <SectionHeader title="Notes" icon="note.text" color="#6B7280" />

        <View style={styles.card}>
          <InputField
            label="Notes"
            value={notes}
            onChangeText={(text) => { setNotes(text); markChanged(); }}
            placeholder="Any additional notes..."
            multiline
            optional
          />
        </View>

        {/* Quick Actions (for existing bills) */}
        {!isNewBill && (
          <>
            <SectionHeader title="Quick Actions" icon="bolt.fill" color="#046C4E" />

            <View style={styles.quickActionsCard}>
              <TouchableOpacity style={styles.quickAction} onPress={handleMarkPaid}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#22C55E15' }]}>
                  <SFSymbol name="checkmark.circle.fill" size={22} color="#22C55E" />
                </View>
                <Text style={styles.quickActionText}>Mark as Paid</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => navigation.navigate('BillDetailScreen', { billId: billId! })}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F615' }]}>
                  <SFSymbol name="clock.arrow.circlepath" size={22} color="#3B82F6" />
                </View>
                <Text style={styles.quickActionText}>View History</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => setStatus(status === 'paused' ? 'active' : 'paused')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B15' }]}>
                  <SFSymbol 
                    name={status === 'paused' ? 'play.circle.fill' : 'pause.circle.fill'} 
                    size={22} 
                    color="#F59E0B" 
                  />
                </View>
                <Text style={styles.quickActionText}>
                  {status === 'paused' ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Delete Button (for existing bills) */}
        {!isNewBill && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <SFSymbol name="trash.fill" size={18} color="#DC2626" />
            <Text style={styles.deleteButtonText}>Delete Bill</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Selection Modals */}
      <SelectionModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Select Category"
        options={Object.entries(categoryConfig).map(([key, config]) => ({
          value: key as BillCategory,
          label: config.label,
          icon: config.icon,
          color: config.color,
        }))}
        selectedValue={category}
        onSelect={(value) => { setCategory(value); markChanged(); }}
      />

      <SelectionModal
        visible={showFrequencyModal}
        onClose={() => setShowFrequencyModal(false)}
        title="Billing Frequency"
        options={Object.entries(frequencyConfig).map(([key, config]) => ({
          value: key as BillFrequency,
          label: config.label,
          description: config.description,
        }))}
        selectedValue={frequency}
        onSelect={(value) => { setFrequency(value); markChanged(); }}
      />

      <SelectionModal
        visible={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        title="Payment Method"
        options={Object.entries(paymentMethodConfig).map(([key, config]) => ({
          value: key as PaymentMethod,
          label: config.label,
          icon: config.icon,
        }))}
        selectedValue={paymentMethod}
        onSelect={(value) => { setPaymentMethod(value); markChanged(); }}
      />

      <SelectionModal
        visible={showReminderTimingModal}
        onClose={() => setShowReminderTimingModal(false)}
        title="Reminder Timing"
        options={Object.entries(reminderTimingConfig).map(([key, config]) => ({
          value: key as ReminderTiming,
          label: config.label,
        }))}
        selectedValue={reminderTiming}
        onSelect={(value) => { setReminderTiming(value); markChanged(); }}
      />

      <SelectionModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Bill Status"
        options={Object.entries(statusConfig).map(([key, config]) => ({
          value: key as BillStatus,
          label: config.label,
          icon: config.icon,
          color: config.color,
        }))}
        selectedValue={status}
        onSelect={(value) => { setStatus(value); markChanged(); }}
      />
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveTextDisabled: {
    color: '#C7C7CC',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    gap: 8,
  },
  sectionHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },

  // Input
  inputContainer: {
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  optionalBadge: {
    fontSize: 11,
    color: '#8E8E93',
    marginLeft: 8,
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputWrapperMultiline: {
    height: 80,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputWrapperDisabled: {
    opacity: 0.6,
  },
  inputPrefix: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 4,
  },
  inputSuffix: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  inputMultiline: {
    height: '100%',
    textAlignVertical: 'top',
  },

  // Category Selector
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
  },
  categorySelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  toggleRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleRowContent: {
    flex: 1,
  },
  toggleRowLabel: {
    fontSize: 16,
    color: '#000',
  },
  toggleRowDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Selection Row
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  selectionRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectionRowContent: {
    flex: 1,
  },
  selectionRowLabel: {
    fontSize: 16,
    color: '#000',
  },
  selectionRowValue: {
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 8,
  },

  // Date Picker Container
  datePickerContainer: {
    marginTop: 12,
  },

  // Quick Actions
  quickActionsCard: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },

  // Delete Button
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC262615',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  modalCancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#046C4E10',
    borderWidth: 2,
    borderColor: '#046C4E',
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  modalOptionLabelSelected: {
    color: '#046C4E',
  },
  modalOptionDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  bottomSpacer: {
    height: 40,
  },
});