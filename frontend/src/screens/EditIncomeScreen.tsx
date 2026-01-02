// src/screens/EditIncomeScreen.tsx
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
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

// ============ TYPES ============
type IncomeType = 
  | 'employment' 
  | 'freelance' 
  | 'business' 
  | 'investment' 
  | 'rental' 
  | 'scholarship' 
  | 'other';

type PayStructure = 'salary' | 'hourly' | 'commission' | 'contract' | 'variable';
type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'annually' | 'irregular';
type IncomeStatus = 'active' | 'paused' | 'ended';

type Deduction = {
  deduction_id: string;
  deduction_name: string;
  deduction_type: 'pre_tax' | 'post_tax';
  amount: number;
  is_percentage: boolean;
};

type IncomeSource = {
  income_id: string;
  source_name: string;
  employer_name?: string;
  income_type: IncomeType;
  pay_structure: PayStructure;
  pay_frequency: PayFrequency;
  base_amount: number;
  hourly_rate?: number;
  expected_hours?: number;
  is_taxable: boolean;
  federal_tax_rate?: number;
  state_tax_rate?: number;
  deductions: Deduction[];
  status: IncomeStatus;
  start_date: string;
  end_date?: string;
  pay_day?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};

// ============ CONFIG ============
const incomeTypeConfig: Record<IncomeType, { icon: string; color: string; label: string }> = {
  employment: { icon: 'building.2.fill', color: '#2563EB', label: 'Employment' },
  freelance: { icon: 'laptopcomputer', color: '#7C3AED', label: 'Freelance' },
  business: { icon: 'storefront.fill', color: '#046C4E', label: 'Business' },
  investment: { icon: 'chart.line.uptrend.xyaxis', color: '#0891B2', label: 'Investment' },
  rental: { icon: 'house.fill', color: '#F59E0B', label: 'Rental' },
  scholarship: { icon: 'graduationcap.fill', color: '#EC4899', label: 'Scholarship' },
  other: { icon: 'dollarsign.circle.fill', color: '#6B7280', label: 'Other' },
};

const incomeTypes: IncomeType[] = ['employment', 'freelance', 'business', 'investment', 'rental', 'scholarship', 'other'];

const payStructureConfig: Record<PayStructure, { label: string; description: string }> = {
  salary: { label: 'Salary', description: 'Fixed amount per pay period' },
  hourly: { label: 'Hourly', description: 'Paid by the hour' },
  commission: { label: 'Commission', description: 'Based on sales/performance' },
  contract: { label: 'Contract', description: 'Project-based payments' },
  variable: { label: 'Variable', description: 'Amount varies each period' },
};

const payStructures: PayStructure[] = ['salary', 'hourly', 'commission', 'contract', 'variable'];

const payFrequencyConfig: Record<PayFrequency, { label: string; periodsPerYear: number }> = {
  weekly: { label: 'Weekly', periodsPerYear: 52 },
  biweekly: { label: 'Every 2 Weeks', periodsPerYear: 26 },
  semimonthly: { label: 'Twice Monthly', periodsPerYear: 24 },
  monthly: { label: 'Monthly', periodsPerYear: 12 },
  quarterly: { label: 'Quarterly', periodsPerYear: 4 },
  annually: { label: 'Annually', periodsPerYear: 1 },
  irregular: { label: 'Irregular', periodsPerYear: 0 },
};

