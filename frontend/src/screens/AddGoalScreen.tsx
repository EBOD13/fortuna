// src/screens/AddGoalScreen.tsx
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
type GoalType = 'savings' | 'emergency' | 'investment' | 'debt_payoff' | 'purchase' | 'retirement' | 'education' | 'travel' | 'other';
type PriorityLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type DropdownOption = {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  subtitle?: string;
};

type Milestone = {
  id: string;
  name: string;
  amount: string;
  date: string;
};

type FormData = {
  goal_name: string;
  goal_type: GoalType | null;
  target_amount: string;
  current_amount: string;
  deadline_date: string;
  priority_level: PriorityLevel;
  is_mandatory: boolean;
  monthly_allocation: string;
  treat_as_bill: boolean;
  milestones: Milestone[];
  notes: string;
};

// ============ DROPDOWN OPTIONS ============
const goalTypes: DropdownOption[] = [
  { id: 'savings', label: 'Savings', subtitle: 'General savings goal' },
  { id: 'emergency', label: 'Emergency Fund', subtitle: '3-6 months of expenses' },
  { id: 'investment', label: 'Investment', subtitle: 'Stocks, bonds, crypto' },
  { id: 'debt_payoff', label: 'Debt Payoff', subtitle: 'Pay off loans or credit' },
  { id: 'purchase', label: 'Major Purchase', subtitle: 'Car, appliance, electronics' },
  { id: 'retirement', label: 'Retirement', subtitle: 'Long-term retirement savings' },
  { id: 'education', label: 'Education', subtitle: 'Tuition, courses, training' },
  { id: 'travel', label: 'Travel', subtitle: 'Vacation or trip fund' },
  { id: 'other', label: 'Other', subtitle: 'Custom goal' },
];

const priorityLevels: DropdownOption[] = [
  { id: '10', label: 'Critical', subtitle: 'Must achieve, highest priority' },
  { id: '9', label: 'Very High', subtitle: 'Extremely important' },
  { id: '8', label: 'High', subtitle: 'Very important goal' },
  { id: '7', label: 'Above Average', subtitle: 'Important goal' },
  { id: '6', label: 'Medium-High', subtitle: 'Moderately important' },
  { id: '5', label: 'Medium', subtitle: 'Average priority' },
  { id: '4', label: 'Medium-Low', subtitle: 'Below average priority' },
  { id: '3', label: 'Low', subtitle: 'Nice to have' },
  { id: '2', label: 'Very Low', subtitle: 'When possible' },
  { id: '1', label: 'Minimal', subtitle: 'Lowest priority' },
];

// ============ HEADER ============
const FormHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: 22 }]}>
      {/* Left spacer to keep title centered */}
      <View style={styles.headerSpacer} />
    
      <Text style={styles.headerTitle}>Add Goal</Text>
    
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
              <Text style={[styles.dropdownSelectedText, { color: selected.color || '#000' }]}>
                {selected.label}
              </Text>
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
                      { color: item.color || '#000' },
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

// ============ MILESTONE CARD ============
type MilestoneCardProps = {
  milestone: Milestone;
  index: number;
  onUpdate: (milestone: Milestone) => void;
  onRemove: () => void;
};

const MilestoneCard = ({ milestone, index, onUpdate, onRemove }: MilestoneCardProps) => (
  <View style={styles.milestoneCard}>
    <View style={styles.milestoneHeader}>
      <View style={styles.milestoneBadge}>
        <Text style={styles.milestoneBadgeText}>{index + 1}</Text>
      </View>
      <Text style={styles.milestoneTitle}>Milestone {index + 1}</Text>
      <TouchableOpacity onPress={onRemove} style={styles.milestoneRemove}>
        <SFSymbol name="trash.fill" size={16} color="#DC2626" />
      </TouchableOpacity>
    </View>
    <View style={styles.milestoneInputs}>
      <View style={styles.milestoneInputFull}>
        <Text style={styles.milestoneInputLabel}>Name</Text>
        <TextInput
          style={styles.milestoneInput}
          placeholder="e.g., 25% complete"
          placeholderTextColor="#C7C7CC"
          value={milestone.name}
          onChangeText={(text) => onUpdate({ ...milestone, name: text })}
        />
      </View>
      <View style={styles.milestoneInputRow}>
        <View style={styles.milestoneInputHalf}>
          <Text style={styles.milestoneInputLabel}>Target Amount</Text>
          <View style={styles.milestoneAmountWrapper}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={styles.milestoneInput}
              placeholder="0.00"
              placeholderTextColor="#C7C7CC"
              value={milestone.amount}
              onChangeText={(text) => onUpdate({ ...milestone, amount: text })}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View style={styles.milestoneInputHalf}>
          <Text style={styles.milestoneInputLabel}>Target Date</Text>
          <TextInput
            style={styles.milestoneInput}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#C7C7CC"
            value={milestone.date}
            onChangeText={(text) => onUpdate({ ...milestone, date: text })}
          />
        </View>
      </View>
    </View>
  </View>
);

