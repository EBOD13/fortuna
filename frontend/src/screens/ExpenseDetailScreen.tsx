// src/screens/ExpenseDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

// ============ TYPES ============
type ExpenseCategory = 
  | 'food' | 'dining' | 'groceries' | 'transport' | 'entertainment' 
  | 'shopping' | 'utilities' | 'healthcare' | 'education' | 'personal' 
  | 'gifts' | 'travel' | 'subscriptions' | 'housing' | 'insurance'
  | 'childcare' | 'pets' | 'fitness' | 'beauty' | 'other';

type EmotionType = 
  | 'happy' | 'excited' | 'content' | 'neutral' | 'stressed' 
  | 'anxious' | 'sad' | 'frustrated' | 'guilty' | 'impulsive'
  | 'bored' | 'celebratory';

type PaymentMethod = 
  | 'cash' | 'credit' | 'debit' | 'venmo' | 'apple_pay' 
  | 'google_pay' | 'bank_transfer' | 'other';

type ExpenseStatus = 'pending' | 'confirmed' | 'disputed' | 'refunded';

type RecurringFrequency = 
  | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

type Expense = {
  expense_id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  subcategory?: string;
  date: string;
  time?: string;
  merchant?: string;
  location?: string;
  payment_method?: PaymentMethod;
  status: ExpenseStatus;
  
  // Emotional tracking
  emotion?: EmotionType;
  emotion_intensity?: number; // 1-5
  stress_level?: number; // 1-5
  was_planned: boolean;
  was_necessary: boolean;
  satisfaction_rating?: number; // 1-5
  
  // Relationships
  dependent_id?: string;
  dependent_name?: string;
  budget_id?: string;
  budget_name?: string;
  goal_impact?: string;
  
  // Recurring
  is_recurring: boolean;
  recurring_frequency?: RecurringFrequency;
  next_occurrence?: string;
  
  // Additional
  notes?: string;
  tags?: string[];
  receipt_url?: string;
  
  // Reflection
  reflection?: {
    prompt: string;
    response?: string;
    created_at?: string;
  };
  
  // Related
  similar_expenses?: {
    expense_id: string;
    description: string;
    amount: number;
    date: string;
    emotion?: EmotionType;
  }[];
  
  // Meta
  created_at: string;
  updated_at: string;
};

// ============ CONFIG ============
const categoryConfig: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  food: { label: 'Food', icon: 'fork.knife', color: '#F59E0B' },
  dining: { label: 'Dining', icon: 'fork.knife.circle.fill', color: '#F97316' },
  groceries: { label: 'Groceries', icon: 'cart.fill', color: '#84CC16' },
  transport: { label: 'Transport', icon: 'car.fill', color: '#3B82F6' },
  entertainment: { label: 'Entertainment', icon: 'film.fill', color: '#8B5CF6' },
  shopping: { label: 'Shopping', icon: 'bag.fill', color: '#EC4899' },
  utilities: { label: 'Utilities', icon: 'bolt.fill', color: '#F59E0B' },
  healthcare: { label: 'Healthcare', icon: 'heart.fill', color: '#EF4444' },
  education: { label: 'Education', icon: 'book.fill', color: '#6366F1' },
  personal: { label: 'Personal', icon: 'person.fill', color: '#14B8A6' },
  gifts: { label: 'Gifts', icon: 'gift.fill', color: '#F472B6' },
  travel: { label: 'Travel', icon: 'airplane', color: '#0EA5E9' },
  subscriptions: { label: 'Subscriptions', icon: 'repeat', color: '#7C3AED' },
  housing: { label: 'Housing', icon: 'house.fill', color: '#78716C' },
  insurance: { label: 'Insurance', icon: 'shield.fill', color: '#14B8A6' },
  childcare: { label: 'Childcare', icon: 'figure.and.child.holdinghands', color: '#FB923C' },
  pets: { label: 'Pets', icon: 'pawprint.fill', color: '#A78BFA' },
  fitness: { label: 'Fitness', icon: 'figure.run', color: '#22C55E' },
  beauty: { label: 'Beauty', icon: 'sparkles', color: '#E879F9' },
  other: { label: 'Other', icon: 'ellipsis.circle.fill', color: '#6B7280' },
};

