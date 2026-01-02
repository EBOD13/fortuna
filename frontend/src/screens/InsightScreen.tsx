// src/screens/InsightScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import InsightCard, { Insight, InsightList } from '../components/cards/InsightCard';
import { useEmotionalAnalysis } from '../hooks/useExpense';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TYPES ============
type EmotionType = 
  | 'happy' 
  | 'stressed' 
  | 'anxious' 
  | 'bored' 
  | 'sad' 
  | 'excited' 
  | 'tired' 
  | 'frustrated'
  | 'neutral';

type SpendingPattern = {
  pattern_id: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  amount_affected: number;
  frequency: string;
  icon: string;
  color: string;
  suggestion?: string;
};

type EmotionalSpendingData = {
  emotion: EmotionType;
  label: string;
  icon: string;
  color: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
  avg_per_transaction: number;
};

// AIInsight type now imported from InsightCard component

type TimeOfDaySpending = {
  period: string;
  label: string;
  amount: number;
  percentage: number;
  icon: string;
  color: string;
  insight?: string;
};

type WeeklyMood = {
  day: string;
  mood_score: number; // 1-10
  spending: number;
  dominant_emotion: EmotionType;
};

type FinancialHealthScore = {
  overall: number;
  savings_rate: number;
  budget_adherence: number;
  emotional_spending: number;
  goal_progress: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
};

type DailyCheckIn = {
  completed_today: boolean;
  streak: number;
  last_mood: EmotionType;
  last_energy: number;
};

// ============ EMOTION CONFIG ============
const emotionConfig: Record<EmotionType, { icon: string; color: string; label: string }> = {
  happy: { icon: 'face.smiling.fill', color: '#046C4E', label: 'Happy' },
  stressed: { icon: 'bolt.heart.fill', color: '#DC2626', label: 'Stressed' },
  anxious: { icon: 'waveform.path.ecg', color: '#F59E0B', label: 'Anxious' },
  bored: { icon: 'moon.zzz.fill', color: '#6B7280', label: 'Bored' },
  sad: { icon: 'cloud.rain.fill', color: '#3B82F6', label: 'Sad' },
  excited: { icon: 'star.fill', color: '#EC4899', label: 'Excited' },
  tired: { icon: 'powersleep', color: '#8B5CF6', label: 'Tired' },
  frustrated: { icon: 'flame.fill', color: '#EA580C', label: 'Frustrated' },
  neutral: { icon: 'face.dashed', color: '#9CA3AF', label: 'Neutral' },
};

// ============ HEADER ============
const AppHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.navigate('NotificationsScreen')}
      >
        <SFSymbol name="bell" size={22} color="#000" />
      </TouchableOpacity>
      <Text style={styles.appName}>Fortuna</Text>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.navigate('ProfileScreen')}
      >
        <SFSymbol name="person.circle" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

// ============ DAILY CHECK-IN CARD ============
type DailyCheckInCardProps = {
  checkIn: DailyCheckIn;
  onCheckIn: () => void;
};

