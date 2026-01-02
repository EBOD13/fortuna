// src/screens/AddIncomeScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useCreateIncome } from '../hooks/useIncome';
import type { IncomeSource } from '../types/income';

// ============ COLOR CONSTANTS ============
const COLORS = {
  charcoalBlack: '#1B1B1B',
  emeraldGreen: '#046C4E',
  matteGold: '#BFA46F',
  slateGray: '#2E3A46',
  mutedBurgundy: '#5A1E2B',
  lightGray: '#F2F2F7',
  white: '#FFFFFF',
  darkText: '#1B1B1B',
  mediumText: '#8E8E93',
  borderColor: '#E5E5EA',
  errorRed: '#FF3B30',
};

// ============ TYPES ============
type DropdownOption = {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  subtitle?: string;
};

type FormData = {
  name: string;
  source_kind: string | null;
  earning_model: string | null;
  rate_value: string;
  rate_unit: string | null;
  pay_frequency: string | null;
  max_units_per_period: string;
  amount_behavior: string | null;
  expected_min_amount: string;
  expected_max_amount: string;
  start_date: string;
  end_date: string;
  is_time_bound: boolean;
  status: string;
  is_taxable: boolean;
  tax_application_mode: string | null;
  tax_basis: string | null;
  default_allocation_mode: string | null;
  restricted_usage: boolean;
  priority_level: string;
  payout_delay_days: string;
  requires_manual_confirmation: boolean;
  user_notes: string;
};

// ============ DROPDOWN OPTIONS ============
// Aligned with SQL table source_kind enum
const sourceKinds: DropdownOption[] = [
  { id: 'employment', label: 'Employment', icon: 'briefcase.fill', color: COLORS.emeraldGreen, subtitle: 'Regular job or employment' },
  { id: 'scholarship', label: 'Scholarship', icon: 'graduationcap.fill', color: COLORS.matteGold, subtitle: 'Educational scholarship' },
  { id: 'grant', label: 'Grant', icon: 'hand.raised.fill', color: COLORS.slateGray, subtitle: 'Financial grant or award' },
  { id: 'gift', label: 'Gift', icon: 'gift.fill', color: COLORS.mutedBurgundy, subtitle: 'Gift or present' },
  { id: 'business', label: 'Business', icon: 'building.2.fill', color: COLORS.emeraldGreen, subtitle: 'Business income' },
  { id: 'royalty', label: 'Royalty', icon: 'crown.fill', color: COLORS.matteGold, subtitle: 'Royalty payments' },
  { id: 'allowance', label: 'Allowance', icon: 'dollarsign.circle.fill', color: COLORS.slateGray, subtitle: 'Regular allowance' },
  { id: 'other', label: 'Other', icon: 'ellipsis.circle.fill', color: COLORS.mediumText, subtitle: 'Other income type' },
];

// Aligned with SQL table earning_model enum
const earningModels: DropdownOption[] = [
  { id: 'fixed', label: 'Fixed', icon: 'dollarsign.square.fill', color: COLORS.emeraldGreen, subtitle: 'Fixed amount per period' },
  { id: 'time_based', label: 'Time-based', icon: 'clock.fill', color: COLORS.matteGold, subtitle: 'Paid based on time worked' },
  { id: 'unit_based', label: 'Unit-based', icon: 'number.circle.fill', color: COLORS.slateGray, subtitle: 'Paid per unit produced' },
  { id: 'variable', label: 'Variable', icon: 'chart.line.uptrend.xyaxis', color: COLORS.mutedBurgundy, subtitle: 'Variable income' },
  { id: 'mixed', label: 'Mixed', icon: 'arrow.triangle.2.circlepath', color: COLORS.mediumText, subtitle: 'Combination of models' },
];

// Aligned with SQL table rate_unit enum
const rateUnits: DropdownOption[] = [
  { id: 'hour', label: 'Per Hour', icon: 'clock.fill', subtitle: 'Hourly rate' },
  { id: 'day', label: 'Per Day', icon: 'sun.max.fill', subtitle: 'Daily rate' },
  { id: 'week', label: 'Per Week', icon: 'calendar', subtitle: 'Weekly rate' },
  { id: 'month', label: 'Per Month', icon: 'moon.fill', subtitle: 'Monthly rate' },
  { id: 'term', label: 'Per Term', icon: 'graduationcap.fill', subtitle: 'Per term/semester' },
  { id: 'payout', label: 'Per Payout', icon: 'banknote.fill', subtitle: 'Per payment' },
  { id: 'unit', label: 'Per Unit', icon: 'cube.fill', subtitle: 'Per unit/item' },
];

