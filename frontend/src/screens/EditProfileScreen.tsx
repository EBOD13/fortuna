// src/screens/EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  Image,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

// ============ TYPES ============
type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'MXN';
type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
type TimeFormat = '12h' | '24h';
type WeekStart = 'sunday' | 'monday' | 'saturday';
type Theme = 'light' | 'dark' | 'system';

type UserProfile = {
  // Personal Info
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  date_of_birth?: string;
  
  // Location
  country: string;
  timezone: string;
  
  // Preferences
  currency: Currency;
  date_format: DateFormat;
  time_format: TimeFormat;
  week_start: WeekStart;
  theme: Theme;
  language: string;
  
  // Notifications
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  budget_alerts: boolean;
  bill_reminders: boolean;
  goal_updates: boolean;
  weekly_summary: boolean;
  monthly_report: boolean;
  spending_alerts: boolean;
  spending_alert_threshold: number;
  
  // Privacy
  share_anonymous_data: boolean;
  
  // Account
  created_at: string;
  subscription_type: 'free' | 'premium' | 'pro';
  subscription_expires?: string;
};

// ============ CONFIG ============
const currencyOptions: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { value: 'MXN', label: 'Mexican Peso', symbol: 'MX$' },
];

const dateFormatOptions: { value: DateFormat; label: string; example: string }[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/30/2024' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '30/12/2024' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2024-12-30' },
];

const weekStartOptions: { value: WeekStart; label: string }[] = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'saturday', label: 'Saturday' },
];

const themeOptions: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'sun.max.fill' },
  { value: 'dark', label: 'Dark', icon: 'moon.fill' },
  { value: 'system', label: 'System', icon: 'gearshape.fill' },
];

// ============ COMPONENTS ============
type SectionHeaderProps = {
  title: string;
  icon?: string;
  color?: string;
};

const SectionHeader = ({ title, icon, color = '#8E8E93' }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    {icon && (
      <View style={[styles.sectionHeaderIcon, { backgroundColor: color + '15' }]}>
        <SFSymbol name={icon} size={14} color={color} />
      </View>
    )}
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

type SettingRowProps = {
  icon: string;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
};

const SettingRow = ({
  icon,
  iconColor = '#8E8E93',
  label,
  value,
  onPress,
  showChevron = true,
  destructive = false,
  disabled = false,
}: SettingRowProps) => (
  <TouchableOpacity
    style={[styles.settingRow, disabled && styles.settingRowDisabled]}
    onPress={onPress}
    disabled={!onPress || disabled}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.settingRowIcon, { backgroundColor: iconColor + '15' }]}>
      <SFSymbol name={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.settingRowContent}>
      <Text style={[
        styles.settingRowLabel,
        destructive && styles.settingRowLabelDestructive,
      ]}>
        {label}
      </Text>
    </View>
    {value && <Text style={styles.settingRowValue}>{value}</Text>}
    {showChevron && onPress && (
      <SFSymbol name="chevron.right" size={14} color="#C7C7CC" />
    )}
  </TouchableOpacity>
);

type SettingToggleProps = {
  icon: string;
  iconColor?: string;
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
};

const SettingToggle = ({
  icon,
  iconColor = '#8E8E93',
  label,
  description,
  value,
  onToggle,
  disabled = false,
}: SettingToggleProps) => (
  <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
    <View style={[styles.settingRowIcon, { backgroundColor: iconColor + '15' }]}>
      <SFSymbol name={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.settingRowContent}>
      <Text style={styles.settingRowLabel}>{label}</Text>
      {description && <Text style={styles.settingRowDescription}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#E5E5EA', true: '#046C4E' }}
      thumbColor="#FFFFFF"
      disabled={disabled}
    />
  </View>
);

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  disabled?: boolean;
};

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  disabled = false,
}: InputFieldProps) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputWrapper, disabled && styles.inputWrapperDisabled]}>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
      />
    </View>
  </View>
);