const DailyCheckInCard = ({ checkIn, onCheckIn }: DailyCheckInCardProps) => {
  if (checkIn.completed_today) {
    return (
      <View style={styles.checkInCardCompleted}>
        <View style={styles.checkInCompletedContent}>
          <View style={styles.checkInCompletedIcon}>
            <SFSymbol name="checkmark.circle.fill" size={24} color="#046C4E" />
          </View>
          <View style={styles.checkInCompletedText}>
            <Text style={styles.checkInCompletedTitle}>Today's check-in complete!</Text>
            <Text style={styles.checkInCompletedStreak}>
              🔥 {checkIn.streak} day streak
            </Text>
          </View>
        </View>
        <View style={styles.checkInMoodDisplay}>
          <Text style={styles.checkInMoodLabel}>You're feeling</Text>
          <View style={[
            styles.checkInMoodBadge, 
            { backgroundColor: emotionConfig[checkIn.last_mood].color + '20' }
          ]}>
            <SFSymbol 
              name={emotionConfig[checkIn.last_mood].icon} 
              size={16} 
              color={emotionConfig[checkIn.last_mood].color} 
            />
            <Text style={[
              styles.checkInMoodText, 
              { color: emotionConfig[checkIn.last_mood].color }
            ]}>
              {emotionConfig[checkIn.last_mood].label}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.checkInCard} onPress={onCheckIn} activeOpacity={0.8}>
      <View style={styles.checkInGradient}>
        <View style={styles.checkInContent}>
          <View style={styles.checkInIcon}>
            <SFSymbol name="sun.max.fill" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.checkInTextContainer}>
            <Text style={styles.checkInTitle}>How are you feeling today?</Text>
            <Text style={styles.checkInSubtitle}>
              Quick check-in helps Fortuna understand your spending patterns
            </Text>
          </View>
        </View>
        <View style={styles.checkInAction}>
          <Text style={styles.checkInActionText}>Check In</Text>
          <SFSymbol name="chevron.right" size={16} color="#FFFFFF" />
        </View>
        {checkIn.streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>🔥 {checkIn.streak}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ============ FINANCIAL HEALTH SCORE ============
type HealthScoreCardProps = {
  score: FinancialHealthScore;
};

const HealthScoreCard = ({ score }: HealthScoreCardProps) => {
  const getScoreColor = (value: number) => {
    if (value >= 80) return '#046C4E';
    if (value >= 60) return '#F59E0B';
    return '#DC2626';
  };

  const getScoreLabel = (value: number) => {
    if (value >= 90) return 'Excellent';
    if (value >= 80) return 'Great';
    if (value >= 70) return 'Good';
    if (value >= 60) return 'Fair';
    return 'Needs Work';
  };

  return (
    <View style={styles.healthScoreCard}>
      <View style={styles.healthScoreHeader}>
        <Text style={styles.healthScoreTitle}>Financial Wellness</Text>
        <View style={[
          styles.healthScoreTrend,
          { backgroundColor: score.trend === 'up' ? '#046C4E15' : score.trend === 'down' ? '#DC262615' : '#6B728015' }
        ]}>
          <SFSymbol 
            name={score.trend === 'up' ? 'arrow.up.right' : score.trend === 'down' ? 'arrow.down.right' : 'minus'} 
            size={12} 
            color={score.trend === 'up' ? '#046C4E' : score.trend === 'down' ? '#DC2626' : '#6B7280'} 
          />
          <Text style={[
            styles.healthScoreTrendText,
            { color: score.trend === 'up' ? '#046C4E' : score.trend === 'down' ? '#DC2626' : '#6B7280' }
          ]}>
            {score.change > 0 ? '+' : ''}{score.change}%
          </Text>
        </View>
      </View>

      <View style={styles.healthScoreMain}>
        <View style={styles.healthScoreCircle}>
          <Text style={[styles.healthScoreValue, { color: getScoreColor(score.overall) }]}>
            {score.overall}
          </Text>
          <Text style={styles.healthScoreLabel}>{getScoreLabel(score.overall)}</Text>
        </View>

        <View style={styles.healthScoreMetrics}>
          <View style={styles.healthScoreMetric}>
            <View style={styles.healthScoreMetricHeader}>
              <SFSymbol name="banknote.fill" size={14} color="#046C4E" />
              <Text style={styles.healthScoreMetricLabel}>Savings</Text>
            </View>
            <View style={styles.healthScoreMetricBar}>
              <View style={[styles.healthScoreMetricFill, { width: `${score.savings_rate}%`, backgroundColor: '#046C4E' }]} />
            </View>
            <Text style={styles.healthScoreMetricValue}>{score.savings_rate}%</Text>
          </View>

          <View style={styles.healthScoreMetric}>
            <View style={styles.healthScoreMetricHeader}>
              <SFSymbol name="chart.pie.fill" size={14} color="#2563EB" />
              <Text style={styles.healthScoreMetricLabel}>Budget</Text>
            </View>
            <View style={styles.healthScoreMetricBar}>
              <View style={[styles.healthScoreMetricFill, { width: `${score.budget_adherence}%`, backgroundColor: '#2563EB' }]} />
            </View>
            <Text style={styles.healthScoreMetricValue}>{score.budget_adherence}%</Text>
          </View>

          <View style={styles.healthScoreMetric}>
            <View style={styles.healthScoreMetricHeader}>
              <SFSymbol name="heart.fill" size={14} color="#EC4899" />
              <Text style={styles.healthScoreMetricLabel}>Emotional</Text>
            </View>
            <View style={styles.healthScoreMetricBar}>
              <View style={[styles.healthScoreMetricFill, { width: `${score.emotional_spending}%`, backgroundColor: '#EC4899' }]} />
            </View>
            <Text style={styles.healthScoreMetricValue}>{score.emotional_spending}%</Text>
          </View>

          <View style={styles.healthScoreMetric}>
            <View style={styles.healthScoreMetricHeader}>
              <SFSymbol name="target" size={14} color="#7C3AED" />
              <Text style={styles.healthScoreMetricLabel}>Goals</Text>
            </View>
            <View style={styles.healthScoreMetricBar}>
              <View style={[styles.healthScoreMetricFill, { width: `${score.goal_progress}%`, backgroundColor: '#7C3AED' }]} />
            </View>
            <Text style={styles.healthScoreMetricValue}>{score.goal_progress}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ============ AI INSIGHT CARD ============
// AIInsightCard now imported from InsightCard component

// ============ EMOTIONAL SPENDING BREAKDOWN ============
type EmotionalBreakdownProps = {
  data: EmotionalSpendingData[];
  onSeeAll: () => void;
};

const EmotionalBreakdown = ({ data, onSeeAll }: EmotionalBreakdownProps) => {
  const topEmotions = data.slice(0, 4);
  const maxAmount = Math.max(...data.map(d => d.total_amount), 1);

  return (
    <View style={styles.emotionalBreakdown}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: '#EC489915' }]}>
            <SFSymbol name="heart.text.square.fill" size={16} color="#EC4899" />
          </View>
          <Text style={styles.sectionTitle}>Emotional Spending</Text>
        </View>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.sectionAction}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emotionalGrid}>
        {topEmotions.map((item) => (
          <View key={item.emotion} style={styles.emotionalItem}>
            <View style={[styles.emotionalItemIcon, { backgroundColor: item.color + '15' }]}>
              <SFSymbol name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.emotionalItemLabel}>{item.label}</Text>
            <Text style={styles.emotionalItemAmount}>${item.total_amount.toLocaleString()}</Text>
            <View style={styles.emotionalItemBar}>
              <View 
                style={[
                  styles.emotionalItemBarFill, 
                  { width: `${(item.total_amount / maxAmount) * 100}%`, backgroundColor: item.color }
                ]} 
              />
            </View>
            <Text style={styles.emotionalItemCount}>{item.transaction_count} purchases</Text>
          </View>
        ))}
      </View>

      {data.length > 0 && data[0].emotion === 'stressed' && (
        <View style={styles.emotionalAlert}>
          <SFSymbol name="exclamationmark.triangle.fill" size={16} color="#DC2626" />
          <Text style={styles.emotionalAlertText}>
            Stress-driven spending is your #1 emotional trigger this month
          </Text>
        </View>
      )}
    </View>
  );
};

