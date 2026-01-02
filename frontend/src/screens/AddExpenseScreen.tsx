// src/screens/AddExpenseScreen.tsx
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
import DatePickerComponent, { QuickDateButtons } from '../components/inputs/DatePickerComponent';
import TimePicker, { TimeValue, QuickTimeButtons } from '../components/inputs/TimePicker';
import { useCreateExpense } from '../hooks/useExpense';
import { 
  CreateExpenseRequest, 
  ExpenseCategory, 
  EmotionType as APIEmotionType,
  PaymentMethod as APIPaymentMethod,
} from '../api/types';

// ============ TYPES ============
// Form-specific types (for UI display)
type FormCategoryType = 'food' | 'groceries' | 'dining' | 'transport' | 'utilities' | 'entertainment' | 'shopping' | 'healthcare' | 'education' | 'pets' | 'subscriptions' | 'gifts' | 'personal' | 'other';
type FormPaymentMethod = 'cash' | 'debit' | 'credit' | 'bank_transfer' | 'venmo' | 'apple_pay' | 'other';
type FormEmotionType = 'happy' | 'excited' | 'neutral' | 'stressed' | 'anxious' | 'sad' | 'bored' | 'frustrated' | 'celebratory' | 'guilty' | 'impulsive' | 'content';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

type DropdownOption = {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  subtitle?: string;
};

type FormData = {
  expense_name: string;
  amount: string;
  category_id: FormCategoryType | null;
  expense_date: Date;
  expense_time: TimeValue;
  payment_method: FormPaymentMethod | null;
  merchant_name: string;
  location: string;
  
  // Emotional tracking
  was_urgent: boolean;
  was_necessary: boolean;
  is_asset: boolean;
  primary_emotion: FormEmotionType | null;
  emotion_intensity: number;
  purchase_reason: string;
  time_of_day: TimeOfDay | null;
  stress_level: number;
  
  // Recurring
  is_recurring: boolean;
  recurrence_frequency: string | null;
  
  // Notes
  notes: string;
  tags: string[];
};

