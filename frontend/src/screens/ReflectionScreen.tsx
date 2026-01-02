// src/screens/ReflectionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { ProgressBar } from '../components/charts/ChartComponents';
import ReflectionCard, { 
  Reflection, 
  ReflectionResponse as CardReflectionResponse,
  ReflectionList,
  ReflectionSummaryCard,
} from '../components/cards/ReflectionCard';

// ============ LOCAL TYPES ============
type MoodRating = 1 | 2 | 3 | 4 | 5;

type ReflectionPrompt = {
  prompt_id: string;
  question: string;
  placeholder: string;
  category: 'wins' | 'challenges' | 'lessons' | 'goals' | 'gratitude' | 'general';
  required: boolean;
};

// ============ MOOD CONFIG ============
const moodConfig: Record<MoodRating, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😢', label: 'Struggling', color: '#DC2626' },
  2: { emoji: '😕', label: 'Difficult', color: '#F59E0B' },
  3: { emoji: '😐', label: 'Okay', color: '#6B7280' },
  4: { emoji: '🙂', label: 'Good', color: '#2563EB' },
  5: { emoji: '😄', label: 'Great', color: '#046C4E' },
};

// ============ PROMPTS ============
const monthlyPrompts: ReflectionPrompt[] = [
  {
    prompt_id: '1',
    question: 'What was your biggest financial win this month?',
    placeholder: 'e.g., Stayed under budget, saved extra money, paid off debt...',
    category: 'wins',
    required: true,
  },
  {
    prompt_id: '2',
    question: 'What financial challenge did you face?',
    placeholder: 'e.g., Unexpected expense, overspending, impulse purchases...',
    category: 'challenges',
    required: true,
  },
  {
    prompt_id: '3',
    question: 'What did you learn about your spending habits?',
    placeholder: 'e.g., I spend more when stressed, weekends are expensive...',
    category: 'lessons',
    required: false,
  },
  {
    prompt_id: '4',
    question: 'What\'s one financial goal for next month?',
    placeholder: 'e.g., Save $500, reduce dining out, track every expense...',
    category: 'goals',
    required: true,
  },
  {
    prompt_id: '5',
    question: 'What are you grateful for financially?',
    placeholder: 'e.g., Steady income, emergency fund, supportive partner...',
    category: 'gratitude',
    required: false,
  },
];

