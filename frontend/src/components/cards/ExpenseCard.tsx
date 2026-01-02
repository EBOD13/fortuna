// src/components/cards/ExpenseCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============ TYPES ============
export type ExpenseCategory = 
  | 'food' 
  | 'dining' 
  | 'groceries' 
  | 'transport' 
  | 'entertainment' 
  | 'shopping' 
  | 'utilities' 
  | 'healthcare' 
  | 'education' 
  | 'personal' 
  | 'gifts' 
  | 'travel' 
  | 'subscriptions'
  | 'housing'
  | 'insurance'
  | 'childcare'
  | 'pets'
  | 'fitness'
  | 'beauty'
  | 'other';

export type EmotionType = 
  | 'happy' 
  | 'excited' 
  | 'content' 
  | 'neutral' 
  | 'stressed' 
  | 'anxious' 
  | 'sad' 
  | 'frustrated' 
  | 'guilty' 
  | 'impulsive'
  | 'bored'
  | 'celebratory';

export type ExpenseStatus = 'pending' | 'confirmed' | 'disputed' | 'refunded';

export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'venmo' | 'apple_pay' | 'google_pay' | 'bank_transfer' | 'other';

export type Expense = {
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
  status?: ExpenseStatus;
  
  // Emotional tracking
  emotion?: EmotionType;
  emotion_intensity?: number; // 1-5
  stress_level?: number; // 1-5
  was_planned?: boolean;
  was_necessary?: boolean;
  satisfaction_rating?: number; // 1-5
  
  // Relationships
  dependent_id?: string;
  dependent_name?: string;
  budget_id?: string;
  budget_name?: string;
  goal_impact?: string;
  
  // Recurring
  is_recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  next_occurrence?: string;
  
  // Meta
  notes?: string;
  tags?: string[];
  receipt_url?: string;
  created_at?: string;
};

// ============ CONFIG ============
const categoryConfig: Record<ExpenseCategory, { icon: string; color: string; label: string }> = {
  food: { icon: 'fork.knife', color: '#F59E0B', label: 'Food' },
  dining: { icon: 'fork.knife.circle.fill', color: '#F97316', label: 'Dining' },
  groceries: { icon: 'cart.fill', color: '#84CC16', label: 'Groceries' },
  transport: { icon: 'car.fill', color: '#3B82F6', label: 'Transport' },
  entertainment: { icon: 'film.fill', color: '#8B5CF6', label: 'Entertainment' },
  shopping: { icon: 'bag.fill', color: '#EC4899', label: 'Shopping' },
  utilities: { icon: 'bolt.fill', color: '#F59E0B', label: 'Utilities' },
  healthcare: { icon: 'heart.fill', color: '#EF4444', label: 'Healthcare' },
  education: { icon: 'book.fill', color: '#6366F1', label: 'Education' },
  personal: { icon: 'person.fill', color: '#14B8A6', label: 'Personal' },
  gifts: { icon: 'gift.fill', color: '#F472B6', label: 'Gifts' },
  travel: { icon: 'airplane', color: '#0EA5E9', label: 'Travel' },
  subscriptions: { icon: 'repeat', color: '#7C3AED', label: 'Subscriptions' },
  housing: { icon: 'house.fill', color: '#78716C', label: 'Housing' },
  insurance: { icon: 'shield.fill', color: '#0D9488', label: 'Insurance' },
  childcare: { icon: 'figure.and.child.holdinghands', color: '#FB923C', label: 'Childcare' },
  pets: { icon: 'pawprint.fill', color: '#A78BFA', label: 'Pets' },
  fitness: { icon: 'figure.run', color: '#22C55E', label: 'Fitness' },
  beauty: { icon: 'sparkles', color: '#E879F9', label: 'Beauty' },
  other: { icon: 'ellipsis.circle.fill', color: '#6B7280', label: 'Other' },
};

