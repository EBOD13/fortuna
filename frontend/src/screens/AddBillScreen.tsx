// src/screens/AddBillScreen.tsx
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

// ============ TYPES ============
type CategoryType = 'housing' | 'utilities' | 'insurance' | 'subscription' | 'loan' | 'transportation' | 'healthcare' | 'education' | 'other';
type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'annually';
type PaymentMethod = 'bank_account' | 'credit_card' | 'debit_card' | 'cash' | 'other';

type DropdownOption = {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  subtitle?: string;
};

type FormData = {
  expense_name: string;
  category_id: CategoryType | null;
  amount: string;
  recurrence_frequency: Frequency | null;
  next_occurrence_date: string;
  payment_method: PaymentMethod | null;
  merchant_name: string;
  is_autopay: boolean;
  is_essential: boolean;
  reminder_days: number;
  notes: string;
};

// ============ DROPDOWN OPTIONS ============
const categories: DropdownOption[] = [
  { id: 'housing', label: 'Housing', color: '#2563EB', subtitle: 'Rent, mortgage, HOA' },
  { id: 'utilities', label: 'Utilities', color: '#F59E0B', subtitle: 'Electric, gas, water, internet' },
  { id: 'insurance', label: 'Insurance', color: '#046C4E', subtitle: 'Health, auto, home, life' },
  { id: 'subscription', label: 'Subscription', color: '#7C3AED', subtitle: 'Streaming, software, memberships' },
  { id: 'loan', label: 'Loan Payment', color: '#DC2626', subtitle: 'Car, student, personal loans' },
  { id: 'transportation', label: 'Transportation', color: '#0891B2', subtitle: 'Car payment, transit pass' },
  { id: 'healthcare', label: 'Healthcare', color: '#DB2777', subtitle: 'Medical, dental, vision' },
  { id: 'education', label: 'Education', color: '#4F46E5', subtitle: 'Tuition, courses, training' },
  { id: 'other', label: 'Other', color: '#6B7280', subtitle: 'Other recurring expenses' },
];

