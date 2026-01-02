// src/screens/DailyCheckinScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TYPES ============
type MoodLevel = 1 | 2 | 3 | 4 | 5;
type SpendingFeeling = 'great' | 'okay' | 'regret' | 'stressed';
type ExpenseCategory = 
  | 'food' 
  | 'transport' 
  | 'shopping' 
  | 'entertainment' 
  | 'bills' 
  | 'health' 
  | 'groceries' 
  | 'coffee' 
  | 'other';

type QuickExpense = {
  id: string;
  category: ExpenseCategory;
  amount: string;
  note: string;
  wasNecessary: boolean | null;
};

// ============ CONFIG ============
const moodConfig: Record<MoodLevel, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😫', label: 'Rough', color: '#DC2626' },
  2: { emoji: '😔', label: 'Meh', color: '#F59E0B' },
  3: { emoji: '😐', label: 'Okay', color: '#6B7280' },
  4: { emoji: '🙂', label: 'Good', color: '#0891B2' },
  5: { emoji: '😊', label: 'Great', color: '#046C4E' },
};

const spendingFeelingConfig: Record<SpendingFeeling, { emoji: string; label: string; color: string; description: string }> = {
  great: { emoji: '💚', label: 'Great', color: '#046C4E', description: 'Spent mindfully today' },
  okay: { emoji: '💛', label: 'Okay', color: '#F59E0B', description: 'Some good, some not' },
  regret: { emoji: '💔', label: 'Regret', color: '#DC2626', description: 'Wish I spent less' },
  stressed: { emoji: '😰', label: 'Stressed', color: '#7C3AED', description: 'Money is on my mind' },
};

const categoryConfig: Record<ExpenseCategory, { icon: string; color: string; label: string }> = {
  food: { icon: 'fork.knife', color: '#F59E0B', label: 'Food & Dining' },
  transport: { icon: 'car.fill', color: '#0891B2', label: 'Transport' },
  shopping: { icon: 'bag.fill', color: '#EC4899', label: 'Shopping' },
  entertainment: { icon: 'gamecontroller.fill', color: '#8B5CF6', label: 'Entertainment' },
  bills: { icon: 'doc.text.fill', color: '#DC2626', label: 'Bills' },
  health: { icon: 'heart.fill', color: '#046C4E', label: 'Health' },
  groceries: { icon: 'cart.fill', color: '#2563EB', label: 'Groceries' },
  coffee: { icon: 'cup.and.saucer.fill', color: '#92400E', label: 'Coffee' },
  other: { icon: 'ellipsis.circle.fill', color: '#6B7280', label: 'Other' },
};

const categories: ExpenseCategory[] = [
  'food', 'coffee', 'transport', 'shopping', 'entertainment', 'groceries', 'health', 'bills', 'other'
];

const reflectionPrompts = [
  "What's one purchase today that brought you joy?",
  "Did you avoid any temptations today?",
  "What would you do differently tomorrow?",
  "Were your purchases aligned with your goals?",
  "What triggered your spending today?",
  "Did you stick to your budget?",
  "What are you grateful for today?",
  "How did your mood affect your spending?",
];

// ============ STEP INDICATOR ============
type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => (
  <View style={styles.stepIndicator}>
    {Array.from({ length: totalSteps }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.stepDot,
          index < currentStep && styles.stepDotCompleted,
          index === currentStep && styles.stepDotActive,
        ]}
      />
    ))}
  </View>
);

// ============ MOOD SELECTOR ============
type MoodSelectorProps = {
  selectedMood: MoodLevel | null;
  onSelect: (mood: MoodLevel) => void;
};

