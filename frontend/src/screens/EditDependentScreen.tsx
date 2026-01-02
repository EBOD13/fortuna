// src/screens/EditDependentScreen.tsx
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
  Image,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

// ============ TYPES ============
type RelationshipType = 
  | 'child' 
  | 'spouse' 
  | 'parent' 
  | 'sibling' 
  | 'pet' 
  | 'other';

type DependentStatus = 'active' | 'inactive';

type ExpenseCategory = 
  | 'education' 
  | 'healthcare' 
  | 'childcare' 
  | 'activities' 
  | 'clothing' 
  | 'food' 
  | 'transportation' 
  | 'entertainment' 
  | 'pet_care' 
  | 'other';

type AttachedExpense = {
  expense_id: string;
  expense_name: string;
  category: ExpenseCategory;
  amount: number;
  frequency: 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  is_recurring: boolean;
  start_date: string;
  end_date?: string;
  notes?: string;
  is_shared: boolean;
  share_percentage?: number;
};

type Dependent = {
  dependent_id: string;
  name: string;
  relationship: RelationshipType;
  date_of_birth?: string;
  photo_url?: string;
  is_shared_custody: boolean;
  custody_percentage?: number;
  status: DependentStatus;
  notes?: string;
  attached_expenses: AttachedExpense[];
  created_at: string;
  updated_at: string;
  monthly_total: number;
  yearly_total: number;
};

// ============ CONFIG ============
const relationshipConfig: Record<RelationshipType, { icon: string; color: string; label: string }> = {
  child: { icon: 'figure.and.child.holdinghands', color: '#2563EB', label: 'Child' },
  spouse: { icon: 'heart.fill', color: '#EC4899', label: 'Spouse/Partner' },
  parent: { icon: 'figure.stand', color: '#7C3AED', label: 'Parent' },
  sibling: { icon: 'person.2.fill', color: '#0891B2', label: 'Sibling' },
  pet: { icon: 'pawprint.fill', color: '#F59E0B', label: 'Pet' },
  other: { icon: 'person.fill', color: '#6B7280', label: 'Other' },
};

const relationshipTypes: RelationshipType[] = ['child', 'spouse', 'parent', 'sibling', 'pet', 'other'];

const expenseCategoryConfig: Record<ExpenseCategory, { icon: string; color: string; label: string }> = {
  education: { icon: 'book.fill', color: '#2563EB', label: 'Education' },
  healthcare: { icon: 'cross.case.fill', color: '#DC2626', label: 'Healthcare' },
  childcare: { icon: 'figure.and.child.holdinghands', color: '#7C3AED', label: 'Childcare' },
  activities: { icon: 'sportscourt.fill', color: '#046C4E', label: 'Activities' },
  clothing: { icon: 'tshirt.fill', color: '#EC4899', label: 'Clothing' },
  food: { icon: 'fork.knife', color: '#F59E0B', label: 'Food' },
  transportation: { icon: 'car.fill', color: '#0891B2', label: 'Transportation' },
  entertainment: { icon: 'gamecontroller.fill', color: '#8B5CF6', label: 'Entertainment' },
  pet_care: { icon: 'pawprint.fill', color: '#F97316', label: 'Pet Care' },
  other: { icon: 'ellipsis.circle.fill', color: '#6B7280', label: 'Other' },
};

const expenseCategories: ExpenseCategory[] = [
  'education', 'healthcare', 'childcare', 'activities', 
  'clothing', 'food', 'transportation', 'entertainment', 'pet_care', 'other'
];

const frequencyLabels: Record<string, string> = {
  'one-time': 'One-time',
  'weekly': 'Weekly',
  'monthly': 'Monthly',
  'quarterly': 'Quarterly',
  'yearly': 'Yearly',
};

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
      <Text style={styles.headerTitle}>Edit Dependent</Text>
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
  rightElement?: React.ReactNode;
};

const SectionHeader = ({ title, icon, color, rightElement }: SectionHeaderProps) => (
  <View style={styles.sectionHeaderRow}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionHeaderIcon, { backgroundColor: color + '15' }]}>
        <SFSymbol name={icon} size={16} color={color} />
      </View>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
    {rightElement}
  </View>
);