const emotionConfig: Record<EmotionType, { icon: string; emoji: string; color: string; label: string }> = {
  happy: { icon: 'face.smiling.fill', emoji: '😊', color: '#22C55E', label: 'Happy' },
  excited: { icon: 'star.fill', emoji: '🤩', color: '#F59E0B', label: 'Excited' },
  content: { icon: 'heart.fill', emoji: '😌', color: '#14B8A6', label: 'Content' },
  neutral: { icon: 'minus.circle.fill', emoji: '😐', color: '#6B7280', label: 'Neutral' },
  stressed: { icon: 'bolt.fill', emoji: '😰', color: '#EF4444', label: 'Stressed' },
  anxious: { icon: 'exclamationmark.triangle.fill', emoji: '😟', color: '#F97316', label: 'Anxious' },
  sad: { icon: 'cloud.rain.fill', emoji: '😢', color: '#3B82F6', label: 'Sad' },
  frustrated: { icon: 'xmark.circle.fill', emoji: '😤', color: '#DC2626', label: 'Frustrated' },
  guilty: { icon: 'hand.raised.fill', emoji: '😔', color: '#7C3AED', label: 'Guilty' },
  impulsive: { icon: 'bolt.heart.fill', emoji: '🙈', color: '#EC4899', label: 'Impulsive' },
  bored: { icon: 'zzz', emoji: '😑', color: '#9CA3AF', label: 'Bored' },
  celebratory: { icon: 'party.popper.fill', emoji: '🎉', color: '#FBBF24', label: 'Celebratory' },
};

const statusConfig: Record<ExpenseStatus, { icon: string; color: string; label: string }> = {
  pending: { icon: 'clock.fill', color: '#F59E0B', label: 'Pending' },
  confirmed: { icon: 'checkmark.circle.fill', color: '#22C55E', label: 'Confirmed' },
  disputed: { icon: 'exclamationmark.triangle.fill', color: '#EF4444', label: 'Disputed' },
  refunded: { icon: 'arrow.uturn.left.circle.fill', color: '#3B82F6', label: 'Refunded' },
};

const paymentMethodConfig: Record<PaymentMethod, { icon: string; label: string }> = {
  cash: { icon: 'banknote.fill', label: 'Cash' },
  credit: { icon: 'creditcard.fill', label: 'Credit Card' },
  debit: { icon: 'creditcard.fill', label: 'Debit Card' },
  venmo: { icon: 'v.circle.fill', label: 'Venmo' },
  apple_pay: { icon: 'apple.logo', label: 'Apple Pay' },
  google_pay: { icon: 'g.circle.fill', label: 'Google Pay' },
  bank_transfer: { icon: 'building.columns.fill', label: 'Bank Transfer' },
  other: { icon: 'ellipsis.circle.fill', label: 'Other' },
};

// ============ PROPS ============
export type ExpenseCardProps = {
  expense: Expense;
  variant?: 'default' | 'compact' | 'detailed' | 'mini';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showEmotions?: boolean;
  showCategory?: boolean;
  showDate?: boolean;
  showMerchant?: boolean;
  selected?: boolean;
};

