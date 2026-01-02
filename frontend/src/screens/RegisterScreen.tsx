// src/screens/RegisterScreen.tsx
/**
 * Registration Screen for Fortuna
 * Beautiful iOS-native design with modal pickers
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SFSymbol } from 'react-native-sfsymbols';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

// ============ DATA ============

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'Washington D.C.' },
];

const OCCUPATIONS = [
  { id: 'employed', label: 'Employed', icon: 'briefcase.fill' },
  { id: 'self_employed', label: 'Self-employed', icon: 'person.crop.square.fill' },
  { id: 'student', label: 'Student', icon: 'graduationcap.fill' },
  { id: 'unemployed', label: 'Unemployed', icon: 'magnifyingglass' },
  { id: 'retired', label: 'Retired', icon: 'sun.max.fill' },
  { id: 'other', label: 'Other', icon: 'ellipsis.circle.fill' },
];

const MARITAL_STATUSES = [
  { id: 'single', label: 'Single' },
  { id: 'married', label: 'Married' },
  { id: 'divorced', label: 'Divorced' },
  { id: 'widowed', label: 'Widowed' },
  { id: 'separated', label: 'Separated' },
  { id: 'domestic_partnership', label: 'Domestic Partnership' },
];

type RegisterNavigationProp = StackNavigationProp<RootStackParamList, 'RegisterScreen'>;

// ============ SELECTION MODAL ============

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { id: string; label: string; icon?: string; subtitle?: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function SelectionModal({ visible, onClose, title, options, selectedId, onSelect }: SelectionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.modalOption,
                  selectedId === option.id && styles.modalOptionSelected,
                  index === options.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => {
                  onSelect(option.id);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                {option.icon && (
                  <View style={[
                    styles.modalOptionIcon,
                    selectedId === option.id && styles.modalOptionIconSelected,
                  ]}>
                    <SFSymbol name={option.icon} size={20} color={selectedId === option.id ? '#046C4E' : '#8E8E93'} />
                  </View>
                )}
                <View style={styles.modalOptionContent}>
                  <Text style={[
                    styles.modalOptionLabel,
                    selectedId === option.id && styles.modalOptionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  {option.subtitle && (
                    <Text style={styles.modalOptionSubtitle}>{option.subtitle}</Text>
                  )}
                </View>
                {selectedId === option.id && (
                  <SFSymbol name="checkmark" size={18} color="#046C4E" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============ DATE PICKER MODAL ============

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  value: Date;
  onChange: (date: Date) => void;
  maxDate: Date;
}

function DatePickerModal({ visible, onClose, value, onChange, maxDate }: DatePickerModalProps) {
  const [tempDate, setTempDate] = useState(value);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.datePickerContent} onPress={e => e.stopPropagation()}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.datePickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.datePickerTitle}>Date of Birth</Text>
            <TouchableOpacity onPress={() => { onChange(tempDate); onClose(); }}>
              <Text style={styles.datePickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            onChange={(_, date) => date && setTempDate(date)}
            maximumDate={maxDate}
            style={styles.datePicker}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============ INPUT FIELD ============

interface InputFieldProps {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words';
  autoComplete?: string;
  maxLength?: number;
  showToggle?: boolean;
  onToggle?: () => void;
  toggleState?: boolean;
}

function InputField({
  label, icon, placeholder, value, onChangeText, error,
  secureTextEntry, keyboardType = 'default', autoCapitalize = 'none',
  autoComplete, maxLength, showToggle, onToggle, toggleState,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[
        styles.fieldInput,
        isFocused && styles.fieldInputFocused,
        error && styles.fieldInputError,
      ]}>
        <SFSymbol name={icon} size={18} color={isFocused ? '#046C4E' : '#8E8E93'} />
        <TextInput
          style={styles.fieldTextInput}
          placeholder={placeholder}
          placeholderTextColor="#C7C7CC"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !toggleState}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete as any}
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <SFSymbol name={toggleState ? 'eye.slash.fill' : 'eye.fill'} size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ============ SELECTOR FIELD ============

interface SelectorFieldProps {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  displayValue?: string;
  onPress: () => void;
  error?: string;
}

function SelectorField({ label, icon, placeholder, value, displayValue, onPress, error }: SelectorFieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.fieldInput, error && styles.fieldInputError]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <SFSymbol name={icon} size={18} color="#8E8E93" />
        <Text style={[styles.fieldSelectorText, !value && styles.fieldSelectorPlaceholder]}>
          {displayValue || value || placeholder}
        </Text>
        <SFSymbol name="chevron.right" size={14} color="#C7C7CC" />
      </TouchableOpacity>
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ============ MAIN COMPONENT ============

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavigationProp>();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stateOfResidence, setStateOfResidence] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [occupation, setOccupation] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal state
  const [showStateModal, setShowStateModal] = useState(false);
  const [showOccupationModal, setShowOccupationModal] = useState(false);
  const [showMaritalModal, setShowMaritalModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Calculate max date (13 years ago)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13);

  // Phone formatting
  const formatPhone = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  // Format date for display
  const formatDateDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Format date for API
  const formatDateAPI = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Get display values
  const getStateDisplayValue = () => US_STATES.find(s => s.code === stateOfResidence)?.name || '';
  const getOccupationDisplayValue = () => OCCUPATIONS.find(o => o.id === occupation)?.label || '';
  const getMaritalDisplayValue = () => MARITAL_STATUSES.find(m => m.id === maritalStatus)?.label || '';

  // Clear error
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    }
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim() || firstName.trim().length < 2) {
      newErrors.firstName = 'Please enter your first name';
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      newErrors.lastName = 'Please enter your last name';
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Include uppercase, lowercase, and number';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!stateOfResidence) {
      newErrors.state = 'Please select your state';
    }
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Please enter your date of birth';
    }
    if (!occupation) {
      newErrors.occupation = 'Please select your occupation';
    }
    if (!maritalStatus) {
      newErrors.maritalStatus = 'Please select your marital status';
    }
    if (!agreedToTerms) {
      newErrors.terms = 'Please agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Password strength
  const getPasswordStrength = () => {
    if (!password) return { percent: 0, label: '', color: '#E5E5EA' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    if (score <= 2) return { percent: 33, label: 'Weak', color: '#EF4444' };
    if (score <= 3) return { percent: 66, label: 'Good', color: '#F59E0B' };
    return { percent: 100, label: 'Strong', color: '#22C55E' };
  };

  const passwordStrength = getPasswordStrength();

  // Handle registration
  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        state_of_residence: stateOfResidence,
        date_of_birth: formatDateAPI(dateOfBirth!),
        phone_number: phoneNumber.replace(/\D/g, '') || null,
        main_occupation: occupation,
        marital_status: maritalStatus,
      });

      if (result.success) {
        Alert.alert('Welcome to Fortuna!', 'Your account has been created.');
      } else {
        Alert.alert('Registration Failed', result.error || 'Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <SFSymbol name="chevron.left" size={22} color="#046C4E" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSubtitle}>Start your financial wellness journey</Text>
            </View>
          </View>

          {/* Form Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.row}>
              <View style={styles.halfField}>
                <InputField
                  label="First Name"
                  icon="person.fill"
                  placeholder="John"
                  value={firstName}
                  onChangeText={(t) => { setFirstName(t); clearError('firstName'); }}
                  autoCapitalize="words"
                  error={errors.firstName}
                />
              </View>
              <View style={styles.halfField}>
                <InputField
                  label="Last Name"
                  icon="person.fill"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={(t) => { setLastName(t); clearError('lastName'); }}
                  autoCapitalize="words"
                  error={errors.lastName}
                />
              </View>
            </View>

            <SelectorField
              label="Date of Birth"
              icon="calendar"
              placeholder="Select your date of birth"
              value={dateOfBirth ? 'selected' : ''}
              displayValue={formatDateDisplay(dateOfBirth)}
              onPress={() => setShowDatePicker(true)}
              error={errors.dateOfBirth}
            />

            <SelectorField
              label="State of Residence"
              icon="location.fill"
              placeholder="Select your state"
              value={stateOfResidence}
              displayValue={getStateDisplayValue()}
              onPress={() => setShowStateModal(true)}
              error={errors.state}
            />

            <InputField
              label="Phone Number (Optional)"
              icon="phone.fill"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChangeText={(t) => setPhoneNumber(formatPhone(t))}
              keyboardType="phone-pad"
              maxLength={14}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About You</Text>

            <SelectorField
              label="Occupation"
              icon="briefcase.fill"
              placeholder="Select your occupation"
              value={occupation}
              displayValue={getOccupationDisplayValue()}
              onPress={() => setShowOccupationModal(true)}
              error={errors.occupation}
            />

            <SelectorField
              label="Marital Status"
              icon="heart.fill"
              placeholder="Select your marital status"
              value={maritalStatus}
              displayValue={getMaritalDisplayValue()}
              onPress={() => setShowMaritalModal(true)}
              error={errors.maritalStatus}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Security</Text>

            <InputField
              label="Email"
              icon="envelope.fill"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => { setEmail(t); clearError('email'); }}
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
            />

            <InputField
              label="Password"
              icon="lock.fill"
              placeholder="Create a password"
              value={password}
              onChangeText={(t) => { setPassword(t); clearError('password'); }}
              secureTextEntry
              showToggle
              onToggle={() => setShowPassword(!showPassword)}
              toggleState={showPassword}
              error={errors.password}
            />

            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: `${passwordStrength.percent}%`, backgroundColor: passwordStrength.color }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
              </View>
            )}

            <InputField
              label="Confirm Password"
              icon="lock.fill"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
              secureTextEntry
              showToggle
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              toggleState={showConfirmPassword}
              error={errors.confirmPassword}
            />

            {confirmPassword && password === confirmPassword && (
              <View style={styles.matchBadge}>
                <SFSymbol name="checkmark.circle.fill" size={14} color="#22C55E" />
                <Text style={styles.matchText}>Passwords match</Text>
              </View>
            )}
          </View>

          {/* Terms */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => { setAgreedToTerms(!agreedToTerms); clearError('terms'); }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <SFSymbol name="checkmark" size={12} color="#FFF" />}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && <Text style={[styles.fieldError, { marginTop: -12, marginBottom: 16, marginLeft: 4 }]}>{errors.terms}</Text>}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Create Account</Text>
                <SFSymbol name="arrow.right" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <SelectionModal
        visible={showStateModal}
        onClose={() => setShowStateModal(false)}
        title="State of Residence"
        options={US_STATES.map(s => ({ id: s.code, label: s.name }))}
        selectedId={stateOfResidence}
        onSelect={(id) => { setStateOfResidence(id); clearError('state'); }}
      />

      <SelectionModal
        visible={showOccupationModal}
        onClose={() => setShowOccupationModal(false)}
        title="Occupation"
        options={OCCUPATIONS}
        selectedId={occupation}
        onSelect={(id) => { setOccupation(id); clearError('occupation'); }}
      />

      <SelectionModal
        visible={showMaritalModal}
        onClose={() => setShowMaritalModal(false)}
        title="Marital Status"
        options={MARITAL_STATUSES}
        selectedId={maritalStatus}
        onSelect={(id) => { setMaritalStatus(id); clearError('maritalStatus'); }}
      />

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={dateOfBirth || maxDate}
        onChange={(date) => { setDateOfBirth(date); clearError('dateOfBirth'); }}
        maxDate={maxDate}
      />
    </View>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  headerTextContainer: {
    flex: 1,
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },

  // Sections
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },

  // Row
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },

  // Fields
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 10,
  },
  fieldInputFocused: {
    borderColor: '#046C4E',
    backgroundColor: '#FFF',
  },
  fieldInputError: {
    borderColor: '#EF4444',
  },
  fieldTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  fieldSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  fieldSelectorPlaceholder: {
    color: '#C7C7CC',
  },
  fieldError: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
  },

  // Password Strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
    gap: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 50,
  },

  // Match Badge
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    gap: 6,
  },
  matchText: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '500',
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#046C4E',
    borderColor: '#046C4E',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#046C4E',
    fontWeight: '600',
  },

  // Submit Button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#046C4E',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#046C4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  footerLink: {
    fontSize: 15,
    color: '#046C4E',
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
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
    marginBottom: 8,
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    gap: 14,
  },
  modalOptionSelected: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionIconSelected: {
    backgroundColor: '#DCFCE7',
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionLabel: {
    fontSize: 17,
    color: '#000',
  },
  modalOptionLabelSelected: {
    color: '#046C4E',
    fontWeight: '600',
  },
  modalOptionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Date Picker Modal
  datePickerContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  datePickerCancel: {
    fontSize: 17,
    color: '#8E8E93',
  },
  datePickerDone: {
    fontSize: 17,
    fontWeight: '600',
    color: '#046C4E',
  },
  datePicker: {
    height: 200,
  },
});