// ============ MAIN COMPONENT ============
export default function AddGoalScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    goal_name: '',
    goal_type: null,
    target_amount: '',
    current_amount: '',
    deadline_date: '',
    priority_level: 5,
    is_mandatory: false,
    monthly_allocation: '',
    treat_as_bill: false,
    milestones: [],
    notes: '',
  });

  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      name: '',
      amount: '',
      date: '',
    };
    updateForm('milestones', [...formData.milestones, newMilestone]);
  };

  const updateMilestone = (index: number, milestone: Milestone) => {
    const updated = [...formData.milestones];
    updated[index] = milestone;
    updateForm('milestones', updated);
  };

  const removeMilestone = (index: number) => {
    const updated = formData.milestones.filter((_, i) => i !== index);
    updateForm('milestones', updated);
  };

  const canSubmit = () => {
    return (
      formData.goal_name.trim() !== '' &&
      formData.goal_type !== null &&
      formData.target_amount.trim() !== ''
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // TODO: API call to save goal
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Goal Created!',
        `${formData.goal_name} has been added to your goals.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress and timeline
  const calculateProgress = () => {
    const target = parseFloat(formData.target_amount) || 0;
    const current = parseFloat(formData.current_amount) || 0;
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const calculateMonthsToGoal = () => {
    const target = parseFloat(formData.target_amount) || 0;
    const current = parseFloat(formData.current_amount) || 0;
    const monthly = parseFloat(formData.monthly_allocation) || 0;
    if (monthly === 0) return null;
    const remaining = target - current;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / monthly);
  };

  const progress = calculateProgress();
  const monthsToGoal = calculateMonthsToGoal();

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
        {/* Goal Details */}
        <SectionHeader title="Goal Details" />
        
        <InputField
          label="Goal Name"
          placeholder="e.g., Emergency Fund, New Car, Vacation"
          value={formData.goal_name}
          onChangeText={(text) => updateForm('goal_name', text)}
        />

        <Dropdown
          label="Goal Type"
          placeholder="Select goal type"
          options={goalTypes}
          selectedId={formData.goal_type}
          onSelect={(id) => updateForm('goal_type', id)}
        />

        <Dropdown
          label="Priority Level"
          placeholder="Select priority"
          options={priorityLevels}
          selectedId={formData.priority_level.toString()}
          onSelect={(id) => updateForm('priority_level', parseInt(id) as PriorityLevel)}
        />

        <ToggleSwitch
          label="Mandatory Goal"
          description="This goal is non-negotiable"
          value={formData.is_mandatory}
          onToggle={() => updateForm('is_mandatory', !formData.is_mandatory)}
        />

        {/* Target & Progress */}
        <SectionHeader title="Target & Progress" />

        <InputField
          label="Target Amount"
          placeholder="0.00"
          value={formData.target_amount}
          onChangeText={(text) => updateForm('target_amount', text)}
          keyboardType="decimal-pad"
          prefix="$"
        />

        <InputField
          label="Current Amount Saved"
          placeholder="0.00"
          value={formData.current_amount}
          onChangeText={(text) => updateForm('current_amount', text)}
          keyboardType="decimal-pad"
          prefix="$"
          optional
        />

        {/* Progress Card */}
        {formData.target_amount && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Current Progress</Text>
              <Text style={styles.progressPercentage}>{progress.toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <View style={styles.progressAmounts}>
              <Text style={styles.progressCurrent}>
                ${parseFloat(formData.current_amount || '0').toLocaleString()}
              </Text>
              <Text style={styles.progressTarget}>
                of ${parseFloat(formData.target_amount).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <InputField
          label="Target Date"
          placeholder="MM/DD/YYYY"
          value={formData.deadline_date}
          onChangeText={(text) => updateForm('deadline_date', text)}
          optional
        />

        {/* Monthly Contribution */}
        <SectionHeader title="Monthly Contribution" />

        <InputField
          label="Monthly Allocation"
          placeholder="0.00"
          value={formData.monthly_allocation}
          onChangeText={(text) => updateForm('monthly_allocation', text)}
          keyboardType="decimal-pad"
          prefix="$"
          optional
        />

        <ToggleSwitch
          label="Treat as Bill"
          description="Add to your monthly bills for automatic tracking"
          value={formData.treat_as_bill}
          onToggle={() => updateForm('treat_as_bill', !formData.treat_as_bill)}
        />

        {/* Timeline Estimate */}
        {monthsToGoal !== null && formData.monthly_allocation && (
          <View style={styles.timelineCard}>
            <View style={styles.timelineIcon}>
              <SFSymbol name="calendar" size={24} color="#046C4E" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Estimated Time to Goal</Text>
              <Text style={styles.timelineValue}>
                {monthsToGoal === 0 
                  ? 'Goal achieved!' 
                  : monthsToGoal === 1 
                    ? '1 month' 
                    : monthsToGoal < 12 
                      ? `${monthsToGoal} months`
                      : `${Math.floor(monthsToGoal / 12)} years ${monthsToGoal % 12} months`
                }
              </Text>
            </View>
          </View>
        )}

        {/* Milestones */}
        <SectionHeader title="Milestones (Optional)" />

        <Text style={styles.milestonesSubtext}>
          Break down your goal into smaller, achievable milestones
        </Text>

        {formData.milestones.map((milestone, index) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            index={index}
            onUpdate={(updated) => updateMilestone(index, updated)}
            onRemove={() => removeMilestone(index)}
          />
        ))}

        <TouchableOpacity style={styles.addMilestoneButton} onPress={addMilestone}>
          
          <Text style={styles.addMilestoneText}>Add Milestone</Text>
        </TouchableOpacity>

        {/* Notes */}
        <SectionHeader title="Notes" />

        <InputField
          label="Additional Notes"
          placeholder="Why is this goal important to you?"
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
          disabled={!canSubmit() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>

              <Text style={styles.submitButtonText}>Create Goal</Text>
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
// Header
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingBottom: 16,          
  backgroundColor: '#FFFFFF',
  borderBottomWidth: 0.5,
  borderBottomColor: '#FFFFFF',
},

headerTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: '#000',
},

cancelText: {
  fontSize: 16,
  color: '#FF3B30',          
  fontWeight: '500',
},

headerSpacer: {
  width: 60,                
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
  },
  modalOptionLabelSelected: {
    fontWeight: '600',
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

  // Progress Card
  progressCard: {
    backgroundColor: '#046C4E15',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#046C4E',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#046C4E',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#046C4E',
    borderRadius: 4,
  },
  progressAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressCurrent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#046C4E',
  },
  progressTarget: {
    fontSize: 14,
    color: '#046C4E',
    marginLeft: 6,
  },

  // Timeline Card
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#046C4E15',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 8,
  },
  timelineIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#046C4E',
    marginBottom: 4,
  },
  timelineValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#046C4E',
  },

  // Milestones
  milestonesSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: -8,
    marginBottom: 16,
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#046C4E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  milestoneRemove: {
    padding: 8,
  },
  milestoneInputs: {
    gap: 12,
  },
  milestoneInputFull: {
    gap: 8,
  },
  milestoneInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  milestoneInputHalf: {
    flex: 1,
    gap: 8,
  },
  milestoneInputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  milestoneInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 16,
    color: '#000',
  },
  milestoneAmountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  addMilestoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#046C4E15',
    borderRadius: 16,
    padding: 18,
    gap: 10,
    borderWidth: 2,
    borderColor: '#046C4E30',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  addMilestoneText: {
    fontSize: 16,
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