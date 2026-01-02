// src/screens/DependentDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import ExpenseCard, { 
  Expense as CardExpense, 
  ExpenseCategory as CardExpenseCategory 
} from '../components/cards/ExpenseCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TYPES ============
type DependentType = 'child' | 'spouse' | 'parent' | 'sibling' | 'pet' | 'other';

type ExpenseCategory = {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  total_amount: number;
  percentage: number;
};

type Expense = {
  expense_id: string;
  description: string;
  amount: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  date: string;
  is_recurring: boolean;
  notes?: string;
};

type MonthlySpending = {
  month: string;
  amount: number;
};

type Dependent = {
  dependent_id: string;
  name: string;
  relationship: DependentType;
  birth_date?: string;
  age?: number;
  monthly_allowance?: number;
  school_name?: string;
  grade_level?: string;
  medical_info?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Stats
  total_expenses: number;
  expenses_this_month: number;
  expenses_last_month: number;
  average_monthly: number;
  expense_categories: ExpenseCategory[];
  recent_expenses: Expense[];
  monthly_spending: MonthlySpending[];
};

// ============ RELATIONSHIP CONFIG ============
const relationshipConfig: Record<DependentType, { icon: string; color: string; label: string }> = {
  child: { icon: 'figure.and.child.holdinghands', color: '#2563EB', label: 'Child' },
  spouse: { icon: 'heart.fill', color: '#EC4899', label: 'Spouse' },
  parent: { icon: 'figure.stand', color: '#7C3AED', label: 'Parent' },
  sibling: { icon: 'person.2.fill', color: '#F59E0B', label: 'Sibling' },
  pet: { icon: 'pawprint.fill', color: '#046C4E', label: 'Pet' },
  other: { icon: 'person.fill', color: '#6B7280', label: 'Other' },
};

// ============ HEADER ============
type HeaderProps = {
  dependent: Dependent | null;
  isEditing: boolean;
  onEdit: () => void;
  onFullEdit: () => void;
  onAddExpense: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

const Header = ({ dependent, isEditing, onEdit, onFullEdit, onAddExpense, onSave, onCancel, onDelete }: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity 
        style={styles.headerButton} 
        onPress={() => isEditing ? onCancel() : navigation.goBack()}
      >
        <SFSymbol name={isEditing ? "xmark" : "chevron.left"} size={20} color="#000" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>
        {isEditing ? 'Edit Dependent' : 'Dependent Details'}
      </Text>
      
      {isEditing ? (
        <TouchableOpacity style={styles.headerButtonSave} onPress={onSave}>
          <Text style={styles.headerButtonSaveText}>Save</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => setShowMenu(!showMenu)}
        >
          <SFSymbol name="ellipsis" size={20} color="#000" />
        </TouchableOpacity>
      )}

      {showMenu && !isEditing && (
        <View style={[styles.menuDropdown, { top: insets.top + 56 }]}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { setShowMenu(false); onEdit(); }}
          >
            <SFSymbol name="pencil" size={18} color="#000" />
            <Text style={styles.menuItemText}>Quick Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { setShowMenu(false); onFullEdit(); }}
          >
            <SFSymbol name="slider.horizontal.3" size={18} color="#000" />
            <Text style={styles.menuItemText}>Full Edit & Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { setShowMenu(false); onAddExpense(); }}
          >
            <SFSymbol name="plus.circle" size={18} color="#046C4E" />
            <Text style={[styles.menuItemText, { color: '#046C4E' }]}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, styles.menuItemDanger]} 
            onPress={() => { setShowMenu(false); onDelete(); }}
          >
            <SFSymbol name="trash" size={18} color="#DC2626" />
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============ STAT CARD ============
type StatCardProps = {
  icon: string;
  color: string;
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
};