const emotionConfig: Record<EmotionType, { label: string; emoji: string; color: string; description: string }> = {
  happy: { label: 'Happy', emoji: '😊', color: '#22C55E', description: 'Feeling good about this purchase' },
  excited: { label: 'Excited', emoji: '🤩', color: '#F59E0B', description: 'Thrilled and enthusiastic' },
  content: { label: 'Content', emoji: '😌', color: '#14B8A6', description: 'Satisfied and at peace' },
  neutral: { label: 'Neutral', emoji: '😐', color: '#6B7280', description: 'No strong feelings' },
  stressed: { label: 'Stressed', emoji: '😰', color: '#EF4444', description: 'Feeling pressured or worried' },
  anxious: { label: 'Anxious', emoji: '😟', color: '#F97316', description: 'Worried about finances' },
  sad: { label: 'Sad', emoji: '😢', color: '#3B82F6', description: 'Feeling down or regretful' },
  frustrated: { label: 'Frustrated', emoji: '😤', color: '#DC2626', description: 'Annoyed or irritated' },
  guilty: { label: 'Guilty', emoji: '😔', color: '#7C3AED', description: 'Feeling bad about spending' },
  impulsive: { label: 'Impulsive', emoji: '🙈', color: '#EC4899', description: 'Spontaneous, unplanned' },
  bored: { label: 'Bored', emoji: '😑', color: '#9CA3AF', description: 'Shopping out of boredom' },
  celebratory: { label: 'Celebratory', emoji: '🎉', color: '#FBBF24', description: 'Celebrating something special' },
};

const statusConfig: Record<ExpenseStatus, { label: string; icon: string; color: string }> = {
  pending: { label: 'Pending', icon: 'clock.fill', color: '#F59E0B' },
  confirmed: { label: 'Confirmed', icon: 'checkmark.circle.fill', color: '#22C55E' },
  disputed: { label: 'Disputed', icon: 'exclamationmark.triangle.fill', color: '#EF4444' },
  refunded: { label: 'Refunded', icon: 'arrow.uturn.left.circle.fill', color: '#3B82F6' },
};

const paymentMethodConfig: Record<PaymentMethod, { label: string; icon: string }> = {
  cash: { label: 'Cash', icon: 'banknote.fill' },
  credit: { label: 'Credit Card', icon: 'creditcard.fill' },
  debit: { label: 'Debit Card', icon: 'creditcard.fill' },
  venmo: { label: 'Venmo', icon: 'v.circle.fill' },
  apple_pay: { label: 'Apple Pay', icon: 'apple.logo' },
  google_pay: { label: 'Google Pay', icon: 'g.circle.fill' },
  bank_transfer: { label: 'Bank Transfer', icon: 'building.columns.fill' },
  other: { label: 'Other', icon: 'ellipsis.circle.fill' },
};

const reflectionPrompts = [
  "Was this purchase worth it? Why or why not?",
  "How did you feel before making this purchase?",
  "Would you make this purchase again?",
  "What triggered this spending decision?",
  "How does this align with your financial goals?",
  "What could you have done differently?",
];

// ============ COMPONENTS ============
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
        <SFSymbol name={icon} size={14} color={color} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={[styles.sectionAction, { color }]}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

type InfoRowProps = {
  icon: string;
  label: string;
  value: string;
  color?: string;
  onPress?: () => void;
};

const InfoRow = ({ icon, label, value, color = '#6B7280', onPress }: InfoRowProps) => (
  <TouchableOpacity 
    style={styles.infoRow} 
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.infoRowLeft}>
      <SFSymbol name={icon} size={16} color={color} />
      <Text style={styles.infoRowLabel}>{label}</Text>
    </View>
    <View style={styles.infoRowRight}>
      <Text style={styles.infoRowValue}>{value}</Text>
      {onPress && <SFSymbol name="chevron.right" size={12} color="#C7C7CC" />}
    </View>
  </TouchableOpacity>
);

type IntensityDotsProps = {
  value: number;
  max?: number;
  color: string;
};