// ============ TIME OF DAY ANALYSIS ============
type TimeOfDayProps = {
  data: TimeOfDaySpending[];
};

const TimeOfDayAnalysis = ({ data }: TimeOfDayProps) => {
  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  return (
    <View style={styles.timeOfDayCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: '#F59E0B15' }]}>
            <SFSymbol name="clock.fill" size={16} color="#F59E0B" />
          </View>
          <Text style={styles.sectionTitle}>When You Spend</Text>
        </View>
      </View>

      <View style={styles.timeOfDayGrid}>
        {data.map((item) => (
          <View key={item.period} style={styles.timeOfDayItem}>
            <View style={[styles.timeOfDayIcon, { backgroundColor: item.color + '15' }]}>
              <SFSymbol name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.timeOfDayLabel}>{item.label}</Text>
            <Text style={styles.timeOfDayAmount}>${item.amount.toLocaleString()}</Text>
            <View style={styles.timeOfDayBar}>
              <View 
                style={[
                  styles.timeOfDayBarFill, 
                  { height: `${(item.amount / maxAmount) * 100}%`, backgroundColor: item.color }
                ]} 
              />
            </View>
            <Text style={styles.timeOfDayPercent}>{item.percentage}%</Text>
          </View>
        ))}
      </View>

      {data.find(d => d.insight) && (
        <View style={styles.timeOfDayInsight}>
          <SFSymbol name="lightbulb.fill" size={16} color="#F59E0B" />
          <Text style={styles.timeOfDayInsightText}>
            {data.find(d => d.insight)?.insight}
          </Text>
        </View>
      )}
    </View>
  );
};