// Aligned with SQL table pay_frequency enum
const payFrequencies: DropdownOption[] = [
  { id: 'weekly', label: 'Weekly', icon: 'calendar.badge.clock', subtitle: 'Every week' },
  { id: 'biweekly', label: 'Bi-weekly', icon: 'calendar', subtitle: 'Every two weeks' },
  { id: 'monthly', label: 'Monthly', icon: 'moon.fill', subtitle: 'Every month' },
  { id: 'per_term', label: 'Per Term', icon: 'graduationcap.fill', subtitle: 'Per academic term' },
  { id: 'irregular', label: 'Irregular', icon: 'calendar.badge.exclamationmark', subtitle: 'No fixed schedule' },
];

// Aligned with SQL table amount_behavior enum
const amountBehaviors: DropdownOption[] = [
  { id: 'fixed', label: 'Fixed', icon: 'lock.fill', color: COLORS.emeraldGreen, subtitle: 'Consistent amount' },
  { id: 'bounded', label: 'Bounded', icon: 'arrow.left.and.right', color: COLORS.matteGold, subtitle: 'Within a range' },
  { id: 'unpredictable', label: 'Unpredictable', icon: 'questionmark.circle.fill', color: COLORS.mutedBurgundy, subtitle: 'Highly variable' },
];

// Aligned with SQL table status enum
const statusOptions: DropdownOption[] = [
  { id: 'active', label: 'Active', icon: 'checkmark.circle.fill', color: COLORS.emeraldGreen, subtitle: 'Currently receiving income' },
  { id: 'paused', label: 'Paused', icon: 'pause.circle.fill', color: COLORS.matteGold, subtitle: 'Temporarily inactive' },
  { id: 'completed', label: 'Completed', icon: 'checkmark.circle', color: COLORS.slateGray, subtitle: 'Income period ended' },
  { id: 'archived', label: 'Archived', icon: 'archivebox.fill', color: COLORS.mediumText, subtitle: 'No longer relevant' },
];

// Aligned with SQL table tax_application_mode enum
const taxModes: DropdownOption[] = [
  { id: 'withheld', label: 'Withheld', icon: 'lock.fill', subtitle: 'Taxes withheld at source' },
  { id: 'self_reported', label: 'Self-reported', icon: 'doc.text.fill', subtitle: 'You report taxes yourself' },
  { id: 'mixed', label: 'Mixed', icon: 'arrow.triangle.2.circlepath', subtitle: 'Combination of both' },
];

// Aligned with SQL table tax_basis enum
const taxBasisOptions: DropdownOption[] = [
  { id: 'gross', label: 'Gross', subtitle: 'Tax applied to gross income' },
  { id: 'net', label: 'Net', subtitle: 'Tax applied to net income' },
];

// Aligned with SQL table default_allocation_mode enum
const allocationModes: DropdownOption[] = [
  { id: 'spend', label: 'Spend', icon: 'cart.fill', color: COLORS.mutedBurgundy, subtitle: 'For spending' },
  { id: 'save', label: 'Save', icon: 'banknote.fill', color: COLORS.emeraldGreen, subtitle: 'For saving' },
  { id: 'invest', label: 'Invest', icon: 'chart.line.uptrend.xyaxis', color: COLORS.matteGold, subtitle: 'For investing' },
  { id: 'split', label: 'Split', icon: 'square.split.2x1', color: COLORS.slateGray, subtitle: 'Split between categories' },
];

