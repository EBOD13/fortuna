// src/screens/EmotionalReportScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { BarChart, LineChart, PieChart, SpendingBreakdown } from '../components/charts/ChartComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TYPES ============
type EmotionType = 
  | 'happy' 
  | 'stressed' 
  | 'anxious' 
  | 'sad' 
  | 'bored' 
  | 'excited' 
  | 'frustrated' 
  | 'content' 
  | 'tired' 
  | 'confident'
  | 'neutral';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

type EmotionalSummary = {
  total_emotional_spending: number;
  total_planned_spending: number;
  emotional_percent: number;
  avg_emotional_transaction: number;
  avg_planned_transaction: number;
  top_emotion: EmotionType;
  top_emotion_amount: number;
  improvement_from_last_period: number;
  transactions_count: number;
};

type EmotionBreakdown = {
  emotion: EmotionType;
  amount: number;
  percent: number;
  transaction_count: number;
  avg_amount: number;
  trend: 'up' | 'down' | 'stable';
  trend_percent: number;
  common_categories: string[];
  common_times: TimeOfDay[];
};

type CategoryEmotionalData = {
  category: string;
  icon: string;
  color: string;
  total_amount: number;
  emotional_amount: number;
  emotional_percent: number;
  top_emotion: EmotionType;
  transactions: number;
};

type DailyEmotionalData = {
  date: string;
  day_label: string;
  emotional_amount: number;
  planned_amount: number;
  dominant_emotion: EmotionType;
  mood_score: number; // 1-5
};

type EmotionalTrigger = {
  trigger: string;
  description: string;
  occurrence_count: number;
  total_amount: number;
  related_emotions: EmotionType[];
  avoidance_tip: string;
};

type EmotionalInsight = {
  insight_id: string;
  type: 'warning' | 'positive' | 'tip' | 'pattern';
  title: string;
  description: string;
  action?: string;
  related_amount?: number;
};

type MoodSpendingCorrelation = {
  mood_score: number;
  label: string;
  emoji: string;
  avg_spending: number;
  transaction_count: number;
};

// ============ CONFIG ============
const emotionConfig: Record<EmotionType, { emoji: string; color: string; label: string }> = {
  happy: { emoji: '😊', color: '#046C4E', label: 'Happy' },
  stressed: { emoji: '😰', color: '#DC2626', label: 'Stressed' },
  anxious: { emoji: '😟', color: '#F59E0B', label: 'Anxious' },
  sad: { emoji: '😢', color: '#6366F1', label: 'Sad' },
  bored: { emoji: '😑', color: '#6B7280', label: 'Bored' },
  excited: { emoji: '🤩', color: '#EC4899', label: 'Excited' },
  frustrated: { emoji: '😤', color: '#EF4444', label: 'Frustrated' },
  content: { emoji: '😌', color: '#10B981', label: 'Content' },
  tired: { emoji: '😴', color: '#8B5CF6', label: 'Tired' },
  confident: { emoji: '😎', color: '#0891B2', label: 'Confident' },
  neutral: { emoji: '😐', color: '#9CA3AF', label: 'Neutral' },
};

const timeOfDayConfig: Record<TimeOfDay, { icon: string; label: string; color: string }> = {
  morning: { icon: 'sunrise.fill', label: 'Morning', color: '#F59E0B' },
  afternoon: { icon: 'sun.max.fill', label: 'Afternoon', color: '#EAB308' },
  evening: { icon: 'sunset.fill', label: 'Evening', color: '#F97316' },
  night: { icon: 'moon.fill', label: 'Night', color: '#6366F1' },
};

// ============ HEADER ============
const Header = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="chevron.left" size={20} color="#007AFF" />
        <Text style={styles.headerBackText}>Insights</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Emotional Report</Text>
      <TouchableOpacity style={styles.headerShareButton}>
        <SFSymbol name="square.and.arrow.up" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
};

// ============ PERIOD SELECTOR ============
type PeriodSelectorProps = {
  selected: TimePeriod;
  onSelect: (period: TimePeriod) => void;
};