const StatCard = ({ icon, color, label, value, subtitle, trend, trendValue }: StatCardProps) => (
  <View style={styles.statCard}>
    <View style={[styles.statCardIcon, { backgroundColor: color + '15' }]}>
      <SFSymbol name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statCardLabel}>{label}</Text>
    <Text style={styles.statCardValue}>{value}</Text>
    {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
    {trend && trendValue && (
      <View style={[
        styles.trendBadge,
        { backgroundColor: trend === 'up' ? '#DC262615' : trend === 'down' ? '#046C4E15' : '#6B728015' }
      ]}>
        <SFSymbol 
          name={trend === 'up' ? 'arrow.up.right' : trend === 'down' ? 'arrow.down.right' : 'minus'} 
          size={10} 
          color={trend === 'up' ? '#DC2626' : trend === 'down' ? '#046C4E' : '#6B7280'} 
        />
        <Text style={[
          styles.trendText,
          { color: trend === 'up' ? '#DC2626' : trend === 'down' ? '#046C4E' : '#6B7280' }
        ]}>
          {trendValue}
        </Text>
      </View>
    )}
  </View>
);

// ============ SECTION HEADER ============
type SectionHeaderProps = {
  title: string;
  icon: string;
  color: string;
  action?: { label: string; onPress: () => void };
};

const SectionHeader = ({ title, icon, color, action }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <View style={[styles.sectionHeaderIcon, { backgroundColor: color + '15' }]}>
        <SFSymbol name={icon} size={16} color={color} />
      </View>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
    </View>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={[styles.sectionHeaderAction, { color }]}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ============ EXPENSE CATEGORY CARD ============
type ExpenseCategoryCardProps = {
  category: ExpenseCategory;
  maxAmount: number;
};

const ExpenseCategoryCard = ({ category, maxAmount }: ExpenseCategoryCardProps) => {
  const barWidth = maxAmount > 0 ? (category.total_amount / maxAmount) * 100 : 0;
  
  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryCardLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
          <SFSymbol name={category.icon} size={18} color={category.color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.category_name}</Text>
          <View style={styles.categoryBarContainer}>
            <View 
              style={[
                styles.categoryBarFill, 
                { width: `${barWidth}%`, backgroundColor: category.color }
              ]} 
            />
          </View>
        </View>
      </View>
      <View style={styles.categoryCardRight}>
        <Text style={styles.categoryAmount}>${category.total_amount.toLocaleString()}</Text>
        <Text style={styles.categoryPercent}>{category.percentage.toFixed(0)}%</Text>
      </View>
    </View>
  );
};

// ============ EXPENSE ITEM (using ExpenseCard) ============
// Helper to convert local Expense to CardExpense format
const convertToCardExpense = (expense: Expense, dependentName: string): CardExpense => ({
  expense_id: expense.expense_id,
  amount: expense.amount,
  description: expense.description,
  category: (expense.category_name.toLowerCase().replace(/\s+/g, '_') as CardExpenseCategory) || 'other',
  date: expense.date,
  is_recurring: expense.is_recurring,
  notes: expense.notes,
  dependent_name: dependentName,
});

// ============ SPENDING CHART (Simplified Bar Chart) ============
type SpendingChartProps = {
  data: MonthlySpending[];
  color: string;
};