// ============ HEADER ============
const Header = ({ onSave, canSave, isSaving }: { onSave: () => void; canSave: boolean; isSaving: boolean }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="chevron.left" size={20} color="#007AFF" />
        <Text style={styles.headerBackText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Monthly Reflection</Text>
      <TouchableOpacity 
        style={[styles.headerSaveButton, !canSave && styles.headerSaveButtonDisabled]}
        onPress={onSave}
        disabled={!canSave || isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={[styles.headerSaveText, !canSave && styles.headerSaveTextDisabled]}>
            Save
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ============ MOOD SELECTOR ============
type MoodSelectorProps = {
  title: string;
  subtitle: string;
  value: MoodRating | null;
  onChange: (value: MoodRating) => void;
};

const MoodSelector = ({ title, subtitle, value, onChange }: MoodSelectorProps) => {
  return (
    <View style={styles.moodSelectorCard}>
      <Text style={styles.moodSelectorTitle}>{title}</Text>
      <Text style={styles.moodSelectorSubtitle}>{subtitle}</Text>
      
      <View style={styles.moodOptions}>
        {([1, 2, 3, 4, 5] as MoodRating[]).map((rating) => {
          const config = moodConfig[rating];
          const isSelected = value === rating;
          
          return (
            <TouchableOpacity
              key={rating}
              style={[
                styles.moodOption,
                isSelected && { backgroundColor: config.color + '20', borderColor: config.color },
              ]}
              onPress={() => onChange(rating)}
            >
              <Text style={styles.moodEmoji}>{config.emoji}</Text>
              <Text style={[
                styles.moodLabel,
                isSelected && { color: config.color, fontWeight: '600' },
              ]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ============ PROMPT CARD ============
type PromptCardProps = {
  prompt: ReflectionPrompt;
  value: string;
  onChange: (value: string) => void;
  index: number;
  total: number;
};

const PromptCard = ({ prompt, value, onChange, index, total }: PromptCardProps) => {
  const getCategoryIcon = () => {
    switch (prompt.category) {
      case 'wins': return { icon: 'trophy.fill', color: '#F59E0B' };
      case 'challenges': return { icon: 'exclamationmark.triangle.fill', color: '#DC2626' };
      case 'lessons': return { icon: 'lightbulb.fill', color: '#2563EB' };
      case 'goals': return { icon: 'target', color: '#046C4E' };
      case 'gratitude': return { icon: 'heart.fill', color: '#EC4899' };
      default: return { icon: 'text.bubble.fill', color: '#6B7280' };
    }
  };

  const categoryConfig = getCategoryIcon();

  return (
    <View style={styles.promptCard}>
      <View style={styles.promptHeader}>
        <View style={[styles.promptIcon, { backgroundColor: categoryConfig.color + '15' }]}>
          <SFSymbol name={categoryConfig.icon} size={16} color={categoryConfig.color} />
        </View>
        <View style={styles.promptMeta}>
          <Text style={styles.promptNumber}>Question {index + 1} of {total}</Text>
          {prompt.required && <Text style={styles.promptRequired}>Required</Text>}
        </View>
      </View>
      
      <Text style={styles.promptQuestion}>{prompt.question}</Text>
      
      <TextInput
        style={styles.promptInput}
        placeholder={prompt.placeholder}
        placeholderTextColor="#C7C7CC"
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      
      <Text style={styles.promptCharCount}>
        {value.length} characters
      </Text>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function ReflectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ReflectionScreen'>>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // New reflection state
  const [moodRating, setMoodRating] = useState<MoodRating | null>(null);
  const [financialRating, setFinancialRating] = useState<MoodRating | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  
  // Data state
  const [pastReflections, setPastReflections] = useState<Reflection[]>([]);
  const [stats, setStats] = useState<{
    total_reflections: number;
    current_streak: number;
    longest_streak: number;
    avg_mood: number;
    avg_financial_rating: number;
    most_common_win: string;
    most_common_challenge: string;
  } | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [hasCurrentReflection, setHasCurrentReflection] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Get current month
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      setCurrentPeriod(`${monthNames[now.getMonth()]} ${now.getFullYear()}`);

      // Mock past reflections with full response data
      setPastReflections([
        {
          reflection_id: '1',
          type: 'monthly',
          period: '2024-11',
          period_label: 'November 2024',
          mood_rating: 4,
          financial_rating: 4,
          responses: [
            { 
              prompt_id: '1', 
              question: 'What was your biggest financial win this month?',
              response: 'Saved $600 towards emergency fund!',
              category: 'wins',
            },
            { 
              prompt_id: '2', 
              question: 'What financial challenge did you face?',
              response: 'Holiday shopping started early and went over budget',
              category: 'challenges',
            },
            { 
              prompt_id: '4', 
              question: 'What\'s one financial goal for next month?',
              response: 'Create a gift budget and stick to it',
              category: 'goals',
            },
          ],
          created_at: 'Nov 30, 2024',
          highlights: ['Saved $600 towards emergency fund!', 'Holiday shopping started early'],
        },
        {
          reflection_id: '2',
          type: 'monthly',
          period: '2024-10',
          period_label: 'October 2024',
          mood_rating: 3,
          financial_rating: 3,
          responses: [
            { 
              prompt_id: '1', 
              question: 'What was your biggest financial win this month?',
              response: 'Paid off credit card completely',
              category: 'wins',
            },
            { 
              prompt_id: '2', 
              question: 'What financial challenge did you face?',
              response: 'Car repair was unexpected and expensive',
              category: 'challenges',
            },
            { 
              prompt_id: '4', 
              question: 'What\'s one financial goal for next month?',
              response: 'Build up car maintenance fund',
              category: 'goals',
            },
          ],
          created_at: 'Oct 31, 2024',
          highlights: ['Paid off credit card completely', 'Car repair was unexpected'],
        },
        {
          reflection_id: '3',
          type: 'monthly',
          period: '2024-09',
          period_label: 'September 2024',
          mood_rating: 5,
          financial_rating: 4,
          responses: [
            { 
              prompt_id: '1', 
              question: 'What was your biggest financial win this month?',
              response: 'Got a raise at work!',
              category: 'wins',
            },
            { 
              prompt_id: '2', 
              question: 'What financial challenge did you face?',
              response: 'Subscriptions adding up - need to audit them',
              category: 'challenges',
            },
            { 
              prompt_id: '3', 
              question: 'What did you learn about your spending habits?',
              response: 'Small recurring charges add up quickly',
              category: 'lessons',
            },
            { 
              prompt_id: '4', 
              question: 'What\'s one financial goal for next month?',
              response: 'Audit and cancel unused subscriptions',
              category: 'goals',
            },
            { 
              prompt_id: '5', 
              question: 'What are you grateful for financially?',
              response: 'Grateful for the raise and supportive manager',
              category: 'gratitude',
            },
          ],
          created_at: 'Sep 30, 2024',
          highlights: ['Got a raise at work!', 'Need to audit subscriptions'],
        },
      ]);

      // Mock stats
      setStats({
        total_reflections: 8,
        current_streak: 3,
        longest_streak: 5,
        avg_mood: 3.8,
        avg_financial_rating: 3.6,
        most_common_win: 'Staying under budget',
        most_common_challenge: 'Impulse purchases',
      });

      setHasCurrentReflection(false);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (promptId: string, value: string) => {
    setResponses(prev => ({ ...prev, [promptId]: value }));
  };

  const canSave = () => {
    if (!moodRating || !financialRating) return false;
    
    const requiredPrompts = monthlyPrompts.filter(p => p.required);
    for (const prompt of requiredPrompts) {
      if (!responses[prompt.prompt_id] || responses[prompt.prompt_id].trim() === '') {
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!canSave()) {
      Alert.alert(
        'Incomplete Reflection',
        'Please complete all required fields before saving.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSaving(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Reflection Saved! 🎉',
        'Great job taking time to reflect on your finances this month.',
        [
          {
            text: 'View History',
            onPress: () => setActiveTab('history'),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );

      // Reset form
      setMoodRating(null);
      setFinancialRating(null);
      setResponses({});
      setHasCurrentReflection(true);

    } catch (error) {
      Alert.alert('Error', 'Failed to save reflection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewReflection = (reflection: Reflection) => {
    // The ReflectionCard now handles expansion internally
    // This could navigate to a detail screen if needed
    console.log('Viewing reflection:', reflection.reflection_id);
  };

  const handleDeleteReflection = (reflection: Reflection) => {
    Alert.alert(
      'Delete Reflection',
      `Are you sure you want to delete your ${reflection.period_label} reflection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setPastReflections(prev => 
              prev.filter(r => r.reflection_id !== reflection.reflection_id)
            );
          },
        },
      ]
    );
  };

  const completionPercentage = () => {
    let completed = 0;
    let total = monthlyPrompts.length + 2; // prompts + 2 mood ratings
    
    if (moodRating) completed++;
    if (financialRating) completed++;
    
    monthlyPrompts.forEach(prompt => {
      if (responses[prompt.prompt_id] && responses[prompt.prompt_id].trim() !== '') {
        completed++;
      }
    });
    
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header onSave={() => {}} canSave={false} isSaving={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header onSave={handleSave} canSave={canSave()} isSaving={saving} />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.tabActive]}
          onPress={() => setActiveTab('new')}
        >
          <SFSymbol 
            name="square.and.pencil" 
            size={16} 
            color={activeTab === 'new' ? '#046C4E' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
            New Reflection
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <SFSymbol 
            name="clock.arrow.circlepath" 
            size={16} 
            color={activeTab === 'history' ? '#046C4E' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
          {pastReflections.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pastReflections.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'new' ? (
            <>
              {/* Period Header */}
              <View style={styles.periodHeader}>
                <View style={styles.periodIconContainer}>
                  <SFSymbol name="calendar" size={24} color="#046C4E" />
                </View>
                <View>
                  <Text style={styles.periodLabel}>Reflecting on</Text>
                  <Text style={styles.periodValue}>{currentPeriod}</Text>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Completion</Text>
                  <Text style={styles.progressPercent}>{completionPercentage()}%</Text>
                </View>
                <ProgressBar
                  progress={completionPercentage()}
                  height={8}
                  color="#046C4E"
                  backgroundColor="#E5E5EA"
                />
              </View>

              {/* Already Completed Message */}
              {hasCurrentReflection && (
                <View style={styles.completedCard}>
                  <SFSymbol name="checkmark.circle.fill" size={24} color="#046C4E" />
                  <View style={styles.completedContent}>
                    <Text style={styles.completedTitle}>Already Reflected!</Text>
                    <Text style={styles.completedText}>
                      You've already completed your reflection for {currentPeriod}. 
                      You can view it in the History tab.
                    </Text>
                  </View>
                </View>
              )}

              {/* Mood Rating */}
              <MoodSelector
                title="How are you feeling overall?"
                subtitle="Think about your general mood this month"
                value={moodRating}
                onChange={setMoodRating}
              />

              {/* Financial Rating */}
              <MoodSelector
                title="How do you feel about your finances?"
                subtitle="Consider your spending, saving, and progress"
                value={financialRating}
                onChange={setFinancialRating}
              />

              {/* Prompts */}
              <View style={styles.promptsSection}>
                <Text style={styles.sectionTitle}>Reflection Questions</Text>
                {monthlyPrompts.map((prompt, index) => (
                  <PromptCard
                    key={prompt.prompt_id}
                    prompt={prompt}
                    value={responses[prompt.prompt_id] || ''}
                    onChange={(value) => handleResponseChange(prompt.prompt_id, value)}
                    index={index}
                    total={monthlyPrompts.length}
                  />
                ))}
              </View>

              {/* Tips */}
              <View style={styles.tipsCard}>
                <View style={styles.tipsIcon}>
                  <SFSymbol name="lightbulb.fill" size={18} color="#F59E0B" />
                </View>
                <View style={styles.tipsContent}>
                  <Text style={styles.tipsTitle}>Reflection Tips</Text>
                  <Text style={styles.tipsText}>
                    • Be honest with yourself{'\n'}
                    • Focus on specific examples{'\n'}
                    • Celebrate small wins{'\n'}
                    • Learn from challenges without judgment
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Stats - Using ReflectionSummaryCard */}
              {stats && (
                <ReflectionSummaryCard
                  totalReflections={stats.total_reflections}
                  currentStreak={stats.current_streak}
                  longestStreak={stats.longest_streak}
                  avgMood={stats.avg_mood}
                  avgFinancialRating={stats.avg_financial_rating}
                  mostCommonWin={stats.most_common_win}
                  mostCommonChallenge={stats.most_common_challenge}
                />
              )}

              {/* Past Reflections - Using ReflectionList */}
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Past Reflections</Text>
                
                {pastReflections.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <SFSymbol name="doc.text" size={40} color="#C7C7CC" />
                    </View>
                    <Text style={styles.emptyTitle}>No Reflections Yet</Text>
                    <Text style={styles.emptyText}>
                      Start your first monthly reflection to track your financial journey.
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyButton}
                      onPress={() => setActiveTab('new')}
                    >
                      <Text style={styles.emptyButtonText}>Start Reflecting</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ReflectionList
                    reflections={pastReflections}
                    variant="default"
                    onReflectionPress={handleViewReflection}
                    onDelete={handleDeleteReflection}
                    showActions={true}
                    groupByYear={pastReflections.length > 6}
                  />
                )}
              </View>

              {/* Streak Motivation */}
              {stats && stats.current_streak > 0 && (
                <View style={styles.streakCard}>
                  <View style={styles.streakIconContainer}>
                    <SFSymbol name="flame.fill" size={28} color="#F59E0B" />
                  </View>
                  <View style={styles.streakContent}>
                    <Text style={styles.streakTitle}>
                      {stats.current_streak} Month Streak! 🔥
                    </Text>
                    <Text style={styles.streakText}>
                      Keep reflecting monthly to maintain your streak. 
                      Your longest streak is {stats.longest_streak} months.
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBackText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerSaveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  headerSaveButtonDisabled: {
    opacity: 0.5,
  },
  headerSaveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerSaveTextDisabled: {
    color: '#C7C7CC',
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

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#046C4E15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#046C4E',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#046C4E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },

  // Period Header
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  periodIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#046C4E15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
  },
  periodValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#046C4E',
  },

  // Completed Card
  completedCard: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  completedContent: {
    flex: 1,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#046C4E',
    marginBottom: 4,
  },
  completedText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },

  // Mood Selector
  moodSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  moodSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  moodSelectorSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Prompts Section
  promptsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },

  // Prompt Card
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  promptIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promptNumber: {
    fontSize: 12,
    color: '#8E8E93',
  },
  promptRequired: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  promptQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    lineHeight: 22,
  },
  promptInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#000',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  promptCharCount: {
    fontSize: 11,
    color: '#C7C7CC',
    textAlign: 'right',
    marginTop: 8,
  },

  // Tips Card
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  tipsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  tipsText: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 20,
  },

  // History Section (styles now in ReflectionCard component)
  historySection: {
    gap: 12,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: '#046C4E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Streak Card
  streakCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  streakIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 20,
  },
});