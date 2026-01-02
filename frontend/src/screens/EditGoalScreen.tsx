// src/screens/EditGoalScreen.tsx
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
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useGoal } from '../hooks/useGoal';
import { GoalType as APIGoalType, GoalPriority as APIGoalPriority } from '../api/types';

// ============ TYPES ============
type GoalType = 
  | 'emergency' 
  | 'savings' 
  | 'debt_payoff' 
  | 'investment' 
  | 'retirement' 
  | 'education' 
  | 'travel' 
  | 'purchase' 
  | 'other';

type GoalStatus = 'active' | 'paused' | 'completed' | 'cancelled';
type GoalPriority = 'high' | 'medium' | 'low';

type Milestone = {
  milestone_id: string;
  milestone_name: string;
  target_amount: number;
  target_date: string;
  is_achieved: boolean;
  achieved_date?: string;
};

type Goal = {
  goal_id: string;
  goal_name: string;
  goal_type: GoalType;
  target_amount: number;
  current_amount: number;
  deadline: string;
  monthly_allocation: number;
  is_auto_save: boolean;
  is_required: boolean;
  priority: GoalPriority;
  status: GoalStatus;
  notes?: string;
  milestones: Milestone[];
  created_at: string;
};

// ============ GOAL TYPE CONFIG ============
const goalTypeConfig: Record<GoalType, { icon: string; color: string; label: string }> = {
  emergency: { icon: 'shield.fill', color: '#DC2626', label: 'Emergency Fund' },
  savings: { icon: 'banknote.fill', color: '#046C4E', label: 'Savings' },
  debt_payoff: { icon: 'creditcard.fill', color: '#7C3AED', label: 'Debt Payoff' },
  investment: { icon: 'chart.line.uptrend.xyaxis', color: '#2563EB', label: 'Investment' },
  retirement: { icon: 'figure.walk', color: '#F59E0B', label: 'Retirement' },
  education: { icon: 'graduationcap.fill', color: '#0891B2', label: 'Education' },
  travel: { icon: 'airplane', color: '#EC4899', label: 'Travel' },
  purchase: { icon: 'cart.fill', color: '#8B5CF6', label: 'Major Purchase' },
  other: { icon: 'star.fill', color: '#6B7280', label: 'Other' },
};

const goalTypes: GoalType[] = [
  'emergency', 'savings', 'debt_payoff', 'investment', 
  'retirement', 'education', 'travel', 'purchase', 'other'
];

const statusOptions: { value: GoalStatus; label: string; icon: string; color: string }[] = [
  { value: 'active', label: 'Active', icon: 'play.circle.fill', color: '#046C4E' },
  { value: 'paused', label: 'Paused', icon: 'pause.circle.fill', color: '#F59E0B' },
  { value: 'completed', label: 'Completed', icon: 'checkmark.circle.fill', color: '#2563EB' },
  { value: 'cancelled', label: 'Cancelled', icon: 'xmark.circle.fill', color: '#DC2626' },
];

const priorityOptions: { value: GoalPriority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: '#DC2626' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'low', label: 'Low', color: '#046C4E' },
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
      <Text style={styles.headerTitle}>Edit Goal</Text>
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

// ============ MILESTONE CARD ============
type MilestoneCardProps = {
  milestone: Milestone;
  index: number;
  onUpdate: (milestone: Milestone) => void;
  onDelete: () => void;
  currentAmount: number;
};