// ============ HEADER ============
const FormHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  return (
    <View style={[styles.header, { paddingTop:  12 }]}>
      <View style={styles.headerButtonPlaceholder} />
      <Text style={styles.headerTitle}>Add Income Source</Text>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.headerCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============ DROPDOWN SELECTOR ============
type DropdownProps = {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  optional?: boolean;
};

const Dropdown = ({ label, placeholder, options, selectedId, onSelect, optional }: DropdownProps) => {
  const [visible, setVisible] = useState(false);
  const selected = options.find(o => o.id === selectedId);

  return (
    <>
      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>{label}</Text>
          {optional && <Text style={styles.optionalBadge}>Optional</Text>}
        </View>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          {selected ? (
            <View style={styles.dropdownSelected}>
              {selected.icon && (
                <View style={[styles.dropdownSelectedIcon, { backgroundColor: (selected.color || COLORS.emeraldGreen) + '20' }]}>
                  <SFSymbol name={selected.icon} size={18} weight="medium" color={selected.color || COLORS.emeraldGreen} />
                </View>
              )}
              <View style={styles.dropdownTextContainer}>
                <Text style={styles.dropdownSelectedText}>{selected.label}</Text>
                {selected.subtitle && (
                  <Text style={styles.dropdownSubtitle}>{selected.subtitle}</Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.dropdownPlaceholder}>{placeholder}</Text>
          )}
          <SFSymbol name="chevron.down" size={16} weight="medium" color={COLORS.mediumText} />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedId === item.id && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    setVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  {item.icon && (
                    <View style={[styles.modalOptionIcon, { backgroundColor: (item.color || COLORS.emeraldGreen) + '20' }]}>
                      <SFSymbol name={item.icon} size={22} weight="medium" color={item.color || COLORS.emeraldGreen} />
                    </View>
                  )}
                  <View style={styles.modalOptionContent}>
                    <Text style={[
                      styles.modalOptionLabel,
                      selectedId === item.id && styles.modalOptionLabelSelected,
                    ]}>
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.modalOptionSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  {selectedId === item.id && (
                    <SFSymbol name="checkmark.circle.fill" size={22} weight="medium" color={COLORS.emeraldGreen} />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
            />
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

// ============ INPUT FIELD ============
type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'number-pad';
  multiline?: boolean;
  prefix?: string;
  suffix?: string;
  optional?: boolean;
  maxLength?: number;
};

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
  prefix,
  suffix,
  optional = false,
  maxLength,
}: InputFieldProps) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputLabelRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      {optional && <Text style={styles.optionalBadge}>Optional</Text>}
    </View>
    <View style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}>
      {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.mediumText}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        maxLength={maxLength}
        cursorColor={COLORS.emeraldGreen}
        selectionColor={`${COLORS.emeraldGreen}40`}
      />
      {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
    </View>
  </View>
);

// ============ TOGGLE SWITCH ============
type ToggleSwitchProps = {
  label: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
};

const ToggleSwitch = ({ label, description, value, onToggle }: ToggleSwitchProps) => (
  <TouchableOpacity 
    style={styles.toggleContainer} 
    onPress={onToggle} 
    activeOpacity={0.7}
  >
    <View style={styles.toggleContent}>
      <Text style={styles.toggleLabel}>{label}</Text>
      {description && <Text style={styles.toggleDescription}>{description}</Text>}
    </View>
    <View style={[styles.toggle, value && styles.toggleActive]}>
      <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
    </View>
  </TouchableOpacity>
);

// ============ SECTION HEADER ============
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeaderContainer}>
    <Text style={styles.sectionHeader}>{title}</Text>
    <View style={styles.sectionHeaderLine} />
  </View>
);

