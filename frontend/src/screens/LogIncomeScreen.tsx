// src/screens/LogIncomeScreen.tsx
import React, { useState, useEffect } from 'react';
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
import DatePickerComponent, { QuickDateButtons } from '../components/inputs/DatePickerComponent';
import { useLogIncome } from '../hooks/useIncome';
import type { 
  IncomeSourceSummary, 
  LogIncomeRequest, 
  IncomeType,
} from '../api/types/income';

// ============ TYPES ============
type DropdownOption = {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  subtitle?: string;
};

type FormData = {
  income_id: string | null;
  payment_date: Date;
  pay_period_start: string;
  pay_period_end: string;
  
  // Work logged
  hours_worked: string;
  
  // Amounts
  gross_amount: string;
  
  // Taxes (can be auto-calculated or manual)
  tax_federal: string;
  tax_state: string;
  tax_local: string;
  tax_fica: string;
  manual_taxes: boolean;
  
  // Final
  net_amount: string;
  
  notes: string;
};

// ============ INCOME TYPE CONFIG ============
// Aligned with backend IncomeType enum
const incomeTypeConfig: Record<IncomeType, { icon: string; color: string }> = {
  employment: { icon: 'briefcase.fill', color: '#046C4E' },
  freelance: { icon: 'laptopcomputer', color: '#2563EB' },
  business: { icon: 'building.2.fill', color: '#0891B2' },
  investment: { icon: 'chart.line.uptrend.xyaxis', color: '#22C55E' },
  rental: { icon: 'house.fill', color: '#DC2626' },
  scholarship: { icon: 'graduationcap.fill', color: '#7C3AED' },
  other: { icon: 'ellipsis.circle.fill', color: '#6B7280' },
};

// ============ HEADER ============
const FormHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="xmark" size={20} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Log Income</Text>
      <View style={styles.headerButtonPlaceholder} />
    </View>
  );
};

// ============ INCOME SOURCE SELECTOR ============
type IncomeSourceSelectorProps = {
  sources: IncomeSourceSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
};

