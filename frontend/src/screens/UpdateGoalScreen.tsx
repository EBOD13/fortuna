// src/screens/UpdateGoalScreen.tsx
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
type GoalType = 'savings' | 'emergency' | 'investment' | 'debt_payoff' | 'purchase' | 'retirement' | 'education' | 'travel' | 'other';
type GoalStatus = 'active' | 'paused' | 'completed';

type Milestone = {
  milestone_id: string;
  milestone_name: string;
  target_amount: number;
  target_date: string;
  achieved_date?: string;
  is_achieved: boolean;
};

type Goal = {
  goal_id: string;
  goal_name: string;
  goal_type: GoalType;
  target_amount: number;
  current_amount: number;
  deadline_date?: string;
  priority_level: number;
  is_mandatory: boolean;
  monthly_allocation?: number;
  treat_as_bill: boolean;
  status: GoalStatus;
  milestones?: Milestone[];
};

type DropdownOption = {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  subtitle?: string;
};

type ContributionSource = 'salary' | 'bonus' | 'savings' | 'gift' | 'other';

// ============ GOAL TYPE CONFIG ============
const goalTypeConfig: Record<GoalType, { icon: string; color: string }> = {
  savings: { icon: 'banknote.fill', color: '#046C4E' },
  emergency: { icon: 'shield.fill', color: '#F59E0B' },
  investment: { icon: 'chart.line.uptrend.xyaxis', color: '#2563EB' },
  debt_payoff: { icon: 'creditcard.fill', color: '#DC2626' },
  purchase: { icon: 'bag.fill', color: '#7C3AED' },
  retirement: { icon: 'figure.walk', color: '#0891B2' },
  education: { icon: 'book.fill', color: '#DB2777' },
  travel: { icon: 'airplane', color: '#059669' },
  other: { icon: 'star.fill', color: '#6B7280' },
};

const contributionSources: DropdownOption[] = [
  { id: 'salary', label: 'Salary', icon: 'briefcase.fill', color: '#046C4E' },
  { id: 'bonus', label: 'Bonus', icon: 'gift.fill', color: '#F59E0B' },
  { id: 'savings', label: 'Savings Transfer', icon: 'arrow.left.arrow.right', color: '#2563EB' },
  { id: 'gift', label: 'Gift Received', icon: 'heart.fill', color: '#EC4899' },
  { id: 'other', label: 'Other', icon: 'ellipsis.circle.fill', color: '#6B7280' },
];