// ============ SPENDING PATTERNS ============
type SpendingPatternsProps = {
  patterns: SpendingPattern[];
  onPatternPress: (pattern: SpendingPattern) => void;
  onSeeAll: () => void;
};

const SpendingPatterns = ({ patterns, onPatternPress, onSeeAll }: SpendingPatternsProps) => (
  <View style={styles.patternsContainer}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionHeaderIcon, { backgroundColor: '#7C3AED15' }]}>
          <SFSymbol name="waveform.path.ecg.rectangle.fill" size={16} color="#7C3AED" />
        </View>
        <Text style={styles.sectionTitle}>Detected Patterns</Text>
      </View>
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.sectionAction}>See All</Text>
      </TouchableOpacity>
    </View>

    {patterns.map((pattern) => (
      <TouchableOpacity 
        key={pattern.pattern_id}
        style={styles.patternCard}
        onPress={() => onPatternPress(pattern)}
        activeOpacity={0.7}
      >
        <View style={[styles.patternIcon, { backgroundColor: pattern.color + '15' }]}>
          <SFSymbol name={pattern.icon} size={22} color={pattern.color} />
        </View>
        <View style={styles.patternContent}>
          <View style={styles.patternHeader}>
            <Text style={styles.patternTitle}>{pattern.title}</Text>
            <View style={[
              styles.patternImpact,
              { backgroundColor: pattern.impact === 'positive' ? '#046C4E15' : pattern.impact === 'negative' ? '#DC262615' : '#6B728015' }
            ]}>
              <SFSymbol 
                name={pattern.impact === 'positive' ? 'arrow.down' : pattern.impact === 'negative' ? 'arrow.up' : 'minus'} 
                size={10} 
                color={pattern.impact === 'positive' ? '#046C4E' : pattern.impact === 'negative' ? '#DC2626' : '#6B7280'} 
              />
              <Text style={[
                styles.patternImpactText,
                { color: pattern.impact === 'positive' ? '#046C4E' : pattern.impact === 'negative' ? '#DC2626' : '#6B7280' }
              ]}>
                ${pattern.amount_affected.toLocaleString()}
              </Text>
            </View>
          </View>
          <Text style={styles.patternDescription}>{pattern.description}</Text>
          <Text style={styles.patternFrequency}>{pattern.frequency}</Text>
          {pattern.suggestion && (
            <View style={styles.patternSuggestion}>
              <SFSymbol name="sparkles" size={12} color="#7C3AED" />
              <Text style={styles.patternSuggestionText}>{pattern.suggestion}</Text>
            </View>
          )}
        </View>
        <SFSymbol name="chevron.right" size={16} color="#C7C7CC" />
      </TouchableOpacity>
    ))}
  </View>
);

// ============ WEEKLY MOOD & SPENDING ============
type WeeklyMoodChartProps = {
  data: WeeklyMood[];
};