// ============ DATE INPUT COMPONENT ============
const DateInputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  optional = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  optional?: boolean;
}) => {
  // Format date as user types
  const handleDateChange = (text: string) => {
    // Remove non-numeric characters
    const numbers = text.replace(/[^\d]/g, '');
    
    // Format as YYYY-MM-DD as user types
    let formatted = numbers;
    if (numbers.length > 4) {
      formatted = numbers.slice(0, 4) + '-' + numbers.slice(4, 6);
    }
    if (numbers.length > 6) {
      formatted = numbers.slice(0, 4) + '-' + numbers.slice(4, 6) + '-' + numbers.slice(6, 8);
    }
    
    onChangeText(formatted);
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputLabelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        {optional && <Text style={styles.optionalBadge}>Optional</Text>}
      </View>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mediumText}
          value={value}
          onChangeText={handleDateChange}
          keyboardType="number-pad"
          maxLength={10}
          cursorColor={COLORS.emeraldGreen}
          selectionColor={`${COLORS.emeraldGreen}40`}
        />
        {value && (
          <TouchableOpacity 
            onPress={() => onChangeText('')}
            style={styles.dateClearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SFSymbol name="xmark.circle.fill" size={18} weight="medium" color={COLORS.mediumText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function AddIncomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const createIncomeMutation = useCreateIncome();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    source_kind: null,
    earning_model: null,
    rate_value: '',
    rate_unit: null,
    pay_frequency: null,
    max_units_per_period: '',
    amount_behavior: null,
    expected_min_amount: '',
    expected_max_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_time_bound: false,
    status: 'active',
    is_taxable: true,
    tax_application_mode: null,
    tax_basis: null,
    default_allocation_mode: 'spend',
    restricted_usage: false,
    priority_level: '5',
    payout_delay_days: '0',
    requires_manual_confirmation: false,
    user_notes: '',
  });

  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const canSubmit = () => {
    return (
      formData.name.trim() !== '' &&
      formData.source_kind !== null &&
      formData.earning_model !== null &&
      formData.amount_behavior !== null &&
      formData.start_date.trim() !== '' &&
      formData.status !== ''
    );
  };

  const handleSubmit = () => {
  if (!canSubmit()) {
    Alert.alert(
      'Missing Information', 
      'Please fill in all required fields.',
      [{ text: 'OK', style: 'default' }]
    );
    return;
  }

  const requestData: Partial<IncomeSource> = {
    name: formData.name.trim(),
    source_kind: formData.source_kind as any,
    earning_model: formData.earning_model as any,
    rate_value: formData.rate_value ? parseFloat(formData.rate_value) : undefined,
    rate_unit: formData.rate_unit as any,
    pay_frequency: formData.pay_frequency as any,
    max_units_per_period: formData.max_units_per_period ? parseInt(formData.max_units_per_period) : undefined,
    amount_behavior: formData.amount_behavior as any,
    expected_min_amount: formData.expected_min_amount ? parseFloat(formData.expected_min_amount) : undefined,
    expected_max_amount: formData.expected_max_amount ? parseFloat(formData.expected_max_amount) : undefined,
    start_date: formData.start_date,
    end_date: formData.end_date || undefined,
    is_time_bound: formData.is_time_bound,
    status: formData.status as any,
    is_taxable: formData.is_taxable,
    tax_application_mode: formData.tax_application_mode as any,
    tax_basis: formData.tax_basis as any,
    default_allocation_mode: formData.default_allocation_mode as any,
    restricted_usage: formData.restricted_usage,
    priority_level: parseInt(formData.priority_level),
    payout_delay_days: parseInt(formData.payout_delay_days),
    requires_manual_confirmation: formData.requires_manual_confirmation,
    user_notes: formData.user_notes || undefined,
  };

  createIncomeMutation.mutate(requestData, {
    onSuccess: () => {
      Alert.alert(
        'Success!',
        `${formData.name} has been added as an income source.`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack(),
            style: 'default'
          }
        ]
      );
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        'Failed to create income source. Please try again.',
        [{ text: 'OK', style: 'cancel' }]
      );
      console.error('Error creating income source:', error);
    }
  });
};

  // Show range fields only for bounded amount behavior
  const showRangeFields = formData.amount_behavior === 'bounded';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FormHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Information */}
        <SectionHeader title="Basic Information" />
        
        <InputField
          label="Name"
          placeholder="e.g., Full-time Job, Freelance Work"
          value={formData.name}
          onChangeText={(text) => updateForm('name', text)}
          maxLength={100}
        />

        <Dropdown
          label="Income Type"
          placeholder="Select income type"
          options={sourceKinds}
          selectedId={formData.source_kind}
          onSelect={(id) => updateForm('source_kind', id)}
        />

        <Dropdown
          label="Earning Model"
          placeholder="Select how you earn"
          options={earningModels}
          selectedId={formData.earning_model}
          onSelect={(id) => updateForm('earning_model', id)}
        />

        {/* Rate Information */}
        <SectionHeader title="Rate Information" />

        <View style={styles.rowInputs}>
          <View style={styles.rowInputHalf}>
            <InputField
              label="Rate Value"
              placeholder="0.00"
              value={formData.rate_value}
              onChangeText={(text) => updateForm('rate_value', text)}
              keyboardType="decimal-pad"
              prefix="$"  
            />
          </View>
          <View style={styles.rowInputHalf}>
            <Dropdown
              label="Rate Unit"
              placeholder="Select unit"
              options={rateUnits}
              selectedId={formData.rate_unit}
              onSelect={(id) => updateForm('rate_unit', id)}
            />
          </View>
        </View>

        <Dropdown
          label="Payment Frequency"
          placeholder="Select frequency"
          options={payFrequencies}
          selectedId={formData.pay_frequency}
          onSelect={(id) => updateForm('pay_frequency', id)}
          optional
        />

        <InputField
          label="Max Units per Period"
          placeholder="e.g., 40 hours, 100 units"
          value={formData.max_units_per_period}
          onChangeText={(text) => updateForm('max_units_per_period', text)}
          keyboardType="numeric"
          suffix="units"
          optional
        />

        {/* Amount Behavior */}
        <SectionHeader title="Amount Behavior" />

        <Dropdown
          label="Amount Behavior"
          placeholder="Select behavior"
          options={amountBehaviors}
          selectedId={formData.amount_behavior}
          onSelect={(id) => updateForm('amount_behavior', id)}
        />

        {showRangeFields && (
          <View style={styles.rowInputs}>
            <View style={styles.rowInputHalf}>
              <InputField
                label="Min Amount"
                placeholder="0.00"
                value={formData.expected_min_amount}
                onChangeText={(text) => updateForm('expected_min_amount', text)}
                keyboardType="decimal-pad"
                prefix="$"
              />
            </View>
            <View style={styles.rowInputHalf}>
              <InputField
                label="Max Amount"
                placeholder="0.00"
                value={formData.expected_max_amount}
                onChangeText={(text) => updateForm('expected_max_amount', text)}
                keyboardType="decimal-pad"
                prefix="$"
              />
            </View>
          </View>
        )}

        {/* Time Period */}
        <SectionHeader title="Time Period" />

        <View style={styles.rowInputs}>
          <View style={styles.rowInputHalf}>
            <DateInputField
              label="Start Date"
              placeholder="YYYY-MM-DD"
              value={formData.start_date}
              onChangeText={(text) => updateForm('start_date', text)}
            />
          </View>
          <View style={styles.rowInputHalf}>
            <DateInputField
              label="End Date"
              placeholder="YYYY-MM-DD"
              value={formData.end_date}
              onChangeText={(text) => updateForm('end_date', text)}
              optional
            />
          </View>
        </View>

        <ToggleSwitch
          label="Time Bound"
          description="Has a specific end date"
          value={formData.is_time_bound}
          onToggle={() => updateForm('is_time_bound', !formData.is_time_bound)}
        />

        <Dropdown
          label="Status"
          placeholder="Select status"
          options={statusOptions}
          selectedId={formData.status}
          onSelect={(id) => updateForm('status', id)}
        />

        {/* Tax Information */}
        <SectionHeader title="Tax Information" />

        <ToggleSwitch
          label="Taxable Income"
          description="Subject to taxes"
          value={formData.is_taxable}
          onToggle={() => updateForm('is_taxable', !formData.is_taxable)}
        />

        {formData.is_taxable && (
          <>
            <Dropdown
              label="Tax Application"
              placeholder="Select tax mode"
              options={taxModes}
              selectedId={formData.tax_application_mode}
              onSelect={(id) => updateForm('tax_application_mode', id)}
              optional
            />

            <Dropdown
              label="Tax Basis"
              placeholder="Select basis"
              options={taxBasisOptions}
              selectedId={formData.tax_basis}
              onSelect={(id) => updateForm('tax_basis', id)}
              optional
            />
          </>
        )}

        {/* Allocation & Settings */}
        <SectionHeader title="Allocation & Settings" />

        <Dropdown
          label="Default Allocation"
          placeholder="Select allocation"
          options={allocationModes}
          selectedId={formData.default_allocation_mode}
          onSelect={(id) => updateForm('default_allocation_mode', id)}
        />

        <ToggleSwitch
          label="Restricted Usage"
          description="Income has specific usage rules"
          value={formData.restricted_usage}
          onToggle={() => updateForm('restricted_usage', !formData.restricted_usage)}
        />

        <InputField
          label="Priority Level"
          placeholder="1-10"
          value={formData.priority_level}
          onChangeText={(text) => {
            const num = parseInt(text);
            if ((num >= 1 && num <= 10) || text === '') {
              updateForm('priority_level', text);
            }
          }}
          keyboardType="numeric"
          maxLength={2}
          suffix="(1-10)"
        />

        <InputField
          label="Payout Delay Days"
          placeholder="0"
          value={formData.payout_delay_days}
          onChangeText={(text) => updateForm('payout_delay_days', text)}
          keyboardType="numeric"
          suffix="days"
        />

        <ToggleSwitch
          label="Manual Confirmation"
          description="Requires manual payout confirmation"
          value={formData.requires_manual_confirmation}
          onToggle={() => updateForm('requires_manual_confirmation', !formData.requires_manual_confirmation)}
        />

        {/* Notes */}
        <InputField
          label="Notes"
          placeholder="Any additional notes about this income..."
          value={formData.user_notes}
          onChangeText={(text) => updateForm('user_notes', text)}
          multiline
          optional
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit() || createIncomeMutation.isPending}
          activeOpacity={0.8}
        >
          {createIncomeMutation.isPending ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Add Income Source</Text>
          )}
      </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.charcoalBlack,
  },