// ============ DROPDOWN OPTIONS ============
const categories: DropdownOption[] = [
  { id: 'groceries', label: 'Groceries', icon: 'cart.fill', color: '#046C4E', subtitle: 'Food & household items' },
  { id: 'dining', label: 'Dining Out', icon: 'fork.knife', color: '#F59E0B', subtitle: 'Restaurants & takeout' },
  { id: 'transport', label: 'Transportation', icon: 'car.fill', color: '#2563EB', subtitle: 'Gas, uber, transit' },
  { id: 'utilities', label: 'Utilities', icon: 'bolt.fill', color: '#7C3AED', subtitle: 'Electric, water, internet' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film.fill', color: '#DB2777', subtitle: 'Movies, games, events' },
  { id: 'shopping', label: 'Shopping', icon: 'bag.fill', color: '#0891B2', subtitle: 'Clothes, electronics' },
  { id: 'healthcare', label: 'Healthcare', icon: 'heart.fill', color: '#DC2626', subtitle: 'Medical, pharmacy' },
  { id: 'education', label: 'Education', icon: 'book.fill', color: '#4F46E5', subtitle: 'Books, courses, supplies' },
  { id: 'pets', label: 'Pet Care', icon: 'pawprint.fill', color: '#EA580C', subtitle: 'Food, vet, supplies' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'repeat', color: '#6366F1', subtitle: 'Monthly services' },
  { id: 'gifts', label: 'Gifts', icon: 'gift.fill', color: '#EC4899', subtitle: 'Presents for others' },
  { id: 'personal', label: 'Personal Care', icon: 'sparkles', color: '#14B8A6', subtitle: 'Haircut, skincare' },
  { id: 'other', label: 'Other', icon: 'ellipsis.circle.fill', color: '#6B7280', subtitle: 'Everything else' },
];

const paymentMethods: DropdownOption[] = [
  { id: 'debit', label: 'Debit Card', icon: 'creditcard.fill', color: '#046C4E' },
  { id: 'credit', label: 'Credit Card', icon: 'creditcard.fill', color: '#7C3AED' },
  { id: 'cash', label: 'Cash', icon: 'banknote.fill', color: '#F59E0B' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: 'building.columns.fill', color: '#2563EB' },
  { id: 'venmo', label: 'Venmo / PayPal', icon: 'dollarsign.circle.fill', color: '#0891B2' },
  { id: 'apple_pay', label: 'Apple Pay', icon: 'apple.logo', color: '#000000' },
  { id: 'other', label: 'Other', icon: 'ellipsis.circle.fill', color: '#6B7280' },
];

const emotions: DropdownOption[] = [
  { id: 'happy', label: 'Happy', icon: 'face.smiling.fill', color: '#046C4E' },
  { id: 'excited', label: 'Excited', icon: 'star.fill', color: '#F59E0B' },
  { id: 'content', label: 'Content', icon: 'checkmark.seal.fill', color: '#22C55E' },
  { id: 'neutral', label: 'Neutral', icon: 'face.smiling', color: '#6B7280' },
  { id: 'stressed', label: 'Stressed', icon: 'exclamationmark.triangle.fill', color: '#DC2626' },
  { id: 'anxious', label: 'Anxious', icon: 'waveform.path.ecg', color: '#7C3AED' },
  { id: 'sad', label: 'Sad', icon: 'cloud.rain.fill', color: '#2563EB' },
  { id: 'bored', label: 'Bored', icon: 'moon.zzz.fill', color: '#8B5CF6' },
  { id: 'frustrated', label: 'Frustrated', icon: 'flame.fill', color: '#EF4444' },
  { id: 'impulsive', label: 'Impulsive', icon: 'bolt.fill', color: '#EA580C' },
  { id: 'celebratory', label: 'Celebratory', icon: 'party.popper.fill', color: '#EC4899' },
  { id: 'guilty', label: 'Guilty', icon: 'eye.slash.fill', color: '#78716C' },
];

const timeOfDayOptions: DropdownOption[] = [
  { id: 'morning', label: 'Morning', icon: 'sunrise.fill', color: '#F59E0B', subtitle: '6am - 12pm' },
  { id: 'afternoon', label: 'Afternoon', icon: 'sun.max.fill', color: '#EA580C', subtitle: '12pm - 5pm' },
  { id: 'evening', label: 'Evening', icon: 'sunset.fill', color: '#7C3AED', subtitle: '5pm - 9pm' },
  { id: 'night', label: 'Night', icon: 'moon.stars.fill', color: '#2563EB', subtitle: '9pm - 6am' },
];

const frequencies: DropdownOption[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Annually' },
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
      <Text style={styles.headerTitle}>Log Expense</Text>
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

// ============ INTENSITY SLIDER ============
type IntensitySliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
};

const IntensitySlider = ({ label, value, onChange, max = 10, lowLabel = 'Low', highLabel = 'High' }: IntensitySliderProps) => (
  <View style={styles.sliderContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{lowLabel}</Text>
      <View style={styles.sliderButtons}>
        {Array.from({ length: max }, (_, i) => i + 1).map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.sliderButton,
              value === num && styles.sliderButtonActive,
              value === num && { backgroundColor: getIntensityColor(num, max) },
            ]}
            onPress={() => onChange(num)}
          >
            <Text style={[
              styles.sliderButtonText,
              value === num && styles.sliderButtonTextActive,
            ]}>
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sliderLabel}>{highLabel}</Text>
    </View>
  </View>
);

const getIntensityColor = (value: number, max: number): string => {
  const ratio = value / max;
  if (ratio <= 0.3) return '#046C4E';
  if (ratio <= 0.6) return '#F59E0B';
  return '#DC2626';
};

// ============ QUICK TOGGLE BUTTONS ============
type QuickTogglesProps = {
  wasUrgent: boolean;
  wasNecessary: boolean;
  isAsset: boolean;
  onToggleUrgent: () => void;
  onToggleNecessary: () => void;
  onToggleAsset: () => void;
};