const WeeklyMoodChart = ({ data }: WeeklyMoodChartProps) => {
  const maxSpending = Math.max(...data.map(d => d.spending), 1);

  return (
    <View style={styles.weeklyMoodCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: '#2563EB15' }]}>
            <SFSymbol name="calendar" size={16} color="#2563EB" />
          </View>
          <Text style={styles.sectionTitle}>This Week</Text>
        </View>
      </View>

      <View style={styles.weeklyMoodGrid}>
        {data.map((day, index) => {
          const emotionData = emotionConfig[day.dominant_emotion];
          const barHeight = (day.spending / maxSpending) * 60;
          
          return (
            <View key={day.day} style={styles.weeklyMoodDay}>
              <View style={[styles.weeklyMoodBar, { height: 70 }]}>
                <View 
                  style={[
                    styles.weeklyMoodBarFill, 
                    { height: barHeight, backgroundColor: emotionData.color }
                  ]} 
                />
              </View>
              <View style={[styles.weeklyMoodEmoji, { backgroundColor: emotionData.color + '20' }]}>
                <SFSymbol name={emotionData.icon} size={14} color={emotionData.color} />
              </View>
              <Text style={styles.weeklyMoodDayLabel}>{day.day}</Text>
              <Text style={styles.weeklyMoodAmount}>${day.spending}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.weeklyMoodLegend}>
        <Text style={styles.weeklyMoodLegendText}>
          Bar height = spending amount • Icon = dominant mood
        </Text>
      </View>
    </View>
  );
};

// ============ QUICK ACTIONS ============
const QuickActions = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  return (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate('MonthlyAnalysisScreen')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: '#046C4E15' }]}>
          <SFSymbol name="doc.text.magnifyingglass" size={22} color="#046C4E" />
        </View>
        <Text style={styles.quickActionLabel}>Monthly{'\n'}Report</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate('SpendingPatternsScreen')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: '#2563EB15' }]}>
          <SFSymbol name="chart.xyaxis.line" size={22} color="#2563EB" />
        </View>
        <Text style={styles.quickActionLabel}>Spending{'\n'}Patterns</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate('EmotionalReportScreen')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: '#7C3AED15' }]}>
          <SFSymbol name="brain.head.profile" size={22} color="#7C3AED" />
        </View>
        <Text style={styles.quickActionLabel}>Emotional{'\n'}Report</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate('ReflectionScreen')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B15' }]}>
          <SFSymbol name="text.book.closed.fill" size={22} color="#F59E0B" />
        </View>
        <Text style={styles.quickActionLabel}>Monthly{'\n'}Reflection</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function InsightScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State
  const [checkIn, setCheckIn] = useState<DailyCheckIn | null>(null);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [emotionalData, setEmotionalData] = useState<EmotionalSpendingData[]>([]);
  const [timeOfDayData, setTimeOfDayData] = useState<TimeOfDaySpending[]>([]);
  const [patterns, setPatterns] = useState<SpendingPattern[]>([]);
  const [weeklyMood, setWeeklyMood] = useState<WeeklyMood[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 800));

      // Mock Check-in
      setCheckIn({
        completed_today: false,
        streak: 12,
        last_mood: 'happy',
        last_energy: 7,
      });

      // Mock Health Score
      setHealthScore({
        overall: 78,
        savings_rate: 82,
        budget_adherence: 74,
        emotional_spending: 65,
        goal_progress: 88,
        trend: 'up',
        change: 5,
      });

      // Mock AI Insights
      setInsights([
        {
          insight_id: '1',
          type: 'warning',
          title: 'Late-night spending spike detected',
          description: 'You spent $340 after 10 PM this week, mostly on food delivery. This is 3x your usual.',
          priority: 'high',
          timestamp: '2h ago',
          category: 'Spending',
          expandedContent: 'Your late-night spending has increased significantly. Most purchases were food delivery orders between 10 PM and 1 AM. Consider setting app limits or preparing meals in advance.',
          relatedData: [
            { label: 'This Week', value: '$340', trend: 'up', trendIsPositive: false },
            { label: 'Last Week', value: '$95', trend: 'down', trendIsPositive: true },
          ],
          actions: [
            { label: 'View Details', onPress: () => navigation.navigate('SpendingPatternsScreen'), style: 'secondary' },
          ],
          source: 'Fortuna AI',
        },
        {
          insight_id: '2',
          type: 'achievement',
          title: '🎉 New savings milestone!',
          description: 'You\'ve saved $500 more than last month. Your emergency fund is 65% complete.',
          priority: 'medium',
          timestamp: '1d ago',
          category: 'Savings',
          relatedData: [
            { label: 'Saved This Month', value: '$500', trend: 'up', trendIsPositive: true },
            { label: 'Emergency Fund', value: '65%', trend: 'up', trendIsPositive: true },
          ],
          actions: [
            { label: 'See Progress', onPress: () => navigation.navigate('MainTabs'), style: 'primary' },
          ],
        },
        {
          insight_id: '3',
          type: 'alert',
          title: 'Budget alert predicted',
          description: 'At your current pace, you\'ll exceed your dining budget by ~$85 by month end.',
          priority: 'high',
          timestamp: '3h ago',
          category: 'Budget',
          expandedContent: 'Based on your spending pattern, we predict you\'ll exceed your $400 dining budget. You\'ve spent $315 with 10 days remaining in the month.',
          relatedData: [
            { label: 'Spent', value: '$315', trend: 'up', trendIsPositive: false },
            { label: 'Budget', value: '$400' },
          ],
          actions: [
            { label: 'Adjust Budget', onPress: () => navigation.navigate('EditBudgetScreen', {}), style: 'primary' },
            { label: 'View Spending', onPress: () => navigation.navigate('BudgetDetailScreen', {}), style: 'secondary' },
          ],
          dismissible: true,
          onDismiss: () => setInsights(prev => prev.filter(i => i.insight_id !== '3')),
        },
        {
          insight_id: '4',
          type: 'tip',
          title: 'Coffee savings opportunity',
          description: 'You spend ~$156/month on coffee. Making coffee at home could save you $120/month.',
          priority: 'low',
          timestamp: '5h ago',
          category: 'Tips',
          actions: [
            { label: 'Learn More', onPress: () => {}, style: 'secondary' },
          ],
          dismissible: true,
          onDismiss: () => setInsights(prev => prev.filter(i => i.insight_id !== '4')),
        },
        {
          insight_id: '5',
          type: 'pattern',
          title: 'Weekend spending pattern',
          description: 'You spend 2.3x more on Saturdays compared to weekdays, primarily on entertainment.',
          priority: 'medium',
          timestamp: '1d ago',
          category: 'Patterns',
          relatedData: [
            { label: 'Saturday Avg', value: '$125' },
            { label: 'Weekday Avg', value: '$54' },
          ],
          actions: [
            { label: 'View Patterns', onPress: () => navigation.navigate('SpendingPatternsScreen'), style: 'secondary' },
          ],
        },
      ]);

      // Mock Emotional Spending Data
      setEmotionalData([
        {
          emotion: 'stressed',
          label: 'Stressed',
          icon: 'bolt.heart.fill',
          color: '#DC2626',
          total_amount: 520,
          transaction_count: 14,
          percentage: 32,
          avg_per_transaction: 37,
        },
        {
          emotion: 'bored',
          label: 'Bored',
          icon: 'moon.zzz.fill',
          color: '#6B7280',
          total_amount: 380,
          transaction_count: 22,
          percentage: 23,
          avg_per_transaction: 17,
        },
        {
          emotion: 'happy',
          label: 'Happy',
          icon: 'face.smiling.fill',
          color: '#046C4E',
          total_amount: 290,
          transaction_count: 8,
          percentage: 18,
          avg_per_transaction: 36,
        },
        {
          emotion: 'tired',
          label: 'Tired',
          icon: 'powersleep',
          color: '#8B5CF6',
          total_amount: 245,
          transaction_count: 11,
          percentage: 15,
          avg_per_transaction: 22,
        },
      ]);

      // Mock Time of Day Data
      setTimeOfDayData([
        {
          period: 'morning',
          label: 'Morning',
          amount: 180,
          percentage: 12,
          icon: 'sunrise.fill',
          color: '#F59E0B',
        },
        {
          period: 'afternoon',
          label: 'Afternoon',
          amount: 420,
          percentage: 28,
          icon: 'sun.max.fill',
          color: '#046C4E',
        },
        {
          period: 'evening',
          label: 'Evening',
          amount: 560,
          percentage: 37,
          icon: 'sunset.fill',
          color: '#EC4899',
        },
        {
          period: 'night',
          label: 'Night',
          amount: 340,
          percentage: 23,
          icon: 'moon.fill',
          color: '#7C3AED',
          insight: 'Late-night spending is 40% higher when stressed',
        },
      ]);

      // Mock Patterns
      setPatterns([
        {
          pattern_id: '1',
          title: 'Weekend Splurge',
          description: 'Your spending increases by 65% on Saturdays, primarily on dining and entertainment.',
          impact: 'negative',
          amount_affected: 280,
          frequency: 'Every weekend',
          icon: 'calendar.badge.exclamationmark',
          color: '#DC2626',
          suggestion: 'Try setting a weekend spending limit of $150',
        },
        {
          pattern_id: '2',
          title: 'Coffee Consistency',
          description: 'You buy coffee every weekday morning at the same time. Consider a subscription?',
          impact: 'neutral',
          amount_affected: 120,
          frequency: '5x per week',
          icon: 'cup.and.saucer.fill',
          color: '#92400E',
          suggestion: 'A home coffee setup could save you $80/month',
        },
        {
          pattern_id: '3',
          title: 'Grocery Optimization',
          description: 'You\'ve reduced grocery spending by 15% this month by shopping on Sundays.',
          impact: 'positive',
          amount_affected: 95,
          frequency: 'Weekly habit',
          icon: 'cart.fill',
          color: '#046C4E',
        },
      ]);

      // Mock Weekly Mood
      setWeeklyMood([
        { day: 'Mon', mood_score: 6, spending: 45, dominant_emotion: 'neutral' },
        { day: 'Tue', mood_score: 4, spending: 120, dominant_emotion: 'stressed' },
        { day: 'Wed', mood_score: 7, spending: 35, dominant_emotion: 'happy' },
        { day: 'Thu', mood_score: 5, spending: 80, dominant_emotion: 'tired' },
        { day: 'Fri', mood_score: 8, spending: 95, dominant_emotion: 'excited' },
        { day: 'Sat', mood_score: 7, spending: 180, dominant_emotion: 'happy' },
        { day: 'Sun', mood_score: 6, spending: 55, dominant_emotion: 'neutral' },
      ]);

    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCheckIn = () => {
    navigation.navigate('DailyCheckinScreen');
  };

  const handlePatternPress = (pattern: SpendingPattern) => {
    navigation.navigate('SpendingPatternsScreen');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Analyzing your patterns...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#046C4E" />
        }
      >
        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Insights</Text>
          <Text style={styles.pageSubtitle}>Understand your spending psychology</Text>
        </View>

        {/* Daily Check-in */}
        {checkIn && (
          <DailyCheckInCard checkIn={checkIn} onCheckIn={handleCheckIn} />
        )}

        {/* Quick Actions */}
        <QuickActions />

        {/* Financial Health Score */}
        {healthScore && <HealthScoreCard score={healthScore} />}

        {/* AI Insights */}
        {insights.length > 0 && (
          <InsightList
            insights={insights}
            title="AI Insights"
            variant="default"
            showSeeAll={insights.length > 3}
            onSeeAll={() => {}}
            maxItems={4}
          />
        )}

        {/* Weekly Mood & Spending */}
        {weeklyMood.length > 0 && <WeeklyMoodChart data={weeklyMood} />}

        {/* Emotional Spending Breakdown */}
        {emotionalData.length > 0 && (
          <EmotionalBreakdown data={emotionalData} onSeeAll={() => navigation.navigate('EmotionalReportScreen')} />
        )}

        {/* Time of Day Analysis */}
        {timeOfDayData.length > 0 && <TimeOfDayAnalysis data={timeOfDayData} />}

        {/* Spending Patterns */}
        {patterns.length > 0 && (
          <SpendingPatterns 
            patterns={patterns} 
            onPatternPress={handlePatternPress} 
            onSeeAll={() => navigation.navigate('SpendingPatternsScreen')}
          />
        )}

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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 8,
  },
  appName: {
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#000',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Page Title
  pageTitleContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Daily Check-in
  checkInCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  checkInGradient: {
    backgroundColor: '#7C3AED',
    padding: 20,
  },
  checkInContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkInIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  checkInTextContainer: {
    flex: 1,
  },
  checkInTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  checkInSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  checkInAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  checkInActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  streakBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkInCardCompleted: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#046C4E30',
  },
  checkInCompletedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkInCompletedIcon: {
    marginRight: 12,
  },
  checkInCompletedText: {
    flex: 1,
  },
  checkInCompletedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#046C4E',
  },
  checkInCompletedStreak: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  checkInMoodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  checkInMoodLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  checkInMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  checkInMoodText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionItem: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 60) / 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Health Score Card
  healthScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  healthScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  healthScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  healthScoreTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  healthScoreTrendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  healthScoreMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  healthScoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  healthScoreLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  healthScoreMetrics: {
    flex: 1,
    gap: 12,
  },
  healthScoreMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthScoreMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    gap: 6,
  },
  healthScoreMetricLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  healthScoreMetricBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthScoreMetricFill: {
    height: '100%',
    borderRadius: 3,
  },
  healthScoreMetricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    width: 32,
    textAlign: 'right',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: '600',
    color: '#046C4E',
  },

  // AI Insights
  // Insight styles now in InsightCard component

  // Emotional Breakdown
  emotionalBreakdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  emotionalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emotionalItem: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 4,
  },
  emotionalItemIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emotionalItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  emotionalItemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emotionalItemBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  emotionalItemBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  emotionalItemCount: {
    fontSize: 10,
    color: '#8E8E93',
  },
  emotionalAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  emotionalAlertText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },

  // Time of Day
  timeOfDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  timeOfDayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeOfDayItem: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 4,
  },
  timeOfDayIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timeOfDayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 6,
  },
  timeOfDayAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  timeOfDayBar: {
    width: 24,
    height: 60,
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  timeOfDayBarFill: {
    width: '100%',
    borderRadius: 12,
  },
  timeOfDayPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  timeOfDayInsight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  timeOfDayInsightText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },

  // Weekly Mood
  weeklyMoodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  weeklyMoodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyMoodDay: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 7,
  },
  weeklyMoodBar: {
    width: 20,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  weeklyMoodBarFill: {
    width: '100%',
    borderRadius: 10,
  },
  weeklyMoodEmoji: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  weeklyMoodDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 2,
  },
  weeklyMoodAmount: {
    fontSize: 10,
    color: '#8E8E93',
  },
  weeklyMoodLegend: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  weeklyMoodLegendText: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Patterns
  patternsContainer: {
    marginBottom: 20,
  },
  patternCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  patternIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  patternContent: {
    flex: 1,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  patternTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  patternImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  patternImpactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patternDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  patternFrequency: {
    fontSize: 12,
    color: '#8E8E93',
  },
  patternSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    gap: 6,
  },
  patternSuggestionText: {
    flex: 1,
    fontSize: 12,
    color: '#7C3AED',
  },

  // Bottom
  bottomSpacer: {
    height: 100,
  },
});