// Styles
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingBottom: 10,
  backgroundColor: COLORS.charcoalBlack,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.slateGray,
},
headerButtonPlaceholder: {
  width: 50,
},
headerTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: COLORS.white,
},
headerCancelText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#007AFF',
},

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // Section Header
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mediumText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 12,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.slateGray,
  },

  // Input Field
  inputContainer: {
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  optionalBadge: {
    fontSize: 12,
    color: COLORS.mediumText,
    marginLeft: 8,
    backgroundColor: COLORS.slateGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slateGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapperMultiline: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  inputPrefix: {
    fontSize: 17,
    color: COLORS.matteGold,
    marginRight: 6,
    fontWeight: '500',
  },
  inputSuffix: {
    fontSize: 15,
    color: COLORS.mediumText,
    marginLeft: 6,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: COLORS.white,
    paddingVertical: 0,
  },
  inputMultiline: {
    height: '100%',
  },

  // Date Clear Button
  dateClearButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Row Inputs
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  rowInputHalf: {
    flex: 1,
  },

  // Dropdown
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.slateGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dropdownPlaceholder: {
    fontSize: 17,
    color: COLORS.mediumText,
  },
  dropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownSelectedIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownSelectedText: {
    fontSize: 17,
    color: COLORS.white,
    fontWeight: '500',
  },
  dropdownSubtitle: {
    fontSize: 13,
    color: COLORS.mediumText,
    marginTop: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.charcoalBlack,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 34,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.slateGray,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.mediumText,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalList: {
    paddingHorizontal: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slateGray,
  },
  modalOptionSelected: {
    backgroundColor: `${COLORS.emeraldGreen}15`,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.white,
  },
  modalOptionLabelSelected: {
    color: COLORS.emeraldGreen,
  },
  modalOptionSubtitle: {
    fontSize: 14,
    color: COLORS.mediumText,
    marginTop: 2,
  },
  modalCancelButton: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: COLORS.slateGray,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.slateGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  toggleDescription: {
    fontSize: 14,
    color: COLORS.mediumText,
    marginTop: 4,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.mediumText,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.emeraldGreen,
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.charcoalBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },

  // Bottom
  bottomSpacer: {
    height: 100,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34,
    backgroundColor: COLORS.charcoalBlack,
    borderTopWidth: 1,
    borderTopColor: COLORS.slateGray,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.emeraldGreen,
    borderRadius: 14,
    paddingVertical: 18,
    gap: 10,
    shadowColor: COLORS.emeraldGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.slateGray,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
  },
});