const SpendingChart = ({ data, color }: SpendingChartProps) => {
  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {data.map((item, index) => (
          <View key={index} style={styles.chartBarWrapper}>
            <View style={styles.chartBarBackground}>
              <View 
                style={[
                  styles.chartBar, 
                  { 
                    height: `${(item.amount / maxAmount) * 100}%`,
                    backgroundColor: index === data.length - 1 ? color : color + '60'
                  }
                ]} 
              />
            </View>
            <Text style={styles.chartBarLabel}>{item.month}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ============ EDIT FIELD ============
type EditFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  prefix?: string;
};

const EditField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder,
  keyboardType = 'default',
  multiline = false,
  prefix,
}: EditFieldProps) => (
  <View style={styles.editFieldContainer}>
    <Text style={styles.editFieldLabel}>{label}</Text>
    <View style={[styles.editFieldWrapper, multiline && styles.editFieldWrapperMultiline]}>
      {prefix && <Text style={styles.editFieldPrefix}>{prefix}</Text>}
      <TextInput
        style={[styles.editFieldInput, multiline && styles.editFieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  </View>
);

// ============ INFO ROW ============
type InfoRowProps = {
  icon: string;
  label: string;
  value: string;
  color?: string;
};

const InfoRow = ({ icon, label, value, color = '#8E8E93' }: InfoRowProps) => (
  <View style={styles.infoRow}>
    <View style={styles.infoRowLeft}>
      <SFSymbol name={icon} size={18} color={color} />
      <Text style={styles.infoRowLabel}>{label}</Text>
    </View>
    <Text style={styles.infoRowValue}>{value}</Text>
  </View>
);

// ============ MAIN COMPONENT ============
export default function DependentDetailScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'DependentDetailScreen'>>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dependent, setDependent] = useState<Dependent | null>(null);
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editAllowance, setEditAllowance] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editMedical, setEditMedical] = useState('');
  const [editNotes, setEditNotes] = useState('');

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
        birth_date: '03/15/2018',
        age: 6,
        monthly_allowance: 50,
        school_name: 'Lincoln Elementary School',
        grade_level: '1st Grade',
        medical_info: 'Mild peanut allergy. Carries EpiPen.',
        notes: 'Soccer practice on Tuesdays and Thursdays. Piano lessons on Saturdays.',
        is_active: true,
        created_at: '01/15/2024',
        updated_at: '12/20/2024',
        total_expenses: 8450,
        expenses_this_month: 425,
        expenses_last_month: 380,
        average_monthly: 390,
        expense_categories: [
          {
            category_id: '1',
            category_name: 'Education',
            icon: 'book.fill',
            color: '#2563EB',
            total_amount: 3200,
            percentage: 37.9,
          },
          {
            category_id: '2',
            category_name: 'Activities',
            icon: 'figure.run',
            color: '#046C4E',
            total_amount: 2100,
            percentage: 24.9,
          },
          {
            category_id: '3',
            category_name: 'Clothing',
            icon: 'tshirt.fill',
            color: '#EC4899',
            total_amount: 1450,
            percentage: 17.2,
          },
          {
            category_id: '4',
            category_name: 'Healthcare',
            icon: 'cross.case.fill',
            color: '#DC2626',
            total_amount: 950,
            percentage: 11.2,
          },
          {
            category_id: '5',
            category_name: 'Entertainment',
            icon: 'gamecontroller.fill',
            color: '#7C3AED',
            total_amount: 750,
            percentage: 8.9,
          },
        ],
        recent_expenses: [
          {
            expense_id: '1',
            description: 'Piano Lesson - December',
            amount: 120,
            category_name: 'Education',
            category_icon: 'book.fill',
            category_color: '#2563EB',
            date: '12/21/2024',
            is_recurring: true,
          },
          {
            expense_id: '2',
            description: 'Winter Jacket',
            amount: 85,
            category_name: 'Clothing',
            category_icon: 'tshirt.fill',
            category_color: '#EC4899',
            date: '12/18/2024',
            is_recurring: false,
            notes: 'From Gap Kids',
          },
          {
            expense_id: '3',
            description: 'Soccer Registration - Spring',
            amount: 150,
            category_name: 'Activities',
            category_icon: 'figure.run',
            category_color: '#046C4E',
            date: '12/15/2024',
            is_recurring: false,
          },
          {
            expense_id: '4',
            description: 'School Supplies',
            amount: 45,
            category_name: 'Education',
            category_icon: 'book.fill',
            category_color: '#2563EB',
            date: '12/10/2024',
            is_recurring: false,
          },
          {
            expense_id: '5',
            description: 'Pediatrician Visit - Checkup',
            amount: 25,
            category_name: 'Healthcare',
            category_icon: 'cross.case.fill',
            category_color: '#DC2626',
            date: '12/05/2024',
            is_recurring: false,
            notes: 'Copay only',
          },
        ],
        monthly_spending: [
          { month: 'Jul', amount: 320 },
          { month: 'Aug', amount: 580 },
          { month: 'Sep', amount: 420 },
          { month: 'Oct', amount: 350 },
          { month: 'Nov', amount: 380 },
          { month: 'Dec', amount: 425 },
        ],
      };

      setDependent(mockDependent);
      
      // Initialize edit fields
      setEditName(mockDependent.name);
      setEditBirthDate(mockDependent.birth_date || '');
      setEditAllowance(mockDependent.monthly_allowance?.toString() || '');
      setEditSchool(mockDependent.school_name || '');
      setEditGrade(mockDependent.grade_level || '');
      setEditMedical(mockDependent.medical_info || '');
      setEditNotes(mockDependent.notes || '');
    } catch (error) {
      console.error('Error fetching dependent:', error);
      Alert.alert('Error', 'Failed to load dependent details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleFullEdit = () => {
    navigation.navigate('EditDependentScreen', { dependentId: dependent?.dependent_id || '' });
  };

  const handleAddExpense = () => {
    navigation.navigate('AddExpenseScreen', { dependentId: dependent?.dependent_id });
  };

  const handleCancel = () => {
    // Reset to original values
    if (dependent) {
      setEditName(dependent.name);
      setEditBirthDate(dependent.birth_date || '');
      setEditAllowance(dependent.monthly_allowance?.toString() || '');
      setEditSchool(dependent.school_name || '');
      setEditGrade(dependent.grade_level || '');
      setEditMedical(dependent.medical_info || '');
      setEditNotes(dependent.notes || '');
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      // TODO: API call to update dependent
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      if (dependent) {
        setDependent({
          ...dependent,
          name: editName,
          birth_date: editBirthDate,
          monthly_allowance: parseFloat(editAllowance) || undefined,
          school_name: editSchool,
          grade_level: editGrade,
          medical_info: editMedical,
          notes: editNotes,
          updated_at: new Date().toLocaleDateString(),
        });
      }
      
      setIsEditing(false);
      Alert.alert('Success', 'Dependent updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update dependent');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Dependent',
      `Are you sure you want to delete ${dependent?.name}? This will also delete all associated expense records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            // TODO: API call to delete
            Alert.alert('Deleted', 'Dependent has been deleted.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        },
      ]
    );
  };

  const handleExpensePress = (expense: Expense) => {
    Alert.alert(
      expense.description,
      `Amount: $${expense.amount}\nCategory: ${expense.category_name}\nDate: ${expense.date}${expense.notes ? `\n\nNotes: ${expense.notes}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  const calculateTrend = () => {
    if (!dependent) return { trend: 'neutral' as const, value: '0%' };
    const diff = dependent.expenses_this_month - dependent.expenses_last_month;
    const percent = dependent.expenses_last_month > 0 
      ? Math.abs((diff / dependent.expenses_last_month) * 100).toFixed(0)
      : '0';
    if (diff > 0) return { trend: 'up' as const, value: `${percent}%` };
    if (diff < 0) return { trend: 'down' as const, value: `${percent}%` };
    return { trend: 'neutral' as const, value: '0%' };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          dependent={null} 
          isEditing={false}
          onEdit={handleEdit}
          onFullEdit={handleFullEdit}
          onAddExpense={handleAddExpense}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </View>
    );
  }

  if (!dependent) {
    return (
      <View style={styles.container}>
        <Header 
          dependent={null} 
          isEditing={false}
          onEdit={handleEdit}
          onFullEdit={handleFullEdit}
          onAddExpense={handleAddExpense}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
        <View style={styles.errorContainer}>
          <SFSymbol name="exclamationmark.triangle.fill" size={48} color="#DC2626" />
          <Text style={styles.errorText}>Dependent not found</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const config = relationshipConfig[dependent.relationship];
  const trend = calculateTrend();
  const maxCategoryAmount = Math.max(...dependent.expense_categories.map(c => c.total_amount), 1);

  // ============ EDIT MODE VIEW ============
  if (isEditing) {
    return (
      <View style={styles.container}>
        <Header 
          dependent={dependent} 
          isEditing={true}
          onEdit={handleEdit}
          onFullEdit={handleFullEdit}
          onAddExpense={handleAddExpense}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentEdit}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Preview */}
          <View style={styles.editProfilePreview}>
            <View style={[styles.avatarLarge, { backgroundColor: config.color + '20' }]}>
              <SFSymbol name={config.icon} size={40} color={config.color} />
            </View>
            <View style={[styles.relationshipBadge, { backgroundColor: config.color + '15' }]}>
              <Text style={[styles.relationshipText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>

          <EditField
            label="Name"
            value={editName}
            onChangeText={setEditName}
            placeholder="Enter name"
          />

          <EditField
            label="Birth Date"
            value={editBirthDate}
            onChangeText={setEditBirthDate}
            placeholder="MM/DD/YYYY"
          />

          <EditField
            label="Monthly Allowance"
            value={editAllowance}
            onChangeText={setEditAllowance}
            placeholder="0.00"
            keyboardType="numeric"
            prefix="$"
          />

          <EditField
            label="School Name"
            value={editSchool}
            onChangeText={setEditSchool}
            placeholder="Enter school name"
          />

          <EditField
            label="Grade Level"
            value={editGrade}
            onChangeText={setEditGrade}
            placeholder="e.g., 1st Grade"
          />

          <EditField
            label="Medical Information"
            value={editMedical}
            onChangeText={setEditMedical}
            placeholder="Allergies, medications, etc."
            multiline
          />

          <EditField
            label="Notes"
            value={editNotes}
            onChangeText={setEditNotes}
            placeholder="Activities, schedules, etc."
            multiline
          />

          <View style={styles.bottomSpacerEdit} />
        </ScrollView>

        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </View>
    );
  }

  // ============ VIEW MODE ============
  return (
    <View style={styles.container}>
      <Header 
        dependent={dependent} 
        isEditing={false}
        onEdit={handleEdit}
        onFullEdit={handleFullEdit}
        onAddExpense={handleAddExpense}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: config.color + '10' }]}>
          <View style={[styles.avatarLarge, { backgroundColor: config.color + '20' }]}>
            <SFSymbol name={config.icon} size={48} color={config.color} />
          </View>
          
          <Text style={styles.dependentName}>{dependent.name}</Text>
          
          <View style={[styles.relationshipBadge, { backgroundColor: config.color + '15' }]}>
            <Text style={[styles.relationshipText, { color: config.color }]}>{config.label}</Text>
          </View>

          {dependent.age && (
            <Text style={styles.ageText}>{dependent.age} years old</Text>
          )}

          {!dependent.is_active && (
            <View style={styles.inactiveBanner}>
              <SFSymbol name="exclamationmark.circle.fill" size={16} color="#F59E0B" />
              <Text style={styles.inactiveBannerText}>Inactive</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="dollarsign.circle.fill"
            color="#046C4E"
            label="This Month"
            value={`$${dependent.expenses_this_month.toLocaleString()}`}
            trend={trend.trend}
            trendValue={trend.value}
          />
          <StatCard
            icon="chart.bar.fill"
            color="#2563EB"
            label="Total Spent"
            value={`$${dependent.total_expenses.toLocaleString()}`}
            subtitle="all time"
          />
          <StatCard
            icon="calendar"
            color="#7C3AED"
            label="Monthly Avg"
            value={`$${dependent.average_monthly.toLocaleString()}`}
          />
          <StatCard
            icon="banknote.fill"
            color="#F59E0B"
            label="Allowance"
            value={dependent.monthly_allowance ? `$${dependent.monthly_allowance}` : 'None'}
            subtitle="per month"
          />
        </View>

        {/* Spending Trend */}
        <SectionHeader
          title="Spending Trend"
          icon="chart.line.uptrend.xyaxis"
          color={config.color}
          action={{ label: 'Details', onPress: () => {} }}
        />
        <View style={styles.chartCard}>
          <SpendingChart data={dependent.monthly_spending} color={config.color} />
        </View>

        {/* Expense Breakdown */}
        <SectionHeader
          title="Expense Breakdown"
          icon="chart.pie.fill"
          color={config.color}
        />
        <View style={styles.categoriesContainer}>
          {dependent.expense_categories.map((category) => (
            <ExpenseCategoryCard
              key={category.category_id}
              category={category}
              maxAmount={maxCategoryAmount}
            />
          ))}
        </View>

        {/* Recent Expenses */}
        <SectionHeader
          title="Recent Expenses"
          icon="clock.fill"
          color={config.color}
          action={{ label: 'See All', onPress: () => {} }}
        />
        <View style={styles.expensesContainer}>
          {dependent.recent_expenses.map((expense) => (
            <ExpenseCard
              key={expense.expense_id}
              expense={convertToCardExpense(expense, dependent.name)}
              variant="compact"
              showEmotions={false}
              onPress={() => handleExpensePress(expense)}
            />
          ))}
        </View>

        {/* Details Section */}
        <SectionHeader
          title="Details"
          icon="info.circle.fill"
          color="#6B7280"
        />
        <View style={styles.detailsCard}>
          {dependent.birth_date && (
            <InfoRow icon="calendar" label="Birth Date" value={dependent.birth_date} />
          )}
          {dependent.school_name && (
            <InfoRow icon="building.2.fill" label="School" value={dependent.school_name} />
          )}
          {dependent.grade_level && (
            <InfoRow icon="book.fill" label="Grade" value={dependent.grade_level} />
          )}
          {dependent.medical_info && (
            <InfoRow 
              icon="cross.case.fill" 
              label="Medical" 
              value={dependent.medical_info} 
              color="#DC2626"
            />
          )}
        </View>

        {/* Notes */}
        {dependent.notes && (
          <>
            <SectionHeader
              title="Notes"
              icon="note.text"
              color="#6B7280"
            />
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{dependent.notes}</Text>
            </View>
          </>
        )}

        {/* Meta Info */}
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>Added: {dependent.created_at}</Text>
          <Text style={styles.metaText}>Last updated: {dependent.updated_at}</Text>
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
  headerButtonSave: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#046C4E',
    borderRadius: 20,
  },
  headerButtonSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    minWidth: 160,
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
  scrollContentEdit: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dependentName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  relationshipBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  relationshipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ageText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  inactiveBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statCardLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  statCardSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
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
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sectionHeaderAction: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Chart
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  chartContainer: {
    height: 140,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarBackground: {
    width: 24,
    height: 100,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: 12,
  },
  chartBarLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 8,
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  categoryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  categoryBarContainer: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryCardRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  categoryPercent: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Expenses
  expensesContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  expenseCategory: {
    fontSize: 13,
    color: '#8E8E93',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  recurringText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  expenseRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  expenseDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Details Card
  detailsCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoRowValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  // Notes
  notesCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  notesText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },

  // Meta Info
  metaInfo: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Edit Mode
  editProfilePreview: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  editFieldContainer: {
    marginBottom: 20,
  },
  editFieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  editFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  editFieldWrapperMultiline: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  editFieldPrefix: {
    fontSize: 17,
    color: '#8E8E93',
    marginRight: 4,
  },
  editFieldInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  editFieldInputMultiline: {
    height: '100%',
  },
  bottomSpacerEdit: {
    height: 40,
  },

  // Saving Overlay
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  savingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Bottom
  bottomSpacer: {
    height: 40,
  },
});