// ============ COMPONENT ============
export default function ExpenseCard({
  expense,
  variant = 'default',
  onPress,
  onEdit,
  onDelete,
  showEmotions = true,
  showCategory = true,
  showDate = true,
  showMerchant = true,
  selected = false,
}: ExpenseCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const catConfig = categoryConfig[expense.category] || categoryConfig.other;
  const emotionCfg = expense.emotion ? emotionConfig[expense.emotion] : null;
  const statusCfg = expense.status ? statusConfig[expense.status] : null;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (variant === 'default') {
      toggleExpanded();
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // ============ MINI VARIANT ============
  if (variant === 'mini') {
    return (
      <TouchableOpacity 
        style={[styles.miniCard, selected && styles.miniCardSelected]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={[styles.miniIcon, { backgroundColor: catConfig.color + '15' }]}>
          <SFSymbol name={catConfig.icon} size={12} color={catConfig.color} />
        </View>
        <Text style={styles.miniAmount}>{formatAmount(expense.amount)}</Text>
      </TouchableOpacity>
    );
  }

  // ============ COMPACT VARIANT ============
  if (variant === 'compact') {
    return (
      <TouchableOpacity 
        style={[styles.compactCard, selected && styles.compactCardSelected]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={[styles.compactIcon, { backgroundColor: catConfig.color + '15' }]}>
          <SFSymbol name={catConfig.icon} size={16} color={catConfig.color} />
        </View>
        
        <View style={styles.compactContent}>
          <Text style={styles.compactDescription} numberOfLines={1}>
            {expense.merchant || expense.description}
          </Text>
          <View style={styles.compactMeta}>
            {showCategory && (
              <Text style={styles.compactCategory}>{catConfig.label}</Text>
            )}
            {showDate && (
              <>
                <Text style={styles.compactDot}>•</Text>
                <Text style={styles.compactDate}>{formatDate(expense.date)}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.compactRight}>
          <Text style={styles.compactAmount}>{formatAmount(expense.amount)}</Text>
          {showEmotions && emotionCfg && (
            <Text style={styles.compactEmoji}>{emotionCfg.emoji}</Text>
          )}
        </View>
        
        {expense.is_recurring && (
          <View style={styles.compactRecurringDot} />
        )}
      </TouchableOpacity>
    );
  }

  // ============ DETAILED VARIANT ============
  if (variant === 'detailed') {
    return (
      <TouchableOpacity 
        style={[styles.detailedCard, selected && styles.detailedCardSelected]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.detailedHeader}>
          <View style={[styles.detailedIcon, { backgroundColor: catConfig.color + '15' }]}>
            <SFSymbol name={catConfig.icon} size={22} color={catConfig.color} />
          </View>
          <View style={styles.detailedHeaderContent}>
            <Text style={styles.detailedMerchant}>
              {expense.merchant || expense.description}
            </Text>
            <View style={styles.detailedHeaderMeta}>
              <Text style={styles.detailedCategory}>{catConfig.label}</Text>
              {expense.subcategory && (
                <>
                  <Text style={styles.detailedDot}>•</Text>
                  <Text style={styles.detailedSubcategory}>{expense.subcategory}</Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.detailedAmountContainer}>
            <Text style={styles.detailedAmount}>{formatAmount(expense.amount)}</Text>
            {expense.status && statusCfg && (
              <View style={[styles.detailedStatusBadge, { backgroundColor: statusCfg.color + '15' }]}>
                <SFSymbol name={statusCfg.icon} size={10} color={statusCfg.color} />
                <Text style={[styles.detailedStatusText, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {expense.description && expense.merchant && (
          <Text style={styles.detailedDescription}>{expense.description}</Text>
        )}

        {/* Emotional Context */}
        {showEmotions && (emotionCfg || expense.was_planned !== undefined) && (
          <View style={styles.detailedEmotionSection}>
            {emotionCfg && (
              <View style={[styles.detailedEmotionBadge, { backgroundColor: emotionCfg.color + '15' }]}>
                <Text style={styles.detailedEmotionEmoji}>{emotionCfg.emoji}</Text>
                <Text style={[styles.detailedEmotionText, { color: emotionCfg.color }]}>
                  {emotionCfg.label}
                </Text>
                {expense.emotion_intensity && (
                  <View style={styles.detailedIntensityDots}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.detailedIntensityDot,
                          { backgroundColor: i <= expense.emotion_intensity! ? emotionCfg.color : '#E5E5EA' },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
            {expense.was_planned !== undefined && (
              <View style={[
                styles.detailedPlanBadge,
                { backgroundColor: expense.was_planned ? '#D1FAE5' : '#FEF2F2' }
              ]}>
                <SFSymbol 
                  name={expense.was_planned ? 'checkmark.circle.fill' : 'bolt.fill'} 
                  size={12} 
                  color={expense.was_planned ? '#046C4E' : '#DC2626'} 
                />
                <Text style={[
                  styles.detailedPlanText,
                  { color: expense.was_planned ? '#046C4E' : '#DC2626' }
                ]}>
                  {expense.was_planned ? 'Planned' : 'Impulse'}
                </Text>
              </View>
            )}
            {expense.was_necessary !== undefined && (
              <View style={[
                styles.detailedNeedBadge,
                { backgroundColor: expense.was_necessary ? '#DBEAFE' : '#FEF3C7' }
              ]}>
                <SFSymbol 
                  name={expense.was_necessary ? 'star.fill' : 'sparkles'} 
                  size={12} 
                  color={expense.was_necessary ? '#2563EB' : '#F59E0B'} 
                />
                <Text style={[
                  styles.detailedNeedText,
                  { color: expense.was_necessary ? '#2563EB' : '#F59E0B' }
                ]}>
                  {expense.was_necessary ? 'Need' : 'Want'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Meta Info */}
        <View style={styles.detailedMetaGrid}>
          <View style={styles.detailedMetaItem}>
            <SFSymbol name="calendar" size={14} color="#8E8E93" />
            <Text style={styles.detailedMetaText}>
              {formatDate(expense.date)}
              {expense.time && ` at ${expense.time}`}
            </Text>
          </View>
          {expense.payment_method && (
            <View style={styles.detailedMetaItem}>
              <SFSymbol 
                name={paymentMethodConfig[expense.payment_method].icon} 
                size={14} 
                color="#8E8E93" 
              />
              <Text style={styles.detailedMetaText}>
                {paymentMethodConfig[expense.payment_method].label}
              </Text>
            </View>
          )}
          {expense.location && (
            <View style={styles.detailedMetaItem}>
              <SFSymbol name="location.fill" size={14} color="#8E8E93" />
              <Text style={styles.detailedMetaText} numberOfLines={1}>
                {expense.location}
              </Text>
            </View>
          )}
          {expense.is_recurring && (
            <View style={styles.detailedMetaItem}>
              <SFSymbol name="repeat" size={14} color="#7C3AED" />
              <Text style={[styles.detailedMetaText, { color: '#7C3AED' }]}>
                {expense.recurring_frequency ? 
                  expense.recurring_frequency.charAt(0).toUpperCase() + expense.recurring_frequency.slice(1) : 
                  'Recurring'}
              </Text>
            </View>
          )}
        </View>

        {/* Relationships */}
        {(expense.dependent_name || expense.budget_name) && (
          <View style={styles.detailedRelationships}>
            {expense.dependent_name && (
              <View style={styles.detailedRelationshipBadge}>
                <SFSymbol name="person.fill" size={12} color="#6B7280" />
                <Text style={styles.detailedRelationshipText}>{expense.dependent_name}</Text>
              </View>
            )}
            {expense.budget_name && (
              <View style={styles.detailedRelationshipBadge}>
                <SFSymbol name="chart.pie.fill" size={12} color="#6B7280" />
                <Text style={styles.detailedRelationshipText}>{expense.budget_name}</Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {expense.notes && (
          <View style={styles.detailedNotes}>
            <SFSymbol name="note.text" size={14} color="#8E8E93" />
            <Text style={styles.detailedNotesText}>{expense.notes}</Text>
          </View>
        )}

        {/* Tags */}
        {expense.tags && expense.tags.length > 0 && (
          <View style={styles.detailedTags}>
            {expense.tags.map((tag, index) => (
              <View key={index} style={styles.detailedTag}>
                <Text style={styles.detailedTagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && (
          <View style={styles.detailedActions}>
            {onEdit && (
              <TouchableOpacity style={styles.detailedActionButton} onPress={onEdit}>
                <SFSymbol name="pencil" size={14} color="#007AFF" />
                <Text style={styles.detailedActionText}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity 
                style={[styles.detailedActionButton, styles.detailedActionButtonDestructive]} 
                onPress={onDelete}
              >
                <SFSymbol name="trash" size={14} color="#DC2626" />
                <Text style={[styles.detailedActionText, { color: '#DC2626' }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ============ DEFAULT VARIANT ============
  return (
    <TouchableOpacity 
      style={[styles.card, selected && styles.cardSelected]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Main Row */}
      <View style={styles.mainRow}>
        <View style={[styles.icon, { backgroundColor: catConfig.color + '15' }]}>
          <SFSymbol name={catConfig.icon} size={18} color={catConfig.color} />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.description} numberOfLines={1}>
            {expense.merchant || expense.description}
          </Text>
          <View style={styles.metaRow}>
            {showCategory && (
              <Text style={styles.category}>{catConfig.label}</Text>
            )}
            {showDate && (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.date}>{formatDate(expense.date)}</Text>
              </>
            )}
            {expense.is_recurring && (
              <>
                <Text style={styles.dot}>•</Text>
                <View style={styles.recurringBadge}>
                  <SFSymbol name="repeat" size={10} color="#7C3AED" />
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.amount}>{formatAmount(expense.amount)}</Text>
          {showEmotions && emotionCfg && (
            <View style={[styles.emotionBadge, { backgroundColor: emotionCfg.color + '15' }]}>
              <Text style={styles.emotionEmoji}>{emotionCfg.emoji}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Emotional Details */}
          {emotionCfg && (
            <View style={styles.expandedEmotionRow}>
              <Text style={styles.expandedLabel}>Feeling:</Text>
              <View style={[styles.expandedEmotionBadge, { backgroundColor: emotionCfg.color + '15' }]}>
                <Text style={styles.expandedEmotionEmoji}>{emotionCfg.emoji}</Text>
                <Text style={[styles.expandedEmotionText, { color: emotionCfg.color }]}>
                  {emotionCfg.label}
                </Text>
              </View>
              {expense.was_planned !== undefined && (
                <View style={[
                  styles.expandedPlanBadge,
                  { backgroundColor: expense.was_planned ? '#D1FAE5' : '#FEF2F2' }
                ]}>
                  <Text style={[
                    styles.expandedPlanText,
                    { color: expense.was_planned ? '#046C4E' : '#DC2626' }
                  ]}>
                    {expense.was_planned ? 'Planned' : 'Impulse'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Additional Meta */}
          <View style={styles.expandedMeta}>
            {expense.payment_method && (
              <View style={styles.expandedMetaItem}>
                <SFSymbol 
                  name={paymentMethodConfig[expense.payment_method].icon} 
                  size={12} 
                  color="#8E8E93" 
                />
                <Text style={styles.expandedMetaText}>
                  {paymentMethodConfig[expense.payment_method].label}
                </Text>
              </View>
            )}
            {expense.location && (
              <View style={styles.expandedMetaItem}>
                <SFSymbol name="location.fill" size={12} color="#8E8E93" />
                <Text style={styles.expandedMetaText} numberOfLines={1}>
                  {expense.location}
                </Text>
              </View>
            )}
          </View>

          {/* Notes */}
          {expense.notes && (
            <Text style={styles.expandedNotes}>{expense.notes}</Text>
          )}

          {/* Actions */}
          {(onEdit || onDelete) && (
            <View style={styles.expandedActions}>
              {onEdit && (
                <TouchableOpacity style={styles.expandedActionButton} onPress={onEdit}>
                  <SFSymbol name="pencil" size={12} color="#007AFF" />
                  <Text style={styles.expandedActionText}>Edit</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity 
                  style={[styles.expandedActionButton, styles.expandedActionButtonDestructive]} 
                  onPress={onDelete}
                >
                  <SFSymbol name="trash" size={12} color="#DC2626" />
                  <Text style={[styles.expandedActionText, { color: '#DC2626' }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Expand Indicator */}
      {!onPress && (
        <View style={styles.expandIndicator}>
          <SFSymbol 
            name={expanded ? 'chevron.up' : 'chevron.down'} 
            size={10} 
            color="#C7C7CC" 
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============ EXPENSE LIST ============
export type ExpenseListProps = {
  expenses: Expense[];
  variant?: 'default' | 'compact' | 'detailed';
  onExpensePress?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  showEmotions?: boolean;
  groupByDate?: boolean;
  emptyMessage?: string;
};

export function ExpenseList({
  expenses,
  variant = 'default',
  onExpensePress,
  onEdit,
  onDelete,
  showEmotions = true,
  groupByDate = false,
  emptyMessage = 'No expenses yet',
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <SFSymbol name="creditcard" size={32} color="#C7C7CC" />
        </View>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  if (groupByDate) {
    // Group expenses by date
    const grouped = expenses.reduce((acc, expense) => {
      const date = expense.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);

    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const formatGroupDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    };

    const getDayTotal = (dayExpenses: Expense[]) => {
      return dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    };

    return (
      <View style={styles.listContainer}>
        {dates.map((date) => (
          <View key={date} style={styles.dateGroup}>
            <View style={styles.dateGroupHeader}>
              <Text style={styles.dateGroupLabel}>{formatGroupDate(date)}</Text>
              <Text style={styles.dateGroupTotal}>
                ${getDayTotal(grouped[date]).toFixed(2)}
              </Text>
            </View>
            {grouped[date].map((expense) => (
              <ExpenseCard
                key={expense.expense_id}
                expense={expense}
                variant={variant}
                onPress={() => onExpensePress?.(expense)}
                onEdit={onEdit ? () => onEdit(expense) : undefined}
                onDelete={onDelete ? () => onDelete(expense) : undefined}
                showEmotions={showEmotions}
                showDate={false}
              />
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.expense_id}
          expense={expense}
          variant={variant}
          onPress={() => onExpensePress?.(expense)}
          onEdit={onEdit ? () => onEdit(expense) : undefined}
          onDelete={onDelete ? () => onDelete(expense) : undefined}
          showEmotions={showEmotions}
        />
      ))}
    </View>
  );
}

// ============ EXPENSE SUMMARY CARD ============
export type ExpenseSummaryProps = {
  totalAmount: number;
  expenseCount: number;
  topCategory: ExpenseCategory;
  topCategoryAmount: number;
  emotionalSpendingPercent?: number;
  impulseSpendingPercent?: number;
  comparisonAmount?: number;
  comparisonLabel?: string;
};

export function ExpenseSummaryCard({
  totalAmount,
  expenseCount,
  topCategory,
  topCategoryAmount,
  emotionalSpendingPercent,
  impulseSpendingPercent,
  comparisonAmount,
  comparisonLabel,
}: ExpenseSummaryProps) {
  const catConfig = categoryConfig[topCategory] || categoryConfig.other;
  const percentChange = comparisonAmount 
    ? ((totalAmount - comparisonAmount) / comparisonAmount) * 100 
    : 0;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryAmount}>
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          {comparisonAmount !== undefined && (
            <View style={styles.summaryComparison}>
              <SFSymbol 
                name={percentChange > 0 ? 'arrow.up' : percentChange < 0 ? 'arrow.down' : 'minus'} 
                size={10} 
                color={percentChange > 0 ? '#DC2626' : '#046C4E'} 
              />
              <Text style={[
                styles.summaryComparisonText,
                { color: percentChange > 0 ? '#DC2626' : '#046C4E' }
              ]}>
                {Math.abs(percentChange).toFixed(0)}% {comparisonLabel || 'vs last period'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{expenseCount}</Text>
            <Text style={styles.summaryStatLabel}>Expenses</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryDetails}>
        <View style={styles.summaryDetailItem}>
          <View style={[styles.summaryDetailIcon, { backgroundColor: catConfig.color + '15' }]}>
            <SFSymbol name={catConfig.icon} size={14} color={catConfig.color} />
          </View>
          <View>
            <Text style={styles.summaryDetailLabel}>Top Category</Text>
            <Text style={styles.summaryDetailValue}>
              {catConfig.label} (${topCategoryAmount.toFixed(0)})
            </Text>
          </View>
        </View>

        {emotionalSpendingPercent !== undefined && (
          <View style={styles.summaryDetailItem}>
            <View style={[styles.summaryDetailIcon, { backgroundColor: '#EC489915' }]}>
              <SFSymbol name="heart.fill" size={14} color="#EC4899" />
            </View>
            <View>
              <Text style={styles.summaryDetailLabel}>Emotional</Text>
              <Text style={styles.summaryDetailValue}>{emotionalSpendingPercent}%</Text>
            </View>
          </View>
        )}

        {impulseSpendingPercent !== undefined && (
          <View style={styles.summaryDetailItem}>
            <View style={[styles.summaryDetailIcon, { backgroundColor: '#F59E0B15' }]}>
              <SFSymbol name="bolt.fill" size={14} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.summaryDetailLabel}>Impulse</Text>
              <Text style={styles.summaryDetailValue}>{impulseSpendingPercent}%</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  // Default Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#046C4E',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 13,
    color: '#8E8E93',
  },
  dot: {
    fontSize: 13,
    color: '#C7C7CC',
    marginHorizontal: 6,
  },
  date: {
    fontSize: 13,
    color: '#8E8E93',
  },
  recurringBadge: {
    marginLeft: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  emotionBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionEmoji: {
    fontSize: 14,
  },
  expandIndicator: {
    alignItems: 'center',
    paddingTop: 8,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginTop: 12,
    paddingTop: 12,
    gap: 10,
  },
  expandedEmotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandedLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  expandedEmotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  expandedEmotionEmoji: {
    fontSize: 14,
  },
  expandedEmotionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  expandedPlanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expandedPlanText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandedMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  expandedMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  expandedMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  expandedNotes: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  expandedActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  expandedActionButtonDestructive: {
    backgroundColor: '#FEF2F2',
  },
  expandedActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
  },

  // Mini Card
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    gap: 8,
  },
  miniCardSelected: {
    borderWidth: 2,
    borderColor: '#046C4E',
  },
  miniIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },

  // Compact Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  compactCardSelected: {
    borderWidth: 2,
    borderColor: '#046C4E',
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  compactContent: {
    flex: 1,
  },
  compactDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactCategory: {
    fontSize: 12,
    color: '#8E8E93',
  },
  compactDot: {
    fontSize: 12,
    color: '#C7C7CC',
    marginHorizontal: 5,
  },
  compactDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  compactRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  compactAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  compactEmoji: {
    fontSize: 14,
  },
  compactRecurringDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },

  // Detailed Card
  detailedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  detailedCardSelected: {
    borderWidth: 2,
    borderColor: '#046C4E',
  },
  detailedHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailedIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailedHeaderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailedMerchant: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 3,
  },
  detailedHeaderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedCategory: {
    fontSize: 13,
    color: '#8E8E93',
  },
  detailedDot: {
    fontSize: 13,
    color: '#C7C7CC',
    marginHorizontal: 5,
  },
  detailedSubcategory: {
    fontSize: 13,
    color: '#8E8E93',
  },
  detailedAmountContainer: {
    alignItems: 'flex-end',
  },
  detailedAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  detailedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  detailedStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailedDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  detailedEmotionSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  detailedEmotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  detailedEmotionEmoji: {
    fontSize: 16,
  },
  detailedEmotionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailedIntensityDots: {
    flexDirection: 'row',
    gap: 3,
    marginLeft: 6,
  },
  detailedIntensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detailedPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  detailedPlanText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailedNeedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  detailedNeedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailedMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailedMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailedMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailedRelationships: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  detailedRelationshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  detailedRelationshipText: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailedNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  detailedNotesText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  detailedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  detailedTag: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailedTagText: {
    fontSize: 11,
    color: '#6B7280',
  },
  detailedActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  detailedActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  detailedActionButtonDestructive: {
    backgroundColor: '#FEF2F2',
  },
  detailedActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },

  // List
  listContainer: {
    gap: 0,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dateGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  dateGroupTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  summaryComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  summaryComparisonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryStats: {
    alignItems: 'flex-end',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  summaryStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 14,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryDetailIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDetailLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  summaryDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
});