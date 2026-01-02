// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SFSymbol } from 'react-native-sfsymbols';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
// ============ TYPES ============
type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'MXN';
type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
type TimeFormat = '12h' | '24h';
type WeekStart = 'sunday' | 'monday' | 'saturday';
type Theme = 'light' | 'dark' | 'system';

type UserProfile = {
  // Personal Info
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  
  // Profile Data
  occupation: string;
  risk_tolerance: string;
  spending_personality: string;
  household_size: number;
  dependents_count: number;
  primary_currency: Currency;
  timezone: string;
  location_city: string;
  location_state: string;
  
  // Account Info
  created_at: string;
  last_login: string;
  
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

// ============ SUB-COMPONENT TYPES ============
type InfoRowProps = {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: string;
  iconColor?: string;
};

type ToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
};

type ActionRowProps = {
  label: string;
  icon?: string;
  iconColor?: string;
  danger?: boolean;
  premium?: boolean;
  onPress?: () => void;
};

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

type HeaderProps = {
  activeTab: 'view' | 'edit';
  onTabChange: (tab: 'view' | 'edit') => void;
  hasChanges?: boolean;
  onSave?: () => void;
  saving?: boolean;
};

// ============ SUB-COMPONENTS ============
const InfoRow = ({ label, value, highlight, icon, iconColor = '#8E8E93' }: InfoRowProps) => (
  <View style={styles.infoRow}>
    {icon && (
      <View style={[styles.infoRowIcon, { backgroundColor: iconColor + '15' }]}>
        <SFSymbol name={icon} size={16} color={iconColor} />
      </View>
    )}
    <View style={styles.infoRowContent}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={[styles.infoRowValue, highlight && styles.highlight]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  </View>
);

const ToggleRow = ({ label, value, onChange, description }: ToggleRowProps) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleRowContent}>
      <Text style={styles.toggleRowLabel}>{label}</Text>
      {description && <Text style={styles.toggleRowDescription}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#E5E5EA"
    />
  </View>
);

const ActionRow = ({ label, icon, iconColor = '#007AFF', danger, premium, onPress }: ActionRowProps) => (
  <TouchableOpacity style={styles.actionRow} onPress={onPress}>
    <View style={styles.actionRowContent}>
      {icon && (
        <View style={[styles.actionRowIcon, { backgroundColor: danger ? '#FF3B3015' : iconColor + '15' }]}>
          <SFSymbol name={icon} size={18} color={danger ? '#FF3B30' : iconColor} />
        </View>
      )}
      <Text style={[styles.actionRowLabel, danger && styles.danger, premium && styles.premium]}>
        {label}
      </Text>
    </View>
    {!danger && (
      <SFSymbol name="chevron.right" size={14} color="#C7C7CC" />
    )}
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Badge = ({ text, premium = false }: { text: string; premium?: boolean }) => (
  <View style={[styles.badge, premium && styles.premiumBadge]}>
    <Text style={[styles.badgeText, premium && styles.premiumBadgeText]}>{text}</Text>
  </View>
);

const StatCard = ({ icon, iconColor, label, value }: { icon: string; iconColor: string; label: string; value: string }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: iconColor + '15' }]}>
      <SFSymbol name={icon} size={20} color={iconColor} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

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
        placeholderTextColor="#8E8E93"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
      />
    </View>
  </View>
);