const statusOptions: DropdownOption[] = [
  { id: 'active', label: 'Active', icon: 'flame.fill', color: '#046C4E' },
  { id: 'paused', label: 'Paused', icon: 'pause.circle.fill', color: '#F59E0B' },
  { id: 'completed', label: 'Completed', icon: 'checkmark.circle.fill', color: '#2563EB' },
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
      <Text style={styles.headerTitle}>Update Goal</Text>
      <View style={styles.headerButtonPlaceholder} />
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

// ============ GOAL SELECTOR ============
type GoalSelectorProps = {
  goals: Goal[];
  selectedGoalId: string | null;
  onSelect: (goalId: string) => void;
  loading: boolean;
};

const GoalSelector = ({ goals, selectedGoalId, onSelect, loading }: GoalSelectorProps) => {
  const [visible, setVisible] = useState(false);
  const selectedGoal = goals.find(g => g.goal_id === selectedGoalId);

  if (loading) {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Select Goal</Text>
        <View style={[styles.dropdownButton, styles.loadingDropdown]}>
          <ActivityIndicator size="small" color="#046C4E" />
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Select Goal</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          {selectedGoal ? (
            <View style={styles.goalSelectorSelected}>
              <View style={[styles.goalSelectorIcon, { backgroundColor: goalTypeConfig[selectedGoal.goal_type].color + '15' }]}>
                <SFSymbol 
                  name={goalTypeConfig[selectedGoal.goal_type].icon} 
                  size={20} 
                  color={goalTypeConfig[selectedGoal.goal_type].color} 
                />
              </View>
              <View style={styles.goalSelectorContent}>
                <Text style={styles.goalSelectorName}>{selectedGoal.goal_name}</Text>
                <Text style={styles.goalSelectorProgress}>
                  ${selectedGoal.current_amount.toLocaleString()} / ${selectedGoal.target_amount.toLocaleString()}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.dropdownPlaceholder}>Choose a goal to update</Text>
          )}
          <SFSymbol name="chevron.down" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Goal</Text>
            
            {goals.length === 0 ? (
              <View style={styles.emptyGoals}>
                <SFSymbol name="target" size={48} color="#C7C7CC" />
                <Text style={styles.emptyGoalsText}>No active goals</Text>
                <Text style={styles.emptyGoalsSubtext}>Create a goal first to update progress</Text>
              </View>
            ) : (
              <FlatList
                data={goals}
                keyExtractor={item => item.goal_id}
                renderItem={({ item }) => {
                  const progress = (item.current_amount / item.target_amount) * 100;
                  const config = goalTypeConfig[item.goal_type];
                  
                  return (
                    <TouchableOpacity
                      style={[
                        styles.goalOptionCard,
                        selectedGoalId === item.goal_id && styles.goalOptionCardSelected,
                      ]}
                      onPress={() => {
                        onSelect(item.goal_id);
                        setVisible(false);
                      }}
                    >
                      <View style={[styles.goalOptionIcon, { backgroundColor: config.color + '15' }]}>
                        <SFSymbol name={config.icon} size={24} color={config.color} />
                      </View>
                      <View style={styles.goalOptionContent}>
                        <View style={styles.goalOptionHeader}>
                          <Text style={styles.goalOptionName}>{item.goal_name}</Text>
                          {item.is_mandatory && (
                            <View style={styles.mandatoryBadge}>
                              <Text style={styles.mandatoryBadgeText}>Required</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.goalOptionAmount}>
                          ${item.current_amount.toLocaleString()} of ${item.target_amount.toLocaleString()}
                        </Text>
                        <View style={styles.goalOptionProgressBar}>
                          <View style={[styles.goalOptionProgressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: config.color }]} />
                        </View>
                        <Text style={[styles.goalOptionPercent, { color: config.color }]}>
                          {progress.toFixed(0)}% complete
                        </Text>
                      </View>
                      {selectedGoalId === item.goal_id && (
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

// ============ PROGRESS CARD ============
type ProgressCardProps = {
  goal: Goal;
};

const ProgressCard = ({ goal }: ProgressCardProps) => {
  const progress = (goal.current_amount / goal.target_amount) * 100;
  const remaining = goal.target_amount - goal.current_amount;
  const config = goalTypeConfig[goal.goal_type];

  return (
    <View style={[styles.progressCard, { borderLeftColor: config.color }]}>
      <View style={styles.progressCardHeader}>
        <Text style={styles.progressCardTitle}>Current Progress</Text>
        <Text style={[styles.progressCardPercent, { color: config.color }]}>{progress.toFixed(1)}%</Text>
      </View>
      
      <View style={styles.progressBarLarge}>
        <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: config.color }]} />
      </View>
      
      <View style={styles.progressCardStats}>
        <View style={styles.progressCardStat}>
          <Text style={styles.progressCardStatLabel}>Saved</Text>
          <Text style={[styles.progressCardStatValue, { color: config.color }]}>
            ${goal.current_amount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.progressCardStatDivider} />
        <View style={styles.progressCardStat}>
          <Text style={styles.progressCardStatLabel}>Remaining</Text>
          <Text style={styles.progressCardStatValue}>
            ${remaining.toLocaleString()}
          </Text>
        </View>
        <View style={styles.progressCardStatDivider} />
        <View style={styles.progressCardStat}>
          <Text style={styles.progressCardStatLabel}>Target</Text>
          <Text style={styles.progressCardStatValue}>
            ${goal.target_amount.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ============ MILESTONE SELECTOR ============
type MilestoneSelectorProps = {
  milestones: Milestone[];
  selectedMilestoneId: string | null;
  onSelect: (id: string | null) => void;
  currentAmount: number;
};

const MilestoneSelector = ({ milestones, selectedMilestoneId, onSelect, currentAmount }: MilestoneSelectorProps) => {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  return (
    <View style={styles.milestonesSection}>
      <Text style={styles.inputLabel}>Milestones</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.milestonesScroll}>
        {milestones.map((milestone) => {
          const isSelected = selectedMilestoneId === milestone.milestone_id;
          const isAchieved = milestone.is_achieved || currentAmount >= milestone.target_amount;
          
          return (
            <TouchableOpacity
              key={milestone.milestone_id}
              style={[
                styles.milestoneChip,
                isSelected && styles.milestoneChipSelected,
                isAchieved && styles.milestoneChipAchieved,
              ]}
              onPress={() => onSelect(isSelected ? null : milestone.milestone_id)}
            >
              <SFSymbol 
                name={isAchieved ? "checkmark.circle.fill" : "circle"} 
                size={18} 
                color={isAchieved ? "#046C4E" : isSelected ? "#FFFFFF" : "#8E8E93"} 
              />
              <View style={styles.milestoneChipContent}>
                <Text style={[
                  styles.milestoneChipName,
                  isSelected && styles.milestoneChipNameSelected,
                  isAchieved && styles.milestoneChipNameAchieved,
                ]}>
                  {milestone.milestone_name}
                </Text>
                <Text style={[
                  styles.milestoneChipAmount,
                  isSelected && styles.milestoneChipAmountSelected,
                ]}>
                  ${milestone.target_amount.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  multiline?: boolean;
  prefix?: string;
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
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  </View>
);

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

// ============ MAIN COMPONENT ============
export default function UpdateGoalScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  // Selection state
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  
  // Form state
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionSource, setContributionSource] = useState<ContributionSource | null>(null);
  const [contributionDate, setContributionDate] = useState(new Date().toLocaleDateString('en-US'));
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState<GoalStatus | null>(null);

  // Get selected goal
  const selectedGoal = goals.find(g => g.goal_id === selectedGoalId);

  // Fetch goals on mount
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      
      // Mock data
      const mockGoals: Goal[] = [
        {
          goal_id: '1',
          goal_name: 'Emergency Fund',
          goal_type: 'emergency',
          target_amount: 15000,
          current_amount: 9750,
          deadline_date: '2025-06-30',
          priority_level: 10,
          is_mandatory: true,
          monthly_allocation: 500,
          treat_as_bill: true,
          status: 'active',
          milestones: [
            { milestone_id: '1a', milestone_name: '1 Month Expenses', target_amount: 5000, target_date: '2024-06-01', achieved_date: '2024-05-15', is_achieved: true },
            { milestone_id: '1b', milestone_name: '2 Months Expenses', target_amount: 10000, target_date: '2024-12-01', is_achieved: false },
            { milestone_id: '1c', milestone_name: '3 Months Expenses', target_amount: 15000, target_date: '2025-06-30', is_achieved: false },
          ],
        },
        {
          goal_id: '2',
          goal_name: 'Vacation to Japan',
          goal_type: 'travel',
          target_amount: 8000,
          current_amount: 3200,
          deadline_date: '2025-09-01',
          priority_level: 6,
          is_mandatory: false,
          monthly_allocation: 400,
          treat_as_bill: false,
          status: 'active',
          milestones: [
            { milestone_id: '2a', milestone_name: 'Book Flights', target_amount: 2500, target_date: '2025-03-01', achieved_date: '2024-12-10', is_achieved: true },
            { milestone_id: '2b', milestone_name: 'Book Hotels', target_amount: 5000, target_date: '2025-06-01', is_achieved: false },
            { milestone_id: '2c', milestone_name: 'Full Budget', target_amount: 8000, target_date: '2025-09-01', is_achieved: false },
          ],
        },
        {
          goal_id: '3',
          goal_name: 'New MacBook Pro',
          goal_type: 'purchase',
          target_amount: 3500,
          current_amount: 2100,
          deadline_date: '2025-04-15',
          priority_level: 5,
          is_mandatory: false,
          monthly_allocation: 350,
          treat_as_bill: false,
          status: 'active',
        },
        {
          goal_id: '4',
          goal_name: 'Down Payment Fund',
          goal_type: 'savings',
          target_amount: 50000,
          current_amount: 12500,
          deadline_date: '2027-01-01',
          priority_level: 9,
          is_mandatory: true,
          monthly_allocation: 800,
          treat_as_bill: true,
          status: 'active',
          milestones: [
            { milestone_id: '4a', milestone_name: '10% Saved', target_amount: 5000, target_date: '2024-06-01', achieved_date: '2024-05-20', is_achieved: true },
            { milestone_id: '4b', milestone_name: '25% Saved', target_amount: 12500, target_date: '2025-01-01', is_achieved: false },
            { milestone_id: '4c', milestone_name: '50% Saved', target_amount: 25000, target_date: '2025-12-01', is_achieved: false },
          ],
        },
      ];
      
      setGoals(mockGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = () => {
    if (!selectedGoalId) return false;
    // Either adding contribution OR changing status
    return (contributionAmount.trim() !== '' && parseFloat(contributionAmount) > 0) || newStatus !== null;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Missing Information', 'Please select a goal and enter a contribution amount or change status.');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: API call to update goal progress
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      const amount = parseFloat(contributionAmount) || 0;
      const message = amount > 0 
        ? `Added $${amount.toLocaleString()} to ${selectedGoal?.goal_name}!`
        : `Updated ${selectedGoal?.goal_name} status.`;
      
      Alert.alert(
        'Goal Updated! 🎯',
        message,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate new progress preview
  const getNewProgress = () => {
    if (!selectedGoal) return null;
    const addAmount = parseFloat(contributionAmount) || 0;
    const newAmount = selectedGoal.current_amount + addAmount;
    const newPercent = (newAmount / selectedGoal.target_amount) * 100;
    return { newAmount, newPercent, willComplete: newAmount >= selectedGoal.target_amount };
  };

  const newProgress = getNewProgress();

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
        {/* Goal Selection */}
        <SectionHeader title="Select Goal" icon="target" color="#2563EB" />
        
        <GoalSelector
          goals={goals}
          selectedGoalId={selectedGoalId}
          onSelect={(id) => {
            setSelectedGoalId(id);
            setSelectedMilestoneId(null);
            setNewStatus(null);
          }}
          loading={loading}
        />

        {/* Show details when goal is selected */}
        {selectedGoal && (
          <>
            {/* Current Progress */}
            <ProgressCard goal={selectedGoal} />

            {/* Milestones */}
            {selectedGoal.milestones && selectedGoal.milestones.length > 0 && (
              <MilestoneSelector
                milestones={selectedGoal.milestones}
                selectedMilestoneId={selectedMilestoneId}
                onSelect={setSelectedMilestoneId}
                currentAmount={selectedGoal.current_amount}
              />
            )}

            {/* Add Contribution */}
            <SectionHeader title="Add Contribution" icon="plus.circle.fill" color="#046C4E" />

            <View style={styles.contributionCard}>
              <View style={styles.contributionAmountRow}>
                <Text style={styles.contributionCurrency}>$</Text>
                <TextInput
                  style={styles.contributionAmountInput}
                  placeholder="0.00"
                  placeholderTextColor="#C7C7CC"
                  value={contributionAmount}
                  onChangeText={setContributionAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              
              {/* Preview */}
              {newProgress && contributionAmount && parseFloat(contributionAmount) > 0 && (
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>After this contribution:</Text>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewAmount}>
                      ${newProgress.newAmount.toLocaleString()}
                    </Text>
                    <Text style={styles.previewPercent}>
                      ({newProgress.newPercent.toFixed(1)}%)
                    </Text>
                  </View>
                  {newProgress.willComplete && (
                    <View style={styles.completionBadge}>
                      <SFSymbol name="party.popper.fill" size={16} color="#046C4E" />
                      <Text style={styles.completionText}>Goal will be complete! 🎉</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <Dropdown
              label="Contribution Source"
              placeholder="Where did this money come from?"
              options={contributionSources}
              selectedId={contributionSource}
              onSelect={(id) => setContributionSource(id as ContributionSource)}
              optional
            />

            <InputField
              label="Contribution Date"
              placeholder="MM/DD/YYYY"
              value={contributionDate}
              onChangeText={setContributionDate}
            />

            {/* Goal Settings */}
            <SectionHeader title="Goal Settings" icon="gearshape.fill" color="#7C3AED" />

            <Dropdown
              label="Change Status"
              placeholder="Keep current status"
              options={statusOptions}
              selectedId={newStatus}
              onSelect={(id) => setNewStatus(id as GoalStatus)}
              optional
            />

            {/* Notes */}
            <InputField
              label="Notes"
              placeholder="Any notes about this update..."
              value={notes}
              onChangeText={setNotes}
              multiline
              optional
            />
          </>
        )}

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
              <SFSymbol name="arrow.up.circle.fill" size={22} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Update Goal</Text>
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

  // Goal Selector
  goalSelectorSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalSelectorContent: {
    flex: 1,
  },
  goalSelectorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  goalSelectorProgress: {
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

  // Empty Goals
  emptyGoals: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyGoalsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptyGoalsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Goal Option Card
  goalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  goalOptionCardSelected: {
    backgroundColor: '#046C4E10',
    borderWidth: 2,
    borderColor: '#046C4E',
  },
  goalOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  goalOptionContent: {
    flex: 1,
  },
  goalOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  mandatoryBadge: {
    backgroundColor: '#DC262615',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mandatoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  goalOptionAmount: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  goalOptionProgressBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  goalOptionProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalOptionPercent: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  progressCardPercent: {
    fontSize: 24,
    fontWeight: '700',
  },
  progressBarLarge: {
    height: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCardStat: {
    flex: 1,
    alignItems: 'center',
  },
  progressCardStatDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
  progressCardStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  progressCardStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  // Milestones
  milestonesSection: {
    marginBottom: 20,
  },
  milestonesScroll: {
    marginTop: 10,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  milestoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    gap: 10,
  },
  milestoneChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  milestoneChipAchieved: {
    backgroundColor: '#046C4E15',
    borderColor: '#046C4E',
  },
  milestoneChipContent: {},
  milestoneChipName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  milestoneChipNameSelected: {
    color: '#FFFFFF',
  },
  milestoneChipNameAchieved: {
    color: '#046C4E',
  },
  milestoneChipAmount: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  milestoneChipAmountSelected: {
    color: '#FFFFFF',
    opacity: 0.8,
  },

  // Contribution Card
  contributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  contributionAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contributionCurrency: {
    fontSize: 32,
    fontWeight: '300',
    color: '#8E8E93',
    marginRight: 4,
  },
  contributionAmountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: '#046C4E',
    minWidth: 150,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: '#046C4E10',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 13,
    color: '#046C4E',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  previewAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#046C4E',
  },
  previewPercent: {
    fontSize: 16,
    fontWeight: '500',
    color: '#046C4E',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
    gap: 6,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#046C4E',
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