const payFrequencies: PayFrequency[] = ['weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'annually', 'irregular'];

const statusOptions: { value: IncomeStatus; label: string; icon: string; color: string }[] = [
  { value: 'active', label: 'Active', icon: 'play.circle.fill', color: '#046C4E' },
  { value: 'paused', label: 'Paused', icon: 'pause.circle.fill', color: '#F59E0B' },
  { value: 'ended', label: 'Ended', icon: 'stop.circle.fill', color: '#DC2626' },
];

// ============ HEADER ============
type HeaderProps = {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  hasChanges: boolean;
};

const Header = ({ onCancel, onSave, isSaving, hasChanges }: HeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
        <Text style={styles.headerButtonText}>Cancel</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Income</Text>
      <TouchableOpacity 
        style={[styles.headerSaveButton, !hasChanges && styles.headerSaveButtonDisabled]}
        onPress={onSave}
        disabled={isSaving || !hasChanges}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={[styles.headerSaveText, !hasChanges && styles.headerSaveTextDisabled]}>
            Save
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ============ SECTION HEADER ============
type SectionHeaderProps = {
  title: string;
  icon: string;
  color: string;
};

const SectionHeader = ({ title, icon, color }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionHeaderIcon, { backgroundColor: color + '15' }]}>
      <SFSymbol name={icon} size={16} color={color} />
    </View>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

// ============ DROPDOWN COMPONENT ============
type DropdownOption = {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
};

type DropdownProps = {
  label: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
};

const Dropdown = ({ label, value, options, onSelect, placeholder }: DropdownProps) => {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <>
      <TouchableOpacity style={styles.dropdown} onPress={() => setVisible(true)}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <View style={styles.dropdownValue}>
          {selectedOption?.icon && (
            <SFSymbol name={selectedOption.icon} size={18} color={selectedOption.color || '#000'} />
          )}
          <Text style={[
            styles.dropdownValueText,
            !selectedOption && styles.dropdownPlaceholder
          ]}>
            {selectedOption?.label || placeholder || 'Select...'}
          </Text>
          <SFSymbol name="chevron.down" size={14} color="#8E8E93" />
        </View>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <SFSymbol name="xmark.circle.fill" size={28} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    item.value === value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  {item.icon && (
                    <View style={[styles.modalOptionIcon, { backgroundColor: (item.color || '#6B7280') + '15' }]}>
                      <SFSymbol name={item.icon} size={20} color={item.color || '#6B7280'} />
                    </View>
                  )}
                  <View style={styles.modalOptionInfo}>
                    <Text style={styles.modalOptionText}>{item.label}</Text>
                    {item.description && (
                      <Text style={styles.modalOptionDescription}>{item.description}</Text>
                    )}
                  </View>
                  {item.value === value && (
                    <SFSymbol name="checkmark" size={18} color="#046C4E" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

// ============ DEDUCTION CARD ============
type DeductionCardProps = {
  deduction: Deduction;
  onUpdate: (deduction: Deduction) => void;
  onDelete: () => void;
  grossAmount: number;
};

const DeductionCard = ({ deduction, onUpdate, onDelete, grossAmount }: DeductionCardProps) => {
  const calculatedAmount = deduction.is_percentage 
    ? (grossAmount * deduction.amount / 100)
    : deduction.amount;

  return (
    <View style={styles.deductionCard}>
      <View style={styles.deductionHeader}>
        <View style={[
          styles.deductionTypeBadge,
          { backgroundColor: deduction.deduction_type === 'pre_tax' ? '#046C4E15' : '#7C3AED15' }
        ]}>
          <Text style={[
            styles.deductionTypeBadgeText,
            { color: deduction.deduction_type === 'pre_tax' ? '#046C4E' : '#7C3AED' }
          ]}>
            {deduction.deduction_type === 'pre_tax' ? 'Pre-Tax' : 'Post-Tax'}
          </Text>
        </View>
        <TouchableOpacity style={styles.deductionDeleteButton} onPress={onDelete}>
          <SFSymbol name="xmark.circle.fill" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <View style={styles.deductionFields}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={deduction.deduction_name}
            onChangeText={(text) => onUpdate({ ...deduction, deduction_name: text })}
            placeholder="e.g., 401(k), Health Insurance"
          />
        </View>

        <View style={styles.deductionAmountRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.inputWithSuffix}>
              {!deduction.is_percentage && <Text style={styles.inputPrefix}>$</Text>}
              <TextInput
                style={[styles.input, styles.inputWithAffixField]}
                value={deduction.amount > 0 ? deduction.amount.toString() : ''}
                onChangeText={(text) => onUpdate({ ...deduction, amount: parseFloat(text) || 0 })}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              {deduction.is_percentage && <Text style={styles.inputSuffix}>%</Text>}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.percentageToggle,
              deduction.is_percentage && styles.percentageToggleActive
            ]}
            onPress={() => onUpdate({ ...deduction, is_percentage: !deduction.is_percentage })}
          >
            <SFSymbol 
              name="percent" 
              size={16} 
              color={deduction.is_percentage ? '#FFFFFF' : '#8E8E93'} 
            />
          </TouchableOpacity>
        </View>

        {deduction.is_percentage && deduction.amount > 0 && (
          <Text style={styles.deductionCalculated}>
            = ${calculatedAmount.toFixed(2)} per pay period
          </Text>
        )}

        <View style={styles.deductionTypeToggle}>
          <TouchableOpacity
            style={[
              styles.deductionTypeOption,
              deduction.deduction_type === 'pre_tax' && styles.deductionTypeOptionActive
            ]}
            onPress={() => onUpdate({ ...deduction, deduction_type: 'pre_tax' })}
          >
            <Text style={[
              styles.deductionTypeOptionText,
              deduction.deduction_type === 'pre_tax' && styles.deductionTypeOptionTextActive
            ]}>
              Pre-Tax
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deductionTypeOption,
              deduction.deduction_type === 'post_tax' && styles.deductionTypeOptionActiveAlt
            ]}
            onPress={() => onUpdate({ ...deduction, deduction_type: 'post_tax' })}
          >
            <Text style={[
              styles.deductionTypeOptionText,
              deduction.deduction_type === 'post_tax' && styles.deductionTypeOptionTextActiveAlt
            ]}>
              Post-Tax
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function EditIncomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditIncomeScreen'>>();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalIncome, setOriginalIncome] = useState<IncomeSource | null>(null);

  // Form state
  const [sourceName, setSourceName] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [incomeType, setIncomeType] = useState<IncomeType>('employment');
  const [payStructure, setPayStructure] = useState<PayStructure>('salary');
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('biweekly');
  const [baseAmount, setBaseAmount] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [expectedHours, setExpectedHours] = useState('');
  const [isTaxable, setIsTaxable] = useState(true);
  const [federalTaxRate, setFederalTaxRate] = useState('');
  const [stateTaxRate, setStateTaxRate] = useState('');
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [status, setStatus] = useState<IncomeStatus>('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payDay, setPayDay] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      
      // Mock income data
      const mockIncome: IncomeSource = {
        income_id: route.params?.incomeId || '1',
        source_name: 'Software Developer',
        employer_name: 'TechCorp Inc.',
        income_type: 'employment',
        pay_structure: 'salary',
        pay_frequency: 'biweekly',
        base_amount: 3846.15,
        is_taxable: true,
        federal_tax_rate: 22,
        state_tax_rate: 5.25,
        deductions: [
          {
            deduction_id: '1',
            deduction_name: '401(k) Contribution',
            deduction_type: 'pre_tax',
            amount: 6,
            is_percentage: true,
          },
          {
            deduction_id: '2',
            deduction_name: 'Health Insurance',
            deduction_type: 'pre_tax',
            amount: 150,
            is_percentage: false,
          },
          {
            deduction_id: '3',
            deduction_name: 'Dental Insurance',
            deduction_type: 'pre_tax',
            amount: 25,
            is_percentage: false,
          },
        ],
        status: 'active',
        start_date: '03/15/2023',
        pay_day: 15,
        notes: 'Annual salary: $100,000. Eligible for annual bonus in December.',
        created_at: '03/15/2023',
        updated_at: '01/10/2025',
      };

      setOriginalIncome(mockIncome);
      
      // Populate form
      setSourceName(mockIncome.source_name);
      setEmployerName(mockIncome.employer_name || '');
      setIncomeType(mockIncome.income_type);
      setPayStructure(mockIncome.pay_structure);
      setPayFrequency(mockIncome.pay_frequency);
      setBaseAmount(mockIncome.base_amount.toString());
      setHourlyRate(mockIncome.hourly_rate?.toString() || '');
      setExpectedHours(mockIncome.expected_hours?.toString() || '');
      setIsTaxable(mockIncome.is_taxable);
      setFederalTaxRate(mockIncome.federal_tax_rate?.toString() || '');
      setStateTaxRate(mockIncome.state_tax_rate?.toString() || '');
      setDeductions(mockIncome.deductions);
      setStatus(mockIncome.status);
      setStartDate(mockIncome.start_date);
      setEndDate(mockIncome.end_date || '');
      setPayDay(mockIncome.pay_day?.toString() || '');
      setNotes(mockIncome.notes || '');

    } catch (error) {
      console.error('Error fetching income:', error);
      Alert.alert('Error', 'Failed to load income details');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = (): boolean => {
    if (!originalIncome) return false;
    
    return (
      sourceName !== originalIncome.source_name ||
      employerName !== (originalIncome.employer_name || '') ||
      incomeType !== originalIncome.income_type ||
      payStructure !== originalIncome.pay_structure ||
      payFrequency !== originalIncome.pay_frequency ||
      baseAmount !== originalIncome.base_amount.toString() ||
      hourlyRate !== (originalIncome.hourly_rate?.toString() || '') ||
      expectedHours !== (originalIncome.expected_hours?.toString() || '') ||
      isTaxable !== originalIncome.is_taxable ||
      federalTaxRate !== (originalIncome.federal_tax_rate?.toString() || '') ||
      stateTaxRate !== (originalIncome.state_tax_rate?.toString() || '') ||
      status !== originalIncome.status ||
      startDate !== originalIncome.start_date ||
      endDate !== (originalIncome.end_date || '') ||
      payDay !== (originalIncome.pay_day?.toString() || '') ||
      notes !== (originalIncome.notes || '') ||
      JSON.stringify(deductions) !== JSON.stringify(originalIncome.deductions)
    );
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const validateForm = (): boolean => {
    if (!sourceName.trim()) {
      Alert.alert('Validation Error', 'Please enter a source name.');
      return false;
    }
    if (payStructure === 'hourly') {
      if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid hourly rate.');
        return false;
      }
    } else {
      if (!baseAmount || parseFloat(baseAmount) <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid amount.');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 800));

      const updatedIncome = {
        income_id: originalIncome?.income_id,
        source_name: sourceName.trim(),
        employer_name: employerName.trim() || undefined,
        income_type: incomeType,
        pay_structure: payStructure,
        pay_frequency: payFrequency,
        base_amount: parseFloat(baseAmount) || 0,
        hourly_rate: payStructure === 'hourly' ? parseFloat(hourlyRate) || undefined : undefined,
        expected_hours: payStructure === 'hourly' ? parseFloat(expectedHours) || undefined : undefined,
        is_taxable: isTaxable,
        federal_tax_rate: isTaxable ? parseFloat(federalTaxRate) || undefined : undefined,
        state_tax_rate: isTaxable ? parseFloat(stateTaxRate) || undefined : undefined,
        deductions: deductions.filter(d => d.deduction_name.trim()),
        status: status,
        start_date: startDate,
        end_date: endDate || undefined,
        pay_day: parseFloat(payDay) || undefined,
        notes: notes.trim() || undefined,
      };

      console.log('Saving income:', updatedIncome);

      Alert.alert('Success', 'Income source updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error('Error saving income:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addDeduction = () => {
    const newDeduction: Deduction = {
      deduction_id: `new_${Date.now()}`,
      deduction_name: '',
      deduction_type: 'pre_tax',
      amount: 0,
      is_percentage: false,
    };
    setDeductions([...deductions, newDeduction]);
  };

  const updateDeduction = (index: number, updated: Deduction) => {
    const newDeductions = [...deductions];
    newDeductions[index] = updated;
    setDeductions(newDeductions);
  };

  const deleteDeduction = (index: number) => {
    const deduction = deductions[index];
    Alert.alert(
      'Remove Deduction',
      `Are you sure you want to remove "${deduction.deduction_name || 'this deduction'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setDeductions(deductions.filter((_, i) => i !== index));
          }
        },
      ]
    );
  };

  // Calculate estimates
  const grossAmount = payStructure === 'hourly' 
    ? (parseFloat(hourlyRate) || 0) * (parseFloat(expectedHours) || 40)
    : parseFloat(baseAmount) || 0;

  const preTaxDeductions = deductions
    .filter(d => d.deduction_type === 'pre_tax')
    .reduce((sum, d) => sum + (d.is_percentage ? grossAmount * d.amount / 100 : d.amount), 0);

  const taxableAmount = grossAmount - preTaxDeductions;
  const federalTax = isTaxable ? taxableAmount * (parseFloat(federalTaxRate) || 0) / 100 : 0;
  const stateTax = isTaxable ? taxableAmount * (parseFloat(stateTaxRate) || 0) / 100 : 0;

  const postTaxDeductions = deductions
    .filter(d => d.deduction_type === 'post_tax')
    .reduce((sum, d) => sum + (d.is_percentage ? grossAmount * d.amount / 100 : d.amount), 0);

  const netAmount = taxableAmount - federalTax - stateTax - postTaxDeductions;

  const periodsPerYear = payFrequencyConfig[payFrequency].periodsPerYear;
  const annualGross = grossAmount * periodsPerYear;
  const annualNet = netAmount * periodsPerYear;

  const config = incomeTypeConfig[incomeType];

  if (loading) {
    return (
      <View style={styles.container}>
        <Header onCancel={handleCancel} onSave={handleSave} isSaving={false} hasChanges={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Loading income...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        onCancel={handleCancel} 
        onSave={handleSave} 
        isSaving={saving} 
        hasChanges={hasChanges()} 
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview Card */}
          <View style={[styles.previewCard, { backgroundColor: config.color + '10' }]}>
            <View style={[styles.previewIcon, { backgroundColor: config.color + '20' }]}>
              <SFSymbol name={config.icon} size={28} color={config.color} />
            </View>
            <Text style={styles.previewName}>{sourceName || 'Income Source'}</Text>
            {employerName && <Text style={styles.previewEmployer}>{employerName}</Text>}
            
            <View style={styles.previewAmounts}>
              <View style={styles.previewAmountItem}>
                <Text style={styles.previewAmountLabel}>Gross</Text>
                <Text style={[styles.previewAmountValue, { color: config.color }]}>
                  ${grossAmount.toLocaleString()}
                </Text>
              </View>
              <View style={styles.previewAmountDivider} />
              <View style={styles.previewAmountItem}>
                <Text style={styles.previewAmountLabel}>Net</Text>
                <Text style={[styles.previewAmountValue, { color: '#046C4E' }]}>
                  ${netAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.previewAmountDivider} />
              <View style={styles.previewAmountItem}>
                <Text style={styles.previewAmountLabel}>Annual</Text>
                <Text style={styles.previewAmountValue}>
                  ${annualGross.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <SectionHeader title="BASIC INFORMATION" icon="info.circle.fill" color="#2563EB" />
            
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Source Name *</Text>
                <TextInput
                  style={styles.input}
                  value={sourceName}
                  onChangeText={setSourceName}
                  placeholder="e.g., Software Developer, Freelance Design"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Employer / Client Name</Text>
                <TextInput
                  style={styles.input}
                  value={employerName}
                  onChangeText={setEmployerName}
                  placeholder="e.g., TechCorp Inc."
                />
              </View>

              <Dropdown
                label="Income Type"
                value={incomeType}
                options={incomeTypes.map(type => ({
                  value: type,
                  label: incomeTypeConfig[type].label,
                  icon: incomeTypeConfig[type].icon,
                  color: incomeTypeConfig[type].color,
                }))}
                onSelect={(val) => setIncomeType(val as IncomeType)}
              />

              <Dropdown
                label="Status"
                value={status}
                options={statusOptions.map(s => ({
                  value: s.value,
                  label: s.label,
                  icon: s.icon,
                  color: s.color,
                }))}
                onSelect={(val) => setStatus(val as IncomeStatus)}
              />

              {status === 'ended' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <TextInput
                    style={styles.input}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="MM/DD/YYYY"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Payment Structure */}
          <View style={styles.section}>
            <SectionHeader title="PAYMENT STRUCTURE" icon="dollarsign.circle.fill" color="#046C4E" />
            
            <View style={styles.card}>
              <Dropdown
                label="Pay Structure"
                value={payStructure}
                options={payStructures.map(ps => ({
                  value: ps,
                  label: payStructureConfig[ps].label,
                  description: payStructureConfig[ps].description,
                }))}
                onSelect={(val) => setPayStructure(val as PayStructure)}
              />

              <Dropdown
                label="Pay Frequency"
                value={payFrequency}
                options={payFrequencies.map(pf => ({
                  value: pf,
                  label: payFrequencyConfig[pf].label,
                }))}
                onSelect={(val) => setPayFrequency(val as PayFrequency)}
              />

              {payStructure === 'hourly' ? (
                <>
                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Hourly Rate *</Text>
                      <View style={styles.inputWithPrefix}>
                        <Text style={styles.inputPrefix}>$</Text>
                        <TextInput
                          style={[styles.input, styles.inputWithPrefixField]}
                          value={hourlyRate}
                          onChangeText={setHourlyRate}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                        />
                      </View>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                      <Text style={styles.inputLabel}>Expected Hours/Period</Text>
                      <TextInput
                        style={styles.input}
                        value={expectedHours}
                        onChangeText={setExpectedHours}
                        keyboardType="number-pad"
                        placeholder="40"
                      />
                    </View>
                  </View>

                  {hourlyRate && expectedHours && (
                    <View style={styles.calculatedNote}>
                      <SFSymbol name="equal.circle" size={16} color="#046C4E" />
                      <Text style={styles.calculatedNoteText}>
                        ${(parseFloat(hourlyRate) * parseFloat(expectedHours)).toFixed(2)} per pay period
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount Per Pay Period *</Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.inputPrefix}>$</Text>
                    <TextInput
                      style={[styles.input, styles.inputWithPrefixField]}
                      value={baseAmount}
                      onChangeText={setBaseAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                </View>
              )}

              {payFrequency !== 'irregular' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pay Day (day of month)</Text>
                  <TextInput
                    style={styles.input}
                    value={payDay}
                    onChangeText={setPayDay}
                    keyboardType="number-pad"
                    placeholder="e.g., 15"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="MM/DD/YYYY"
                />
              </View>
            </View>
          </View>

          {/* Tax Settings */}
          <View style={styles.section}>
            <SectionHeader title="TAX SETTINGS" icon="percent" color="#DC2626" />
            
            <View style={styles.card}>
              <View style={styles.taxableToggle}>
                <View style={styles.taxableToggleInfo}>
                  <Text style={styles.taxableToggleTitle}>Taxable Income</Text>
                  <Text style={styles.taxableToggleSubtitle}>
                    {isTaxable ? 'Subject to federal and state taxes' : 'Not subject to income tax'}
                  </Text>
                </View>
                <Switch
                  value={isTaxable}
                  onValueChange={setIsTaxable}
                  trackColor={{ false: '#E5E5EA', true: '#046C4E' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {isTaxable && (
                <>
                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Federal Tax Rate</Text>
                      <View style={styles.inputWithSuffix}>
                        <TextInput
                          style={[styles.input, styles.inputWithAffixField]}
                          value={federalTaxRate}
                          onChangeText={setFederalTaxRate}
                          keyboardType="decimal-pad"
                          placeholder="0"
                        />
                        <Text style={styles.inputSuffix}>%</Text>
                      </View>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                      <Text style={styles.inputLabel}>State Tax Rate</Text>
                      <View style={styles.inputWithSuffix}>
                        <TextInput
                          style={[styles.input, styles.inputWithAffixField]}
                          value={stateTaxRate}
                          onChangeText={setStateTaxRate}
                          keyboardType="decimal-pad"
                          placeholder="0"
                        />
                        <Text style={styles.inputSuffix}>%</Text>
                      </View>
                    </View>
                  </View>

                  {(federalTax > 0 || stateTax > 0) && (
                    <View style={styles.taxSummary}>
                      <View style={styles.taxSummaryRow}>
                        <Text style={styles.taxSummaryLabel}>Federal Tax</Text>
                        <Text style={styles.taxSummaryValue}>-${federalTax.toFixed(2)}</Text>
                      </View>
                      <View style={styles.taxSummaryRow}>
                        <Text style={styles.taxSummaryLabel}>State Tax</Text>
                        <Text style={styles.taxSummaryValue}>-${stateTax.toFixed(2)}</Text>
                      </View>
                      <View style={[styles.taxSummaryRow, styles.taxSummaryRowTotal]}>
                        <Text style={styles.taxSummaryLabelTotal}>Total Tax</Text>
                        <Text style={styles.taxSummaryValueTotal}>
                          -${(federalTax + stateTax).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Deductions */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SectionHeader title="DEDUCTIONS" icon="minus.circle.fill" color="#7C3AED" />
              <TouchableOpacity style={styles.addButton} onPress={addDeduction}>
                <SFSymbol name="plus" size={16} color="#7C3AED" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {deductions.length === 0 ? (
              <View style={styles.emptyDeductions}>
                <SFSymbol name="minus.circle" size={32} color="#C7C7CC" />
                <Text style={styles.emptyDeductionsText}>No deductions</Text>
                <Text style={styles.emptyDeductionsSubtext}>
                  Add 401(k), insurance, or other deductions
                </Text>
              </View>
            ) : (
              <>
                {deductions.map((deduction, index) => (
                  <DeductionCard
                    key={deduction.deduction_id}
                    deduction={deduction}
                    onUpdate={(updated) => updateDeduction(index, updated)}
                    onDelete={() => deleteDeduction(index)}
                    grossAmount={grossAmount}
                  />
                ))}

                <View style={styles.deductionSummary}>
                  <View style={styles.deductionSummaryRow}>
                    <Text style={styles.deductionSummaryLabel}>Pre-Tax Deductions</Text>
                    <Text style={styles.deductionSummaryValue}>-${preTaxDeductions.toFixed(2)}</Text>
                  </View>
                  <View style={styles.deductionSummaryRow}>
                    <Text style={styles.deductionSummaryLabel}>Post-Tax Deductions</Text>
                    <Text style={styles.deductionSummaryValue}>-${postTaxDeductions.toFixed(2)}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Net Pay Summary */}
          <View style={styles.netPayCard}>
            <Text style={styles.netPayTitle}>Net Pay Summary</Text>
            <View style={styles.netPayBreakdown}>
              <View style={styles.netPayRow}>
                <Text style={styles.netPayLabel}>Gross Pay</Text>
                <Text style={styles.netPayValue}>${grossAmount.toFixed(2)}</Text>
              </View>
              {preTaxDeductions > 0 && (
                <View style={styles.netPayRow}>
                  <Text style={styles.netPayLabelSmall}>Pre-Tax Deductions</Text>
                  <Text style={styles.netPayValueSmall}>-${preTaxDeductions.toFixed(2)}</Text>
                </View>
              )}
              {isTaxable && (federalTax > 0 || stateTax > 0) && (
                <View style={styles.netPayRow}>
                  <Text style={styles.netPayLabelSmall}>Taxes</Text>
                  <Text style={styles.netPayValueSmall}>-${(federalTax + stateTax).toFixed(2)}</Text>
                </View>
              )}
              {postTaxDeductions > 0 && (
                <View style={styles.netPayRow}>
                  <Text style={styles.netPayLabelSmall}>Post-Tax Deductions</Text>
                  <Text style={styles.netPayValueSmall}>-${postTaxDeductions.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.netPayRow, styles.netPayRowTotal]}>
                <Text style={styles.netPayLabelTotal}>Net Pay</Text>
                <Text style={styles.netPayValueTotal}>${netAmount.toFixed(2)}</Text>
              </View>
            </View>
            {periodsPerYear > 0 && (
              <Text style={styles.netPayAnnual}>
                Annual: ${annualNet.toLocaleString()} net / ${annualGross.toLocaleString()} gross
              </Text>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <SectionHeader title="NOTES" icon="note.text" color="#6B7280" />
            
            <View style={styles.card}>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this income source..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Meta Info */}
          {originalIncome && (
            <View style={styles.metaInfo}>
              <Text style={styles.metaText}>Added: {originalIncome.created_at}</Text>
              <Text style={styles.metaText}>Last updated: {originalIncome.updated_at}</Text>
            </View>
          )}

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={() => {
                Alert.alert(
                  'Delete Income Source',
                  `Are you sure you want to delete "${sourceName}"? This will also remove all payment history. This action cannot be undone.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert('Deleted', 'Income source has been deleted.', [
                          { text: 'OK', onPress: () => navigation.goBack() }
                        ]);
                      }
                    },
                  ]
                );
              }}
            >
              <SFSymbol name="trash" size={18} color="#DC2626" />
              <Text style={styles.dangerButtonText}>Delete Income Source</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerSaveButton: {
    backgroundColor: '#046C4E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  headerSaveButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  headerSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSaveTextDisabled: {
    color: '#8E8E93',
  },

  // Loading
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

  // Scroll
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Preview Card
  previewCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  previewEmployer: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  previewAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 14,
    padding: 16,
    width: '100%',
  },
  previewAmountItem: {
    flex: 1,
    alignItems: 'center',
  },
  previewAmountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  previewAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  previewAmountDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },

  // Input
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  inputPrefix: {
    fontSize: 16,
    color: '#8E8E93',
    paddingLeft: 16,
  },
  inputWithPrefixField: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingLeft: 4,
  },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  inputWithAffixField: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  inputSuffix: {
    fontSize: 16,
    color: '#8E8E93',
    paddingRight: 16,
  },

  // Dropdown
  dropdown: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  dropdownValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  dropdownValueText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  dropdownPlaceholder: {
    color: '#8E8E93',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalList: {
    padding: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: '#046C4E10',
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalOptionInfo: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
  },
  modalOptionDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Calculated Note
  calculatedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  calculatedNoteText: {
    fontSize: 14,
    color: '#046C4E',
    fontWeight: '600',
  },

  // Taxable Toggle
  taxableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  taxableToggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  taxableToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  taxableToggleSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Tax Summary
  taxSummary: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  taxSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  taxSummaryRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    marginTop: 6,
    paddingTop: 10,
  },
  taxSummaryLabel: {
    fontSize: 14,
    color: '#DC2626',
  },
  taxSummaryValue: {
    fontSize: 14,
    color: '#DC2626',
  },
  taxSummaryLabelTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  taxSummaryValueTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Deductions
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#7C3AED15',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  emptyDeductions: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    gap: 8,
  },
  emptyDeductionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  emptyDeductionsSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  deductionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  deductionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deductionTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deductionTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deductionDeleteButton: {
    padding: 4,
  },
  deductionFields: {
    gap: 12,
  },
  deductionAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  percentageToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  percentageToggleActive: {
    backgroundColor: '#7C3AED',
  },
  deductionCalculated: {
    fontSize: 13,
    color: '#7C3AED',
    fontStyle: 'italic',
    marginTop: -8,
  },
  deductionTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 4,
  },
  deductionTypeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  deductionTypeOptionActive: {
    backgroundColor: '#046C4E',
  },
  deductionTypeOptionActiveAlt: {
    backgroundColor: '#7C3AED',
  },
  deductionTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  deductionTypeOptionTextActive: {
    color: '#FFFFFF',
  },
  deductionTypeOptionTextActiveAlt: {
    color: '#FFFFFF',
  },
  deductionSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  deductionSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  deductionSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  deductionSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },

  // Net Pay Card
  netPayCard: {
    backgroundColor: '#046C4E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  netPayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  netPayBreakdown: {
    gap: 8,
  },
  netPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netPayRowTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
    marginTop: 8,
  },
  netPayLabel: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  netPayValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  netPayLabelSmall: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  netPayValueSmall: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  netPayLabelTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  netPayValueTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  netPayAnnual: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 16,
  },

  // Notes
  notesInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Meta Info
  metaInfo: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Danger Zone
  dangerZone: {
    marginTop: 8,
    marginBottom: 24,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});