const QuickToggles = ({ wasUrgent, wasNecessary, isAsset, onToggleUrgent, onToggleNecessary, onToggleAsset }: QuickTogglesProps) => (
  <View style={styles.quickTogglesContainer}>
    <TouchableOpacity
      style={[styles.quickToggle, wasUrgent && styles.quickToggleActive]}
      onPress={onToggleUrgent}
    >
      <SFSymbol name="exclamationmark.circle.fill" size={20} color={wasUrgent ? '#FFFFFF' : '#DC2626'} />
      <Text style={[styles.quickToggleText, wasUrgent && styles.quickToggleTextActive]}>Urgent</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.quickToggle, wasNecessary && styles.quickToggleActiveGreen]}
      onPress={onToggleNecessary}
    >
      <SFSymbol name="checkmark.seal.fill" size={20} color={wasNecessary ? '#FFFFFF' : '#046C4E'} />
      <Text style={[styles.quickToggleText, wasNecessary && styles.quickToggleTextActive]}>Necessary</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.quickToggle, isAsset && styles.quickToggleActiveBlue]}
      onPress={onToggleAsset}
    >
      <SFSymbol name="chart.line.uptrend.xyaxis" size={20} color={isAsset ? '#FFFFFF' : '#2563EB'} />
      <Text style={[styles.quickToggleText, isAsset && styles.quickToggleTextActive]}>Asset</Text>
    </TouchableOpacity>
  </View>
);

