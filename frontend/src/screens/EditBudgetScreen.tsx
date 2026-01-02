// src/screens/EditBudgetScreen.tsx
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

// ============ TYPES ============
type BudgetStatus = 'active' | 'paused' | 'closed';

type Category = {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  is_essential: boolean;
  suggested_amount?: number;
};

type CategoryAllocation = {
  allocation_id: string;
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
  is_flexible: boolean;
  priority: number;
  // For editing
  new_allocated_amount: string;
};

type Budget = {
  budget_id: string;
  budget_name: string;
  budget_period: string;
  start_date: string;
  end_date: string;
  total_income: number;
  total_allocated: number;
  total_spent: number;
  savings_target: number;
  savings_target_percentage: number;
  emergency_buffer: number;
  is_rollover_enabled: boolean;
  status: BudgetStatus;
  notes: string;
  allocations: CategoryAllocation[];
};

type DropdownOption = {
  id: string;
  label: string;
  icon?: string;
  color?: string;
};

// ============ STATUS OPTIONS ============
const statusOptions: DropdownOption[] = [
  { id: 'active', label: 'Active', icon: 'checkmark.circle.fill', color: '#046C4E' },
  { id: 'paused', label: 'Paused', icon: 'pause.circle.fill', color: '#F59E0B' },
  { id: 'closed', label: 'Closed', icon: 'xmark.circle.fill', color: '#DC2626' },
];

// ============ MOCK AVAILABLE CATEGORIES ============
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
const FormHeader = ({ onDelete }: { onDelete: () => void }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="xmark" size={20} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Budget</Text>
      <TouchableOpacity style={styles.headerButtonDelete} onPress={onDelete}>
        <SFSymbol name="trash" size={20} color="#DC2626" />
      </TouchableOpacity>
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

// ============ BUDGET INFO CARD ============
type BudgetInfoCardProps = {
  budget: Budget;
  daysRemaining: number;
};

const BudgetInfoCard = ({ budget, daysRemaining }: BudgetInfoCardProps) => {
  const spentPercent = (budget.total_spent / budget.total_allocated) * 100;
  
  return (
    <View style={styles.budgetInfoCard}>
      <View style={styles.budgetInfoHeader}>
        <View>
          <Text style={styles.budgetInfoName}>{budget.budget_name}</Text>
          <Text style={styles.budgetInfoPeriod}>
            {budget.start_date} - {budget.end_date}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: statusOptions.find(s => s.id === budget.status)?.color + '15' }
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: statusOptions.find(s => s.id === budget.status)?.color }
          ]} />
          <Text style={[
            styles.statusText,
            { color: statusOptions.find(s => s.id === budget.status)?.color }
          ]}>
            {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.budgetInfoStats}>
        <View style={styles.budgetInfoStat}>
          <Text style={styles.budgetInfoStatValue}>${budget.total_spent.toLocaleString()}</Text>
          <Text style={styles.budgetInfoStatLabel}>Spent</Text>
        </View>
        <View style={styles.budgetInfoStatDivider} />
        <View style={styles.budgetInfoStat}>
          <Text style={styles.budgetInfoStatValue}>${budget.total_allocated.toLocaleString()}</Text>
          <Text style={styles.budgetInfoStatLabel}>Allocated</Text>
        </View>
        <View style={styles.budgetInfoStatDivider} />
        <View style={styles.budgetInfoStat}>
          <Text style={styles.budgetInfoStatValue}>{daysRemaining}</Text>
          <Text style={styles.budgetInfoStatLabel}>Days Left</Text>
        </View>
      </View>

      <View style={styles.budgetInfoProgressContainer}>
        <View style={styles.budgetInfoProgressBar}>
          <View 
            style={[
              styles.budgetInfoProgressFill,
              { 
                width: `${Math.min(spentPercent, 100)}%`,
                backgroundColor: spentPercent > 90 ? '#DC2626' : spentPercent > 75 ? '#F59E0B' : '#046C4E'
              }
            ]} 
          />
        </View>
        <Text style={styles.budgetInfoProgressText}>{spentPercent.toFixed(0)}% spent</Text>
      </View>
    </View>
  );
};

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