const Header = ({ 
  activeTab, 
  onTabChange, 
  hasChanges, 
  onSave, 
  saving 
}: HeaderProps) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  return (
    <SafeAreaView style={styles.headerSafeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <SFSymbol name="chevron.left" size={20} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profile</Text>
        
        {activeTab === 'edit' ? (
          hasChanges ? (
            <TouchableOpacity onPress={onSave} disabled={saving} style={styles.saveButton}>
              {saving ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.headerPlaceholder} />
          )
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => onTabChange('edit')}>
            <SFSymbol name="pencil" size={18} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'view' && styles.tabActive]}
          onPress={() => onTabChange('view')}
        >
          <Text style={[styles.tabText, activeTab === 'view' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'edit' && styles.tabActive]}
          onPress={() => onTabChange('edit')}
        >
          <Text style={[styles.tabText, activeTab === 'edit' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ============ MAIN COMPONENT ============
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // View state
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Profile state
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
  const { logout } = useAuth();
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 800));

      // Mock profile data combining both screens
      const mockProfile: UserProfile = {
        full_name: 'Daniel Esambu',
        email: 'daniel@fortuna.app',
        phone: '+1 (555) 123-4567',
        avatar_url: undefined,
        
        occupation: 'Software Engineer',
        risk_tolerance: 'Moderate',
        spending_personality: 'Strategic Planner',
        household_size: 2,
        dependents_count: 1,
        primary_currency: 'USD',
        timezone: 'America/New_York',
        location_city: 'New York',
        location_state: 'NY',
        
        created_at: '2024-01-15',
        last_login: '2024-12-26',
        
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

    const handleLogout = () => {
    logout();
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
    if (!profile) return 'DE';
    const names = profile.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return profile.full_name.substring(0, 2).toUpperCase();
  };

  // ============ SUB-COMPONENTS ============

  const ProfileView = () => {
    if (!profile) return null;

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========= HERO SECTION ========= */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.avatarContainer}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials()}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.avatarEditButton}>
                <SFSymbol name="camera.fill" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.name}>{profile.full_name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <SFSymbol name="calendar" size={14} color="#007AFF" />
                <Text style={styles.statText}>
                  Joined {new Date(profile.created_at).getFullYear()}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <SFSymbol name="clock.fill" size={14} color="#007AFF" />
                <Text style={styles.statText}>
                  Active today
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ========= QUICK STATS ========= */}
        <View style={styles.statsSection}>
          <StatCard
            icon="chart.pie.fill"
            iconColor="#FF9500"
            label="Risk Level"
            value={profile.risk_tolerance}
          />
          <StatCard
            icon="person.2.fill"
            iconColor="#34C759"
            label="Household"
            value={`${profile.household_size} People`}
          />
          <StatCard
            icon="dollarsign.circle.fill"
            iconColor="#32D74B"
            label="Currency"
            value={profile.primary_currency}
          />
        </View>

        {/* ========= PERSONAL INFO ========= */}
        <SectionHeader title="Personal Information" />
        <Card>
          <InfoRow
            icon="briefcase.fill"
            iconColor="#8E8E93"
            label="Occupation"
            value={profile.occupation}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="location.fill"
            iconColor="#FF3B30"
            label="Location"
            value={`${profile.location_city}, ${profile.location_state}`}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="globe"
            iconColor="#007AFF"
            label="Timezone"
            value={profile.timezone}
          />
        </Card>

        {/* ========= FINANCIAL PROFILE ========= */}
        <SectionHeader title="Financial Profile" />
        <Card>
          <InfoRow
            icon="chart.line.uptrend.xyaxis"
            iconColor="#34C759"
            label="Spending Style"
            value={profile.spending_personality}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="person.3.fill"
            iconColor="#AF52DE"
            label="Dependents"
            value={`${profile.dependents_count} dependent${profile.dependents_count !== 1 ? 's' : ''}`}
          />
        </Card>

        {/* ========= SUBSCRIPTION ========= */}
        <SectionHeader title="Subscription" />
        <View style={[
          styles.subscriptionCard,
          profile.subscription_type === 'premium' && styles.premiumSubscriptionCard
        ]}>
          <View style={styles.subscriptionContent}>
            <View style={styles.subscriptionHeader}>
              <SFSymbol 
                name={profile.subscription_type === 'premium' ? 'crown.fill' : 'star.fill'} 
                size={24} 
                color={profile.subscription_type === 'premium' ? '#FFD700' : '#8E8E93'} 
              />
              <Text style={[
                styles.subscriptionTitle,
                profile.subscription_type === 'premium' && styles.premiumSubscriptionTitle
              ]}>
                {profile.subscription_type.charAt(0).toUpperCase() + profile.subscription_type.slice(1)} Plan
              </Text>
            </View>
            {profile.subscription_expires && (
              <Text style={[
                styles.subscriptionExpiry,
                profile.subscription_type === 'premium' && styles.premiumSubscriptionExpiry
              ]}>
                Renews {new Date(profile.subscription_expires).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
            <TouchableOpacity style={[
              styles.upgradeButton,
              profile.subscription_type === 'premium' && styles.premiumUpgradeButton
            ]}>
              <Text style={[
                styles.upgradeButtonText,
                profile.subscription_type === 'premium' && styles.premiumUpgradeButtonText
              ]}>
                {profile.subscription_type === 'premium' ? 'Manage' : 'Upgrade'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========= QUICK ACTIONS ========= */}
        <SectionHeader title="Quick Actions" />
        <Card>
          <ActionRow
            icon="pencil"
            iconColor="#007AFF"
            label="Edit Profile"
            onPress={() => setActiveTab('edit')}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="key.fill"
            iconColor="#FF9500"
            label="Change Password"
            onPress={() => setShowChangePasswordModal(true)}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="square.and.arrow.up"
            iconColor="#34C759"
            label="Export Data"
            onPress={handleExportData}
          />
        </Card>

        {/* ========= ACCOUNT ACTIONS ========= */}
        <SectionHeader title="Account" />
        <Card>
          <ActionRow
            icon="rectangle.portrait.and.arrow.right"
            iconColor="#8E8E93"
            label="Sign Out"
            onPress={handleLogout}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="trash"
            iconColor="#FF3B30"
            label="Delete Account"
            danger
            onPress={handleDeleteAccount}
          />
        </Card>

        <Text style={styles.version}>Fortuna v1.0.0 • iOS</Text>
      </ScrollView>
    );
  };

  const ProfileEdit = () => {
    if (!profile) return null;

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.editScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========= AVATAR SECTION ========= */}
        <View style={styles.editAvatarSection}>
          <View style={styles.editAvatarContainer}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.editAvatar} />
            ) : (
              <View style={styles.editAvatarPlaceholder}>
                <Text style={styles.editAvatarInitials}>{getInitials()}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <SFSymbol name="camera.fill" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.editAvatarName}>{profile.full_name}</Text>
          <Badge 
            text={profile.subscription_type.charAt(0).toUpperCase() + profile.subscription_type.slice(1)} 
            premium={profile.subscription_type === 'premium'}
          />
        </View>

        {/* ========= PERSONAL INFORMATION ========= */}
        <SectionHeader title="Personal Information" />
        <Card style={styles.editCard}>
          <InputField
            label="Full Name"
            value={profile.full_name}
            onChangeText={(text: string) => updateProfile('full_name', text)}
            autoCapitalize="words"
          />
          <View style={styles.divider} />
          <InputField
            label="Email"
            value={profile.email}
            onChangeText={(text: string) => updateProfile('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.divider} />
          <InputField
            label="Phone"
            value={profile.phone}
            onChangeText={(text: string) => updateProfile('phone', text)}
            keyboardType="phone-pad"
          />
          <View style={styles.divider} />
          <InputField
            label="Occupation"
            value={profile.occupation}
            onChangeText={(text: string) => updateProfile('occupation', text)}
          />
        </Card>

        {/* ========= LOCATION ========= */}
        <SectionHeader title="Location" />
        <Card style={styles.editCard}>
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <InputField
                label="City"
                value={profile.location_city}
                onChangeText={(text: string) => updateProfile('location_city', text)}
              />
            </View>
            <View style={styles.halfInput}>
              <InputField
                label="State"
                value={profile.location_state}
                onChangeText={(text: string) => updateProfile('location_state', text)}
              />
            </View>
          </View>
        </Card>

        {/* ========= FINANCIAL SETTINGS ========= */}
        <SectionHeader title="Financial Settings" />
        <Card style={styles.editCard}>
          <InputField
            label="Risk Tolerance"
            value={profile.risk_tolerance}
            onChangeText={(text: string) => updateProfile('risk_tolerance', text)}
          />
          <View style={styles.divider} />
          <InputField
            label="Spending Personality"
            value={profile.spending_personality}
            onChangeText={(text: string) => updateProfile('spending_personality', text)}
          />
          <View style={styles.divider} />
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <InputField
                label="Household Size"
                value={profile.household_size.toString()}
                onChangeText={(text: string) => updateProfile('household_size', parseInt(text) || 1)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <InputField
                label="Dependents"
                value={profile.dependents_count.toString()}
                onChangeText={(text: string) => updateProfile('dependents_count', parseInt(text) || 0)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        {/* ========= PREFERENCES ========= */}
        <SectionHeader title="Preferences" />
        <Card style={styles.editCard}>
          <ToggleRow
            label="Enable Notifications"
            value={profile.notifications_enabled}
            onChange={(value: boolean) => updateProfile('notifications_enabled', value)}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Budget Alerts"
            value={profile.budget_alerts}
            onChange={(value: boolean) => updateProfile('budget_alerts', value)}
            description="Get notified when close to budget limits"
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Share Anonymous Data"
            value={profile.share_anonymous_data}
            onChange={(value: boolean) => updateProfile('share_anonymous_data', value)}
            description="Help improve Fortuna anonymously"
          />
        </Card>

        {/* ========= SECURITY ========= */}
        <SectionHeader title="Security" />
        <Card style={styles.editCard}>
          <ActionRow
            icon="key.fill"
            iconColor="#FF9500"
            label="Change Password"
            onPress={() => setShowChangePasswordModal(true)}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="faceid"
            iconColor="#34C759"
            label="Face ID / Touch ID"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="lock.shield.fill"
            iconColor="#007AFF"
            label="Two-Factor Authentication"
            onPress={() => {}}
          />
        </Card>

        {/* ========= MORE SETTINGS ========= */}
        <SectionHeader title="More Settings" />
        <Card style={styles.editCard}>
          <ActionRow
            icon="creditcard.fill"
            iconColor="#FF2D55"
            label="Payment Methods"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="doc.text.fill"
            iconColor="#8E8E93"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="questionmark.circle.fill"
            iconColor="#007AFF"
            label="Help & Support"
            onPress={() => {}}
          />
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  // ============ RENDER ============
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <Header 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasChanges={hasChanges}
          onSave={handleSave}
          saving={saving}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <Header 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasChanges={hasChanges}
          onSave={handleSave}
          saving={saving}
        />
        <View style={styles.errorContainer}>
          <SFSymbol name="exclamationmark.triangle.fill" size={60} color="#FF9500" />
          <Text style={styles.errorTitle}>Failed to Load Profile</Text>
          <Text style={styles.errorMessage}>Please check your connection and try again</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <Header 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasChanges={activeTab === 'edit' && hasChanges}
        onSave={handleSave}
        saving={saving}
      />

      {activeTab === 'view' ? <ProfileView /> : <ProfileEdit />}

      {/* Modals would go here... */}
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
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerPlaceholder: {
    width: 44,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  editScrollContent: {
    paddingBottom: 40,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F2F2F7',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ========= VIEW MODE STYLES =========

  // Hero Section
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  heroContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
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
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#000',
    marginLeft: 6,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#C7C7CC',
    marginHorizontal: 16,
  },

  // Stats Section
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
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
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Badge
  badge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  premiumBadge: {
    backgroundColor: '#FF2D55',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  premiumBadgeText: {
    color: '#FFFFFF',
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoRowContent: {
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
  },
  infoRowValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  highlight: {
    color: '#007AFF',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 16,
  },

  // Subscription Card
  subscriptionCard: {
    backgroundColor: '#F2F2F7',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumSubscriptionCard: {
    backgroundColor: '#FF2D55',
  },
  subscriptionContent: {
    padding: 20,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  premiumSubscriptionTitle: {
    color: '#FFFFFF',
  },
  subscriptionExpiry: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 16,
  },
  premiumSubscriptionExpiry: {
    color: '#FFFFFF80',
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  premiumUpgradeButton: {
    backgroundColor: '#FFFFFF',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  premiumUpgradeButtonText: {
    color: '#FF2D55',
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionRowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  danger: {
    color: '#FF3B30',
  },
  premium: {
    color: '#FF2D55',
  },

  // Version
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 24,
    marginBottom: 8,
  },

  // ========= EDIT MODE STYLES =========

  // Edit Avatar
  editAvatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  editAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  editAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  editAvatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F2F2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  editAvatarName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },

  // Edit Card
  editCard: {
    padding: 0,
    overflow: 'hidden',
  },

  // Input
  inputContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  inputWrapperDisabled: {
    opacity: 0.6,
  },
  input: {
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  inputDisabled: {
    color: '#8E8E93',
  },

  // Row Inputs
  rowInputs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  toggleRowContent: {
    flex: 1,
  },
  toggleRowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  toggleRowDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },

  bottomSpacer: {
    height: 40,
  },
});