const frequencies: DropdownOption[] = [
  { id: 'weekly', label: 'Weekly', subtitle: 'Every week' },
  { id: 'biweekly', label: 'Bi-weekly', subtitle: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly', subtitle: 'Once a month' },
  { id: 'quarterly', label: 'Quarterly', subtitle: 'Every 3 months' },
  { id: 'semiannually', label: 'Semi-annually', subtitle: 'Twice a year' },
  { id: 'annually', label: 'Annually', subtitle: 'Once a year' },
];

const paymentMethods: DropdownOption[] = [
  { id: 'bank_account', label: 'Bank Account'},
  { id: 'credit_card', label: 'Credit Card'},
  { id: 'debit_card', label: 'Debit Card' },
  { id: 'cash', label: 'Cash' },
  { id: 'other', label: 'Other' },
];

const reminderOptions: DropdownOption[] = [
  { id: '0', label: 'On due date' },
  { id: '1', label: '1 day before' },
  { id: '3', label: '3 days before' },
  { id: '7', label: '1 week before' },
  { id: '14', label: '2 weeks before' },
];

// ============ HEADER ============
const FormHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: 12}]}>
          <View style={{ width: 60 }} />
          <Text style={styles.headerTitle}>Add Bill</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
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
                <View style={[styles.dropdownSelectedIcon, { backgroundColor: (selected.color || '#046C4E') + '15' }]}>
                  <SFSymbol name={selected.icon} size={18} color={selected.color || '#046C4E'} />
                </View>
              )}
              <Text style={styles.dropdownSelectedText}>{selected.label}</Text>
            </View>
          ) : (
            <Text style={styles.dropdownPlaceholder}>{placeholder}</Text>
          )}
          <SFSymbol name="chevron.down" style={{ marginRight: 5 }} size={16} color="#8E8E93" />
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
                >
                  {item.icon && (
                    <View style={[styles.modalOptionIcon, { backgroundColor: (item.color || '#046C4E') + '15' }]}>
                      <SFSymbol name={item.icon} size={22} color={item.color || '#046C4E'} />
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
                    <SFSymbol name="checkmark.circle.fill" size={22} color="#046C4E" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
            />
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
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  prefix?: string;
  suffix?: string;
  optional?: boolean;
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
        placeholderTextColor="#C7C7CC"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
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
  <TouchableOpacity style={styles.toggleContainer} onPress={onToggle} activeOpacity={0.7}>
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
  <Text style={styles.sectionHeader}>{title}</Text>
);

// ============ MAIN COMPONENT ============
export default function AddBillScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    expense_name: '',
    category_id: null,
    amount: '',
    recurrence_frequency: 'monthly',
    next_occurrence_date: '',
    payment_method: null,
    merchant_name: '',
    is_autopay: false,
    is_essential: true,
    reminder_days: 3,
    notes: '',
  });

  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const canSubmit = () => {
    return (
      formData.expense_name.trim() !== '' &&
      formData.category_id !== null &&
      formData.amount.trim() !== '' &&
      formData.recurrence_frequency !== null
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // TODO: API call to save bill
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success!',
        `${formData.expense_name} has been added to your bills.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate annual cost
  const calculateAnnualCost = () => {
    const amount = parseFloat(formData.amount) || 0;
    const multiplier: Record<Frequency, number> = {
      weekly: 52,
      biweekly: 26,
      monthly: 12,
      quarterly: 4,
      semiannually: 2,
      annually: 1,
    };
    return amount * (multiplier[formData.recurrence_frequency as Frequency] || 12);
  };

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
        {/* Basic Info */}
        <SectionHeader title="Bill Details" />
        
        <InputField
          label="Bill Name"
          placeholder="e.g., Netflix, Electric Bill, Car Insurance"
          value={formData.expense_name}
          onChangeText={(text) => updateForm('expense_name', text)}
        />

        <Dropdown
          label="Category"
          placeholder="Select category"
          options={categories}
          selectedId={formData.category_id}
          onSelect={(id) => updateForm('category_id', id)}
        />

        <InputField
          label="Provider / Company"
          placeholder="e.g., ConEdison, State Farm, Netflix"
          value={formData.merchant_name}
          onChangeText={(text) => updateForm('merchant_name', text)}
          optional
        />

        {/* Payment Info */}
        <SectionHeader title="Payment Information" />

        <InputField
          label="Amount"
          placeholder="0.00"
          value={formData.amount}
          onChangeText={(text) => updateForm('amount', text)}
          keyboardType="decimal-pad"
          prefix="$"
        />

        <Dropdown
          label="Frequency"
          placeholder="Select frequency"
          options={frequencies}
          selectedId={formData.recurrence_frequency}
          onSelect={(id) => updateForm('recurrence_frequency', id)}
        />

        <InputField
          label="Next Due Date"
          placeholder="MM/DD/YYYY"
          value={formData.next_occurrence_date}
          onChangeText={(text) => updateForm('next_occurrence_date', text)}
        />

        {/* Annual Cost Card */}
        {formData.amount && formData.recurrence_frequency && (
          <View style={styles.costCard}>
            <View style={styles.costCardRow}>
              <View style={styles.costCardItem}>
                <Text style={styles.costCardLabel}>Monthly</Text>
                <Text style={styles.costCardValue}>
                  ${(calculateAnnualCost() / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={styles.costCardDivider} />
              <View style={styles.costCardItem}>
                <Text style={styles.costCardLabel}>Yearly</Text>
                <Text style={styles.costCardValue}>
                  ${calculateAnnualCost().toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
          </View>
        )}

        <Dropdown
          label="Payment Method"
          placeholder="Select payment method"
          options={paymentMethods}
          selectedId={formData.payment_method}
          onSelect={(id) => updateForm('payment_method', id)}
          optional
        />

        {/* Settings */}
        <SectionHeader title="Bill Settings" />

        <ToggleSwitch
          label="Auto-pay Enabled"
          description="This bill is paid automatically"
          value={formData.is_autopay}
          onToggle={() => updateForm('is_autopay', !formData.is_autopay)}
        />

        <ToggleSwitch
          label="Essential Bill"
          description="This is a necessary expense"
          value={formData.is_essential}
          onToggle={() => updateForm('is_essential', !formData.is_essential)}
        />

        <Dropdown
          label="Reminder"
          placeholder="Select when to remind"
          options={reminderOptions}
          selectedId={formData.reminder_days.toString()}
          onSelect={(id) => updateForm('reminder_days', parseInt(id))}
        />

        {/* Notes */}
        <InputField
          label="Notes"
          placeholder="Account number, special instructions, etc."
          value={formData.notes}
          onChangeText={(text) => updateForm('notes', text)}
          multiline
          optional
        />

        {/* Info Card */}
        <View style={styles.infoCard}>
          <SFSymbol name="info.circle.fill" size={20} color="#2563EB" />
          <Text style={styles.infoCardText}>
            Bills are recurring payments that will appear in your upcoming expenses and reminders.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Add Bill</Text>
            </>
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
    backgroundColor: '#F2F2F7',
  },

  // Header
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  cancelText: { color: '#DC2626', fontSize: 14 , fontWeight: '400' },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPlaceholder: {
    width: 44,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Section Header
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 16,
  },

  // Input Field
  inputContainer: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  optionalBadge: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputWrapperMultiline: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  inputPrefix: {
    fontSize: 17,
    color: '#8E8E93',
    marginRight: 4,
  },
  inputSuffix: {
    fontSize: 15,
    color: '#8E8E93',
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  inputMultiline: {
    height: '100%',
  },

  // Dropdown
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dropdownPlaceholder: {
    fontSize: 17,
    color: '#C7C7CC',
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
  dropdownSelectedText: {
    fontSize: 17,
    color: '#000',
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalList: {
    paddingHorizontal: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalOptionSelected: {
    backgroundColor: '#046C4E08',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
    color: '#000',
  },
  modalOptionLabelSelected: {
    color: '#046C4E',
  },
  modalOptionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
    color: '#000',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#046C4E',
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },

  // Cost Card
  costCard: {
    backgroundColor: '#F59E0B15',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  costCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costCardItem: {
    flex: 1,
    alignItems: 'center',
  },
  costCardDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F59E0B30',
  },
  costCardLabel: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 4,
  },
  costCardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#92400E',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2563EB10',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },

  // Bottom
  bottomSpacer: {
    height: 120,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#046C4E',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});