// ============ MAIN COMPONENT ============
export default function AddExpenseScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { createExpense, isSubmitting } = useCreateExpense();
  const [showEmotionalSection, setShowEmotionalSection] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    expense_name: '',
    amount: '',
    category_id: null,
    expense_date: new Date(),
    expense_time: {
      hours: new Date().getHours(),
      minutes: Math.round(new Date().getMinutes() / 5) * 5, // Round to nearest 5
    },
    payment_method: null,
    merchant_name: '',
    location: '',
    
    // Emotional tracking
    was_urgent: false,
    was_necessary: false,
    is_asset: false,
    primary_emotion: null,
    emotion_intensity: 5,
    purchase_reason: '',
    time_of_day: null,
    stress_level: 5,
    
    // Recurring
    is_recurring: false,
    recurrence_frequency: null,
    
    // Notes
    notes: '',
    tags: [],
  });

  // Auto-detect time of day based on expense_time
  React.useEffect(() => {
    const hour = formData.expense_time.hours;
    let timeOfDay: TimeOfDay;
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    setFormData(prev => ({ ...prev, time_of_day: timeOfDay }));
  }, [formData.expense_time.hours]);

  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const canSubmit = () => {
    return (
      formData.expense_name.trim() !== '' &&
      formData.amount.trim() !== '' &&
      formData.category_id !== null
    );
  };

  // Map form category to API category
  const mapCategoryToAPI = (category: FormCategoryType): ExpenseCategory => {
    const mapping: Record<FormCategoryType, ExpenseCategory> = {
      food: 'food',
      groceries: 'groceries',
      dining: 'dining',
      transport: 'transport',
      utilities: 'utilities',
      entertainment: 'entertainment',
      shopping: 'shopping',
      healthcare: 'healthcare',
      education: 'education',
      pets: 'pets',
      subscriptions: 'subscriptions',
      gifts: 'gifts',
      personal: 'personal',
      other: 'other',
    };
    return mapping[category] || 'other';
  };

  // Map form payment method to API payment method
  const mapPaymentMethodToAPI = (method: FormPaymentMethod): APIPaymentMethod => {
    const mapping: Record<FormPaymentMethod, APIPaymentMethod> = {
      cash: 'cash',
      debit: 'debit',
      credit: 'credit',
      bank_transfer: 'bank_transfer',
      venmo: 'venmo',
      apple_pay: 'apple_pay',
      other: 'other',
    };
    return mapping[method] || 'other';
  };

  // Map form emotion to API emotion
  const mapEmotionToAPI = (emotion: FormEmotionType): APIEmotionType => {
    const mapping: Record<FormEmotionType, APIEmotionType> = {
      happy: 'happy',
      excited: 'excited',
      content: 'content',
      neutral: 'neutral',
      stressed: 'stressed',
      anxious: 'anxious',
      sad: 'sad',
      bored: 'bored',
      frustrated: 'frustrated',
      impulsive: 'impulsive',
      celebratory: 'celebratory',
      guilty: 'guilty',
    };
    return mapping[emotion] || 'neutral';
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !formData.category_id) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Format time as HH:MM
    const timeStr = `${formData.expense_time.hours.toString().padStart(2, '0')}:${formData.expense_time.minutes.toString().padStart(2, '0')}`;

    // Build API request
    const requestData: CreateExpenseRequest = {
      amount: parseFloat(formData.amount),
      description: formData.expense_name.trim(),
      category: mapCategoryToAPI(formData.category_id),
      expense_date: formData.expense_date.toISOString().split('T')[0],
      expense_time: timeStr,
      merchant: formData.merchant_name || undefined,
      location: formData.location || undefined,
      payment_method: formData.payment_method 
        ? mapPaymentMethodToAPI(formData.payment_method) 
        : undefined,
      emotion: formData.primary_emotion 
        ? mapEmotionToAPI(formData.primary_emotion) 
        : undefined,
      emotion_intensity: formData.primary_emotion ? formData.emotion_intensity : undefined,
      stress_level: formData.stress_level,
      was_planned: !formData.was_urgent,
      was_necessary: formData.was_necessary,
      is_recurring: formData.is_recurring,
      recurring_frequency: formData.is_recurring && formData.recurrence_frequency 
        ? formData.recurrence_frequency as any 
        : undefined,
      notes: formData.notes || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    };

    const result = await createExpense(requestData);
    
    if (result) {
      Alert.alert(
        'Expense Logged! 📝',
        `$${formData.amount} for ${formData.expense_name} has been recorded.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
    // Error is handled in the hook
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
        {/* Quick Entry Card */}
        <View style={styles.quickEntryCard}>
          <View style={styles.amountInputLarge}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#C7C7CC"
              value={formData.amount}
              onChangeText={(text) => updateForm('amount', text)}
              keyboardType="decimal-pad"
            />
          </View>
          <TextInput
            style={styles.nameInput}
            placeholder="What did you spend on?"
            placeholderTextColor="#8E8E93"
            value={formData.expense_name}
            onChangeText={(text) => updateForm('expense_name', text)}
          />
        </View>

        {/* Basic Details */}
        <SectionHeader title="Details" icon="doc.text.fill" color="#2563EB" />

        <Dropdown
          label="Category"
          placeholder="Select category"
          options={categories}
          selectedId={formData.category_id}
          onSelect={(id) => updateForm('category_id', id)}
        />

        <View style={styles.rowInputs}>
          <View style={styles.rowInputHalf}>
            <DatePickerComponent
              label="Date"
              value={formData.expense_date}
              onChange={(date) => updateForm('expense_date', date)}
              variant="field"
              format="medium"
              maxDate={new Date()}
            />
          </View>
          <View style={styles.rowInputHalf}>
            <TimePicker
              label="Time"
              value={formData.expense_time}
              onChange={(time) => updateForm('expense_time', time)}
              variant="field"
              format="12h"
              minuteInterval={5}
            />
          </View>
        </View>

        <Dropdown
          label="Payment Method"
          placeholder="How did you pay?"
          options={paymentMethods}
          selectedId={formData.payment_method}
          onSelect={(id) => updateForm('payment_method', id)}
          optional
        />

        <InputField
          label="Merchant / Store"
          placeholder="e.g., Walmart, Amazon, Starbucks"
          value={formData.merchant_name}
          onChangeText={(text) => updateForm('merchant_name', text)}
          optional
        />

        {/* Emotional Tracking Section */}
        <TouchableOpacity 
          style={styles.sectionToggle}
          onPress={() => setShowEmotionalSection(!showEmotionalSection)}
        >
          <View style={styles.sectionToggleLeft}>
            <View style={[styles.sectionHeaderIcon, { backgroundColor: '#EC489915' }]}>
              <SFSymbol name="heart.fill" size={16} color="#EC4899" />
            </View>
            <Text style={styles.sectionHeader}>How Were You Feeling?</Text>
          </View>
          <SFSymbol 
            name={showEmotionalSection ? "chevron.up" : "chevron.down"} 
            size={16} 
            color="#8E8E93" 
          />
        </TouchableOpacity>

        {showEmotionalSection && (
          <View style={styles.emotionalSection}>
            {/* Quick Classification */}
            <Text style={styles.inputLabel}>Classify this expense</Text>
            <QuickToggles
              wasUrgent={formData.was_urgent}
              wasNecessary={formData.was_necessary}
              isAsset={formData.is_asset}
              onToggleUrgent={() => updateForm('was_urgent', !formData.was_urgent)}
              onToggleNecessary={() => updateForm('was_necessary', !formData.was_necessary)}
              onToggleAsset={() => updateForm('is_asset', !formData.is_asset)}
            />

            <Dropdown
              label="Primary Emotion"
              placeholder="How were you feeling?"
              options={emotions}
              selectedId={formData.primary_emotion}
              onSelect={(id) => updateForm('primary_emotion', id)}
            />

            <IntensitySlider
              label="Emotion Intensity"
              value={formData.emotion_intensity}
              onChange={(value) => updateForm('emotion_intensity', value)}
              lowLabel="Mild"
              highLabel="Intense"
            />

            <IntensitySlider
              label="Stress Level"
              value={formData.stress_level}
              onChange={(value) => updateForm('stress_level', value)}
              lowLabel="Calm"
              highLabel="Stressed"
            />

            <Dropdown
              label="Time of Day"
              placeholder="When did this happen?"
              options={timeOfDayOptions}
              selectedId={formData.time_of_day}
              onSelect={(id) => updateForm('time_of_day', id)}
            />

            <InputField
              label="Why did you make this purchase?"
              placeholder="What motivated you to buy this?"
              value={formData.purchase_reason}
              onChangeText={(text) => updateForm('purchase_reason', text)}
              multiline
            />
          </View>
        )}

        {/* Recurring */}
        <SectionHeader title="Recurring" icon="repeat" color="#7C3AED" />

        <ToggleSwitch
          label="Recurring Expense"
          description="This expense happens regularly"
          value={formData.is_recurring}
          onToggle={() => updateForm('is_recurring', !formData.is_recurring)}
        />

        {formData.is_recurring && (
          <Dropdown
            label="Frequency"
            placeholder="How often?"
            options={frequencies}
            selectedId={formData.recurrence_frequency}
            onSelect={(id) => updateForm('recurrence_frequency', id)}
          />
        )}

        {/* Notes */}
        <InputField
          label="Notes"
          placeholder="Any additional details..."
          value={formData.notes}
          onChangeText={(text) => updateForm('notes', text)}
          multiline
          optional
        />

        {/* Info Card */}
        <View style={styles.infoCard}>
          <SFSymbol name="lightbulb.fill" size={20} color="#F59E0B" />
          <Text style={styles.infoCardText}>
            Tracking your emotions helps Fortuna understand your spending patterns and provide personalized insights at the end of each month.
          </Text>
        </View>

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
              <Text style={styles.submitButtonText}>Log Expense</Text>
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
    paddingTop: 20,
  },

  // Quick Entry Card
  quickEntryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  amountInputLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '300',
    color: '#8E8E93',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
    minWidth: 150,
    textAlign: 'center',
  },
  nameInput: {
    fontSize: 17,
    color: '#000',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
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

  // Section Toggle
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 8,
  },
  sectionToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Emotional Section
  emotionalSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
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

  // Quick Toggles
  quickTogglesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    marginTop: 10,
  },
  quickToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  quickToggleActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  quickToggleActiveGreen: {
    backgroundColor: '#046C4E',
    borderColor: '#046C4E',
  },
  quickToggleActiveBlue: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  quickToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  quickToggleTextActive: {
    color: '#FFFFFF',
  },

  // Intensity Slider
  sliderContainer: {
    marginBottom: 20,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#8E8E93',
    width: 50,
  },
  sliderButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  sliderButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonActive: {
    backgroundColor: '#046C4E',
  },
  sliderButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  sliderButtonTextActive: {
    color: '#FFFFFF',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F59E0B10',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
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