const MilestoneCard = ({ milestone, index, onUpdate, onDelete, currentAmount }: MilestoneCardProps) => {
  const progress = Math.min((currentAmount / milestone.target_amount) * 100, 100);
  
  return (
    <View style={[styles.milestoneCard, milestone.is_achieved && styles.milestoneCardAchieved]}>
      <View style={styles.milestoneHeader}>
        <View style={styles.milestoneNumber}>
          <Text style={styles.milestoneNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.milestoneHeaderRight}>
          {milestone.is_achieved && (
            <View style={styles.achievedBadge}>
              <SFSymbol name="checkmark.circle.fill" size={14} color="#046C4E" />
              <Text style={styles.achievedBadgeText}>Achieved</Text>
            </View>
          )}
          <TouchableOpacity style={styles.milestoneDeleteButton} onPress={onDelete}>
            <SFSymbol name="trash" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.milestoneFields}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Milestone Name</Text>
          <TextInput
            style={styles.input}
            value={milestone.milestone_name}
            onChangeText={(text) => onUpdate({ ...milestone, milestone_name: text })}
            placeholder="e.g., First $1,000"
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Target Amount</Text>
            <View style={styles.inputWithPrefix}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                style={[styles.input, styles.inputWithPrefixField]}
                value={milestone.target_amount > 0 ? milestone.target_amount.toString() : ''}
                onChangeText={(text) => onUpdate({ ...milestone, target_amount: parseFloat(text) || 0 })}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.inputLabel}>Target Date</Text>
            <TextInput
              style={styles.input}
              value={milestone.target_date}
              onChangeText={(text) => onUpdate({ ...milestone, target_date: text })}
              placeholder="MM/DD/YYYY"
            />
          </View>
        </View>

        {!milestone.is_achieved && milestone.target_amount > 0 && (
          <View style={styles.milestoneProgress}>
            <View style={styles.milestoneProgressBar}>
              <View style={[styles.milestoneProgressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.milestoneProgressText}>{progress.toFixed(0)}% complete</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function EditGoalScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditGoalScreen'>>();
  const insets = useSafeAreaInsets();
  const goalId = route.params?.goalId;
  
  // Use API hook
  const { 
    goal: apiGoal, 
    milestones: apiMilestones,
    isLoading: loading, 
    updateGoal: apiUpdateGoal,
  } = useGoal(goalId);

  const [saving, setSaving] = useState(false);
  const [originalGoal, setOriginalGoal] = useState<Goal | null>(null);

  // Form state
  const [goalName, setGoalName] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('savings');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [monthlyAllocation, setMonthlyAllocation] = useState('');
  const [isAutoSave, setIsAutoSave] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [notes, setNotes] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Populate form when API data loads
  useEffect(() => {
    if (apiGoal) {
      const goalData: Goal = {
        goal_id: apiGoal.goal_id,
        goal_name: apiGoal.goal_name,
        goal_type: apiGoal.goal_type as GoalType,
        target_amount: apiGoal.target_amount,
        current_amount: apiGoal.current_amount,
        deadline: apiGoal.target_date || '',
        monthly_allocation: apiGoal.monthly_contribution || 0,
        is_auto_save: false,
        is_required: apiGoal.priority === 'critical',
        priority: apiGoal.priority === 'critical' ? 'high' : apiGoal.priority === 'high' ? 'high' : apiGoal.priority === 'medium' ? 'medium' : 'low',
        status: apiGoal.status as GoalStatus,
        notes: apiGoal.notes,
        milestones: apiMilestones.map(m => ({
          milestone_id: m.milestone_id,
          milestone_name: m.title,
          target_amount: m.target_amount,
          target_date: m.target_date || '',
          is_achieved: m.is_completed,
          achieved_date: m.completed_at,
        })),
        created_at: apiGoal.created_at,
      };
      
      setOriginalGoal(goalData);
      setGoalName(goalData.goal_name);
      setGoalType(goalData.goal_type);
      setTargetAmount(goalData.target_amount.toString());
      setCurrentAmount(goalData.current_amount.toString());
      setDeadline(goalData.deadline);
      setMonthlyAllocation(goalData.monthly_allocation.toString());
      setIsAutoSave(goalData.is_auto_save);
      setIsRequired(goalData.is_required);
      setPriority(goalData.priority);
      setStatus(goalData.status);
      setNotes(goalData.notes || '');
      setMilestones(goalData.milestones);
    }
  }, [apiGoal, apiMilestones]);

  const hasChanges = (): boolean => {
    if (!originalGoal) return false;
    
    return (
      goalName !== originalGoal.goal_name ||
      goalType !== originalGoal.goal_type ||
      targetAmount !== originalGoal.target_amount.toString() ||
      currentAmount !== originalGoal.current_amount.toString() ||
      deadline !== originalGoal.deadline ||
      monthlyAllocation !== originalGoal.monthly_allocation.toString() ||
      isAutoSave !== originalGoal.is_auto_save ||
      isRequired !== originalGoal.is_required ||
      priority !== originalGoal.priority ||
      status !== originalGoal.status ||
      notes !== (originalGoal.notes || '') ||
      JSON.stringify(milestones) !== JSON.stringify(originalGoal.milestones)
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
    if (!goalName.trim()) {
      Alert.alert('Validation Error', 'Please enter a goal name.');
      return false;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid target amount.');
      return false;
    }
    if (!deadline.trim()) {
      Alert.alert('Validation Error', 'Please enter a deadline.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Map priority to API format
      const apiPriority: APIGoalPriority = 
        priority === 'high' ? (isRequired ? 'critical' : 'high') : 
        priority === 'medium' ? 'medium' : 'low';

      // Call API to update
      const result = await apiUpdateGoal({
        goal_name: goalName.trim(),
        goal_type: goalType as APIGoalType,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        target_date: deadline ? new Date(deadline).toISOString().split('T')[0] : undefined,
        monthly_contribution: parseFloat(monthlyAllocation) || undefined,
        priority: apiPriority,
        notes: notes.trim() || undefined,
      });

      if (result) {
        Alert.alert('Success', 'Goal updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      milestone_id: `new_${Date.now()}`,
      milestone_name: '',
      target_amount: 0,
      target_date: '',
      is_achieved: false,
    };
    setMilestones([...milestones, newMilestone]);
  };

  const updateMilestone = (index: number, updated: Milestone) => {
    const newMilestones = [...milestones];
    newMilestones[index] = updated;
    setMilestones(newMilestones);
  };

  const deleteMilestone = (index: number) => {
    const milestone = milestones[index];
    if (milestone.is_achieved) {
      Alert.alert(
        'Cannot Delete',
        'This milestone has already been achieved and cannot be deleted.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Delete Milestone',
      `Are you sure you want to delete "${milestone.milestone_name || 'this milestone'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const newMilestones = milestones.filter((_, i) => i !== index);
            setMilestones(newMilestones);
          }
        },
      ]
    );
  };

  // Calculate estimates
  const target = parseFloat(targetAmount) || 0;
  const current = parseFloat(currentAmount) || 0;
  const monthly = parseFloat(monthlyAllocation) || 0;
  const remaining = Math.max(target - current, 0);
  const monthsToGoal = monthly > 0 ? Math.ceil(remaining / monthly) : 0;
  const progressPercent = target > 0 ? (current / target) * 100 : 0;

  const config = goalTypeConfig[goalType];

  if (loading) {
    return (
      <View style={styles.container}>
        <Header onCancel={handleCancel} onSave={handleSave} isSaving={false} hasChanges={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Loading goal...</Text>
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
          {/* Goal Preview */}
          <View style={[styles.previewCard, { backgroundColor: config.color + '10' }]}>
            <View style={[styles.previewIcon, { backgroundColor: config.color + '20' }]}>
              <SFSymbol name={config.icon} size={28} color={config.color} />
            </View>
            <Text style={styles.previewName}>{goalName || 'Goal Name'}</Text>
            <View style={styles.previewProgress}>
              <View style={styles.previewProgressBar}>
                <View style={[styles.previewProgressFill, { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: config.color }]} />
              </View>
              <Text style={styles.previewProgressText}>{progressPercent.toFixed(0)}%</Text>
            </View>
            <Text style={styles.previewAmount}>
              ${current.toLocaleString()} of ${target.toLocaleString()}
            </Text>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <SectionHeader title="GOAL DETAILS" icon="target" color="#2563EB" />
            
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Goal Name *</Text>
                <TextInput
                  style={styles.input}
                  value={goalName}
                  onChangeText={setGoalName}
                  placeholder="What are you saving for?"
                />
              </View>

              <Dropdown
                label="Goal Type"
                value={goalType}
                options={goalTypes.map(type => ({
                  value: type,
                  label: goalTypeConfig[type].label,
                  icon: goalTypeConfig[type].icon,
                  color: goalTypeConfig[type].color,
                }))}
                onSelect={(val) => setGoalType(val as GoalType)}
              />

              <Dropdown
                label="Priority"
                value={priority}
                options={priorityOptions.map(p => ({
                  value: p.value,
                  label: p.label,
                  color: p.color,
                }))}
                onSelect={(val) => setPriority(val as GoalPriority)}
              />
            </View>
          </View>

          {/* Target & Progress */}
          <View style={styles.section}>
            <SectionHeader title="TARGET & PROGRESS" icon="dollarsign.circle" color="#046C4E" />
            
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Target Amount *</Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.inputPrefix}>$</Text>
                    <TextInput
                      style={[styles.input, styles.inputWithPrefixField]}
                      value={targetAmount}
                      onChangeText={setTargetAmount}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.inputLabel}>Current Amount</Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.inputPrefix}>$</Text>
                    <TextInput
                      style={[styles.input, styles.inputWithPrefixField]}
                      value={currentAmount}
                      onChangeText={setCurrentAmount}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Deadline *</Text>
                <TextInput
                  style={styles.input}
                  value={deadline}
                  onChangeText={setDeadline}
                  placeholder="MM/DD/YYYY"
                />
              </View>

              {/* Progress Preview */}
              <View style={styles.progressPreview}>
                <View style={styles.progressPreviewItem}>
                  <Text style={styles.progressPreviewValue}>${remaining.toLocaleString()}</Text>
                  <Text style={styles.progressPreviewLabel}>Remaining</Text>
                </View>
                <View style={styles.progressPreviewDivider} />
                <View style={styles.progressPreviewItem}>
                  <Text style={styles.progressPreviewValue}>{progressPercent.toFixed(1)}%</Text>
                  <Text style={styles.progressPreviewLabel}>Complete</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Monthly Contribution */}
          <View style={styles.section}>
            <SectionHeader title="MONTHLY CONTRIBUTION" icon="calendar" color="#7C3AED" />
            
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Monthly Allocation</Text>
                <View style={styles.inputWithPrefix}>
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    style={[styles.input, styles.inputWithPrefixField]}
                    value={monthlyAllocation}
                    onChangeText={setMonthlyAllocation}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                </View>
              </View>

              {monthly > 0 && remaining > 0 && (
                <View style={styles.estimateCard}>
                  <SFSymbol name="clock" size={18} color="#7C3AED" />
                  <Text style={styles.estimateText}>
                    At ${monthly.toLocaleString()}/month, you'll reach your goal in{' '}
                    <Text style={styles.estimateHighlight}>{monthsToGoal} months</Text>
                  </Text>
                </View>
              )}

              {/* Toggles */}
              <View style={styles.togglesContainer}>
                <TouchableOpacity
                  style={[styles.toggleItem, isAutoSave && styles.toggleItemActive]}
                  onPress={() => setIsAutoSave(!isAutoSave)}
                >
                  <View style={[styles.toggleIcon, isAutoSave && styles.toggleIconActive]}>
                    <SFSymbol 
                      name="arrow.triangle.2.circlepath" 
                      size={18} 
                      color={isAutoSave ? '#FFFFFF' : '#8E8E93'} 
                    />
                  </View>
                  <Text style={[styles.toggleLabel, isAutoSave && styles.toggleLabelActive]}>
                    Auto-Save
                  </Text>
                  {isAutoSave && (
                    <SFSymbol name="checkmark" size={16} color="#046C4E" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleItem, isRequired && styles.toggleItemActive]}
                  onPress={() => setIsRequired(!isRequired)}
                >
                  <View style={[styles.toggleIcon, isRequired && styles.toggleIconActive]}>
                    <SFSymbol 
                      name="exclamationmark.circle" 
                      size={18} 
                      color={isRequired ? '#FFFFFF' : '#8E8E93'} 
                    />
                  </View>
                  <Text style={[styles.toggleLabel, isRequired && styles.toggleLabelActive]}>
                    Required
                  </Text>
                  {isRequired && (
                    <SFSymbol name="checkmark" size={16} color="#046C4E" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <SectionHeader title="STATUS" icon="flag.fill" color="#F59E0B" />
            
            <View style={styles.card}>
              <Dropdown
                label="Goal Status"
                value={status}
                options={statusOptions.map(s => ({
                  value: s.value,
                  label: s.label,
                  icon: s.icon,
                  color: s.color,
                }))}
                onSelect={(val) => setStatus(val as GoalStatus)}
              />

              {status === 'completed' && (
                <View style={styles.completedNote}>
                  <SFSymbol name="party.popper" size={20} color="#046C4E" />
                  <Text style={styles.completedNoteText}>
                    Congratulations on completing this goal! 🎉
                  </Text>
                </View>
              )}

              {status === 'paused' && (
                <View style={styles.pausedNote}>
                  <SFSymbol name="info.circle" size={16} color="#F59E0B" />
                  <Text style={styles.pausedNoteText}>
                    Auto-save and reminders are disabled while paused
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Milestones */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SectionHeader title="MILESTONES" icon="flag.checkered" color="#EC4899" />
              <TouchableOpacity style={styles.addMilestoneButton} onPress={addMilestone}>
                <SFSymbol name="plus" size={16} color="#EC4899" />
                <Text style={styles.addMilestoneText}>Add</Text>
              </TouchableOpacity>
            </View>

            {milestones.length === 0 ? (
              <View style={styles.emptyMilestones}>
                <SFSymbol name="flag" size={32} color="#C7C7CC" />
                <Text style={styles.emptyMilestonesText}>No milestones yet</Text>
                <Text style={styles.emptyMilestonesSubtext}>
                  Add milestones to track progress along the way
                </Text>
              </View>
            ) : (
              milestones.map((milestone, index) => (
                <MilestoneCard
                  key={milestone.milestone_id}
                  milestone={milestone}
                  index={index}
                  onUpdate={(updated) => updateMilestone(index, updated)}
                  onDelete={() => deleteMilestone(index)}
                  currentAmount={current}
                />
              ))
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
                placeholder="Add any notes about this goal..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Meta Info */}
          {originalGoal && (
            <View style={styles.metaInfo}>
              <Text style={styles.metaText}>Created: {originalGoal.created_at}</Text>
            </View>
          )}

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
    marginBottom: 12,
  },
  previewProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
    marginBottom: 8,
  },
  previewProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  previewProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  previewProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    width: 45,
    textAlign: 'right',
  },
  previewAmount: {
    fontSize: 14,
    color: '#6B7280',
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

  // Progress Preview
  progressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  progressPreviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressPreviewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  progressPreviewLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  progressPreviewDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  },

  // Estimate Card
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  estimateText: {
    flex: 1,
    fontSize: 14,
    color: '#7C3AED',
    lineHeight: 20,
  },
  estimateHighlight: {
    fontWeight: '700',
  },

  // Toggles
  togglesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  toggleItemActive: {
    backgroundColor: '#046C4E10',
    borderWidth: 1,
    borderColor: '#046C4E30',
  },
  toggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconActive: {
    backgroundColor: '#046C4E',
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  toggleLabelActive: {
    color: '#046C4E',
  },

  // Status Notes
  completedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  completedNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#046C4E',
  },
  pausedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  pausedNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },

  // Milestones
  addMilestoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EC489915',
    borderRadius: 8,
  },
  addMilestoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EC4899',
  },
  emptyMilestones: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    gap: 8,
  },
  emptyMilestonesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  emptyMilestonesSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  milestoneCardAchieved: {
    borderLeftWidth: 4,
    borderLeftColor: '#046C4E',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  milestoneNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  milestoneHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#046C4E15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  achievedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#046C4E',
  },
  milestoneDeleteButton: {
    padding: 8,
  },
  milestoneFields: {
    gap: 12,
  },
  milestoneProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  milestoneProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: '#046C4E',
    borderRadius: 3,
  },
  milestoneProgressText: {
    fontSize: 12,
    color: '#8E8E93',
    width: 70,
    textAlign: 'right',
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
  },

  // Meta Info
  metaInfo: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});