// ============ STATUS SELECTOR ============
type StatusSelectorProps = {
  selected: BudgetStatus;
  onSelect: (status: BudgetStatus) => void;
};

const StatusSelector = ({ selected, onSelect }: StatusSelectorProps) => {
  const [visible, setVisible] = useState(false);
  const selectedOption = statusOptions.find(o => o.id === selected);

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Budget Status</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          {selectedOption && (
            <View style={styles.dropdownSelected}>
              <View style={[styles.dropdownSelectedIcon, { backgroundColor: selectedOption.color + '15' }]}>
                <SFSymbol name={selectedOption.icon!} size={18} color={selectedOption.color} />
              </View>
              <Text style={styles.dropdownSelectedText}>{selectedOption.label}</Text>
            </View>
          )}
          <SFSymbol name="chevron.down" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Budget Status</Text>
            <FlatList
              data={statusOptions}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selected === item.id && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.id as BudgetStatus);
                    setVisible(false);
                  }}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: item.color + '15' }]}>
                    <SFSymbol name={item.icon!} size={22} color={item.color} />
                  </View>
                  <Text style={[
                    styles.modalOptionLabel,
                    selected === item.id && { color: item.color },
                  ]}>
                    {item.label}
                  </Text>
                  {selected === item.id && (
                    <SFSymbol name="checkmark.circle.fill" size={22} color={item.color} />
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

// ============ ALLOCATION EDIT CARD ============
type AllocationEditCardProps = {
  allocation: CategoryAllocation;
  onUpdateAmount: (amount: string) => void;
  onRemove: () => void;
};

const AllocationEditCard = ({ allocation, onUpdateAmount, onRemove }: AllocationEditCardProps) => {
  const newAmount = parseFloat(allocation.new_allocated_amount) || 0;
  const difference = newAmount - allocation.allocated_amount;
  const hasPendingSpend = allocation.spent_amount > 0;
  const wouldBeOverspent = newAmount < allocation.spent_amount;

  return (
    <View style={[styles.allocationCard, wouldBeOverspent && styles.allocationCardWarning]}>
      <View style={styles.allocationCardHeader}>
        <View style={[styles.allocationIcon, { backgroundColor: allocation.color + '15' }]}>
          <SFSymbol name={allocation.icon} size={22} color={allocation.color} />
        </View>
        <View style={styles.allocationInfo}>
          <Text style={styles.allocationName}>{allocation.category_name}</Text>
          <View style={styles.allocationMeta}>
            <Text style={styles.allocationSpent}>
              ${allocation.spent_amount.toLocaleString()} spent
            </Text>
            <View style={styles.allocationUtilization}>
              <View 
                style={[
                  styles.allocationUtilizationBar,
                  { 
                    width: `${Math.min(allocation.utilization_percentage, 100)}%`,
                    backgroundColor: allocation.utilization_percentage > 90 ? '#DC2626' : 
                                     allocation.utilization_percentage > 75 ? '#F59E0B' : '#046C4E'
                  }
                ]} 
              />
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.allocationRemove} onPress={onRemove}>
          <SFSymbol name="xmark.circle.fill" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <View style={styles.allocationEditRow}>
        <View style={styles.allocationCurrentAmount}>
          <Text style={styles.allocationCurrentLabel}>Current</Text>
          <Text style={styles.allocationCurrentValue}>
            ${allocation.allocated_amount.toLocaleString()}
          </Text>
        </View>

        {/* <SFSymbol name="arrow.right" size={16} color="#8E8E93" /> */}

        <View style={styles.allocationNewAmount}>
          <Text style={styles.allocationNewLabel}>New Amount</Text>
          <View style={[
            styles.allocationInputWrapper,
            wouldBeOverspent && styles.allocationInputWrapperError
          ]}>
            <Text style={styles.allocationInputPrefix}>$</Text>
            <TextInput
              style={styles.allocationInput}
              placeholder={allocation.allocated_amount.toString()}
              placeholderTextColor="#C7C7CC"
              value={allocation.new_allocated_amount}
              onChangeText={onUpdateAmount}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {difference !== 0 && (
          <View style={[
            styles.allocationDifference,
            { backgroundColor: difference > 0 ? '#046C4E15' : '#DC262615' }
          ]}>
            <Text style={[
              styles.allocationDifferenceText,
              { color: difference > 0 ? '#046C4E' : '#DC2626' }
            ]}>
              {difference > 0 ? '+' : ''}{difference.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {wouldBeOverspent && (
        <View style={styles.allocationWarning}>
          <SFSymbol name="exclamationmark.triangle.fill" size={16} color="#DC2626" />
          <Text style={styles.allocationWarningText}>
            New amount is less than spent (${allocation.spent_amount})
          </Text>
        </View>
      )}
    </View>
  );
};

// ============ BUDGET SUMMARY CARD ============
type BudgetSummaryProps = {
  totalIncome: number;
  originalAllocated: number;
  newAllocated: number;
  savingsTarget: number;
  emergencyBuffer: number;
};

const BudgetSummaryCard = ({ 
  totalIncome, 
  originalAllocated, 
  newAllocated, 
  savingsTarget, 
  emergencyBuffer 
}: BudgetSummaryProps) => {
  const difference = newAllocated - originalAllocated;
  const unallocated = totalIncome - newAllocated - savingsTarget - emergencyBuffer;
  const allocatedPercent = totalIncome > 0 ? (newAllocated / totalIncome) * 100 : 0;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>Budget Changes</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Income</Text>
        <Text style={styles.summaryValue}>${totalIncome.toLocaleString()}</Text>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Original Allocation</Text>
        <Text style={styles.summaryValue}>${originalAllocated.toLocaleString()}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>New Allocation</Text>
        <View style={styles.summaryValueRow}>
          <Text style={styles.summaryValue}>${newAllocated.toLocaleString()}</Text>
          {difference !== 0 && (
            <Text style={[
              styles.summaryDifference,
              { color: difference > 0 ? '#DC2626' : '#046C4E' }
            ]}>
              ({difference > 0 ? '+' : ''}{difference.toLocaleString()})
            </Text>
          )}
        </View>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Savings Target</Text>
        <Text style={styles.summaryValue}>-${savingsTarget.toLocaleString()}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Emergency Buffer</Text>
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

      <View style={styles.summaryProgressContainer}>
        <View style={styles.summaryProgressBar}>
          <View style={[
            styles.summaryProgressFill, 
            { 
              width: `${Math.min(allocatedPercent, 100)}%`,
              backgroundColor: allocatedPercent > 100 ? '#DC2626' : '#046C4E'
            }
          ]} />
        </View>
        <Text style={styles.summaryProgressText}>{allocatedPercent.toFixed(0)}% allocated</Text>
      </View>
    </View>
  );
};

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
export default function EditBudgetScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditBudgetScreen'>>();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  const [budget, setBudget] = useState<Budget | null>(null);
  const [allocations, setAllocations] = useState<CategoryAllocation[]>([]);
  const [status, setStatus] = useState<BudgetStatus>('active');
  const [savingsPercentage, setSavingsPercentage] = useState('20');
  const [emergencyBuffer, setEmergencyBuffer] = useState('');
  const [isRolloverEnabled, setIsRolloverEnabled] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      
      // Mock budget data
      const mockBudget: Budget = {
        budget_id: '1',
        budget_name: 'January 2025 Budget',
        budget_period: 'monthly',
        start_date: '01/01/2025',
        end_date: '01/31/2025',
        total_income: 6500,
        total_allocated: 5200,
        total_spent: 2847,
        savings_target: 1300,
        savings_target_percentage: 20,
        emergency_buffer: 650,
        is_rollover_enabled: false,
        status: 'active',
        notes: '',
        allocations: [
          {
            allocation_id: '1',
            category_id: '1',
            category_name: 'Housing & Rent',
            icon: 'house.fill',
            color: '#2563EB',
            allocated_amount: 1500,
            spent_amount: 1500,
            remaining_amount: 0,
            utilization_percentage: 100,
            is_flexible: false,
            priority: 10,
            new_allocated_amount: '1500',
          },
          {
            allocation_id: '2',
            category_id: '2',
            category_name: 'Groceries',
            icon: 'cart.fill',
            color: '#046C4E',
            allocated_amount: 600,
            spent_amount: 423,
            remaining_amount: 177,
            utilization_percentage: 70.5,
            is_flexible: true,
            priority: 9,
            new_allocated_amount: '600',
          },
          {
            allocation_id: '3',
            category_id: '3',
            category_name: 'Transportation',
            icon: 'car.fill',
            color: '#F59E0B',
            allocated_amount: 400,
            spent_amount: 285,
            remaining_amount: 115,
            utilization_percentage: 71.25,
            is_flexible: true,
            priority: 8,
            new_allocated_amount: '400',
          },
          {
            allocation_id: '4',
            category_id: '4',
            category_name: 'Utilities',
            icon: 'bolt.fill',
            color: '#7C3AED',
            allocated_amount: 250,
            spent_amount: 189,
            remaining_amount: 61,
            utilization_percentage: 75.6,
            is_flexible: true,
            priority: 8,
            new_allocated_amount: '250',
          },
          {
            allocation_id: '5',
            category_id: '8',
            category_name: 'Entertainment',
            icon: 'film.fill',
            color: '#EC4899',
            allocated_amount: 200,
            spent_amount: 175,
            remaining_amount: 25,
            utilization_percentage: 87.5,
            is_flexible: true,
            priority: 5,
            new_allocated_amount: '200',
          },
          {
            allocation_id: '6',
            category_id: '7',
            category_name: 'Dining Out',
            icon: 'fork.knife',
            color: '#DC2626',
            allocated_amount: 300,
            spent_amount: 275,
            remaining_amount: 25,
            utilization_percentage: 91.67,
            is_flexible: true,
            priority: 4,
            new_allocated_amount: '300',
          },
          {
            allocation_id: '7',
            category_id: '10',
            category_name: 'Subscriptions',
            icon: 'repeat',
            color: '#0891B2',
            allocated_amount: 100,
            spent_amount: 65,
            remaining_amount: 35,
            utilization_percentage: 65,
            is_flexible: false,
            priority: 6,
            new_allocated_amount: '100',
          },
        ],
      };

      setBudget(mockBudget);
      setAllocations(mockBudget.allocations);
      setStatus(mockBudget.status);
      setSavingsPercentage(mockBudget.savings_target_percentage.toString());
      setEmergencyBuffer(mockBudget.emergency_buffer.toString());
      setIsRolloverEnabled(mockBudget.is_rollover_enabled);
      setNotes(mockBudget.notes);
    } catch (error) {
      console.error('Error fetching budget:', error);
      Alert.alert('Error', 'Failed to load budget');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysRemaining = () => {
    if (!budget) return 0;
    const endDate = new Date(budget.end_date);
    const today = new Date();
    return Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const handleUpdateAllocation = (allocationId: string, amount: string) => {
    setAllocations(prev => prev.map(a => 
      a.allocation_id === allocationId ? { ...a, new_allocated_amount: amount } : a
    ));
  };

  const handleRemoveAllocation = (allocationId: string) => {
    const allocation = allocations.find(a => a.allocation_id === allocationId);
    if (allocation && allocation.spent_amount > 0) {
      Alert.alert(
        'Cannot Remove',
        `This category has $${allocation.spent_amount} already spent. You cannot remove it until the budget period ends.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Remove Category',
      'Are you sure you want to remove this category from the budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setAllocations(prev => prev.filter(a => a.allocation_id !== allocationId))
        },
      ]
    );
  };

  const handleAddCategory = (category: Category) => {
    const newAllocation: CategoryAllocation = {
      allocation_id: `new-${Date.now()}`,
      category_id: category.category_id,
      category_name: category.category_name,
      icon: category.icon,
      color: category.color,
      allocated_amount: 0,
      spent_amount: 0,
      remaining_amount: 0,
      utilization_percentage: 0,
      is_flexible: !category.is_essential,
      priority: category.is_essential ? 10 : 5,
      new_allocated_amount: category.suggested_amount?.toString() || '0',
    };
    setAllocations(prev => [...prev, newAllocation]);
  };

  const handleDelete = () => {
    if (!budget) return;
    
    if (budget.total_spent > 0) {
      Alert.alert(
        'Cannot Delete',
        'This budget has recorded spending and cannot be deleted. You can close it instead.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            // TODO: API call to delete
            Alert.alert('Deleted', 'Budget has been deleted.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        },
      ]
    );
  };

  const originalAllocated = budget?.total_allocated || 0;
  const newAllocated = allocations.reduce((sum, a) => sum + (parseFloat(a.new_allocated_amount) || 0), 0);
  const savingsTarget = (budget?.total_income || 0) * ((parseFloat(savingsPercentage) || 0) / 100);
  const buffer = parseFloat(emergencyBuffer) || 0;

  const hasChanges = () => {
    if (!budget) return false;
    
    // Check if any allocation changed
    const allocationsChanged = allocations.some(a => {
      const newAmt = parseFloat(a.new_allocated_amount) || 0;
      return newAmt !== a.allocated_amount;
    });
    
    // Check other fields
    return (
      allocationsChanged ||
      status !== budget.status ||
      parseFloat(savingsPercentage) !== budget.savings_target_percentage ||
      buffer !== budget.emergency_buffer ||
      isRolloverEnabled !== budget.is_rollover_enabled ||
      notes !== budget.notes ||
      allocations.length !== budget.allocations.length
    );
  };

  const canSubmit = () => {
    if (!budget) return false;
    
    const unallocated = budget.total_income - newAllocated - savingsTarget - buffer;
    const hasOverspent = allocations.some(a => {
      const newAmt = parseFloat(a.new_allocated_amount) || 0;
      return newAmt < a.spent_amount;
    });
    
    return hasChanges() && unallocated >= 0 && !hasOverspent;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Cannot Save', 'Please fix the issues before saving.');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: API call to update budget
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Budget Updated!',
        'Your budget changes have been saved.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update budget. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <FormHeader onDelete={handleDelete} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Loading budget...</Text>
        </View>
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={styles.container}>
        <FormHeader onDelete={handleDelete} />
        <View style={styles.errorContainer}>
          <SFSymbol name="exclamationmark.triangle.fill" size={48} color="#DC2626" />
          <Text style={styles.errorText}>Budget not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FormHeader onDelete={handleDelete} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Budget Info Card */}
        <BudgetInfoCard budget={budget} daysRemaining={calculateDaysRemaining()} />

        {/* Status */}
        <SectionHeader title="Status" icon="flag.fill" color="#2563EB" />
        
        <StatusSelector selected={status} onSelect={setStatus} />

        {status === 'paused' && (
          <View style={styles.warningCard}>
            <SFSymbol name="pause.circle.fill" size={20} color="#F59E0B" />
            <Text style={styles.warningCardText}>
              Pausing the budget will stop tracking expenses against this budget.
            </Text>
          </View>
        )}

        {status === 'closed' && (
          <View style={styles.warningCard}>
            <SFSymbol name="exclamationmark.triangle.fill" size={20} color="#DC2626" />
            <Text style={styles.warningCardText}>
              Closing the budget will finalize it. You won't be able to make further changes.
            </Text>
          </View>
        )}

        {/* Category Allocations */}
        <SectionHeader title="Category Allocations" icon="square.grid.2x2.fill" color="#F59E0B" />

        {allocations.map((allocation) => (
          <AllocationEditCard
            key={allocation.allocation_id}
            allocation={allocation}
            onUpdateAmount={(amount) => handleUpdateAllocation(allocation.allocation_id, amount)}
            onRemove={() => handleRemoveAllocation(allocation.allocation_id)}
          />
        ))}

        <TouchableOpacity
          style={styles.addCategoryButton}
          onPress={() => setShowAddCategory(true)}
        >
          <SFSymbol name="plus.circle.fill" size={22} color="#046C4E" style={{marginRight: 10}}/>
          <Text style={styles.addCategoryButtonText}>Add Category</Text>
        </TouchableOpacity>

        {/* Savings & Buffer */}
        <SectionHeader title="Savings & Buffer" icon="banknote.fill" color="#7C3AED" />

        <View style={styles.rowInputs}>
          <View style={styles.rowInputHalf}>
            <InputField
              label="Savings Target"
              placeholder="20"
              value={savingsPercentage}
              onChangeText={setSavingsPercentage}
              keyboardType="decimal-pad"
              suffix="%"
            />
          </View>
          <View style={styles.rowInputHalf}>
            <InputField
              label="Emergency Buffer"
              placeholder="0.00"
              value={emergencyBuffer}
              onChangeText={setEmergencyBuffer}
              keyboardType="decimal-pad"
              prefix="$"
            />
          </View>
        </View>

        {/* Budget Summary */}
        <BudgetSummaryCard
          totalIncome={budget.total_income}
          originalAllocated={originalAllocated}
          newAllocated={newAllocated}
          savingsTarget={savingsTarget}
          emergencyBuffer={buffer}
        />

        {/* Settings */}
        <SectionHeader title="Settings" icon="gearshape.fill" color="#6B7280" />

        <ToggleSwitch
          label="Enable Rollover"
          description="Carry over unspent amounts to next period"
          value={isRolloverEnabled}
          onToggle={() => setIsRolloverEnabled(!isRolloverEnabled)}
        />

        {/* Notes */}
        <InputField
          label="Notes"
          placeholder="Any notes about this budget..."
          value={notes}
          onChangeText={setNotes}
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
              
              <Text style={styles.submitButtonText}>Save Changes</Text>
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
  headerButtonDelete: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC262615',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Budget Info Card
  budgetInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
  },
  budgetInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  budgetInfoName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  budgetInfoPeriod: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  budgetInfoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  budgetInfoStat: {
    flex: 1,
    alignItems: 'center',
  },
  budgetInfoStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  budgetInfoStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  budgetInfoStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
  },
  budgetInfoProgressContainer: {
    gap: 8,
  },
  budgetInfoProgressBar: {
    height: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    overflow: 'hidden',
  },
  budgetInfoProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  budgetInfoProgressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
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
    maxHeight: '50%',
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
  modalOptionLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
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

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F59E0B15',
    borderRadius: 14,
    padding: 16,
    marginTop: -8,
    marginBottom: 8,
    gap: 12,
  },
  warningCardText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },

  // Allocation Edit Card
  allocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  allocationCardWarning: {
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  allocationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  allocationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  allocationInfo: {
    flex: 1,
  },
  allocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  allocationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  allocationSpent: {
    fontSize: 13,
    color: '#8E8E93',
  },
  allocationUtilization: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
    maxWidth: 80,
  },
  allocationUtilizationBar: {
    height: '100%',
    borderRadius: 2,
  },
  allocationRemove: {
    padding: 4,
  },
  allocationEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  allocationCurrentAmount: {
    alignItems: 'center',
  },
  allocationCurrentLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  allocationCurrentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  allocationNewAmount: {
    flex: 1,
  },
  allocationNewLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  allocationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  allocationInputWrapperError: {
    backgroundColor: '#DC262615',
    borderWidth: 1,
    borderColor: '#DC2626',
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
  },
  allocationDifference: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  allocationDifferenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  allocationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  allocationWarningText: {
    fontSize: 13,
    color: '#DC2626',
  },

  // Add Category Button
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 8,
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

  // Budget Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 8,
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
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryDifference: {
    fontSize: 13,
    fontWeight: '600',
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
    borderRadius: 4,
  },
  summaryProgressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 6,
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