// ============ SELECTION MODAL ============
type SelectionModalProps<T> = {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { value: T; label: string; subtitle?: string; icon?: string }[];
  selectedValue: T;
  onSelect: (value: T) => void;
};

function SelectionModal<T extends string>({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: SelectionModalProps<T>) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalDoneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.modalOption,
                selectedValue === option.value && styles.modalOptionSelected,
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              {option.icon && (
                <View style={styles.modalOptionIcon}>
                  <SFSymbol name={option.icon} size={20} color="#6B7280" />
                </View>
              )}
              <View style={styles.modalOptionContent}>
                <Text style={[
                  styles.modalOptionLabel,
                  selectedValue === option.value && styles.modalOptionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                {option.subtitle && (
                  <Text style={styles.modalOptionSubtitle}>{option.subtitle}</Text>
                )}
              </View>
              {selectedValue === option.value && (
                <SFSymbol name="checkmark.circle.fill" size={22} color="#046C4E" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============ MAIN COMPONENT ============
export default function EditProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Modal states
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showDateFormatModal, setShowDateFormatModal] = useState(false);
  const [showWeekStartModal, setShowWeekStartModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Mock profile data
      const mockProfile: UserProfile = {
        first_name: 'Alex',
        last_name: 'Johnson',
        email: 'alex.johnson@email.com',
        phone: '+1 (555) 123-4567',
        avatar_url: undefined,
        date_of_birth: '1995-06-15',
        
        country: 'United States',
        timezone: 'America/Los_Angeles',
        
        currency: 'USD',
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
        week_start: 'sunday',
        theme: 'system',
        language: 'English',
        
        notifications_enabled: true,
        email_notifications: true,
        push_notifications: true,
        budget_alerts: true,
        bill_reminders: true,
        goal_updates: true,
        weekly_summary: true,
        monthly_report: true,
        spending_alerts: true,
        spending_alert_threshold: 100,
        
        share_anonymous_data: false,
        
        created_at: '2024-01-15',
        subscription_type: 'premium',
        subscription_expires: '2025-01-15',
      };

      setProfile(mockProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    try {
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Please type "DELETE" to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I Understand',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: API call to delete account
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    });
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // TODO: Clear auth state
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'We\'ll prepare your data export and send it to your email within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Success', 'Data export requested. Check your email.');
          },
        },
      ]
    );
  };

  const getInitials = () => {
    if (!profile) return '?';
    return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <SFSymbol name="chevron.left" size={20} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <SFSymbol name="chevron.left" size={20} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <SFSymbol name="exclamationmark.triangle.fill" size={48} color="#F59E0B" />
          <Text style={styles.errorTitle}>Failed to Load Profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <SFSymbol name="chevron.left" size={20} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        {hasChanges ? (
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.avatarEditButton}>
              <SFSymbol name="camera.fill" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarName}>{profile.first_name} {profile.last_name}</Text>
          <View style={styles.subscriptionBadge}>
            <SFSymbol 
              name={profile.subscription_type === 'free' ? 'star' : 'star.fill'} 
              size={12} 
              color={profile.subscription_type === 'free' ? '#6B7280' : '#F59E0B'} 
            />
            <Text style={[
              styles.subscriptionText,
              profile.subscription_type !== 'free' && styles.subscriptionTextPremium,
            ]}>
              {profile.subscription_type.charAt(0).toUpperCase() + profile.subscription_type.slice(1)}
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        <SectionHeader title="Personal Information" icon="person.fill" color="#3B82F6" />
        
        <View style={styles.card}>
          <View style={styles.cardInputsRow}>
            <View style={styles.cardInputHalf}>
              <InputField
                label="First Name"
                value={profile.first_name}
                onChangeText={(text) => updateProfile('first_name', text)}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.cardInputHalf}>
              <InputField
                label="Last Name"
                value={profile.last_name}
                onChangeText={(text) => updateProfile('last_name', text)}
                autoCapitalize="words"
              />
            </View>
          </View>

          <InputField
            label="Email"
            value={profile.email}
            onChangeText={(text) => updateProfile('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Phone"
            value={profile.phone}
            onChangeText={(text) => updateProfile('phone', text)}
            keyboardType="phone-pad"
          />
        </View>

        {/* Preferences */}
        <SectionHeader title="Preferences" icon="gearshape.fill" color="#8B5CF6" />
        
        <View style={styles.cardNoPadding}>
          <SettingRow
            icon="dollarsign.circle.fill"
            iconColor="#22C55E"
            label="Currency"
            value={`${currencyOptions.find(c => c.value === profile.currency)?.symbol} ${profile.currency}`}
            onPress={() => setShowCurrencyModal(true)}
          />
          <SettingRow
            icon="calendar"
            iconColor="#3B82F6"
            label="Date Format"
            value={profile.date_format}
            onPress={() => setShowDateFormatModal(true)}
          />
          <SettingRow
            icon="clock.fill"
            iconColor="#F59E0B"
            label="Time Format"
            value={profile.time_format === '12h' ? '12-hour' : '24-hour'}
            onPress={() => updateProfile('time_format', profile.time_format === '12h' ? '24h' : '12h')}
          />
          <SettingRow
            icon="calendar.badge.clock"
            iconColor="#EC4899"
            label="Week Starts On"
            value={weekStartOptions.find(w => w.value === profile.week_start)?.label}
            onPress={() => setShowWeekStartModal(true)}
          />
          <SettingRow
            icon={themeOptions.find(t => t.value === profile.theme)?.icon || 'sun.max.fill'}
            iconColor="#6B7280"
            label="Theme"
            value={themeOptions.find(t => t.value === profile.theme)?.label}
            onPress={() => setShowThemeModal(true)}
            showChevron={false}
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" icon="bell.fill" color="#F59E0B" />
        
        <View style={styles.cardNoPadding}>
          <SettingToggle
            icon="bell.badge.fill"
            iconColor="#046C4E"
            label="Enable Notifications"
            value={profile.notifications_enabled}
            onToggle={(value) => updateProfile('notifications_enabled', value)}
          />
          
          {profile.notifications_enabled && (
            <>
              <SettingToggle
                icon="envelope.fill"
                iconColor="#3B82F6"
                label="Email Notifications"
                value={profile.email_notifications}
                onToggle={(value) => updateProfile('email_notifications', value)}
              />
              <SettingToggle
                icon="iphone"
                iconColor="#8B5CF6"
                label="Push Notifications"
                value={profile.push_notifications}
                onToggle={(value) => updateProfile('push_notifications', value)}
              />
              <SettingToggle
                icon="chart.pie.fill"
                iconColor="#DC2626"
                label="Budget Alerts"
                description="When you're close to budget limits"
                value={profile.budget_alerts}
                onToggle={(value) => updateProfile('budget_alerts', value)}
              />
              <SettingToggle
                icon="doc.text.fill"
                iconColor="#F59E0B"
                label="Bill Reminders"
                description="Before bills are due"
                value={profile.bill_reminders}
                onToggle={(value) => updateProfile('bill_reminders', value)}
              />
              <SettingToggle
                icon="target"
                iconColor="#046C4E"
                label="Goal Updates"
                description="Progress and milestone achievements"
                value={profile.goal_updates}
                onToggle={(value) => updateProfile('goal_updates', value)}
              />
              <SettingToggle
                icon="chart.bar.fill"
                iconColor="#0EA5E9"
                label="Weekly Summary"
                value={profile.weekly_summary}
                onToggle={(value) => updateProfile('weekly_summary', value)}
              />
              <SettingToggle
                icon="doc.richtext.fill"
                iconColor="#EC4899"
                label="Monthly Report"
                value={profile.monthly_report}
                onToggle={(value) => updateProfile('monthly_report', value)}
              />
            </>
          )}
        </View>

        {/* Spending Alerts */}
        {profile.notifications_enabled && (
          <>
            <SectionHeader title="Spending Alerts" icon="exclamationmark.triangle.fill" color="#DC2626" />
            
            <View style={styles.cardNoPadding}>
              <SettingToggle
                icon="dollarsign.arrow.circlepath"
                iconColor="#DC2626"
                label="Large Purchase Alerts"
                description={`Notify when spending over $${profile.spending_alert_threshold}`}
                value={profile.spending_alerts}
                onToggle={(value) => updateProfile('spending_alerts', value)}
              />
              
              {profile.spending_alerts && (
                <View style={styles.thresholdContainer}>
                  <Text style={styles.thresholdLabel}>Alert Threshold</Text>
                  <View style={styles.thresholdButtons}>
                    {[50, 100, 200, 500].map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        style={[
                          styles.thresholdButton,
                          profile.spending_alert_threshold === amount && styles.thresholdButtonActive,
                        ]}
                        onPress={() => updateProfile('spending_alert_threshold', amount)}
                      >
                        <Text style={[
                          styles.thresholdButtonText,
                          profile.spending_alert_threshold === amount && styles.thresholdButtonTextActive,
                        ]}>
                          ${amount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* Security */}
        <SectionHeader title="Security" icon="lock.fill" color="#6B7280" />
        
        <View style={styles.cardNoPadding}>
          <SettingRow
            icon="key.fill"
            iconColor="#F59E0B"
            label="Change Password"
            onPress={() => setShowChangePasswordModal(true)}
          />
          <SettingRow
            icon="faceid"
            iconColor="#3B82F6"
            label="Face ID / Touch ID"
            value="Enabled"
            onPress={() => {}}
          />
          <SettingRow
            icon="lock.shield.fill"
            iconColor="#046C4E"
            label="Two-Factor Authentication"
            value="Off"
            onPress={() => {}}
          />
        </View>

        {/* Privacy */}
        <SectionHeader title="Privacy" icon="hand.raised.fill" color="#8B5CF6" />
        
        <View style={styles.cardNoPadding}>
          <SettingToggle
            icon="chart.bar.doc.horizontal.fill"
            iconColor="#6B7280"
            label="Share Anonymous Data"
            description="Help improve Fortuna with anonymous usage data"
            value={profile.share_anonymous_data}
            onToggle={(value) => updateProfile('share_anonymous_data', value)}
          />
          <SettingRow
            icon="doc.text.fill"
            iconColor="#3B82F6"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <SettingRow
            icon="doc.plaintext.fill"
            iconColor="#3B82F6"
            label="Terms of Service"
            onPress={() => {}}
          />
        </View>

        {/* Data */}
        <SectionHeader title="Your Data" icon="externaldrive.fill" color="#0EA5E9" />
        
        <View style={styles.cardNoPadding}>
          <SettingRow
            icon="square.and.arrow.up.fill"
            iconColor="#046C4E"
            label="Export Data"
            onPress={handleExportData}
          />
          <SettingRow
            icon="arrow.triangle.2.circlepath"
            iconColor="#3B82F6"
            label="Sync Status"
            value="Synced"
            showChevron={false}
          />
        </View>

        {/* Account Actions */}
        <SectionHeader title="Account" icon="person.crop.circle.fill" color="#DC2626" />
        
        <View style={styles.cardNoPadding}>
          <SettingRow
            icon="rectangle.portrait.and.arrow.right.fill"
            iconColor="#F59E0B"
            label="Sign Out"
            onPress={handleSignOut}
            showChevron={false}
          />
          <SettingRow
            icon="trash.fill"
            iconColor="#DC2626"
            label="Delete Account"
            onPress={handleDeleteAccount}
            destructive
            showChevron={false}
          />
        </View>

        {/* Account Info */}
        <View style={styles.accountInfo}>
          <Text style={styles.accountInfoText}>
            Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          {profile.subscription_expires && (
            <Text style={styles.accountInfoText}>
              {profile.subscription_type.charAt(0).toUpperCase() + profile.subscription_type.slice(1)} expires {new Date(profile.subscription_expires).toLocaleDateString()}
            </Text>
          )}
          <Text style={styles.versionText}>Fortuna v1.0.0</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Selection Modals */}
      <SelectionModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        title="Select Currency"
        options={currencyOptions.map(c => ({
          value: c.value,
          label: `${c.symbol} ${c.label}`,
          subtitle: c.value,
        }))}
        selectedValue={profile.currency}
        onSelect={(value) => updateProfile('currency', value)}
      />

      <SelectionModal
        visible={showDateFormatModal}
        onClose={() => setShowDateFormatModal(false)}
        title="Date Format"
        options={dateFormatOptions.map(d => ({
          value: d.value,
          label: d.label,
          subtitle: `Example: ${d.example}`,
        }))}
        selectedValue={profile.date_format}
        onSelect={(value) => updateProfile('date_format', value)}
      />

      <SelectionModal
        visible={showWeekStartModal}
        onClose={() => setShowWeekStartModal(false)}
        title="Week Starts On"
        options={weekStartOptions.map(w => ({
          value: w.value,
          label: w.label,
        }))}
        selectedValue={profile.week_start}
        onSelect={(value) => updateProfile('week_start', value)}
      />

      <SelectionModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="Theme"
        options={themeOptions.map(t => ({
          value: t.value,
          label: t.label,
          icon: t.icon,
        }))}
        selectedValue={profile.theme}
        onSelect={(value) => updateProfile('theme', value)}
      />

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handleChangePassword}>
              <Text style={styles.modalDoneText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.passwordModalContent}>
            <InputField
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
              autoCapitalize="none"
            />
            <InputField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry
              autoCapitalize="none"
            />
            <InputField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.passwordRequirements}>
              <Text style={styles.passwordRequirementsTitle}>Password Requirements:</Text>
              <Text style={styles.passwordRequirement}>• At least 8 characters</Text>
              <Text style={styles.passwordRequirement}>• One uppercase letter</Text>
              <Text style={styles.passwordRequirement}>• One lowercase letter</Text>
              <Text style={styles.passwordRequirement}>• One number</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#046C4E',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerPlaceholder: {
    width: 50,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#046C4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F2F2F7',
  },
  avatarName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  subscriptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  subscriptionTextPremium: {
    color: '#F59E0B',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    gap: 8,
  },
  sectionHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  cardNoPadding: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardInputHalf: {
    flex: 1,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingRowContent: {
    flex: 1,
  },
  settingRowLabel: {
    fontSize: 16,
    color: '#000',
  },
  settingRowLabelDestructive: {
    color: '#DC2626',
  },
  settingRowDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  settingRowValue: {
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 8,
  },

  // Input
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  inputWrapperDisabled: {
    opacity: 0.6,
  },
  input: {
    fontSize: 16,
    color: '#000',
  },
  inputDisabled: {
    color: '#8E8E93',
  },

  // Threshold
  thresholdContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#F2F2F7',
  },
  thresholdLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  thresholdButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  thresholdButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  thresholdButtonActive: {
    backgroundColor: '#046C4E',
  },
  thresholdButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  thresholdButtonTextActive: {
    color: '#FFFFFF',
  },

  // Account Info
  accountInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  accountInfoText: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 13,
    color: '#C7C7CC',
    marginTop: 8,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  modalCancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  modalDoneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#046C4E10',
    borderWidth: 2,
    borderColor: '#046C4E',
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  modalOptionLabelSelected: {
    color: '#046C4E',
  },
  modalOptionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Password Modal
  passwordModalContent: {
    padding: 20,
  },
  passwordRequirements: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  passwordRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  passwordRequirement: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },

  bottomSpacer: {
    height: 40,
  },
});