// ============ DROPDOWN COMPONENT ============
type DropdownOption = {
  value: string;
  label: string;
  icon?: string;
  color?: string;
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
                  <Text style={styles.modalOptionText}>{item.label}</Text>
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

// ============ EXPENSE CARD ============
type ExpenseCardProps = {
  expense: AttachedExpense;
  onUpdate: (expense: AttachedExpense) => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
};

const ExpenseCard = ({ expense, onUpdate, onDelete, onToggleExpand, isExpanded }: ExpenseCardProps) => {
  const config = expenseCategoryConfig[expense.category];
  
  const getMonthlyAmount = () => {
    switch (expense.frequency) {
      case 'weekly': return expense.amount * 4.33;
      case 'monthly': return expense.amount;
      case 'quarterly': return expense.amount / 3;
      case 'yearly': return expense.amount / 12;
      case 'one-time': return 0;
      default: return expense.amount;
    }
  };

  return (
    <View style={styles.expenseCard}>
      <TouchableOpacity style={styles.expenseCardHeader} onPress={onToggleExpand}>
        <View style={[styles.expenseIcon, { backgroundColor: config.color + '15' }]}>
          <SFSymbol name={config.icon} size={18} color={config.color} />
        </View>
        <View style={styles.expenseHeaderInfo}>
          <Text style={styles.expenseName} numberOfLines={1}>
            {expense.expense_name || 'Untitled Expense'}
          </Text>
          <View style={styles.expenseHeaderMeta}>
            <Text style={styles.expenseAmount}>${expense.amount.toLocaleString()}</Text>
            <Text style={styles.expenseFrequency}>/{frequencyLabels[expense.frequency]}</Text>
            {expense.is_recurring && (
              <View style={styles.recurringBadge}>
                <SFSymbol name="repeat" size={10} color="#7C3AED" />
              </View>
            )}
          </View>
        </View>
        <View style={styles.expenseHeaderRight}>
          <SFSymbol 
            name={isExpanded ? "chevron.up" : "chevron.down"} 
            size={16} 
            color="#8E8E93" 
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expenseCardBody}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expense Name</Text>
            <TextInput
              style={styles.input}
              value={expense.expense_name}
              onChangeText={(text) => onUpdate({ ...expense, expense_name: text })}
              placeholder="e.g., Tuition, Daycare, Vet Visits"
            />
          </View>

          <Dropdown
            label="Category"
            value={expense.category}
            options={expenseCategories.map(cat => ({
              value: cat,
              label: expenseCategoryConfig[cat].label,
              icon: expenseCategoryConfig[cat].icon,
              color: expenseCategoryConfig[cat].color,
            }))}
            onSelect={(val) => onUpdate({ ...expense, category: val as ExpenseCategory })}
          />

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={[styles.input, styles.inputWithPrefixField]}
                  value={expense.amount > 0 ? expense.amount.toString() : ''}
                  onChangeText={(text) => onUpdate({ ...expense, amount: parseFloat(text) || 0 })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <TouchableOpacity 
                style={styles.frequencyButton}
                onPress={() => {
                  const frequencies = ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'];
                  const currentIndex = frequencies.indexOf(expense.frequency);
                  const nextIndex = (currentIndex + 1) % frequencies.length;
                  onUpdate({ ...expense, frequency: frequencies[nextIndex] as any });
                }}
              >
                <Text style={styles.frequencyButtonText}>
                  {frequencyLabels[expense.frequency]}
                </Text>
                <SFSymbol name="chevron.down" size={12} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>

          {expense.frequency !== 'one-time' && (
            <View style={styles.monthlyEstimate}>
              <SFSymbol name="calendar" size={14} color="#046C4E" />
              <Text style={styles.monthlyEstimateText}>
                Monthly: <Text style={styles.monthlyEstimateValue}>${getMonthlyAmount().toFixed(2)}</Text>
              </Text>
            </View>
          )}

          {/* Toggles */}
          <View style={styles.expenseToggles}>
            <TouchableOpacity
              style={[styles.toggleChip, expense.is_recurring && styles.toggleChipActive]}
              onPress={() => onUpdate({ ...expense, is_recurring: !expense.is_recurring })}
            >
              <SFSymbol 
                name="repeat" 
                size={14} 
                color={expense.is_recurring ? '#7C3AED' : '#8E8E93'} 
              />
              <Text style={[
                styles.toggleChipText,
                expense.is_recurring && styles.toggleChipTextActive
              ]}>
                Recurring
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleChip, expense.is_shared && styles.toggleChipActiveGreen]}
              onPress={() => onUpdate({ ...expense, is_shared: !expense.is_shared })}
            >
              <SFSymbol 
                name="person.2.fill" 
                size={14} 
                color={expense.is_shared ? '#046C4E' : '#8E8E93'} 
              />
              <Text style={[
                styles.toggleChipText,
                expense.is_shared && styles.toggleChipTextActiveGreen
              ]}>
                Shared Cost
              </Text>
            </TouchableOpacity>
          </View>

          {expense.is_shared && (
            <View style={styles.sharePercentageContainer}>
              <Text style={styles.inputLabel}>Your Share Percentage</Text>
              <View style={styles.percentageRow}>
                <View style={styles.percentageSliderContainer}>
                  <View style={styles.percentageSliderTrack}>
                    <View 
                      style={[
                        styles.percentageSliderFill, 
                        { width: `${expense.share_percentage || 50}%` }
                      ]} 
                    />
                  </View>
                </View>
                <View style={styles.percentageInputContainer}>
                  <TextInput
                    style={styles.percentageInput}
                    value={(expense.share_percentage || 50).toString()}
                    onChangeText={(text) => {
                      const val = Math.min(100, Math.max(0, parseFloat(text) || 0));
                      onUpdate({ ...expense, share_percentage: val });
                    }}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.percentageSymbol}>%</Text>
                </View>
              </View>
              <Text style={styles.shareAmountText}>
                Your portion: ${((expense.amount * (expense.share_percentage || 50)) / 100).toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={expense.notes || ''}
              onChangeText={(text) => onUpdate({ ...expense, notes: text })}
              placeholder="Add notes about this expense..."
              multiline
              numberOfLines={2}
            />
          </View>

          <TouchableOpacity style={styles.deleteExpenseButton} onPress={onDelete}>
            <SFSymbol name="trash" size={16} color="#DC2626" />
            <Text style={styles.deleteExpenseButtonText}>Remove Expense</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function EditDependentScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditDependentScreen'>>();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalDependent, setOriginalDependent] = useState<Dependent | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('child');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSharedCustody, setIsSharedCustody] = useState(false);
  const [custodyPercentage, setCustodyPercentage] = useState('50');
  const [status, setStatus] = useState<DependentStatus>('active');
  const [notes, setNotes] = useState('');
  const [attachedExpenses, setAttachedExpenses] = useState<AttachedExpense[]>([]);

  useEffect(() => {
    fetchDependent();
  }, []);

  const fetchDependent = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      
      // Mock dependent data
      const mockDependent: Dependent = {
        dependent_id: route.params?.dependentId || '1',
        name: 'Emma',
        relationship: 'child',
        date_of_birth: '03/15/2018',
        photo_url: '',
        is_shared_custody: true,
        custody_percentage: 60,
        status: 'active',
        notes: 'Primary custody. Shares weekends with co-parent.',
        attached_expenses: [
          {
            expense_id: '1',
            expense_name: 'Preschool Tuition',
            category: 'education',
            amount: 1200,
            frequency: 'monthly',
            is_recurring: true,
            start_date: '09/01/2024',
            is_shared: true,
            share_percentage: 60,
          },
          {
            expense_id: '2',
            expense_name: 'Dance Classes',
            category: 'activities',
            amount: 150,
            frequency: 'monthly',
            is_recurring: true,
            start_date: '01/15/2024',
            is_shared: false,
          },
          {
            expense_id: '3',
            expense_name: 'Pediatrician Visits',
            category: 'healthcare',
            amount: 200,
            frequency: 'quarterly',
            is_recurring: true,
            start_date: '01/01/2024',
            is_shared: true,
            share_percentage: 50,
            notes: 'Insurance covers most, this is copays',
          },
          {
            expense_id: '4',
            expense_name: 'Winter Clothes',
            category: 'clothing',
            amount: 350,
            frequency: 'one-time',
            is_recurring: false,
            start_date: '11/01/2024',
            is_shared: true,
            share_percentage: 60,
          },
        ],
        created_at: '01/15/2024',
        updated_at: '01/10/2025',
        monthly_total: 1450,
        yearly_total: 17400,
      };

      setOriginalDependent(mockDependent);
      
      // Populate form
      setName(mockDependent.name);
      setRelationship(mockDependent.relationship);
      setDateOfBirth(mockDependent.date_of_birth || '');
      setPhotoUrl(mockDependent.photo_url || '');
      setIsSharedCustody(mockDependent.is_shared_custody);
      setCustodyPercentage((mockDependent.custody_percentage || 50).toString());
      setStatus(mockDependent.status);
      setNotes(mockDependent.notes || '');
      setAttachedExpenses(mockDependent.attached_expenses);

    } catch (error) {
      console.error('Error fetching dependent:', error);
      Alert.alert('Error', 'Failed to load dependent details');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = (): boolean => {
    if (!originalDependent) return false;
    
    return (
      name !== originalDependent.name ||
      relationship !== originalDependent.relationship ||
      dateOfBirth !== (originalDependent.date_of_birth || '') ||
      photoUrl !== (originalDependent.photo_url || '') ||
      isSharedCustody !== originalDependent.is_shared_custody ||
      custodyPercentage !== (originalDependent.custody_percentage || 50).toString() ||
      status !== originalDependent.status ||
      notes !== (originalDependent.notes || '') ||
      JSON.stringify(attachedExpenses) !== JSON.stringify(originalDependent.attached_expenses)
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
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a name.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 800));

      // Prepare updated dependent data
      const updatedDependent = {
        dependent_id: originalDependent?.dependent_id,
        name: name.trim(),
        relationship: relationship,
        date_of_birth: dateOfBirth || undefined,
        photo_url: photoUrl || undefined,
        is_shared_custody: isSharedCustody,
        custody_percentage: isSharedCustody ? parseFloat(custodyPercentage) || 50 : undefined,
        status: status,
        notes: notes.trim() || undefined,
        attached_expenses: attachedExpenses.filter(e => e.expense_name.trim()),
      };

      console.log('Saving dependent:', updatedDependent);

      Alert.alert('Success', 'Dependent updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error('Error saving dependent:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addExpense = () => {
    const newExpense: AttachedExpense = {
      expense_id: `new_${Date.now()}`,
      expense_name: '',
      category: 'other',
      amount: 0,
      frequency: 'monthly',
      is_recurring: true,
      start_date: new Date().toLocaleDateString('en-US'),
      is_shared: isSharedCustody,
      share_percentage: isSharedCustody ? parseFloat(custodyPercentage) || 50 : undefined,
    };
    setAttachedExpenses([...attachedExpenses, newExpense]);
    setExpandedExpenseId(newExpense.expense_id);
  };

  const updateExpense = (index: number, updated: AttachedExpense) => {
    const newExpenses = [...attachedExpenses];
    newExpenses[index] = updated;
    setAttachedExpenses(newExpenses);
  };

  const deleteExpense = (index: number) => {
    const expense = attachedExpenses[index];
    Alert.alert(
      'Remove Expense',
      `Are you sure you want to remove "${expense.expense_name || 'this expense'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const newExpenses = attachedExpenses.filter((_, i) => i !== index);
            setAttachedExpenses(newExpenses);
            if (expandedExpenseId === expense.expense_id) {
              setExpandedExpenseId(null);
            }
          }
        },
      ]
    );
  };

  // Calculate totals
  const calculateMonthlyTotal = () => {
    return attachedExpenses.reduce((total, exp) => {
      let monthlyAmount = 0;
      switch (exp.frequency) {
        case 'weekly': monthlyAmount = exp.amount * 4.33; break;
        case 'monthly': monthlyAmount = exp.amount; break;
        case 'quarterly': monthlyAmount = exp.amount / 3; break;
        case 'yearly': monthlyAmount = exp.amount / 12; break;
        default: monthlyAmount = 0;
      }
      
      if (exp.is_shared && exp.share_percentage) {
        monthlyAmount = (monthlyAmount * exp.share_percentage) / 100;
      }
      
      return total + monthlyAmount;
    }, 0);
  };

  const monthlyTotal = calculateMonthlyTotal();
  const yearlyTotal = monthlyTotal * 12;
  const config = relationshipConfig[relationship];

  if (loading) {
    return (
      <View style={styles.container}>
        <Header onCancel={handleCancel} onSave={handleSave} isSaving={false} hasChanges={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Loading dependent...</Text>
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
            <View style={[styles.previewAvatar, { backgroundColor: config.color + '20' }]}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.previewAvatarImage} />
              ) : (
                <Text style={[styles.previewAvatarText, { color: config.color }]}>
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </Text>
              )}
            </View>
            <Text style={styles.previewName}>{name || 'Dependent Name'}</Text>
            <View style={[styles.previewRelationshipBadge, { backgroundColor: config.color + '20' }]}>
              <SFSymbol name={config.icon} size={14} color={config.color} />
              <Text style={[styles.previewRelationshipText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
            
            <View style={styles.previewTotals}>
              <View style={styles.previewTotalItem}>
                <Text style={styles.previewTotalValue}>${monthlyTotal.toFixed(0)}</Text>
                <Text style={styles.previewTotalLabel}>Monthly</Text>
              </View>
              <View style={styles.previewTotalDivider} />
              <View style={styles.previewTotalItem}>
                <Text style={styles.previewTotalValue}>${yearlyTotal.toFixed(0)}</Text>
                <Text style={styles.previewTotalLabel}>Yearly</Text>
              </View>
              <View style={styles.previewTotalDivider} />
              <View style={styles.previewTotalItem}>
                <Text style={styles.previewTotalValue}>{attachedExpenses.length}</Text>
                <Text style={styles.previewTotalLabel}>Expenses</Text>
              </View>
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <SectionHeader title="BASIC INFORMATION" icon="person.fill" color="#2563EB" />
            
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter name"
                />
              </View>

              <Dropdown
                label="Relationship"
                value={relationship}
                options={relationshipTypes.map(type => ({
                  value: type,
                  label: relationshipConfig[type].label,
                  icon: relationshipConfig[type].icon,
                  color: relationshipConfig[type].color,
                }))}
                onSelect={(val) => setRelationship(val as RelationshipType)}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="MM/DD/YYYY"
                />
              </View>

              {/* Status Toggle */}
              <View style={styles.statusContainer}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.statusToggles}>
                  <TouchableOpacity
                    style={[
                      styles.statusToggle,
                      status === 'active' && styles.statusToggleActive
                    ]}
                    onPress={() => setStatus('active')}
                  >
                    <SFSymbol 
                      name="checkmark.circle.fill" 
                      size={16} 
                      color={status === 'active' ? '#046C4E' : '#8E8E93'} 
                    />
                    <Text style={[
                      styles.statusToggleText,
                      status === 'active' && styles.statusToggleTextActive
                    ]}>
                      Active
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusToggle,
                      status === 'inactive' && styles.statusToggleInactive
                    ]}
                    onPress={() => setStatus('inactive')}
                  >
                    <SFSymbol 
                      name="pause.circle.fill" 
                      size={16} 
                      color={status === 'inactive' ? '#F59E0B' : '#8E8E93'} 
                    />
                    <Text style={[
                      styles.statusToggleText,
                      status === 'inactive' && styles.statusToggleTextInactive
                    ]}>
                      Inactive
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Shared Custody */}
          {(relationship === 'child' || relationship === 'pet') && (
            <View style={styles.section}>
              <SectionHeader title="CUSTODY & SHARING" icon="person.2.fill" color="#7C3AED" />
              
              <View style={styles.card}>
                <TouchableOpacity
                  style={[styles.sharedCustodyToggle, isSharedCustody && styles.sharedCustodyToggleActive]}
                  onPress={() => setIsSharedCustody(!isSharedCustody)}
                >
                  <View style={[
                    styles.sharedCustodyIcon,
                    isSharedCustody && styles.sharedCustodyIconActive
                  ]}>
                    <SFSymbol 
                      name="person.2.fill" 
                      size={20} 
                      color={isSharedCustody ? '#FFFFFF' : '#8E8E93'} 
                    />
                  </View>
                  <View style={styles.sharedCustodyInfo}>
                    <Text style={[
                      styles.sharedCustodyTitle,
                      isSharedCustody && styles.sharedCustodyTitleActive
                    ]}>
                      Shared Custody
                    </Text>
                    <Text style={styles.sharedCustodySubtitle}>
                      Split expenses with co-parent
                    </Text>
                  </View>
                  <View style={[
                    styles.sharedCustodyCheck,
                    isSharedCustody && styles.sharedCustodyCheckActive
                  ]}>
                    {isSharedCustody && (
                      <SFSymbol name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>

                {isSharedCustody && (
                  <View style={styles.custodyPercentageContainer}>
                    <Text style={styles.inputLabel}>Your Custody Percentage</Text>
                    <View style={styles.percentageRow}>
                      <View style={styles.percentageSliderContainer}>
                        <View style={styles.percentageSliderTrack}>
                          <View 
                            style={[
                              styles.percentageSliderFill, 
                              { width: `${parseFloat(custodyPercentage) || 50}%` }
                            ]} 
                          />
                        </View>
                        <View style={styles.percentageMarkers}>
                          <Text style={styles.percentageMarker}>0%</Text>
                          <Text style={styles.percentageMarker}>50%</Text>
                          <Text style={styles.percentageMarker}>100%</Text>
                        </View>
                      </View>
                      <View style={styles.percentageInputContainer}>
                        <TextInput
                          style={styles.percentageInput}
                          value={custodyPercentage}
                          onChangeText={(text) => {
                            const val = Math.min(100, Math.max(0, parseFloat(text) || 0));
                            setCustodyPercentage(val.toString());
                          }}
                          keyboardType="number-pad"
                        />
                        <Text style={styles.percentageSymbol}>%</Text>
                      </View>
                    </View>
                    <Text style={styles.custodyNote}>
                      This percentage will be used as default for new shared expenses
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Attached Expenses */}
          <View style={styles.section}>
            <SectionHeader 
              title="ATTACHED EXPENSES" 
              icon="dollarsign.circle" 
              color="#046C4E"
              rightElement={
                <TouchableOpacity style={styles.addExpenseButton} onPress={addExpense}>
                  <SFSymbol name="plus" size={16} color="#046C4E" />
                  <Text style={styles.addExpenseText}>Add</Text>
                </TouchableOpacity>
              }
            />

            {attachedExpenses.length === 0 ? (
              <View style={styles.emptyExpenses}>
                <SFSymbol name="dollarsign.circle" size={40} color="#C7C7CC" />
                <Text style={styles.emptyExpensesText}>No expenses attached</Text>
                <Text style={styles.emptyExpensesSubtext}>
                  Add expenses to track costs for this dependent
                </Text>
                <TouchableOpacity style={styles.emptyAddButton} onPress={addExpense}>
                  <SFSymbol name="plus.circle.fill" size={18} color="#046C4E" />
                  <Text style={styles.emptyAddButtonText}>Add First Expense</Text>
                </TouchableOpacity>
              </View>
            ) : (
              attachedExpenses.map((expense, index) => (
                <ExpenseCard
                  key={expense.expense_id}
                  expense={expense}
                  onUpdate={(updated) => updateExpense(index, updated)}
                  onDelete={() => deleteExpense(index)}
                  onToggleExpand={() => {
                    setExpandedExpenseId(
                      expandedExpenseId === expense.expense_id ? null : expense.expense_id
                    );
                  }}
                  isExpanded={expandedExpenseId === expense.expense_id}
                />
              ))
            )}

            {attachedExpenses.length > 0 && (
              <View style={styles.expenseSummary}>
                <View style={styles.expenseSummaryRow}>
                  <Text style={styles.expenseSummaryLabel}>Monthly Total (Your Share)</Text>
                  <Text style={styles.expenseSummaryValue}>${monthlyTotal.toFixed(2)}</Text>
                </View>
                <View style={styles.expenseSummaryRow}>
                  <Text style={styles.expenseSummaryLabel}>Yearly Estimate</Text>
                  <Text style={styles.expenseSummaryValue}>${yearlyTotal.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <SectionHeader title="NOTES" icon="note.text" color="#6B7280" />
            
            <View style={styles.card}>
              <TextInput
                style={styles.notesInputLarge}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this dependent..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Meta Info */}
          {originalDependent && (
            <View style={styles.metaInfo}>
              <Text style={styles.metaText}>Added: {originalDependent.created_at}</Text>
              <Text style={styles.metaText}>Last updated: {originalDependent.updated_at}</Text>
            </View>
          )}

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={() => {
                Alert.alert(
                  'Delete Dependent',
                  `Are you sure you want to delete "${name}"? This will also remove all attached expenses. This action cannot be undone.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert('Deleted', 'Dependent has been deleted.', [
                          { text: 'OK', onPress: () => navigation.goBack() }
                        ]);
                      }
                    },
                  ]
                );
              }}
            >
              <SFSymbol name="trash" size={18} color="#DC2626" />
              <Text style={styles.dangerButtonText}>Delete Dependent</Text>
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
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  previewAvatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  previewName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  previewRelationshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 16,
  },
  previewRelationshipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewTotals: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 14,
    padding: 16,
    width: '100%',
  },
  previewTotalItem: {
    flex: 1,
    alignItems: 'center',
  },
  previewTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  previewTotalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  previewTotalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
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
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
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
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  notesInputLarge: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
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
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },

  // Status
  statusContainer: {
    marginBottom: 8,
  },
  statusToggles: {
    flexDirection: 'row',
    gap: 12,
  },
  statusToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  statusToggleActive: {
    backgroundColor: '#046C4E15',
    borderWidth: 1,
    borderColor: '#046C4E30',
  },
  statusToggleInactive: {
    backgroundColor: '#F59E0B15',
    borderWidth: 1,
    borderColor: '#F59E0B30',
  },
  statusToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  statusToggleTextActive: {
    color: '#046C4E',
  },
  statusToggleTextInactive: {
    color: '#F59E0B',
  },

  // Shared Custody
  sharedCustodyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sharedCustodyToggleActive: {
    backgroundColor: '#7C3AED10',
    borderWidth: 1,
    borderColor: '#7C3AED30',
  },
  sharedCustodyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sharedCustodyIconActive: {
    backgroundColor: '#7C3AED',
  },
  sharedCustodyInfo: {
    flex: 1,
  },
  sharedCustodyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  sharedCustodyTitleActive: {
    color: '#7C3AED',
  },
  sharedCustodySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  sharedCustodyCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedCustodyCheckActive: {
    backgroundColor: '#7C3AED',
  },
  custodyPercentageContainer: {
    marginTop: 4,
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  percentageSliderContainer: {
    flex: 1,
  },
  percentageSliderTrack: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  percentageSliderFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  percentageMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  percentageMarker: {
    fontSize: 10,
    color: '#8E8E93',
  },
  percentageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  percentageInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    width: 40,
    textAlign: 'center',
  },
  percentageSymbol: {
    fontSize: 16,
    color: '#8E8E93',
  },
  custodyNote: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // Expenses
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#046C4E15',
    borderRadius: 8,
  },
  addExpenseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#046C4E',
  },
  emptyExpenses: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    gap: 8,
  },
  emptyExpensesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  emptyExpensesSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#046C4E15',
    borderRadius: 10,
  },
  emptyAddButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#046C4E',
  },

  // Expense Card
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  expenseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseHeaderInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  expenseHeaderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#046C4E',
  },
  expenseFrequency: {
    fontSize: 12,
    color: '#8E8E93',
  },
  recurringBadge: {
    marginLeft: 8,
    backgroundColor: '#7C3AED15',
    padding: 4,
    borderRadius: 4,
  },
  expenseHeaderRight: {
    padding: 8,
  },
  expenseCardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    padding: 16,
  },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  frequencyButtonText: {
    fontSize: 16,
    color: '#000',
  },
  monthlyEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  monthlyEstimateText: {
    fontSize: 13,
    color: '#046C4E',
  },
  monthlyEstimateValue: {
    fontWeight: '700',
  },
  expenseToggles: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  toggleChipActive: {
    backgroundColor: '#7C3AED15',
    borderWidth: 1,
    borderColor: '#7C3AED30',
  },
  toggleChipActiveGreen: {
    backgroundColor: '#046C4E15',
    borderWidth: 1,
    borderColor: '#046C4E30',
  },
  toggleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  toggleChipTextActive: {
    color: '#7C3AED',
  },
  toggleChipTextActiveGreen: {
    color: '#046C4E',
  },
  sharePercentageContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  shareAmountText: {
    fontSize: 13,
    color: '#046C4E',
    fontWeight: '600',
    marginTop: 8,
  },
  deleteExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginTop: 8,
  },
  deleteExpenseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Expense Summary
  expenseSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
  },
  expenseSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expenseSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  expenseSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
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