const PeriodSelector = ({ selected, onSelect }: PeriodSelectorProps) => {
  const periods: { key: TimePeriod; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
  ];

  return (
    <View style={styles.periodSelector}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[styles.periodOption, selected === period.key && styles.periodOptionActive]}
          onPress={() => onSelect(period.key)}
        >
          <Text style={[
            styles.periodOptionText,
            selected === period.key && styles.periodOptionTextActive
          ]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ============ SUMMARY CARD ============
type SummaryCardProps = {
  summary: EmotionalSummary;
};

const SummaryCard = ({ summary }: SummaryCardProps) => {
  const topEmotionConfig = emotionConfig[summary.top_emotion];
  const isImproving = summary.improvement_from_last_period > 0;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Emotional Spending Overview</Text>
        <View style={[
          styles.improvementBadge,
          { backgroundColor: isImproving ? '#D1FAE5' : '#FEF2F2' }
        ]}>
          <SFSymbol 
            name={isImproving ? 'arrow.down' : 'arrow.up'} 
            size={12} 
            color={isImproving ? '#046C4E' : '#DC2626'} 
          />
          <Text style={[
            styles.improvementText,
            { color: isImproving ? '#046C4E' : '#DC2626' }
          ]}>
            {Math.abs(summary.improvement_from_last_period)}% vs last period
          </Text>
        </View>
      </View>

      {/* Main Stats */}
      <View style={styles.mainStatsRow}>
        <View style={styles.mainStatItem}>
          <Text style={styles.mainStatValue}>
            ${summary.total_emotional_spending.toLocaleString()}
          </Text>
          <Text style={styles.mainStatLabel}>Emotional Spending</Text>
        </View>
        <View style={styles.mainStatDivider} />
        <View style={styles.mainStatItem}>
          <Text style={[styles.mainStatValue, { color: '#046C4E' }]}>
            ${summary.total_planned_spending.toLocaleString()}
          </Text>
          <Text style={styles.mainStatLabel}>Planned Spending</Text>
        </View>
      </View>

      {/* Emotional Ratio Bar */}
      <View style={styles.ratioContainer}>
        <View style={styles.ratioBar}>
          <View 
            style={[
              styles.ratioFillEmotional, 
              { width: `${summary.emotional_percent}%` }
            ]} 
          />
        </View>
        <View style={styles.ratioLabels}>
          <Text style={styles.ratioLabelEmotional}>
            {summary.emotional_percent.toFixed(0)}% emotional
          </Text>
          <Text style={styles.ratioLabelPlanned}>
            {(100 - summary.emotional_percent).toFixed(0)}% planned
          </Text>
        </View>
      </View>

      {/* Bottom Stats */}
      <View style={styles.bottomStatsRow}>
        <View style={styles.bottomStatItem}>
          <View style={styles.bottomStatIcon}>
            <Text style={styles.bottomStatEmoji}>{topEmotionConfig.emoji}</Text>
          </View>
          <View>
            <Text style={styles.bottomStatValue}>{topEmotionConfig.label}</Text>
            <Text style={styles.bottomStatLabel}>Top Emotion</Text>
          </View>
        </View>
        <View style={styles.bottomStatItem}>
          <View style={[styles.bottomStatIcon, { backgroundColor: '#F3E8FF' }]}>
            <SFSymbol name="dollarsign.circle.fill" size={20} color="#7C3AED" />
          </View>
          <View>
            <Text style={styles.bottomStatValue}>
              ${summary.avg_emotional_transaction.toFixed(0)}
            </Text>
            <Text style={styles.bottomStatLabel}>Avg. Emotional</Text>
          </View>
        </View>
        <View style={styles.bottomStatItem}>
          <View style={[styles.bottomStatIcon, { backgroundColor: '#DBEAFE' }]}>
            <SFSymbol name="number" size={20} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.bottomStatValue}>{summary.transactions_count}</Text>
            <Text style={styles.bottomStatLabel}>Transactions</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ============ EMOTION BREAKDOWN ============
type EmotionBreakdownCardProps = {
  data: EmotionBreakdown[];
};

const EmotionBreakdownCard = ({ data }: EmotionBreakdownCardProps) => {
  const [expandedEmotion, setExpandedEmotion] = useState<EmotionType | null>(null);
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <View style={styles.breakdownCard}>
      <Text style={styles.sectionTitle}>Spending by Emotion</Text>
      <Text style={styles.sectionSubtitle}>Tap to see details</Text>

      {data.map((item) => {
        const config = emotionConfig[item.emotion];
        const barWidth = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
        const isExpanded = expandedEmotion === item.emotion;

        return (
          <TouchableOpacity
            key={item.emotion}
            style={[styles.emotionRow, isExpanded && styles.emotionRowExpanded]}
            onPress={() => setExpandedEmotion(isExpanded ? null : item.emotion)}
            activeOpacity={0.7}
          >
            <View style={styles.emotionRowHeader}>
              <View style={styles.emotionInfo}>
                <Text style={styles.emotionEmoji}>{config.emoji}</Text>
                <View>
                  <Text style={styles.emotionLabel}>{config.label}</Text>
                  <Text style={styles.emotionCount}>
                    {item.transaction_count} transactions
                  </Text>
                </View>
              </View>
              <View style={styles.emotionAmountSection}>
                <Text style={styles.emotionAmount}>${item.amount.toLocaleString()}</Text>
                <View style={styles.emotionTrend}>
                  <SFSymbol 
                    name={item.trend === 'up' ? 'arrow.up' : item.trend === 'down' ? 'arrow.down' : 'minus'} 
                    size={10} 
                    color={item.trend === 'down' ? '#046C4E' : item.trend === 'up' ? '#DC2626' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.emotionTrendText,
                    { color: item.trend === 'down' ? '#046C4E' : item.trend === 'up' ? '#DC2626' : '#6B7280' }
                  ]}>
                    {item.trend_percent}%
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.emotionBarContainer}>
              <View style={[styles.emotionBar, { width: `${barWidth}%`, backgroundColor: config.color }]} />
            </View>

            {isExpanded && (
              <View style={styles.emotionExpanded}>
                <View style={styles.emotionExpandedRow}>
                  <View style={styles.emotionExpandedItem}>
                    <Text style={styles.emotionExpandedLabel}>Avg. Transaction</Text>
                    <Text style={styles.emotionExpandedValue}>${item.avg_amount.toFixed(0)}</Text>
                  </View>
                  <View style={styles.emotionExpandedItem}>
                    <Text style={styles.emotionExpandedLabel}>% of Emotional</Text>
                    <Text style={styles.emotionExpandedValue}>{item.percent.toFixed(0)}%</Text>
                  </View>
                </View>

                <View style={styles.emotionTagsSection}>
                  <Text style={styles.emotionTagsLabel}>Common Categories</Text>
                  <View style={styles.emotionTags}>
                    {item.common_categories.map((cat, idx) => (
                      <View key={idx} style={styles.emotionTag}>
                        <Text style={styles.emotionTagText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.emotionTagsSection}>
                  <Text style={styles.emotionTagsLabel}>Peak Times</Text>
                  <View style={styles.emotionTags}>
                    {item.common_times.map((time, idx) => (
                      <View key={idx} style={[styles.emotionTag, { backgroundColor: timeOfDayConfig[time].color + '20' }]}>
                        <SFSymbol name={timeOfDayConfig[time].icon} size={12} color={timeOfDayConfig[time].color} />
                        <Text style={[styles.emotionTagText, { color: timeOfDayConfig[time].color }]}>
                          {timeOfDayConfig[time].label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ============ MOOD CORRELATION CHART ============
type MoodCorrelationChartProps = {
  data: MoodSpendingCorrelation[];
};

const MoodCorrelationChart = ({ data }: MoodCorrelationChartProps) => {
  const maxSpending = Math.max(...data.map(d => d.avg_spending));

  return (
    <View style={styles.correlationCard}>
      <Text style={styles.sectionTitle}>Mood vs. Spending</Text>
      <Text style={styles.sectionSubtitle}>How your mood affects your wallet</Text>

      <View style={styles.correlationChart}>
        {data.map((item, index) => {
          const barHeight = maxSpending > 0 ? (item.avg_spending / maxSpending) * 100 : 0;
          return (
            <View key={index} style={styles.correlationBarContainer}>
              <Text style={styles.correlationAmount}>
                ${item.avg_spending.toFixed(0)}
              </Text>
              <View style={styles.correlationBarWrapper}>
                <View 
                  style={[
                    styles.correlationBar,
                    { 
                      height: `${Math.max(barHeight, 5)}%`,
                      backgroundColor: item.mood_score <= 2 ? '#DC2626' : item.mood_score >= 4 ? '#046C4E' : '#F59E0B',
                    }
                  ]} 
                />
              </View>
              <Text style={styles.correlationEmoji}>{item.emoji}</Text>
              <Text style={styles.correlationLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.correlationInsight}>
        <SFSymbol name="lightbulb.fill" size={16} color="#F59E0B" />
        <Text style={styles.correlationInsightText}>
          You spend 2.3x more when feeling stressed compared to when you're content.
        </Text>
      </View>
    </View>
  );
};

// ============ CATEGORY BREAKDOWN ============
type CategoryBreakdownProps = {
  data: CategoryEmotionalData[];
};

const CategoryBreakdown = ({ data }: CategoryBreakdownProps) => (
  <View style={styles.categoryCard}>
    <Text style={styles.sectionTitle}>Categories Most Affected</Text>
    <Text style={styles.sectionSubtitle}>Where emotions drive your spending</Text>

    {data.map((item, index) => (
      <View key={index} style={styles.categoryRow}>
        <View style={[styles.categoryIcon, { backgroundColor: item.color + '15' }]}>
          <SFSymbol name={item.icon} size={20} color={item.color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.category}</Text>
          <View style={styles.categoryBarContainer}>
            <View 
              style={[
                styles.categoryBar,
                { width: `${item.emotional_percent}%`, backgroundColor: '#EC4899' }
              ]} 
            />
            <View 
              style={[
                styles.categoryBar,
                { width: `${100 - item.emotional_percent}%`, backgroundColor: '#046C4E' }
              ]} 
            />
          </View>
          <View style={styles.categoryMeta}>
            <Text style={styles.categoryMetaText}>
              {item.emotional_percent.toFixed(0)}% emotional
            </Text>
            <View style={styles.categoryEmotion}>
              <Text style={styles.categoryEmotionText}>
                {emotionConfig[item.top_emotion].emoji} {emotionConfig[item.top_emotion].label}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.categoryAmounts}>
          <Text style={styles.categoryAmountEmotional}>
            ${item.emotional_amount.toLocaleString()}
          </Text>
          <Text style={styles.categoryAmountTotal}>
            of ${item.total_amount.toLocaleString()}
          </Text>
        </View>
      </View>
    ))}
  </View>
);

// ============ DAILY TIMELINE ============
type DailyTimelineProps = {
  data: DailyEmotionalData[];
};

const DailyTimeline = ({ data }: DailyTimelineProps) => {
  const maxAmount = Math.max(...data.map(d => d.emotional_amount + d.planned_amount));

  return (
    <View style={styles.timelineCard}>
      <Text style={styles.sectionTitle}>7-Day Emotional Timeline</Text>
      <Text style={styles.sectionSubtitle}>Daily mood and spending patterns</Text>

      <View style={styles.timeline}>
        {data.map((day, index) => {
          const emotionalHeight = maxAmount > 0 ? (day.emotional_amount / maxAmount) * 100 : 0;
          const plannedHeight = maxAmount > 0 ? (day.planned_amount / maxAmount) * 100 : 0;
          const emotionConfig_day = emotionConfig[day.dominant_emotion];

          return (
            <View key={index} style={styles.timelineDay}>
              <View style={styles.timelineMoodRow}>
                <Text style={styles.timelineMoodEmoji}>{emotionConfig_day.emoji}</Text>
              </View>
              <View style={styles.timelineBarWrapper}>
                <View style={styles.timelineStackedBar}>
                  <View 
                    style={[
                      styles.timelineBarEmotional,
                      { height: `${emotionalHeight}%` }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.timelineBarPlanned,
                      { height: `${plannedHeight}%` }
                    ]} 
                  />
                </View>
              </View>
              <Text style={styles.timelineDayLabel}>{day.day_label}</Text>
              <Text style={styles.timelineAmount}>
                ${(day.emotional_amount + day.planned_amount).toFixed(0)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.timelineLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EC4899' }]} />
          <Text style={styles.legendText}>Emotional</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#046C4E' }]} />
          <Text style={styles.legendText}>Planned</Text>
        </View>
      </View>
    </View>
  );
};

// ============ TRIGGERS SECTION ============
type TriggersProps = {
  triggers: EmotionalTrigger[];
};

const TriggersSection = ({ triggers }: TriggersProps) => (
  <View style={styles.triggersCard}>
    <Text style={styles.sectionTitle}>Your Emotional Triggers</Text>
    <Text style={styles.sectionSubtitle}>Situations that lead to emotional spending</Text>

    {triggers.map((trigger, index) => (
      <View key={index} style={styles.triggerItem}>
        <View style={styles.triggerHeader}>
          <View style={styles.triggerEmotions}>
            {trigger.related_emotions.slice(0, 3).map((emotion, idx) => (
              <Text key={idx} style={styles.triggerEmoji}>
                {emotionConfig[emotion].emoji}
              </Text>
            ))}
          </View>
          <View style={styles.triggerInfo}>
            <Text style={styles.triggerTitle}>{trigger.trigger}</Text>
            <Text style={styles.triggerDescription}>{trigger.description}</Text>
          </View>
          <View style={styles.triggerStats}>
            <Text style={styles.triggerAmount}>${trigger.total_amount.toLocaleString()}</Text>
            <Text style={styles.triggerCount}>{trigger.occurrence_count}x</Text>
          </View>
        </View>
        <View style={styles.triggerTip}>
          <SFSymbol name="sparkles" size={14} color="#7C3AED" />
          <Text style={styles.triggerTipText}>{trigger.avoidance_tip}</Text>
        </View>
      </View>
    ))}
  </View>
);

// ============ INSIGHTS SECTION ============
type InsightsProps = {
  insights: EmotionalInsight[];
};

const InsightsSection = ({ insights }: InsightsProps) => {
  const getInsightStyle = (type: EmotionalInsight['type']) => {
    switch (type) {
      case 'warning': return { bg: '#FEF2F2', color: '#DC2626', icon: 'exclamationmark.triangle.fill' };
      case 'positive': return { bg: '#D1FAE5', color: '#046C4E', icon: 'checkmark.circle.fill' };
      case 'tip': return { bg: '#FEF3C7', color: '#92400E', icon: 'lightbulb.fill' };
      case 'pattern': return { bg: '#EDE9FE', color: '#7C3AED', icon: 'waveform.path.ecg.rectangle.fill' };
    }
  };

  return (
    <View style={styles.insightsCard}>
      <Text style={styles.sectionTitle}>AI Insights</Text>
      <Text style={styles.sectionSubtitle}>Personalized observations about your habits</Text>

      {insights.map((insight) => {
        const style = getInsightStyle(insight.type);
        return (
          <View 
            key={insight.insight_id} 
            style={[styles.insightItem, { backgroundColor: style.bg }]}
          >
            <View style={styles.insightHeader}>
              <SFSymbol name={style.icon} size={20} color={style.color} />
              <Text style={[styles.insightTitle, { color: style.color }]}>
                {insight.title}
              </Text>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
            {insight.action && (
              <TouchableOpacity style={styles.insightAction}>
                <Text style={[styles.insightActionText, { color: style.color }]}>
                  {insight.action}
                </Text>
                <SFSymbol name="chevron.right" size={12} color={style.color} />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function EmotionalReportScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('month');

  // Data states
  const [summary, setSummary] = useState<EmotionalSummary | null>(null);
  const [emotionBreakdown, setEmotionBreakdown] = useState<EmotionBreakdown[]>([]);
  const [moodCorrelation, setMoodCorrelation] = useState<MoodSpendingCorrelation[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryEmotionalData[]>([]);
  const [dailyData, setDailyData] = useState<DailyEmotionalData[]>([]);
  const [triggers, setTriggers] = useState<EmotionalTrigger[]>([]);
  const [insights, setInsights] = useState<EmotionalInsight[]>([]);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 600));

      // Mock summary
      setSummary({
        total_emotional_spending: 1847,
        total_planned_spending: 2653,
        emotional_percent: 41,
        avg_emotional_transaction: 38.50,
        avg_planned_transaction: 52.20,
        top_emotion: 'stressed',
        top_emotion_amount: 620,
        improvement_from_last_period: 12,
        transactions_count: 48,
      });

      // Mock emotion breakdown
      setEmotionBreakdown([
        {
          emotion: 'stressed',
          amount: 620,
          percent: 33.6,
          transaction_count: 15,
          avg_amount: 41.33,
          trend: 'down',
          trend_percent: 8,
          common_categories: ['Food Delivery', 'Shopping', 'Comfort Items'],
          common_times: ['evening', 'night'],
        },
        {
          emotion: 'bored',
          amount: 445,
          percent: 24.1,
          transaction_count: 18,
          avg_amount: 24.72,
          trend: 'up',
          trend_percent: 15,
          common_categories: ['Entertainment', 'Subscriptions', 'Snacks'],
          common_times: ['afternoon', 'evening'],
        },
        {
          emotion: 'happy',
          amount: 380,
          percent: 20.6,
          transaction_count: 8,
          avg_amount: 47.50,
          trend: 'stable',
          trend_percent: 2,
          common_categories: ['Dining Out', 'Gifts', 'Experiences'],
          common_times: ['evening'],
        },
        {
          emotion: 'anxious',
          amount: 252,
          percent: 13.6,
          transaction_count: 12,
          avg_amount: 21,
          trend: 'down',
          trend_percent: 22,
          common_categories: ['Groceries', 'Health', 'Self-care'],
          common_times: ['morning', 'night'],
        },
        {
          emotion: 'excited',
          amount: 150,
          percent: 8.1,
          transaction_count: 5,
          avg_amount: 30,
          trend: 'up',
          trend_percent: 10,
          common_categories: ['Shopping', 'Events', 'Tech'],
          common_times: ['afternoon'],
        },
      ]);

      // Mock mood correlation
      setMoodCorrelation([
        { mood_score: 1, label: 'Rough', emoji: '😫', avg_spending: 85, transaction_count: 8 },
        { mood_score: 2, label: 'Meh', emoji: '😔', avg_spending: 62, transaction_count: 12 },
        { mood_score: 3, label: 'Okay', emoji: '😐', avg_spending: 45, transaction_count: 18 },
        { mood_score: 4, label: 'Good', emoji: '🙂', avg_spending: 38, transaction_count: 22 },
        { mood_score: 5, label: 'Great', emoji: '😊', avg_spending: 35, transaction_count: 15 },
      ]);

      // Mock category data
      setCategoryData([
        { category: 'Food & Dining', icon: 'fork.knife', color: '#F59E0B', total_amount: 890, emotional_amount: 534, emotional_percent: 60, top_emotion: 'stressed', transactions: 24 },
        { category: 'Shopping', icon: 'bag.fill', color: '#EC4899', total_amount: 650, emotional_amount: 455, emotional_percent: 70, top_emotion: 'bored', transactions: 12 },
        { category: 'Entertainment', icon: 'gamecontroller.fill', color: '#8B5CF6', total_amount: 320, emotional_amount: 192, emotional_percent: 60, top_emotion: 'bored', transactions: 8 },
        { category: 'Self-Care', icon: 'heart.fill', color: '#06B6D4', total_amount: 280, emotional_amount: 168, emotional_percent: 60, top_emotion: 'anxious', transactions: 6 },
      ]);

      // Mock daily data
      setDailyData([
        { date: '2025-01-23', day_label: 'Thu', emotional_amount: 45, planned_amount: 65, dominant_emotion: 'stressed', mood_score: 2 },
        { date: '2025-01-24', day_label: 'Fri', emotional_amount: 85, planned_amount: 40, dominant_emotion: 'excited', mood_score: 4 },
        { date: '2025-01-25', day_label: 'Sat', emotional_amount: 120, planned_amount: 80, dominant_emotion: 'bored', mood_score: 3 },
        { date: '2025-01-26', day_label: 'Sun', emotional_amount: 35, planned_amount: 95, dominant_emotion: 'content', mood_score: 4 },
        { date: '2025-01-27', day_label: 'Mon', emotional_amount: 55, planned_amount: 30, dominant_emotion: 'anxious', mood_score: 2 },
        { date: '2025-01-28', day_label: 'Tue', emotional_amount: 25, planned_amount: 45, dominant_emotion: 'happy', mood_score: 5 },
        { date: '2025-01-29', day_label: 'Wed', emotional_amount: 40, planned_amount: 55, dominant_emotion: 'stressed', mood_score: 3 },
      ]);

      // Mock triggers
      setTriggers([
        {
          trigger: 'Work Deadlines',
          description: 'Spending increases during high-pressure work periods',
          occurrence_count: 8,
          total_amount: 420,
          related_emotions: ['stressed', 'anxious', 'tired'],
          avoidance_tip: 'Prepare healthy snacks and block shopping apps during crunch time',
        },
        {
          trigger: 'Weekend Boredom',
          description: 'Impulse purchases peak on weekend afternoons',
          occurrence_count: 6,
          total_amount: 280,
          related_emotions: ['bored', 'neutral'],
          avoidance_tip: 'Plan free activities in advance for weekends',
        },
        {
          trigger: 'Late Night Browsing',
          description: 'Online shopping after 10pm leads to regret purchases',
          occurrence_count: 5,
          total_amount: 195,
          related_emotions: ['tired', 'bored', 'stressed'],
          avoidance_tip: 'Enable app limits and remove saved payment methods',
        },
      ]);

      // Mock insights
      setInsights([
        {
          insight_id: '1',
          type: 'positive',
          title: 'Stress Spending Down 8%',
          description: 'Your stress-related purchases have decreased compared to last month. Keep using those coping strategies!',
        },
        {
          insight_id: '2',
          type: 'warning',
          title: 'Boredom Spending Rising',
          description: 'Weekend boredom spending increased 15%. Consider planning activities that don\'t involve shopping.',
          action: 'View suggestions',
        },
        {
          insight_id: '3',
          type: 'pattern',
          title: 'Evening Pattern Detected',
          description: '68% of your emotional purchases happen between 6-10pm. This is your highest-risk window.',
          action: 'Set evening reminder',
        },
        {
          insight_id: '4',
          type: 'tip',
          title: 'Try the 24-Hour Rule',
          description: 'For purchases over $30, wait 24 hours. This could save you ~$200/month based on your patterns.',
          action: 'Enable reminders',
        },
      ]);

    } catch (error) {
      console.error('Error fetching emotional report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EC4899" />
          <Text style={styles.loadingText}>Analyzing your emotional patterns...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <PeriodSelector selected={period} onSelect={setPeriod} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {summary && <SummaryCard summary={summary} />}
        
        <MoodCorrelationChart data={moodCorrelation} />
        
        <EmotionBreakdownCard data={emotionBreakdown} />
        
        <DailyTimeline data={dailyData} />
        
        <CategoryBreakdown data={categoryData} />
        
        <TriggersSection triggers={triggers} />
        
        <InsightsSection insights={insights} />

        {/* CTA Card */}
        <View style={styles.ctaCard}>
          <View style={styles.ctaIcon}>
            <SFSymbol name="heart.text.square.fill" size={32} color="#EC4899" />
          </View>
          <Text style={styles.ctaTitle}>Track Your Emotions</Text>
          <Text style={styles.ctaDescription}>
            Log how you feel with each purchase to get more accurate insights
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Start Daily Check-in</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
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
  headerShareButton: {
    padding: 4,
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

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  periodOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  periodOptionActive: {
    backgroundColor: '#EC4899',
  },
  periodOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  periodOptionTextActive: {
    color: '#FFFFFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainStatsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  mainStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EC4899',
  },
  mainStatLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  mainStatDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  ratioContainer: {
    marginBottom: 20,
  },
  ratioBar: {
    height: 12,
    backgroundColor: '#046C4E',
    borderRadius: 6,
    overflow: 'hidden',
  },
  ratioFillEmotional: {
    height: '100%',
    backgroundColor: '#EC4899',
    borderRadius: 6,
  },
  ratioLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratioLabelEmotional: {
    fontSize: 12,
    color: '#EC4899',
    fontWeight: '600',
  },
  ratioLabelPlanned: {
    fontSize: 12,
    color: '#046C4E',
    fontWeight: '600',
  },
  bottomStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomStatEmoji: {
    fontSize: 20,
  },
  bottomStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  bottomStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
  },

  // Emotion Breakdown
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  emotionRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  emotionRowExpanded: {
    backgroundColor: '#FAFAFA',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderRadius: 12,
  },
  emotionRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emotionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  emotionEmoji: {
    fontSize: 28,
  },
  emotionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  emotionCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emotionAmountSection: {
    alignItems: 'flex-end',
  },
  emotionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  emotionTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  emotionTrendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emotionBarContainer: {
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  emotionBar: {
    height: '100%',
    borderRadius: 3,
  },
  emotionExpanded: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  emotionExpandedRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  emotionExpandedItem: {
    flex: 1,
  },
  emotionExpandedLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  emotionExpandedValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  emotionTagsSection: {
    marginBottom: 12,
  },
  emotionTagsLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  emotionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  emotionTagText: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Mood Correlation
  correlationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  correlationChart: {
    flexDirection: 'row',
    height: 180,
    gap: 12,
    marginBottom: 16,
  },
  correlationBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  correlationAmount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  correlationBarWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  correlationBar: {
    width: '100%',
    borderRadius: 8,
  },
  correlationEmoji: {
    fontSize: 24,
    marginTop: 8,
  },
  correlationLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },
  correlationInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  correlationInsightText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },

  // Category Breakdown
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  categoryBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  categoryBar: {
    height: '100%',
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryMetaText: {
    fontSize: 11,
    color: '#EC4899',
    fontWeight: '600',
  },
  categoryEmotion: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmotionText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  categoryAmounts: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  categoryAmountEmotional: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EC4899',
  },
  categoryAmountTotal: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Timeline
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  timeline: {
    flexDirection: 'row',
    height: 200,
    gap: 8,
    marginBottom: 16,
  },
  timelineDay: {
    flex: 1,
    alignItems: 'center',
  },
  timelineMoodRow: {
    marginBottom: 8,
  },
  timelineMoodEmoji: {
    fontSize: 18,
  },
  timelineBarWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  timelineStackedBar: {
    width: '100%',
  },
  timelineBarEmotional: {
    width: '100%',
    backgroundColor: '#EC4899',
  },
  timelineBarPlanned: {
    width: '100%',
    backgroundColor: '#046C4E',
  },
  timelineDayLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 8,
  },
  timelineAmount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Triggers
  triggersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  triggerItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  triggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  triggerEmotions: {
    flexDirection: 'row',
    marginRight: 12,
  },
  triggerEmoji: {
    fontSize: 20,
    marginLeft: -6,
  },
  triggerInfo: {
    flex: 1,
  },
  triggerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  triggerDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  triggerStats: {
    alignItems: 'flex-end',
  },
  triggerAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  triggerCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  triggerTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E8FF',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  triggerTipText: {
    flex: 1,
    fontSize: 13,
    color: '#6B21A8',
    lineHeight: 18,
  },

  // Insights
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  insightItem: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  insightDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  insightActionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // CTA Card
  ctaCard: {
    backgroundColor: '#FDF2F8',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ctaIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});