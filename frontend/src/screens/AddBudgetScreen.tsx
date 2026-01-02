// src/screens/AddBudgetScreen.tsx
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

// ============ TYPES ============
type BudgetPeriod = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

type Category = {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  is_essential: boolean;
  suggested_amount?: number;
};

type CategoryAllocation = {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  allocated_amount: string;
  is_flexible: boolean;
  priority: number;
};

type FormData = {
  budget_name: string;
  budget_period: BudgetPeriod;
  start_date: string;
  end_date: string;
  total_income: string;
  savings_target_percentage: string;
  emergency_buffer: string;
  use_fifty_thirty_twenty: boolean;
  is_rollover_enabled: boolean;
  notes: string;
};

type DropdownOption = {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  color?: string;
};

// ============ BUDGET PERIOD OPTIONS ============
const budgetPeriodOptions: DropdownOption[] = [
  { id: 'weekly', label: 'Weekly', subtitle: '7 days', icon: 'calendar', color: '#2563EB' },
  { id: 'biweekly', label: 'Bi-weekly', subtitle: '14 days', icon: 'calendar', color: '#7C3AED' },
  { id: 'monthly', label: 'Monthly', subtitle: '~30 days', icon: 'calendar', color: '#046C4E' },
  { id: 'quarterly', label: 'Quarterly', subtitle: '3 months', icon: 'calendar', color: '#F59E0B' },
  { id: 'yearly', label: 'Yearly', subtitle: '12 months', icon: 'calendar', color: '#DC2626' },
];

// ============ MOCK CATEGORIES ============
const availableCategories: Category[] = [
  { category_id: '1', category_name: 'Housing & Rent', icon: 'house.fill', color: '#2563EB', is_essential: true, suggested_amount: 1500 },
  { category_id: '2', category_name: 'Groceries', icon: 'cart.fill', color: '#046C4E', is_essential: true, suggested_amount: 600 },
  { category_id: '3', category_name: 'Transportation', icon: 'car.fill', color: '#F59E0B', is_essential: true, suggested_amount: 400 },
  { category_id: '4', category_name: 'Utilities', icon: 'bolt.fill', color: '#7C3AED', is_essential: true, suggested_amount: 250 },
  { category_id: '5', category_name: 'Healthcare', icon: 'cross.case.fill', color: '#DC2626', is_essential: true, suggested_amount: 150 },
  { category_id: '6', category_name: 'Insurance', icon: 'shield.fill', color: '#0891B2', is_essential: true, suggested_amount: 200 },
  { category_id: '7', category_name: 'Dining Out', icon: 'fork.knife', color: '#EC4899', is_essential: false, suggested_amount: 300 },
  { category_id: '8', category_name: 'Entertainment', icon: 'film.fill', color: '#8B5CF6', is_essential: false, suggested_amount: 200 },
  { category_id: '9', category_name: 'Shopping', icon: 'bag.fill', color: '#F97316', is_essential: false, suggested_amount: 150 },
  { category_id: '10', category_name: 'Subscriptions', icon: 'repeat', color: '#06B6D4', is_essential: false, suggested_amount: 100 },
  { category_id: '11', category_name: 'Personal Care', icon: 'sparkles', color: '#D946EF', is_essential: false, suggested_amount: 100 },
  { category_id: '12', category_name: 'Education', icon: 'book.fill', color: '#3B82F6', is_essential: false, suggested_amount: 100 },
  { category_id: '13', category_name: 'Gifts', icon: 'gift.fill', color: '#EF4444', is_essential: false, suggested_amount: 50 },
  { category_id: '14', category_name: 'Pet Care', icon: 'pawprint.fill', color: '#84CC16', is_essential: false, suggested_amount: 100 },
];

// ============ HEADER ============
const FormHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="xmark" size={20} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Create Budget</Text>
      <View style={styles.headerButtonPlaceholder} />
    </View>
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
  multiline?: boolean;
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
  multiline = false,
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
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
    </View>
  </View>
);