const IntensityDots = ({ value, max = 5, color }: IntensityDotsProps) => (
  <View style={styles.intensityDots}>
    {Array.from({ length: max }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.intensityDot,
          { backgroundColor: i < value ? color : '#E5E5EA' },
        ]}
      />
    ))}
  </View>
);

// ============ MAIN COMPONENT ============
export default function ExpenseDetailScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ExpenseDetailScreen'>>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [showReflectionInput, setShowReflectionInput] = useState(false);
  const [reflectionText, setReflectionText] = useState('');

  useEffect(() => {
    fetchExpense();
  }, []);

  const fetchExpense = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Mock expense data
      const mockExpense: Expense = {
        expense_id: route.params?.expenseId || '1',
        amount: 127.45,
        description: 'Weekly grocery shopping',
        category: 'groceries',
        subcategory: 'Food & Essentials',
        date: '2024-12-28',
        time: '2:30 PM',
        merchant: 'Whole Foods Market',
        location: 'Downtown, San Francisco',
        payment_method: 'credit',
        status: 'confirmed',
        
        // Emotional tracking
        emotion: 'content',
        emotion_intensity: 3,
        stress_level: 2,
        was_planned: true,
        was_necessary: true,
        satisfaction_rating: 4,
        
        // Relationships
        budget_id: '1',
        budget_name: 'January 2025 Budget',
        
        // Recurring
        is_recurring: true,
        recurring_frequency: 'weekly',
        next_occurrence: '2025-01-04',
        
        // Additional
        notes: 'Stocked up on organic produce and pantry essentials for the week.',
        tags: ['groceries', 'weekly', 'organic'],
        
        // Reflection
        reflection: {
          prompt: "Was this purchase worth it? Why or why not?",
          response: "Yes, buying quality groceries helps me eat healthier and saves money on eating out.",
          created_at: '2024-12-28',
        },
        
        // Similar expenses
        similar_expenses: [
          {
            expense_id: '2',
            description: 'Grocery run',
            amount: 98.32,
            date: '2024-12-21',
            emotion: 'neutral',
          },
          {
            expense_id: '3',
            description: 'Weekly groceries',
            amount: 115.67,
            date: '2024-12-14',
            emotion: 'happy',
          },
          {
            expense_id: '4',
            description: 'Trader Joe\'s trip',
            amount: 89.45,
            date: '2024-12-07',
            emotion: 'excited',
          },
        ],
        
        created_at: '2024-12-28 2:35 PM',
        updated_at: '2024-12-28 2:35 PM',
      };

      setExpense(mockExpense);
    } catch (error) {
      console.error('Error fetching expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddExpenseScreen', { expenseId: expense?.expense_id });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: API call to delete
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleSaveReflection = () => {
    if (!reflectionText.trim()) return;
    
    // TODO: API call to save reflection
    setExpense(prev => prev ? {
      ...prev,
      reflection: {
        prompt: reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)],
        response: reflectionText,
        created_at: new Date().toISOString().split('T')[0],
      },
    } : null);
    
    setShowReflectionInput(false);
    setReflectionText('');
    Alert.alert('Reflection Saved', 'Your reflection has been saved.');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getRandomPrompt = () => {
    return reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)];
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

  if (!expense) {
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
          <Text style={styles.errorTitle}>Expense Not Found</Text>
          <Text style={styles.errorText}>This expense may have been deleted.</Text>
        </View>
      </View>
    );
  }

  const catConfig = categoryConfig[expense.category];
  const emotionCfg = expense.emotion ? emotionConfig[expense.emotion] : null;
  const statusCfg = statusConfig[expense.status];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <SFSymbol name="chevron.left" size={20} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction} onPress={handleEdit}>
            <SFSymbol name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={handleDelete}>
            <SFSymbol name="trash" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: catConfig.color + '15' }]}>
            <SFSymbol name={catConfig.icon} size={32} color={catConfig.color} />
          </View>
          
          <Text style={styles.heroAmount}>-${expense.amount.toFixed(2)}</Text>
          
          {expense.merchant && (
            <Text style={styles.heroMerchant}>{expense.merchant}</Text>
          )}
          
          <Text style={styles.heroDescription}>{expense.description}</Text>
          
          <View style={styles.heroBadges}>
            <View style={[styles.heroBadge, { backgroundColor: catConfig.color + '15' }]}>
              <SFSymbol name={catConfig.icon} size={12} color={catConfig.color} />
              <Text style={[styles.heroBadgeText, { color: catConfig.color }]}>
                {catConfig.label}
              </Text>
            </View>
            
            <View style={[styles.heroBadge, { backgroundColor: statusCfg.color + '15' }]}>
              <SFSymbol name={statusCfg.icon} size={12} color={statusCfg.color} />
              <Text style={[styles.heroBadgeText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
            
            {expense.is_recurring && (
              <View style={[styles.heroBadge, { backgroundColor: '#7C3AED15' }]}>
                <SFSymbol name="repeat" size={12} color="#7C3AED" />
                <Text style={[styles.heroBadgeText, { color: '#7C3AED' }]}>
                  Recurring
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Emotional Context Section */}
        {emotionCfg && (
          <>
            <SectionHeader
              title="Emotional Context"
              icon="heart.fill"
              color="#EC4899"
            />
            <View style={styles.card}>
              {/* Primary Emotion */}
              <View style={styles.emotionCard}>
                <View style={[styles.emotionIconLarge, { backgroundColor: emotionCfg.color + '20' }]}>
                  <Text style={styles.emotionEmoji}>{emotionCfg.emoji}</Text>
                </View>
                <View style={styles.emotionContent}>
                  <Text style={styles.emotionLabel}>{emotionCfg.label}</Text>
                  <Text style={styles.emotionDescription}>{emotionCfg.description}</Text>
                  {expense.emotion_intensity && (
                    <View style={styles.emotionIntensity}>
                      <Text style={styles.emotionIntensityLabel}>Intensity</Text>
                      <IntensityDots value={expense.emotion_intensity} color={emotionCfg.color} />
                    </View>
                  )}
                </View>
              </View>

              {/* Emotional Metrics */}
              <View style={styles.emotionMetrics}>
                {expense.stress_level !== undefined && (
                  <View style={styles.emotionMetric}>
                    <Text style={styles.emotionMetricLabel}>Stress Level</Text>
                    <IntensityDots value={expense.stress_level} color="#EF4444" />
                  </View>
                )}
                
                {expense.satisfaction_rating !== undefined && (
                  <View style={styles.emotionMetric}>
                    <Text style={styles.emotionMetricLabel}>Satisfaction</Text>
                    <IntensityDots value={expense.satisfaction_rating} color="#22C55E" />
                  </View>
                )}
              </View>

              {/* Purchase Type Badges */}
              <View style={styles.purchaseTypeBadges}>
                <View style={[
                  styles.purchaseTypeBadge,
                  { backgroundColor: expense.was_planned ? '#046C4E15' : '#DC262615' }
                ]}>
                  <SFSymbol 
                    name={expense.was_planned ? 'checkmark.circle.fill' : 'bolt.fill'} 
                    size={14} 
                    color={expense.was_planned ? '#046C4E' : '#DC2626'} 
                  />
                  <Text style={[
                    styles.purchaseTypeBadgeText,
                    { color: expense.was_planned ? '#046C4E' : '#DC2626' }
                  ]}>
                    {expense.was_planned ? 'Planned' : 'Impulse'}
                  </Text>
                </View>
                
                <View style={[
                  styles.purchaseTypeBadge,
                  { backgroundColor: expense.was_necessary ? '#2563EB15' : '#F59E0B15' }
                ]}>
                  <SFSymbol 
                    name={expense.was_necessary ? 'star.fill' : 'sparkles'} 
                    size={14} 
                    color={expense.was_necessary ? '#2563EB' : '#F59E0B'} 
                  />
                  <Text style={[
                    styles.purchaseTypeBadgeText,
                    { color: expense.was_necessary ? '#2563EB' : '#F59E0B' }
                  ]}>
                    {expense.was_necessary ? 'Need' : 'Want'}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Reflection Section */}
        <SectionHeader
          title="Reflection"
          icon="text.bubble.fill"
          color="#7C3AED"
          action={
            !expense.reflection?.response
              ? { label: 'Add', onPress: () => setShowReflectionInput(true) }
              : { label: 'Edit', onPress: () => {
                  setReflectionText(expense.reflection?.response || '');
                  setShowReflectionInput(true);
                }}
          }
        />
        <View style={styles.card}>
          {expense.reflection?.response ? (
            <>
              <Text style={styles.reflectionPrompt}>{expense.reflection.prompt}</Text>
              <Text style={styles.reflectionResponse}>{expense.reflection.response}</Text>
              {expense.reflection.created_at && (
                <Text style={styles.reflectionDate}>
                  Reflected on {formatDate(expense.reflection.created_at)}
                </Text>
              )}
            </>
          ) : showReflectionInput ? (
            <>
              <Text style={styles.reflectionPrompt}>{getRandomPrompt()}</Text>
              <View style={styles.reflectionInputContainer}>
                <View style={styles.reflectionInput}>
                  <Text style={styles.reflectionInputPlaceholder}>
                    Write your reflection here...
                  </Text>
                </View>
                <View style={styles.reflectionActions}>
                  <TouchableOpacity 
                    style={styles.reflectionCancelButton}
                    onPress={() => setShowReflectionInput(false)}
                  >
                    <Text style={styles.reflectionCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.reflectionSaveButton}
                    onPress={handleSaveReflection}
                  >
                    <Text style={styles.reflectionSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.reflectionEmpty}>
              <SFSymbol name="text.bubble" size={32} color="#C7C7CC" />
              <Text style={styles.reflectionEmptyTitle}>No reflection yet</Text>
              <Text style={styles.reflectionEmptyText}>
                Take a moment to reflect on this purchase
              </Text>
              <TouchableOpacity 
                style={styles.reflectionAddButton}
                onPress={() => setShowReflectionInput(true)}
              >
                <SFSymbol name="plus.circle.fill" size={16} color="#FFFFFF" />
                <Text style={styles.reflectionAddText}>Add Reflection</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Details Section */}
        <SectionHeader
          title="Details"
          icon="info.circle.fill"
          color="#6B7280"
        />
        <View style={styles.card}>
          <InfoRow
            icon="calendar"
            label="Date"
            value={formatDate(expense.date)}
          />
          {expense.time && (
            <InfoRow
              icon="clock.fill"
              label="Time"
              value={expense.time}
            />
          )}
          {expense.location && (
            <InfoRow
              icon="location.fill"
              label="Location"
              value={expense.location}
            />
          )}
          {expense.payment_method && (
            <InfoRow
              icon={paymentMethodConfig[expense.payment_method].icon}
              label="Payment"
              value={paymentMethodConfig[expense.payment_method].label}
            />
          )}
          {expense.subcategory && (
            <InfoRow
              icon="tag.fill"
              label="Subcategory"
              value={expense.subcategory}
            />
          )}
        </View>

        {/* Recurring Info */}
        {expense.is_recurring && (
          <>
            <SectionHeader
              title="Recurring"
              icon="repeat"
              color="#7C3AED"
            />
            <View style={styles.card}>
              <InfoRow
                icon="calendar.badge.clock"
                label="Frequency"
                value={expense.recurring_frequency ? 
                  expense.recurring_frequency.charAt(0).toUpperCase() + expense.recurring_frequency.slice(1) 
                  : 'N/A'
                }
              />
              {expense.next_occurrence && (
                <InfoRow
                  icon="arrow.right.circle.fill"
                  label="Next Occurrence"
                  value={formatDate(expense.next_occurrence)}
                />
              )}
            </View>
          </>
        )}

        {/* Relationships */}
        {(expense.budget_name || expense.dependent_name) && (
          <>
            <SectionHeader
              title="Linked To"
              icon="link"
              color="#3B82F6"
            />
            <View style={styles.card}>
              {expense.budget_name && expense.budget_id && (
                <InfoRow
                  icon="chart.pie.fill"
                  label="Budget"
                  value={expense.budget_name}
                  color="#7C3AED"
                  onPress={() => navigation.navigate('BudgetDetailScreen', { budgetId: expense.budget_id! })}
                />
              )}
              {expense.dependent_name && expense.dependent_id && (
                <InfoRow
                  icon="person.fill"
                  label="Dependent"
                  value={expense.dependent_name}
                  color="#3B82F6"
                  onPress={() => navigation.navigate('DependentDetailScreen', { dependentId: expense.dependent_id! })}
                />
              )}
            </View>
          </>
        )}

        {/* Notes */}
        {expense.notes && (
          <>
            <SectionHeader
              title="Notes"
              icon="note.text"
              color="#6B7280"
            />
            <View style={styles.card}>
              <Text style={styles.notesText}>{expense.notes}</Text>
            </View>
          </>
        )}

        {/* Tags */}
        {expense.tags && expense.tags.length > 0 && (
          <>
            <SectionHeader
              title="Tags"
              icon="tag.fill"
              color="#F59E0B"
            />
            <View style={styles.tagsContainer}>
              {expense.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Similar Expenses */}
        {expense.similar_expenses && expense.similar_expenses.length > 0 && (
          <>
            <SectionHeader
              title="Similar Expenses"
              icon="square.stack.fill"
              color="#046C4E"
              action={{ label: 'See All', onPress: () => {} }}
            />
            <View style={styles.similarExpensesList}>
              {expense.similar_expenses.map((similar) => {
                const simEmotion = similar.emotion ? emotionConfig[similar.emotion] : null;
                return (
                  <TouchableOpacity
                    key={similar.expense_id}
                    style={styles.similarExpenseCard}
                    onPress={() => navigation.push('ExpenseDetailScreen', { expenseId: similar.expense_id })}
                  >
                    <View style={styles.similarExpenseLeft}>
                      <Text style={styles.similarExpenseDesc}>{similar.description}</Text>
                      <Text style={styles.similarExpenseDate}>{formatDate(similar.date)}</Text>
                    </View>
                    <View style={styles.similarExpenseRight}>
                      <Text style={styles.similarExpenseAmount}>
                        ${similar.amount.toFixed(2)}
                      </Text>
                      {simEmotion && (
                        <Text style={styles.similarExpenseEmotion}>{simEmotion.emoji}</Text>
                      )}
                    </View>
                    <SFSymbol name="chevron.right" size={14} color="#C7C7CC" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Meta Info */}
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>Created: {expense.created_at}</Text>
          <Text style={styles.metaText}>Last updated: {expense.updated_at}</Text>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerAction: {
    padding: 4,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000',
  },
  heroMerchant: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
  },
  heroDescription: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  // Emotion Card
  emotionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  emotionIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionEmoji: {
    fontSize: 28,
  },
  emotionContent: {
    flex: 1,
  },
  emotionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  emotionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  emotionIntensity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  emotionIntensityLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Intensity Dots
  intensityDots: {
    flexDirection: 'row',
    gap: 4,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Emotion Metrics
  emotionMetrics: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginBottom: 16,
  },
  emotionMetric: {
    gap: 6,
  },
  emotionMetricLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Purchase Type Badges
  purchaseTypeBadges: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  purchaseTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  purchaseTypeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoRowLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoRowValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },

  // Notes
  notesText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },

  // Reflection
  reflectionPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  reflectionResponse: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  reflectionDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 12,
  },
  reflectionEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  reflectionEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
  },
  reflectionEmptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  reflectionAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 16,
  },
  reflectionAddText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reflectionInputContainer: {
    marginTop: 8,
  },
  reflectionInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
  },
  reflectionInputPlaceholder: {
    fontSize: 15,
    color: '#C7C7CC',
  },
  reflectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  reflectionCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  reflectionCancelText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  reflectionSaveButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  reflectionSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Similar Expenses
  similarExpensesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  similarExpenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  similarExpenseLeft: {
    flex: 1,
  },
  similarExpenseDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  similarExpenseDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  similarExpenseRight: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  similarExpenseAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  similarExpenseEmotion: {
    fontSize: 14,
    marginTop: 2,
  },

  // Meta
  metaInfo: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  metaText: {
    fontSize: 13,
    color: '#C7C7CC',
    marginBottom: 4,
  },

  bottomSpacer: {
    height: 40,
  },
});