const IncomeSourceSelector = ({ sources, selectedId, onSelect, loading }: IncomeSourceSelectorProps) => {
  const [visible, setVisible] = useState(false);
  const selectedSource = sources.find(s => s.income_id === selectedId);

  if (loading) {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Select Income Source</Text>
        <View style={[styles.dropdownButton, styles.loadingDropdown]}>
          <ActivityIndicator size="small" color="#046C4E" />
          <Text style={styles.loadingText}>Loading income sources...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Select Income Source</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          {selectedSource ? (
            <View style={styles.sourceSelectorSelected}>
              <View style={[styles.sourceSelectorIcon, { backgroundColor: incomeTypeConfig[selectedSource.source_type].color + '15' }]}>
                <SFSymbol 
                  name={incomeTypeConfig[selectedSource.source_type].icon} 
                  size={20} 
                  color={incomeTypeConfig[selectedSource.source_type].color} 
                />
              </View>
              <View style={styles.sourceSelectorContent}>
                <Text style={styles.sourceSelectorName}>{selectedSource.source_name}</Text>
                <Text style={styles.sourceSelectorMeta}>
                  {selectedSource.pay_structure} • {selectedSource.frequency}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.dropdownPlaceholder}>Choose an income source</Text>
          )}
          <SFSymbol name="chevron.down" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Income Source</Text>
            
            {sources.length === 0 ? (
              <View style={styles.emptySources}>
                <SFSymbol name="dollarsign.circle" size={48} color="#C7C7CC" />
                <Text style={styles.emptySourcesText}>No income sources</Text>
                <Text style={styles.emptySourcesSubtext}>Add an income source first</Text>
              </View>
            ) : (
              <FlatList
                data={sources.filter(s => s.is_active)}
                keyExtractor={item => item.income_id}
                renderItem={({ item }) => {
                  const config = incomeTypeConfig[item.source_type];
                  
                  return (
                    <TouchableOpacity
                      style={[
                        styles.sourceOptionCard,
                        selectedId === item.income_id && styles.sourceOptionCardSelected,
                      ]}
                      onPress={() => {
                        onSelect(item.income_id);
                        setVisible(false);
                      }}
                    >
                      <View style={[styles.sourceOptionIcon, { backgroundColor: config.color + '15' }]}>
                        <SFSymbol name={config.icon} size={24} color={config.color} />
                      </View>
                      <View style={styles.sourceOptionContent}>
                        <View style={styles.sourceOptionHeader}>
                          <Text style={styles.sourceOptionName}>{item.source_name}</Text>
                          {item.is_guaranteed && (
                            <View style={styles.guaranteedBadge}>
                              <Text style={styles.guaranteedBadgeText}>Guaranteed</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.sourceOptionMeta}>
                          {item.pay_structure} • {item.frequency}
                        </Text>
                        <Text style={styles.sourceOptionAmount}>
                          ${item.amount?.toLocaleString() || '0'} per period
                        </Text>
                      </View>
                      {selectedId === item.income_id && (
                        <SFSymbol name="checkmark.circle.fill" size={24} color="#046C4E" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                showsVerticalScrollIndicator={false}
                style={styles.modalList}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

// ============ SECTION HEADER ============
const SectionHeader = ({ title, icon, color }: { title: string; icon?: string; color?: string }) => (
  <View style={styles.sectionHeaderContainer}>
    {icon && (
      <View style={[styles.sectionHeaderIcon, { backgroundColor: (color || '#046C4E') + '15' }]}>
        <SFSymbol name={icon} size={16} color={color || '#046C4E'} />
      </View>
    )}
    <Text style={styles.sectionHeader}>{title}</Text>
  </View>
);

// ============ INPUT FIELD ============
type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  prefix?: string;
  suffix?: string;
  optional?: boolean;
  disabled?: boolean;
  highlight?: boolean;
};

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  prefix,
  suffix,
  optional = false,
  disabled = false,
  highlight = false,
}: InputFieldProps) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputLabelRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      {optional && <Text style={styles.optionalBadge}>Optional</Text>}
    </View>
    <View style={[
      styles.inputWrapper, 
      disabled && styles.inputWrapperDisabled,
      highlight && styles.inputWrapperHighlight,
    ]}>
      {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={!disabled}
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

// ============ TAX BREAKDOWN CARD ============
type TaxBreakdownProps = {
  gross: number;
  federal: number;
  state: number;
  local: number;
  fica: number;
  net: number;
};

const TaxBreakdownCard = ({ gross, federal, state, local, fica, net }: TaxBreakdownProps) => {
  const totalTax = federal + state + local + fica;
  const effectiveRate = gross > 0 ? (totalTax / gross) * 100 : 0;

  return (
    <View style={styles.taxBreakdownCard}>
      <View style={styles.taxBreakdownHeader}>
        <Text style={styles.taxBreakdownTitle}>Tax Breakdown</Text>
        <Text style={styles.taxBreakdownRate}>{effectiveRate.toFixed(1)}% effective</Text>
      </View>

      <View style={styles.taxBreakdownRow}>
        <Text style={styles.taxBreakdownLabel}>Gross Pay</Text>
        <Text style={styles.taxBreakdownGross}>${gross.toLocaleString()}</Text>
      </View>

      <View style={styles.taxBreakdownDivider} />

      <View style={styles.taxBreakdownRow}>
        <Text style={styles.taxBreakdownLabel}>Federal Tax</Text>
        <Text style={styles.taxBreakdownDeduction}>-${federal.toFixed(2)}</Text>
      </View>

      <View style={styles.taxBreakdownRow}>
        <Text style={styles.taxBreakdownLabel}>State Tax</Text>
        <Text style={styles.taxBreakdownDeduction}>-${state.toFixed(2)}</Text>
      </View>

      {local > 0 && (
        <View style={styles.taxBreakdownRow}>
          <Text style={styles.taxBreakdownLabel}>Local Tax</Text>
          <Text style={styles.taxBreakdownDeduction}>-${local.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.taxBreakdownRow}>
        <Text style={styles.taxBreakdownLabel}>FICA (Social Security + Medicare)</Text>
        <Text style={styles.taxBreakdownDeduction}>-${fica.toFixed(2)}</Text>
      </View>

      <View style={styles.taxBreakdownDivider} />

      <View style={styles.taxBreakdownRow}>
        <Text style={styles.taxBreakdownTotalLabel}>Total Deductions</Text>
        <Text style={styles.taxBreakdownTotalDeduction}>-${totalTax.toFixed(2)}</Text>
      </View>

      <View style={styles.taxBreakdownNetRow}>
        <Text style={styles.taxBreakdownNetLabel}>Net Pay</Text>
        <Text style={styles.taxBreakdownNetValue}>${net.toLocaleString()}</Text>
      </View>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function LogIncomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { sources, isLoadingSources, isSubmitting, logPayment } = useLogIncome();

  const [formData, setFormData] = useState<FormData>({
    income_id: null,
    payment_date: new Date(),
    pay_period_start: '',
    pay_period_end: '',
    
    hours_worked: '',
    
    gross_amount: '',
    
    tax_federal: '',
    tax_state: '',
    tax_local: '',
    tax_fica: '',
    manual_taxes: false,
    
    net_amount: '',
    
    notes: '',
  });

  // Get selected source
  const selectedSource = sources.find(s => s.income_id === formData.income_id);

  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const getCalculatedValues = () => {
    const gross = parseFloat(formData.gross_amount) || 0;
    const federal = parseFloat(formData.tax_federal) || 0;
    const state = parseFloat(formData.tax_state) || 0;
    const local = parseFloat(formData.tax_local) || 0;
    const fica = parseFloat(formData.tax_fica) || 0;
    const net = parseFloat(formData.net_amount) || gross - federal - state - local - fica;
    
    return { gross, federal, state, local, fica, net };
  };

  const canSubmit = () => {
    return (
      formData.income_id !== null &&
      formData.payment_date !== null &&
      (parseFloat(formData.gross_amount) > 0 || parseFloat(formData.net_amount) > 0)
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !formData.income_id) {
      Alert.alert('Missing Information', 'Please select an income source and enter the amount received.');
      return;
    }

    const values = getCalculatedValues();
    
    // Build API request - aligned with backend LogIncomeRequest schema
    const requestData: LogIncomeRequest = {
      gross_amount: values.gross,
      net_amount: values.net,
      payment_date: formData.payment_date.toISOString().split('T')[0],
      pay_period_start: formData.pay_period_start || undefined,
      pay_period_end: formData.pay_period_end || undefined,
      hours_worked: formData.hours_worked ? parseFloat(formData.hours_worked) : undefined,
      tax_federal: values.federal || undefined,
      tax_state: values.state || undefined,
      tax_local: values.local || undefined,
      tax_fica: values.fica || undefined,
      notes: formData.notes || undefined,
      auto_calculate_taxes: !formData.manual_taxes,
    };

    const result = await logPayment(formData.income_id, requestData);
    
    if (result) {
      Alert.alert(
        'Income Logged Successfully!',
        `Recorded $${values.net.toFixed(2)} net pay from ${selectedSource?.source_name}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
    // Error is handled in the hook
  };

  const values = getCalculatedValues();

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
        {/* Income Source Selection */}
        <SectionHeader title="Income Source" icon="briefcase.fill" color="#046C4E" />
        
        <IncomeSourceSelector
          sources={sources}
          selectedId={formData.income_id}
          onSelect={(id) => {
            updateForm('income_id', id);
            // Reset calculated fields when source changes
            updateForm('gross_amount', '');
            updateForm('hours_worked', '');
            updateForm('net_amount', '');
          }}
          loading={isLoadingSources}
        />

        {/* Show form when source is selected */}
        {selectedSource && (
          <>
            {/* Payment Details */}
            <SectionHeader title="Payment Details" icon="calendar" color="#2563EB" />

            {/* Quick Date Buttons */}
            <View style={styles.quickDateContainer}>
              <QuickDateButtons
                selectedDate={formData.payment_date}
                onSelect={(date) => updateForm('payment_date', date)}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.rowInputHalf}>
                <DatePickerComponent
                  label="Payment Date"
                  value={formData.payment_date}
                  onChange={(date) => updateForm('payment_date', date)}
                  variant="field"
                  format="medium"
                  maxDate={new Date()}
                />
              </View>
              <View style={styles.rowInputHalf}>
                <InputField
                  label="Pay Period Start"
                  placeholder="YYYY-MM-DD"
                  value={formData.pay_period_start}
                  onChangeText={(text) => updateForm('pay_period_start', text)}
                  optional
                />
              </View>
            </View>

            <InputField
              label="Pay Period End"
              placeholder="YYYY-MM-DD"
              value={formData.pay_period_end}
              onChangeText={(text) => updateForm('pay_period_end', text)}
              optional
            />

            {/* Work Logged (for hourly jobs) */}
            {selectedSource.pay_structure === 'hourly' && (
              <>
                <SectionHeader title="Hours Worked" icon="clock.fill" color="#F59E0B" />

                <View style={styles.hoursCard}>
                  <View style={styles.hoursInputRow}>
                    <View style={styles.hoursInputContainer}>
                      <Text style={styles.hoursInputLabel}>Hours</Text>
                      <TextInput
                        style={styles.hoursInput}
                        placeholder="0"
                        placeholderTextColor="#C7C7CC"
                        value={formData.hours_worked}
                        onChangeText={(text) => {
                          updateForm('hours_worked', text);
                          // Auto-calculate gross if hourly
                          const hours = parseFloat(text) || 0;
                          const rate = selectedSource.amount || 0; // amount is hourly rate for hourly jobs
                          updateForm('gross_amount', (hours * rate).toFixed(2));
                        }}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.hoursCalculation}>
                      <Text style={styles.hoursCalcLabel}>× ${selectedSource.amount || 0}/hr</Text>
                      <Text style={styles.hoursCalcEquals}>=</Text>
                      <Text style={styles.hoursCalcResult}>
                        ${((parseFloat(formData.hours_worked) || 0) * (selectedSource.amount || 0)).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* Amount Section */}
            <SectionHeader title="Amount Received" icon="dollarsign.circle.fill" color="#046C4E" />

            {selectedSource.pay_structure !== 'hourly' && (
              <InputField
                label="Gross Amount"
                placeholder="0.00"
                value={formData.gross_amount}
                onChangeText={(text) => updateForm('gross_amount', text)}
                keyboardType="decimal-pad"
                prefix="$"
              />
            )}

            {/* Tax Section */}
            <ToggleSwitch
              label="Enter taxes manually"
              description="Override calculated taxes with actual paycheck values"
              value={formData.manual_taxes}
              onToggle={() => updateForm('manual_taxes', !formData.manual_taxes)}
            />

            {formData.manual_taxes ? (
              <View style={styles.manualTaxesCard}>
                <Text style={styles.manualTaxesTitle}>Enter from your paycheck:</Text>
                
                <View style={styles.taxInputsGrid}>
                  <View style={styles.taxInputItem}>
                    <Text style={styles.taxInputLabel}>Federal</Text>
                    <View style={styles.taxInputWrapper}>
                      <Text style={styles.taxInputPrefix}>$</Text>
                      <TextInput
                        style={styles.taxInput}
                        placeholder="0.00"
                        placeholderTextColor="#C7C7CC"
                        value={formData.tax_federal}
                        onChangeText={(text) => updateForm('tax_federal', text)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.taxInputItem}>
                    <Text style={styles.taxInputLabel}>State</Text>
                    <View style={styles.taxInputWrapper}>
                      <Text style={styles.taxInputPrefix}>$</Text>
                      <TextInput
                        style={styles.taxInput}
                        placeholder="0.00"
                        placeholderTextColor="#C7C7CC"
                        value={formData.tax_state}
                        onChangeText={(text) => updateForm('tax_state', text)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.taxInputItem}>
                    <Text style={styles.taxInputLabel}>FICA</Text>
                    <View style={styles.taxInputWrapper}>
                      <Text style={styles.taxInputPrefix}>$</Text>
                      <TextInput
                        style={styles.taxInput}
                        placeholder="0.00"
                        placeholderTextColor="#C7C7CC"
                        value={formData.tax_fica}
                        onChangeText={(text) => updateForm('tax_fica', text)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.taxInputItem}>
                    <Text style={styles.taxInputLabel}>Net Pay</Text>
                    <View style={[styles.taxInputWrapper, styles.taxInputWrapperHighlight]}>
                      <Text style={styles.taxInputPrefix}>$</Text>
                      <TextInput
                        style={[styles.taxInput, styles.taxInputHighlight]}
                        placeholder="0.00"
                        placeholderTextColor="#C7C7CC"
                        value={formData.net_amount}
                        onChangeText={(text) => updateForm('net_amount', text)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              /* Tax Breakdown Card */
              values.gross > 0 && (
                <TaxBreakdownCard
                  gross={values.gross}
                  federal={values.federal}
                  state={values.state}
                  local={values.local}
                  fica={values.fica}
                  net={values.net}
                />
              )
            )}

            {/* Notes */}
            <SectionHeader title="Notes" icon="note.text" color="#6B7280" />

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Any notes about this payment..."
                  placeholderTextColor="#C7C7CC"
                  value={formData.notes}
                  onChangeText={(text) => updateForm('notes', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <SFSymbol name="lightbulb.fill" size={20} color="#F59E0B" />
              <Text style={styles.infoCardText}>
                If the calculated taxes don't match your paycheck, toggle "Enter taxes manually" and input the actual values. This helps Fortuna learn and improve future calculations.
              </Text>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <SFSymbol name="checkmark.circle.fill" size={22} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Log Income</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    gap: 10,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Input
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
  inputWrapperDisabled: {
    backgroundColor: '#F8F8F8',
  },
  inputWrapperHighlight: {
    borderColor: '#046C4E',
    borderWidth: 2,
  },
  inputWrapperMultiline: {
    height: 80,
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
  inputDisabled: {
    color: '#8E8E93',
  },
  inputMultiline: {
    height: '100%',
  },

  // Row Inputs
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  rowInputHalf: {
    flex: 1,
  },

  // Quick Date Buttons
  quickDateContainer: {
    marginBottom: 16,
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
  loadingDropdown: {
    justifyContent: 'flex-start',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  dropdownPlaceholder: {
    fontSize: 17,
    color: '#C7C7CC',
  },

  // Source Selector
  sourceSelectorSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sourceSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sourceSelectorContent: {
    flex: 1,
  },
  sourceSelectorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sourceSelectorMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
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
    maxHeight: '80%',
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

  // Empty Sources
  emptySources: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySourcesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySourcesSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Source Option Card
  sourceOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sourceOptionCardSelected: {
    backgroundColor: '#046C4E10',
    borderWidth: 2,
    borderColor: '#046C4E',
  },
  sourceOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sourceOptionContent: {
    flex: 1,
  },
  sourceOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  guaranteedBadge: {
    backgroundColor: '#046C4E15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  guaranteedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#046C4E',
  },
  sourceOptionMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  sourceOptionAmount: {
    fontSize: 12,
    color: '#046C4E',
    marginTop: 4,
  },

  // Hours Card
  hoursCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  hoursInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursInputContainer: {
    alignItems: 'center',
  },
  hoursInputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  hoursInput: {
    width: 80,
    height: 60,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  hoursCalculation: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hoursCalcLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  hoursCalcEquals: {
    fontSize: 18,
    color: '#8E8E93',
  },
  hoursCalcResult: {
    fontSize: 24,
    fontWeight: '700',
    color: '#046C4E',
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
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

  // Tax Breakdown Card
  taxBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  taxBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taxBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  taxBreakdownRate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  taxBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taxBreakdownLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  taxBreakdownGross: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  taxBreakdownDeduction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  taxBreakdownDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 8,
  },
  taxBreakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  taxBreakdownTotalDeduction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  taxBreakdownNetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#046C4E10',
    marginHorizontal: -20,
    marginBottom: -20,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  taxBreakdownNetLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#046C4E',
  },
  taxBreakdownNetValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#046C4E',
  },

  // Manual Taxes Card
  manualTaxesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  manualTaxesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 16,
  },
  taxInputsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  taxInputItem: {
    width: '47%',
  },
  taxInputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  taxInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  taxInputWrapperHighlight: {
    backgroundColor: '#046C4E15',
    borderWidth: 2,
    borderColor: '#046C4E',
  },
  taxInputPrefix: {
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 4,
  },
  taxInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  taxInputHighlight: {
    color: '#046C4E',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F59E0B10',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
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