// ============ DROPDOWN SELECTOR ============
type DropdownProps = {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const Dropdown = ({ label, placeholder, options, selectedId, onSelect }: DropdownProps) => {
  const [visible, setVisible] = useState(false);
  const selected = options.find(o => o.id === selectedId);

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
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
              <View>
                <Text style={styles.dropdownSelectedText}>{selected.label}</Text>
                {selected.subtitle && (
                  <Text style={styles.dropdownSelectedSubtext}>{selected.subtitle}</Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.dropdownPlaceholder}>{placeholder}</Text>
          )}
          <SFSymbol name="chevron.down" size={16} color="#8E8E93" />
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

// ============ 50/30/20 RULE CARD ============
type FiftyThirtyTwentyCardProps = {
  totalIncome: number;
  isActive: boolean;
  onToggle: () => void;
};

const FiftyThirtyTwentyCard = ({ totalIncome, isActive, onToggle }: FiftyThirtyTwentyCardProps) => {
  const needs = totalIncome * 0.5;
  const wants = totalIncome * 0.3;
  const savings = totalIncome * 0.2;

  return (
    <TouchableOpacity
      style={[styles.ruleCard, isActive && styles.ruleCardActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.ruleCardHeader}>
        <View style={styles.ruleCardTitleRow}>
          <SFSymbol name="sparkles" size={20} color={isActive ? '#046C4E' : '#8E8E93'} />
          <Text style={[styles.ruleCardTitle, isActive && styles.ruleCardTitleActive]}>
            50/30/20 Rule
          </Text>
        </View>
        <View style={[styles.ruleCardCheck, isActive && styles.ruleCardCheckActive]}>
          {isActive && <SFSymbol name="checkmark" size={14} color="#FFFFFF" />}
        </View>
      </View>

      <Text style={styles.ruleCardDescription}>
        A popular budgeting method: 50% needs, 30% wants, 20% savings
      </Text>

      {totalIncome > 0 && (
        <View style={styles.ruleCardBreakdown}>
          <View style={styles.ruleCardItem}>
            <View style={[styles.ruleCardDot, { backgroundColor: '#046C4E' }]} />
            <Text style={styles.ruleCardItemLabel}>Needs (50%)</Text>
            <Text style={styles.ruleCardItemValue}>${needs.toLocaleString()}</Text>
          </View>
          <View style={styles.ruleCardItem}>
            <View style={[styles.ruleCardDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.ruleCardItemLabel}>Wants (30%)</Text>
            <Text style={styles.ruleCardItemValue}>${wants.toLocaleString()}</Text>
          </View>
          <View style={styles.ruleCardItem}>
            <View style={[styles.ruleCardDot, { backgroundColor: '#2563EB' }]} />
            <Text style={styles.ruleCardItemLabel}>Savings (20%)</Text>
            <Text style={styles.ruleCardItemValue}>${savings.toLocaleString()}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============ BUDGET SUMMARY CARD ============
type BudgetSummaryProps = {
  totalIncome: number;
  totalAllocated: number;
  savingsTarget: number;
  emergencyBuffer: number;
};

const BudgetSummaryCard = ({ totalIncome, totalAllocated, savingsTarget, emergencyBuffer }: BudgetSummaryProps) => {
  const unallocated = totalIncome - totalAllocated - savingsTarget - emergencyBuffer;
  const allocatedPercent = totalIncome > 0 ? (totalAllocated / totalIncome) * 100 : 0;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>Budget Summary</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Income</Text>
        <Text style={styles.summaryValue}>${totalIncome.toLocaleString()}</Text>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryRow}>
        <View style={styles.summaryLabelRow}>
          <View style={[styles.summaryDot, { backgroundColor: '#046C4E' }]} />
          <Text style={styles.summaryLabel}>Allocated to Categories</Text>
        </View>
        <Text style={styles.summaryValue}>-${totalAllocated.toLocaleString()}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryLabelRow}>
          <View style={[styles.summaryDot, { backgroundColor: '#2563EB' }]} />
          <Text style={styles.summaryLabel}>Savings Target</Text>
        </View>
        <Text style={styles.summaryValue}>-${savingsTarget.toLocaleString()}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryLabelRow}>
          <View style={[styles.summaryDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.summaryLabel}>Emergency Buffer</Text>
        </View>
        <Text style={styles.summaryValue}>-${emergencyBuffer.toLocaleString()}</Text>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, styles.summaryLabelBold]}>Unallocated</Text>
        <Text style={[
          styles.summaryValueLarge,
          { color: unallocated >= 0 ? '#046C4E' : '#DC2626' }
        ]}>
          ${unallocated.toLocaleString()}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.summaryProgressContainer}>
        <View style={styles.summaryProgressBar}>
          <View style={[styles.summaryProgressFill, { width: `${Math.min(allocatedPercent, 100)}%` }]} />
        </View>
        <Text style={styles.summaryProgressText}>{allocatedPercent.toFixed(0)}% allocated</Text>
      </View>
    </View>
  );
};

// ============ CATEGORY ALLOCATION CARD ============
type CategoryAllocationCardProps = {
  allocation: CategoryAllocation;
  onUpdateAmount: (amount: string) => void;
  onRemove: () => void;
};

const CategoryAllocationCard = ({ allocation, onUpdateAmount, onRemove }: CategoryAllocationCardProps) => (
  <View style={styles.allocationCard}>
    <View style={styles.allocationCardHeader}>
      <View style={[styles.allocationIcon, { backgroundColor: allocation.color + '15' }]}>
        <SFSymbol name={allocation.icon} size={22} color={allocation.color} />
      </View>
      <Text style={styles.allocationName}>{allocation.category_name}</Text>
      <TouchableOpacity style={styles.allocationRemove} onPress={onRemove}>
        <SFSymbol
        name="xmark.circle.fill"
        size={22}
        color="#DC2626"
        style={{ marginRight: 10 }}
        />

      </TouchableOpacity>
    </View>
    
    <View style={styles.allocationInputRow}>
      <Text style={styles.allocationInputLabel}>Amount</Text>
      <View style={styles.allocationInputWrapper}>
        <Text style={styles.allocationInputPrefix}>$</Text>
        <TextInput
          style={styles.allocationInput}
          placeholder="0.00"
          placeholderTextColor="#C7C7CC"
          value={allocation.allocated_amount}
          onChangeText={onUpdateAmount}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  </View>
);

// ============ ADD CATEGORY MODAL ============
type AddCategoryModalProps = {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedIds: string[];
  onAdd: (category: Category) => void;
};

const AddCategoryModal = ({ visible, onClose, categories, selectedIds, onAdd }: AddCategoryModalProps) => {
  const availableToAdd = categories.filter(c => !selectedIds.includes(c.category_id));
  
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContentLarge} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Category</Text>
          
          {availableToAdd.length === 0 ? (
            <View style={styles.emptyCategories}>
              <SFSymbol name="checkmark.circle.fill" size={48} color="#046C4E" />
              <Text style={styles.emptyCategoriesText}>All categories added!</Text>
            </View>
          ) : (
            <FlatList
              data={availableToAdd}
              keyExtractor={item => item.category_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.addCategoryOption}
                  onPress={() => {
                    onAdd(item);
                    onClose();
                  }}
                >
                  <View style={[styles.addCategoryIcon, { backgroundColor: item.color + '15' }]}>
                    <SFSymbol name={item.icon} size={24} color={item.color} />
                  </View>
                  <View style={styles.addCategoryContent}>
                    <Text style={styles.addCategoryName}>{item.category_name}</Text>
                    <View style={styles.addCategoryMeta}>
                      {item.is_essential && (
                        <View style={styles.essentialBadge}>
                          <Text style={styles.essentialBadgeText}>Essential</Text>
                        </View>
                      )}
                      {item.suggested_amount && (
                        <Text style={styles.suggestedAmount}>
                          Suggested: ${item.suggested_amount}
                        </Text>
                      )}
                    </View>
                  </View>
                  <SFSymbol name="plus.circle.fill" size={24} color="#046C4E" />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ============ MAIN COMPONENT ============
export default function AddBudgetScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [submitting, setSubmitting] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    budget_name: '',
    budget_period: 'monthly',
    start_date: new Date().toLocaleDateString('en-US'),
    end_date: '',
    total_income: '',
    savings_target_percentage: '20',
    emergency_buffer: '',
    use_fifty_thirty_twenty: false,
    is_rollover_enabled: false,
    notes: '',
  });

  const [allocations, setAllocations] = useState<CategoryAllocation[]>([]);

  // Calculate end date based on period
  useEffect(() => {
    if (formData.start_date && formData.budget_period) {
      const start = new Date(formData.start_date);
      let end = new Date(start);
      
      switch (formData.budget_period) {
        case 'weekly':
          end.setDate(start.getDate() + 6);
          break;
        case 'biweekly':
          end.setDate(start.getDate() + 13);
          break;
        case 'monthly':
          end.setMonth(start.getMonth() + 1);
          end.setDate(end.getDate() - 1);
          break;
        case 'quarterly':
          end.setMonth(start.getMonth() + 3);
          end.setDate(end.getDate() - 1);
          break;
        case 'yearly':
          end.setFullYear(start.getFullYear() + 1);
          end.setDate(end.getDate() - 1);
          break;
      }
      
      setFormData(prev => ({
        ...prev,
        end_date: end.toLocaleDateString('en-US'),
      }));
    }
  }, [formData.start_date, formData.budget_period]);

  // Auto-generate budget name
  useEffect(() => {
    if (formData.budget_period) {
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      let name = '';
      switch (formData.budget_period) {
        case 'weekly':
          name = `Week of ${formData.start_date}`;
          break;
        case 'biweekly':
          name = `Bi-weekly ${formData.start_date}`;
          break;
        case 'monthly':
          name = `${monthNames[now.getMonth()]} ${now.getFullYear()} Budget`;
          break;
        case 'quarterly':
          const quarter = Math.floor(now.getMonth() / 3) + 1;
          name = `Q${quarter} ${now.getFullYear()} Budget`;
          break;
        case 'yearly':
          name = `${now.getFullYear()} Annual Budget`;
          break;
      }
      
      setFormData(prev => ({ ...prev, budget_name: name }));
    }
  }, [formData.budget_period]);

  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const totalIncome = parseFloat(formData.total_income) || 0;
  const totalAllocated = allocations.reduce((sum, a) => sum + (parseFloat(a.allocated_amount) || 0), 0);
  const savingsTarget = totalIncome * ((parseFloat(formData.savings_target_percentage) || 0) / 100);
  const emergencyBuffer = parseFloat(formData.emergency_buffer) || 0;

  const handleAddCategory = (category: Category) => {
    const newAllocation: CategoryAllocation = {
      category_id: category.category_id,
      category_name: category.category_name,
      icon: category.icon,
      color: category.color,
      allocated_amount: category.suggested_amount?.toString() || '',
      is_flexible: !category.is_essential,
      priority: category.is_essential ? 10 : 5,
    };
    setAllocations(prev => [...prev, newAllocation]);
  };

  const handleUpdateAllocation = (categoryId: string, amount: string) => {
    setAllocations(prev => prev.map(a => 
      a.category_id === categoryId ? { ...a, allocated_amount: amount } : a
    ));
  };

  const handleRemoveAllocation = (categoryId: string) => {
    setAllocations(prev => prev.filter(a => a.category_id !== categoryId));
  };

  const handleApply5030Rule = () => {
    if (!formData.use_fifty_thirty_twenty) {
      // Apply the rule - auto-allocate based on needs/wants
      const needs = totalIncome * 0.5;
      const wants = totalIncome * 0.3;
      
      // Add essential categories first
      const essentialCategories = availableCategories.filter(c => c.is_essential);
      const wantsCategories = availableCategories.filter(c => !c.is_essential);
      
      const newAllocations: CategoryAllocation[] = [];
      
      // Distribute needs among essential categories
      const needsPerCategory = needs / essentialCategories.length;
      essentialCategories.forEach(cat => {
        newAllocations.push({
          category_id: cat.category_id,
          category_name: cat.category_name,
          icon: cat.icon,
          color: cat.color,
          allocated_amount: Math.round(needsPerCategory).toString(),
          is_flexible: false,
          priority: 10,
        });
      });
      
      // Add a few wants categories
      const wantsPerCategory = wants / 4;
      wantsCategories.slice(0, 4).forEach(cat => {
        newAllocations.push({
          category_id: cat.category_id,
          category_name: cat.category_name,
          icon: cat.icon,
          color: cat.color,
          allocated_amount: Math.round(wantsPerCategory).toString(),
          is_flexible: true,
          priority: 5,
        });
      });
      
      setAllocations(newAllocations);
      updateForm('savings_target_percentage', '20');
    }
    
    updateForm('use_fifty_thirty_twenty', !formData.use_fifty_thirty_twenty);
  };

  const canSubmit = () => {
    return (
      formData.budget_name.trim() !== '' &&
      formData.budget_period !== null &&
      totalIncome > 0 &&
      allocations.length > 0
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Missing Information', 'Please fill in the budget details and add at least one category.');
      return;
    }

    const unallocated = totalIncome - totalAllocated - savingsTarget - emergencyBuffer;
    if (unallocated < 0) {
      Alert.alert(
        'Over Budget',
        'Your allocations exceed your income. Please adjust the amounts.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);
    try {
      // TODO: API call to create budget
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Budget Created! 📊',
        `"${formData.budget_name}" has been created with ${allocations.length} categories.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create budget. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
        {/* Budget Details */}
        <SectionHeader title="Budget Details" icon="doc.text.fill" color="#2563EB" />

        <InputField
          label="Budget Name"
          placeholder="e.g., January 2025 Budget"
          value={formData.budget_name}
          onChangeText={(text) => updateForm('budget_name', text)}
        />

        <Dropdown
          label="Budget Period"
          placeholder="Select period"
          options={budgetPeriodOptions}
          selectedId={formData.budget_period}
          onSelect={(id) => updateForm('budget_period', id)}
        />

        <View style={styles.rowInputs}>
          <View style={styles.rowInputHalf}>
            <InputField
              label="Start Date"
              placeholder="MM/DD/YYYY"
              value={formData.start_date}
              onChangeText={(text) => updateForm('start_date', text)}
            />
          </View>
          <View style={styles.rowInputHalf}>
            <InputField
              label="End Date"
              placeholder="Auto-calculated"
              value={formData.end_date}
              onChangeText={(text) => updateForm('end_date', text)}
            />
          </View>
        </View>

        {/* Income */}
        <SectionHeader title="Income" icon="dollarsign.circle.fill" color="#046C4E" />

        <InputField
          label="Total Income for Period"
          placeholder="0.00"
          value={formData.total_income}
          onChangeText={(text) => updateForm('total_income', text)}
          keyboardType="decimal-pad"
          prefix="$"
        />

        {/* 50/30/20 Rule */}
        <FiftyThirtyTwentyCard
          totalIncome={totalIncome}
          isActive={formData.use_fifty_thirty_twenty}
          onToggle={handleApply5030Rule}
        />

        {/* Savings & Buffer */}
        <SectionHeader title="Savings & Buffer" icon="banknote.fill" color="#7C3AED" />

        <View style={styles.rowInputs}>
          <View style={styles.rowInputHalf}>
            <InputField
              label="Savings Target"
              placeholder="20"
              value={formData.savings_target_percentage}
              onChangeText={(text) => updateForm('savings_target_percentage', text)}
              keyboardType="decimal-pad"
              suffix="%"
            />
          </View>
          <View style={styles.rowInputHalf}>
            <InputField
              label="Emergency Buffer"
              placeholder="0.00"
              value={formData.emergency_buffer}
              onChangeText={(text) => updateForm('emergency_buffer', text)}
              keyboardType="decimal-pad"
              prefix="$"
              optional
            />
          </View>
        </View>

        {/* Category Allocations */}
        <SectionHeader title="Category Allocations" icon="square.grid.2x2.fill" color="#F59E0B" />

        {allocations.length > 0 ? (
          allocations.map((allocation) => (
            <CategoryAllocationCard
              key={allocation.category_id}
              allocation={allocation}
              onUpdateAmount={(amount) => handleUpdateAllocation(allocation.category_id, amount)}
              onRemove={() => handleRemoveAllocation(allocation.category_id)}
            />
          ))
        ) : (
          <View style={styles.noAllocations}>
            <Text style={styles.noAllocationsText}>No categories added yet</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addCategoryButton}
          onPress={() => setShowAddCategory(true)}
        >
          <Text style={styles.addCategoryButtonText}>Add Category</Text>
        </TouchableOpacity>

        {/* Budget Summary */}
        {totalIncome > 0 && (
          <BudgetSummaryCard
            totalIncome={totalIncome}
            totalAllocated={totalAllocated}
            savingsTarget={savingsTarget}
            emergencyBuffer={emergencyBuffer}
          />
        )}

        {/* Settings */}
        <SectionHeader title="Settings" icon="gearshape.fill" color="#6B7280" />

        <ToggleSwitch
          label="Enable Rollover"
          description="Carry over unspent amounts to next period"
          value={formData.is_rollover_enabled}
          onToggle={() => updateForm('is_rollover_enabled', !formData.is_rollover_enabled)}
        />

        {/* Notes */}
        <InputField
          label="Notes"
          placeholder="Any notes about this budget..."
          value={formData.notes}
          onChangeText={(text) => updateForm('notes', text)}
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
          disabled={!canSubmit() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Create Budget</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Category Modal */}
      <AddCategoryModal
        visible={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        categories={availableCategories}
        selectedIds={allocations.map(a => a.category_id)}
        onAdd={handleAddCategory}
      />
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
    fontSize: 17,
    color: '#8E8E93',
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#000',
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
  dropdownSelectedSubtext: {
    fontSize: 13,
    color: '#8E8E93',
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
    maxHeight: '60%',
  },
  modalContentLarge: {
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

  // 50/30/20 Rule Card
  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  ruleCardActive: {
    borderColor: '#046C4E',
    backgroundColor: '#046C4E08',
  },
  ruleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ruleCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  ruleCardTitleActive: {
    color: '#046C4E',
  },
  ruleCardCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleCardCheckActive: {
    backgroundColor: '#046C4E',
    borderColor: '#046C4E',
  },
  ruleCardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  ruleCardBreakdown: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  ruleCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleCardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  ruleCardItemLabel: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  ruleCardItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  // Budget Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#046C4E',
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#046C4E',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryLabelBold: {
    fontWeight: '600',
    color: '#000',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  summaryValueLarge: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  summaryProgressContainer: {
    marginTop: 16,
  },
  summaryProgressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    backgroundColor: '#046C4E',
    borderRadius: 4,
  },
  summaryProgressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 6,
  },

  // Category Allocation Card
  allocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  allocationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  allocationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  allocationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  allocationRemove: {
    padding: 4,
  },
  allocationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allocationInputLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  allocationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    minWidth: 120,
  },
  allocationInputPrefix: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 4,
  },
  allocationInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
  },

  // No Allocations
  noAllocations: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E5EA',
  },
  noAllocationsText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 10,
  },

  // Add Category Button
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#046C4E',
    gap: 10,
  },
  addCategoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#046C4E',
  },

  // Add Category Modal
  addCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  addCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  addCategoryContent: {
    flex: 1,
  },
  addCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  addCategoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  essentialBadge: {
    backgroundColor: '#DC262615',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  essentialBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  suggestedAmount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  emptyCategories: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCategoriesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#046C4E',
    marginTop: 12,
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