const MoodSelector = ({ selectedMood, onSelect }: MoodSelectorProps) => (
  <View style={styles.moodSelector}>
    {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => {
      const config = moodConfig[level];
      const isSelected = selectedMood === level;
      
      return (
        <TouchableOpacity
          key={level}
          style={[
            styles.moodOption,
            isSelected && { backgroundColor: config.color + '20', borderColor: config.color },
          ]}
          onPress={() => onSelect(level)}
        >
          <Text style={styles.moodEmoji}>{config.emoji}</Text>
          <Text style={[
            styles.moodLabel,
            isSelected && { color: config.color, fontWeight: '600' }
          ]}>
            {config.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ============ SPENDING FEELING SELECTOR ============
type SpendingFeelingSelectorProps = {
  selected: SpendingFeeling | null;
  onSelect: (feeling: SpendingFeeling) => void;
};

const SpendingFeelingSelector = ({ selected, onSelect }: SpendingFeelingSelectorProps) => (
  <View style={styles.feelingSelector}>
    {(Object.keys(spendingFeelingConfig) as SpendingFeeling[]).map((feeling) => {
      const config = spendingFeelingConfig[feeling];
      const isSelected = selected === feeling;
      
      return (
        <TouchableOpacity
          key={feeling}
          style={[
            styles.feelingOption,
            isSelected && { backgroundColor: config.color + '15', borderColor: config.color },
          ]}
          onPress={() => onSelect(feeling)}
        >
          <Text style={styles.feelingEmoji}>{config.emoji}</Text>
          <View style={styles.feelingInfo}>
            <Text style={[
              styles.feelingLabel,
              isSelected && { color: config.color, fontWeight: '700' }
            ]}>
              {config.label}
            </Text>
            <Text style={styles.feelingDescription}>{config.description}</Text>
          </View>
          {isSelected && (
            <SFSymbol name="checkmark.circle.fill" size={22} color={config.color} />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

// ============ QUICK EXPENSE CARD ============
type QuickExpenseCardProps = {
  expense: QuickExpense;
  onUpdate: (expense: QuickExpense) => void;
  onDelete: () => void;
  index: number;
};

const QuickExpenseCard = ({ expense, onUpdate, onDelete, index }: QuickExpenseCardProps) => {
  const [showCategories, setShowCategories] = useState(false);
  const config = categoryConfig[expense.category];

  return (
    <View style={styles.expenseCard}>
      <View style={styles.expenseCardHeader}>
        <Text style={styles.expenseCardNumber}>#{index + 1}</Text>
        <TouchableOpacity style={styles.expenseDeleteButton} onPress={onDelete}>
          <SFSymbol name="xmark.circle.fill" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* Category Selector */}
      <TouchableOpacity
        style={styles.categorySelector}
        onPress={() => setShowCategories(!showCategories)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: config.color + '15' }]}>
          <SFSymbol name={config.icon} size={20} color={config.color} />
        </View>
        <Text style={styles.categorySelectorText}>{config.label}</Text>
        <SFSymbol name="chevron.down" size={14} color="#8E8E93" />
      </TouchableOpacity>

      {showCategories && (
        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const catConfig = categoryConfig[cat];
            const isSelected = expense.category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryGridItem,
                  isSelected && { backgroundColor: catConfig.color + '20' }
                ]}
                onPress={() => {
                  onUpdate({ ...expense, category: cat });
                  setShowCategories(false);
                }}
              >
                <View style={[styles.categoryGridIcon, { backgroundColor: catConfig.color + '15' }]}>
                  <SFSymbol name={catConfig.icon} size={18} color={catConfig.color} />
                </View>
                <Text style={[
                  styles.categoryGridLabel,
                  isSelected && { color: catConfig.color, fontWeight: '600' }
                ]}>
                  {catConfig.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Amount */}
      <View style={styles.amountInput}>
        <Text style={styles.amountPrefix}>$</Text>
        <TextInput
          style={styles.amountField}
          value={expense.amount}
          onChangeText={(text) => onUpdate({ ...expense, amount: text })}
          placeholder="0.00"
          keyboardType="decimal-pad"
          placeholderTextColor="#C7C7CC"
        />
      </View>

      {/* Note */}
      <TextInput
        style={styles.noteInput}
        value={expense.note}
        onChangeText={(text) => onUpdate({ ...expense, note: text })}
        placeholder="What was this for? (optional)"
        placeholderTextColor="#C7C7CC"
      />

      {/* Was it necessary? */}
      <View style={styles.necessarySection}>
        <Text style={styles.necessaryLabel}>Was this necessary?</Text>
        <View style={styles.necessaryOptions}>
          <TouchableOpacity
            style={[
              styles.necessaryOption,
              expense.wasNecessary === true && styles.necessaryOptionYes
            ]}
            onPress={() => onUpdate({ ...expense, wasNecessary: true })}
          >
            <SFSymbol 
              name="checkmark" 
              size={16} 
              color={expense.wasNecessary === true ? '#FFFFFF' : '#046C4E'} 
            />
            <Text style={[
              styles.necessaryOptionText,
              expense.wasNecessary === true && styles.necessaryOptionTextActive
            ]}>
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.necessaryOption,
              expense.wasNecessary === false && styles.necessaryOptionNo
            ]}
            onPress={() => onUpdate({ ...expense, wasNecessary: false })}
          >
            <SFSymbol 
              name="xmark" 
              size={16} 
              color={expense.wasNecessary === false ? '#FFFFFF' : '#DC2626'} 
            />
            <Text style={[
              styles.necessaryOptionText,
              expense.wasNecessary === false && styles.necessaryOptionTextActiveNo
            ]}>
              No
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function DailyCheckinScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [spendingFeeling, setSpendingFeeling] = useState<SpendingFeeling | null>(null);
  const [expenses, setExpenses] = useState<QuickExpense[]>([]);
  const [noSpendingToday, setNoSpendingToday] = useState(false);
  const [reflection, setReflection] = useState('');
  const [currentPrompt] = useState(() => 
    reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)]
  );

  // Mock data
  const todayDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  const streakDays = 7;
  const budgetRemaining = 245.50;
  const dailyBudget = 85;

  const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const unnecessaryTotal = expenses
    .filter(exp => exp.wasNecessary === false)
    .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

  const addExpense = () => {
    const newExpense: QuickExpense = {
      id: `exp_${Date.now()}`,
      category: 'food',
      amount: '',
      note: '',
      wasNecessary: null,
    };
    setExpenses([...expenses, newExpense]);
  };

  const updateExpense = (index: number, updated: QuickExpense) => {
    const newExpenses = [...expenses];
    newExpenses[index] = updated;
    setExpenses(newExpenses);
  };

  const deleteExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleComplete = () => {
    // Save check-in data
    const checkinData = {
      date: new Date().toISOString(),
      mood,
      spendingFeeling,
      expenses: expenses.map(exp => ({
        category: exp.category,
        amount: parseFloat(exp.amount) || 0,
        note: exp.note,
        wasNecessary: exp.wasNecessary,
      })),
      noSpendingToday,
      reflection,
      totalSpent: totalExpenses,
      unnecessarySpending: unnecessaryTotal,
    };

    console.log('Check-in completed:', checkinData);

    Alert.alert(
      '✨ Check-in Complete!',
      `Great job reflecting on your day! You've maintained a ${streakDays + 1}-day streak.`,
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Check-in?',
      'You can always come back later to log your expenses.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => navigation.goBack() },
      ]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return mood !== null;
      case 1: return spendingFeeling !== null;
      case 2: return noSpendingToday || expenses.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepEmoji}>👋</Text>
              <Text style={styles.stepTitle}>How was your day?</Text>
              <Text style={styles.stepSubtitle}>
                Take a moment to reflect on how you're feeling
              </Text>
            </View>
            <MoodSelector selectedMood={mood} onSelect={setMood} />
            
            {mood && (
              <Animated.View style={styles.moodResponse}>
                <Text style={styles.moodResponseText}>
                  {mood >= 4 
                    ? "That's wonderful! Let's see how your spending matched your mood." 
                    : mood >= 3 
                      ? "Thanks for sharing. Let's check in on your finances."
                      : "Sorry to hear that. Tracking can help on tough days too."}
                </Text>
              </Animated.View>
            )}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepEmoji}>💰</Text>
              <Text style={styles.stepTitle}>How do you feel about today's spending?</Text>
              <Text style={styles.stepSubtitle}>
                Be honest — there's no wrong answer
              </Text>
            </View>
            <SpendingFeelingSelector selected={spendingFeeling} onSelect={setSpendingFeeling} />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepEmoji}>📝</Text>
              <Text style={styles.stepTitle}>What did you spend today?</Text>
              <Text style={styles.stepSubtitle}>
                Quick log your purchases — every entry helps!
              </Text>
            </View>

            {/* Budget Context */}
            <View style={styles.budgetContext}>
              <View style={styles.budgetContextItem}>
                <Text style={styles.budgetContextLabel}>Daily Budget</Text>
                <Text style={styles.budgetContextValue}>${dailyBudget}</Text>
              </View>
              <View style={styles.budgetContextDivider} />
              <View style={styles.budgetContextItem}>
                <Text style={styles.budgetContextLabel}>Spent Today</Text>
                <Text style={[
                  styles.budgetContextValue,
                  totalExpenses > dailyBudget && { color: '#DC2626' }
                ]}>
                  ${totalExpenses.toFixed(2)}
                </Text>
              </View>
              <View style={styles.budgetContextDivider} />
              <View style={styles.budgetContextItem}>
                <Text style={styles.budgetContextLabel}>Remaining</Text>
                <Text style={[
                  styles.budgetContextValue,
                  { color: dailyBudget - totalExpenses >= 0 ? '#046C4E' : '#DC2626' }
                ]}>
                  ${(dailyBudget - totalExpenses).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* No Spending Toggle */}
            <TouchableOpacity
              style={[
                styles.noSpendingToggle,
                noSpendingToday && styles.noSpendingToggleActive
              ]}
              onPress={() => {
                setNoSpendingToday(!noSpendingToday);
                if (!noSpendingToday) setExpenses([]);
              }}
            >
              <View style={[
                styles.noSpendingCheck,
                noSpendingToday && styles.noSpendingCheckActive
              ]}>
                {noSpendingToday && (
                  <SFSymbol name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.noSpendingInfo}>
                <Text style={[
                  styles.noSpendingTitle,
                  noSpendingToday && styles.noSpendingTitleActive
                ]}>
                  🎉 No-spend day!
                </Text>
                <Text style={styles.noSpendingSubtitle}>
                  I didn't spend anything today
                </Text>
              </View>
            </TouchableOpacity>

            {!noSpendingToday && (
              <>
                {/* Expense List */}
                {expenses.map((expense, index) => (
                  <QuickExpenseCard
                    key={expense.id}
                    expense={expense}
                    index={index}
                    onUpdate={(updated) => updateExpense(index, updated)}
                    onDelete={() => deleteExpense(index)}
                  />
                ))}

                {/* Add Expense Button */}
                <TouchableOpacity style={styles.addExpenseButton} onPress={addExpense}>
                  <SFSymbol name="plus.circle.fill" size={24} color="#046C4E" />
                  <Text style={styles.addExpenseButtonText}>
                    {expenses.length === 0 ? 'Add an expense' : 'Add another expense'}
                  </Text>
                </TouchableOpacity>

                {/* Summary */}
                {expenses.length > 0 && (
                  <View style={styles.expenseSummary}>
                    <View style={styles.expenseSummaryRow}>
                      <Text style={styles.expenseSummaryLabel}>Total Spent</Text>
                      <Text style={styles.expenseSummaryValue}>${totalExpenses.toFixed(2)}</Text>
                    </View>
                    {unnecessaryTotal > 0 && (
                      <View style={styles.expenseSummaryRow}>
                        <Text style={styles.expenseSummaryLabelRed}>Unnecessary</Text>
                        <Text style={styles.expenseSummaryValueRed}>
                          ${unnecessaryTotal.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepEmoji}>💭</Text>
              <Text style={styles.stepTitle}>Reflection Time</Text>
              <Text style={styles.stepSubtitle}>
                A moment of mindfulness about your finances
              </Text>
            </View>

            {/* Today's Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Today's Summary</Text>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemEmoji}>{mood ? moodConfig[mood].emoji : '😐'}</Text>
                  <Text style={styles.summaryItemLabel}>Mood</Text>
                  <Text style={styles.summaryItemValue}>{mood ? moodConfig[mood].label : '-'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemEmoji}>
                    {spendingFeeling ? spendingFeelingConfig[spendingFeeling].emoji : '💵'}
                  </Text>
                  <Text style={styles.summaryItemLabel}>Feeling</Text>
                  <Text style={styles.summaryItemValue}>
                    {spendingFeeling ? spendingFeelingConfig[spendingFeeling].label : '-'}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemEmoji}>💸</Text>
                  <Text style={styles.summaryItemLabel}>Spent</Text>
                  <Text style={styles.summaryItemValue}>
                    {noSpendingToday ? '$0' : `$${totalExpenses.toFixed(0)}`}
                  </Text>
                </View>
              </View>

              {noSpendingToday && (
                <View style={styles.noSpendBadge}>
                  <SFSymbol name="star.fill" size={16} color="#F59E0B" />
                  <Text style={styles.noSpendBadgeText}>No-Spend Day Achievement!</Text>
                </View>
              )}
            </View>

            {/* Reflection Prompt */}
            <View style={styles.reflectionCard}>
              <View style={styles.reflectionPromptHeader}>
                <SFSymbol name="sparkles" size={18} color="#7C3AED" />
                <Text style={styles.reflectionPromptLabel}>Today's Prompt</Text>
              </View>
              <Text style={styles.reflectionPrompt}>{currentPrompt}</Text>
              <TextInput
                style={styles.reflectionInput}
                value={reflection}
                onChangeText={setReflection}
                placeholder="Share your thoughts... (optional)"
                placeholderTextColor="#C7C7CC"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Streak */}
            <View style={styles.streakCard}>
              <View style={styles.streakIcon}>
                <Text style={styles.streakEmoji}>🔥</Text>
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>{streakDays}-Day Streak!</Text>
                <Text style={styles.streakSubtitle}>
                  Complete today to make it {streakDays + 1} days
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleSkip}>
          <Text style={styles.headerButtonText}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Daily Check-in</Text>
          <Text style={styles.headerDate}>{todayDate}</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={4} />

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 20 }]}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <SFSymbol name="chevron.left" size={18} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
            currentStep === 0 && { marginLeft: 'auto' },
          ]}
          onPress={currentStep === 3 ? handleComplete : handleNext}
          disabled={!canProceed()}
        >
          <Text style={[
            styles.nextButtonText,
            !canProceed() && styles.nextButtonTextDisabled
          ]}>
            {currentStep === 3 ? 'Complete Check-in' : 'Continue'}
          </Text>
          {currentStep < 3 && (
            <SFSymbol 
              name="chevron.right" 
              size={18} 
              color={canProceed() ? '#FFFFFF' : '#8E8E93'} 
            />
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 60,
  },
  headerButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
  stepDotCompleted: {
    backgroundColor: '#046C4E',
  },
  stepDotActive: {
    backgroundColor: '#046C4E',
    width: 24,
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
    paddingTop: 24,
  },

  // Step Content
  stepContent: {
    gap: 24,
  },
  stepHeader: {
    alignItems: 'center',
    gap: 8,
  },
  stepEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Mood Selector
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  moodResponse: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  moodResponseText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Spending Feeling Selector
  feelingSelector: {
    gap: 12,
  },
  feelingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 14,
  },
  feelingEmoji: {
    fontSize: 28,
  },
  feelingInfo: {
    flex: 1,
  },
  feelingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  feelingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Budget Context
  budgetContext: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  budgetContextItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetContextLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  budgetContextValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  budgetContextDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },

  // No Spending Toggle
  noSpendingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 14,
  },
  noSpendingToggleActive: {
    backgroundColor: '#046C4E10',
    borderColor: '#046C4E',
  },
  noSpendingCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSpendingCheckActive: {
    backgroundColor: '#046C4E',
  },
  noSpendingInfo: {
    flex: 1,
  },
  noSpendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  noSpendingTitleActive: {
    color: '#046C4E',
  },
  noSpendingSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Expense Card
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  expenseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseCardNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  expenseDeleteButton: {
    padding: 4,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryGridIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGridLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  amountPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8E8E93',
  },
  amountField: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    paddingVertical: 14,
    paddingLeft: 8,
  },
  noteInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
  necessarySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  necessaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  necessaryOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  necessaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  necessaryOptionYes: {
    backgroundColor: '#046C4E',
  },
  necessaryOptionNo: {
    backgroundColor: '#DC2626',
  },
  necessaryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  necessaryOptionTextActive: {
    color: '#FFFFFF',
  },
  necessaryOptionTextActiveNo: {
    color: '#FFFFFF',
  },

  // Add Expense Button
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    gap: 10,
    borderWidth: 2,
    borderColor: '#046C4E30',
    borderStyle: 'dashed',
  },
  addExpenseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#046C4E',
  },

  // Expense Summary
  expenseSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  expenseSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  expenseSummaryLabel: {
    fontSize: 16,
    color: '#000',
  },
  expenseSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  expenseSummaryLabelRed: {
    fontSize: 14,
    color: '#DC2626',
  },
  expenseSummaryValueRed: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryItemEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  noSpendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  noSpendBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },

  // Reflection Card
  reflectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  reflectionPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reflectionPromptLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  reflectionPrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    lineHeight: 26,
    marginBottom: 16,
  },
  reflectionInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Streak Card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
  },
  streakSubtitle: {
    fontSize: 14,
    color: '#B45309',
    marginTop: 2,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#046C4E',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: '#8E8E93',
  },
});