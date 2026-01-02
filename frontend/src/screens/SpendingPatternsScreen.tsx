// src/screens/SpendingPatternsScreen.tsx
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
import { BarChart, WeekHeatmap, SpendingBreakdown, TrendIndicator } from '../components/charts/ChartComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TYPES ============
type PatternType = 
  | 'emotional' 
  | 'time_based' 
  | 'location' 
  | 'social' 
  | 'habitual' 
  | 'seasonal';

type TriggerType = 
  | 'stress' 
  | 'boredom' 
  | 'celebration' 
  | 'social_pressure' 
  | 'convenience' 
  | 'impulse' 
  | 'routine' 
  | 'marketing';

type ImpactLevel = 'high' | 'medium' | 'low';
type TrendDirection = 'up' | 'down' | 'stable';

type SpendingPattern = {
  pattern_id: string;
  title: string;
  description: string;
  pattern_type: PatternType;
  impact_level: ImpactLevel;
  monthly_impact: number;
  frequency: string;
  trend: TrendDirection;
  trend_percent: number;
  triggers: TriggerType[];
  suggestions: string[];
  examples: string[];
  first_detected: string;
};

type SpendingTrigger = {
  trigger_id: string;
  trigger_type: TriggerType;
  occurrence_count: number;
  total_amount: number;
  avg_amount: number;
  common_categories: string[];
  common_times: string[];
  trend: TrendDirection;
};

type TimePattern = {
  period: string;
  label: string;
  amount: number;
  transactions: number;
  avg_per_transaction: number;
  top_category: string;
  is_peak: boolean;
};

type WeekdayPattern = {
  day: string;
  short: string;
  amount: number;
  transactions: number;
  is_highest: boolean;
};

type CategoryCorrelation = {
  category: string;
  icon: string;
  color: string;
  emotional_percent: number;
  planned_percent: number;
  avg_emotional_amount: number;
  avg_planned_amount: number;
};

// ============ CONFIG ============
const patternTypeConfig: Record<PatternType, { icon: string; color: string; label: string }> = {
  emotional: { icon: 'heart.fill', color: '#EC4899', label: 'Emotional' },
  time_based: { icon: 'clock.fill', color: '#2563EB', label: 'Time-Based' },
  location: { icon: 'location.fill', color: '#046C4E', label: 'Location' },
  social: { icon: 'person.2.fill', color: '#7C3AED', label: 'Social' },
  habitual: { icon: 'repeat', color: '#F59E0B', label: 'Habitual' },
  seasonal: { icon: 'leaf.fill', color: '#0891B2', label: 'Seasonal' },
};

const triggerTypeConfig: Record<TriggerType, { icon: string; color: string; label: string; description: string }> = {
  stress: { icon: 'bolt.fill', color: '#DC2626', label: 'Stress', description: 'Spending when overwhelmed' },
  boredom: { icon: 'moon.fill', color: '#6B7280', label: 'Boredom', description: 'Spending to pass time' },
  celebration: { icon: 'party.popper.fill', color: '#F59E0B', label: 'Celebration', description: 'Rewarding yourself' },
  social_pressure: { icon: 'person.3.fill', color: '#7C3AED', label: 'Social', description: 'Keeping up with others' },
  convenience: { icon: 'hand.tap.fill', color: '#0891B2', label: 'Convenience', description: 'Easy access spending' },
  impulse: { icon: 'sparkles', color: '#EC4899', label: 'Impulse', description: 'Unplanned purchases' },
  routine: { icon: 'repeat.circle.fill', color: '#2563EB', label: 'Routine', description: 'Habitual spending' },
  marketing: { icon: 'megaphone.fill', color: '#F97316', label: 'Marketing', description: 'Influenced by ads/deals' },
};

const impactConfig: Record<ImpactLevel, { color: string; bgColor: string; label: string }> = {
  high: { color: '#DC2626', bgColor: '#FEF2F2', label: 'High Impact' },
  medium: { color: '#F59E0B', bgColor: '#FFFBEB', label: 'Medium Impact' },
  low: { color: '#046C4E', bgColor: '#D1FAE5', label: 'Low Impact' },
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
      <Text style={styles.headerTitle}>Spending Patterns</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
};

// ============ TAB SELECTOR ============
type Tab = 'patterns' | 'triggers' | 'timing';

type TabSelectorProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

const TabSelector = ({ activeTab, onTabChange }: TabSelectorProps) => {
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'patterns', label: 'Patterns', icon: 'chart.bar.fill' },
    { key: 'triggers', label: 'Triggers', icon: 'bolt.fill' },
    { key: 'timing', label: 'Timing', icon: 'clock.fill' },
  ];

  return (
    <View style={styles.tabSelector}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          onPress={() => onTabChange(tab.key)}
        >
          <SFSymbol 
            name={tab.icon} 
            size={16} 
            color={activeTab === tab.key ? '#046C4E' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ============ PATTERN CARD ============
type PatternCardProps = {
  pattern: SpendingPattern;
  onPress: () => void;
};

const PatternCard = ({ pattern, onPress }: PatternCardProps) => {
  const typeConfig = patternTypeConfig[pattern.pattern_type];
  const impact = impactConfig[pattern.impact_level];

  return (
    <TouchableOpacity style={styles.patternCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.patternCardHeader}>
        <View style={[styles.patternTypeIcon, { backgroundColor: typeConfig.color + '15' }]}>
          <SFSymbol name={typeConfig.icon} size={20} color={typeConfig.color} />
        </View>
        <View style={styles.patternCardHeaderInfo}>
          <Text style={styles.patternCardTitle}>{pattern.title}</Text>
          <View style={styles.patternCardMeta}>
            <View style={[styles.impactBadge, { backgroundColor: impact.bgColor }]}>
              <Text style={[styles.impactBadgeText, { color: impact.color }]}>
                {impact.label}
              </Text>
            </View>
            <Text style={styles.patternFrequency}>{pattern.frequency}</Text>
          </View>
        </View>
        <View style={styles.patternTrend}>
          <SFSymbol 
            name={pattern.trend === 'up' ? 'arrow.up.right' : pattern.trend === 'down' ? 'arrow.down.right' : 'arrow.right'} 
            size={14} 
            color={pattern.trend === 'down' ? '#046C4E' : pattern.trend === 'up' ? '#DC2626' : '#6B7280'} 
          />
          <Text style={[
            styles.patternTrendText,
            { color: pattern.trend === 'down' ? '#046C4E' : pattern.trend === 'up' ? '#DC2626' : '#6B7280' }
          ]}>
            {pattern.trend_percent}%
          </Text>
        </View>
      </View>

      <Text style={styles.patternDescription}>{pattern.description}</Text>

      <View style={styles.patternImpactRow}>
        <View style={styles.patternImpactItem}>
          <Text style={styles.patternImpactLabel}>Monthly Impact</Text>
          <Text style={[styles.patternImpactValue, { color: impact.color }]}>
            ${pattern.monthly_impact.toLocaleString()}
          </Text>
        </View>
        <View style={styles.patternDivider} />
        <View style={styles.patternImpactItem}>
          <Text style={styles.patternImpactLabel}>Main Triggers</Text>
          <View style={styles.triggerIcons}>
            {pattern.triggers.slice(0, 3).map((trigger, index) => (
              <View 
                key={index} 
                style={[styles.triggerIconSmall, { backgroundColor: triggerTypeConfig[trigger].color + '15' }]}
              >
                <SFSymbol 
                  name={triggerTypeConfig[trigger].icon} 
                  size={12} 
                  color={triggerTypeConfig[trigger].color} 
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Top Suggestion */}
      {pattern.suggestions.length > 0 && (
        <View style={styles.suggestionPreview}>
          <SFSymbol name="lightbulb.fill" size={14} color="#F59E0B" />
          <Text style={styles.suggestionPreviewText} numberOfLines={1}>
            {pattern.suggestions[0]}
          </Text>
        </View>
      )}

      <View style={styles.patternCardFooter}>
        <Text style={styles.viewDetailsText}>View Details & Tips</Text>
        <SFSymbol name="chevron.right" size={14} color="#007AFF" />
      </View>
    </TouchableOpacity>
  );
};

// ============ TRIGGER CARD ============
type TriggerCardProps = {
  trigger: SpendingTrigger;
};

const TriggerCard = ({ trigger }: TriggerCardProps) => {
  const config = triggerTypeConfig[trigger.trigger_type];
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity 
      style={styles.triggerCard} 
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.triggerCardHeader}>
        <View style={[styles.triggerIcon, { backgroundColor: config.color + '15' }]}>
          <SFSymbol name={config.icon} size={22} color={config.color} />
        </View>
        <View style={styles.triggerCardInfo}>
          <Text style={styles.triggerCardTitle}>{config.label}</Text>
          <Text style={styles.triggerCardDescription}>{config.description}</Text>
        </View>
        <View style={styles.triggerCardStats}>
          <Text style={styles.triggerCardAmount}>${trigger.total_amount.toLocaleString()}</Text>
          <Text style={styles.triggerCardCount}>{trigger.occurrence_count} times</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.triggerCardExpanded}>
          <View style={styles.triggerStatRow}>
            <View style={styles.triggerStatItem}>
              <Text style={styles.triggerStatLabel}>Avg. Spend</Text>
              <Text style={styles.triggerStatValue}>${trigger.avg_amount.toFixed(0)}</Text>
            </View>
            <View style={styles.triggerStatItem}>
              <Text style={styles.triggerStatLabel}>Trend</Text>
              <View style={styles.trendIndicator}>
                <SFSymbol 
                  name={trigger.trend === 'up' ? 'arrow.up' : trigger.trend === 'down' ? 'arrow.down' : 'minus'} 
                  size={12} 
                  color={trigger.trend === 'down' ? '#046C4E' : trigger.trend === 'up' ? '#DC2626' : '#6B7280'} 
                />
                <Text style={[
                  styles.trendText,
                  { color: trigger.trend === 'down' ? '#046C4E' : trigger.trend === 'up' ? '#DC2626' : '#6B7280' }
                ]}>
                  {trigger.trend === 'up' ? 'Increasing' : trigger.trend === 'down' ? 'Decreasing' : 'Stable'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.triggerDetailSection}>
            <Text style={styles.triggerDetailLabel}>Common Categories</Text>
            <View style={styles.triggerDetailTags}>
              {trigger.common_categories.map((cat, index) => (
                <View key={index} style={styles.triggerDetailTag}>
                  <Text style={styles.triggerDetailTagText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.triggerDetailSection}>
            <Text style={styles.triggerDetailLabel}>Peak Times</Text>
            <View style={styles.triggerDetailTags}>
              {trigger.common_times.map((time, index) => (
                <View key={index} style={styles.triggerDetailTag}>
                  <Text style={styles.triggerDetailTagText}>{time}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={styles.expandIndicator}>
        <SFSymbol 
          name={expanded ? 'chevron.up' : 'chevron.down'} 
          size={14} 
          color="#8E8E93" 
        />
      </View>
    </TouchableOpacity>
  );
};

// ============ TIME OF DAY CHART ============
type TimeOfDayChartProps = {
  data: TimePattern[];
};

const TimeOfDayChart = ({ data }: TimeOfDayChartProps) => {
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <View style={styles.timeChart}>
      <Text style={styles.chartTitle}>Spending by Time of Day</Text>
      <View style={styles.timeChartBars}>
        {data.map((item, index) => {
          const heightPercent = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
          return (
            <View key={index} style={styles.timeChartBarContainer}>
              <Text style={styles.timeChartAmount}>
                ${item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount.toFixed(0)}
              </Text>
              <View style={styles.timeChartBarWrapper}>
                <View 
                  style={[
                    styles.timeChartBar,
                    { 
                      height: `${Math.max(heightPercent, 5)}%`,
                      backgroundColor: item.is_peak ? '#DC2626' : '#046C4E',
                    }
                  ]} 
                />
              </View>
              <Text style={[
                styles.timeChartLabel,
                item.is_peak && styles.timeChartLabelPeak
              ]}>
                {item.label}
              </Text>
              {item.is_peak && (
                <View style={styles.peakBadge}>
                  <Text style={styles.peakBadgeText}>Peak</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ============ WEEKDAY CHART ============
type WeekdayChartProps = {
  data: WeekdayPattern[];
};

const WeekdayChart = ({ data }: WeekdayChartProps) => {
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <View style={styles.weekdayChart}>
      <Text style={styles.chartTitle}>Spending by Day of Week</Text>
      <View style={styles.weekdayBars}>
        {data.map((day, index) => {
          const heightPercent = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
          return (
            <View key={index} style={styles.weekdayBarContainer}>
              <View style={styles.weekdayBarWrapper}>
                <View 
                  style={[
                    styles.weekdayBar,
                    { 
                      height: `${Math.max(heightPercent, 5)}%`,
                      backgroundColor: day.is_highest ? '#DC2626' : '#2563EB',
                    }
                  ]} 
                />
              </View>
              <Text style={[
                styles.weekdayLabel,
                day.is_highest && styles.weekdayLabelHighest
              ]}>
                {day.short}
              </Text>
              <Text style={styles.weekdayAmount}>
                ${day.amount >= 1000 ? `${(day.amount / 1000).toFixed(1)}k` : day.amount.toFixed(0)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ============ CATEGORY CORRELATION ============
type CategoryCorrelationProps = {
  data: CategoryCorrelation[];
};

const CategoryCorrelationCard = ({ data }: CategoryCorrelationProps) => (
  <View style={styles.correlationCard}>
    <Text style={styles.chartTitle}>Emotional vs. Planned Spending</Text>
    <Text style={styles.chartSubtitle}>How emotions affect category spending</Text>
    
    {data.map((item, index) => (
      <View key={index} style={styles.correlationRow}>
        <View style={[styles.correlationIcon, { backgroundColor: item.color + '15' }]}>
          <SFSymbol name={item.icon} size={18} color={item.color} />
        </View>
        <View style={styles.correlationInfo}>
          <Text style={styles.correlationCategory}>{item.category}</Text>
          <View style={styles.correlationBars}>
            <View style={styles.correlationBarContainer}>
              <View 
                style={[
                  styles.correlationBar,
                  styles.correlationBarEmotional,
                  { width: `${item.emotional_percent}%` }
                ]} 
              />
              <View 
                style={[
                  styles.correlationBar,
                  styles.correlationBarPlanned,
                  { width: `${item.planned_percent}%` }
                ]} 
              />
            </View>
          </View>
        </View>
        <View style={styles.correlationAmounts}>
          <Text style={styles.correlationAmountEmotional}>
            ${item.avg_emotional_amount.toFixed(0)}
          </Text>
          <Text style={styles.correlationAmountPlanned}>
            ${item.avg_planned_amount.toFixed(0)}
          </Text>
        </View>
      </View>
    ))}

    <View style={styles.correlationLegend}>
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

// ============ INSIGHTS SUMMARY ============
type InsightsSummaryProps = {
  totalPatterns: number;
  highImpactPatterns: number;
  topTrigger: string;
  potentialSavings: number;
};

const InsightsSummary = ({ totalPatterns, highImpactPatterns, topTrigger, potentialSavings }: InsightsSummaryProps) => (
  <View style={styles.summaryCard}>
    <View style={styles.summaryHeader}>
      <SFSymbol name="brain.head.profile" size={24} color="#7C3AED" />
      <Text style={styles.summaryTitle}>Your Pattern Profile</Text>
    </View>
    
    <View style={styles.summaryGrid}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{totalPatterns}</Text>
        <Text style={styles.summaryLabel}>Patterns Detected</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryValue, { color: '#DC2626' }]}>{highImpactPatterns}</Text>
        <Text style={styles.summaryLabel}>High Impact</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValueSmall}>{topTrigger}</Text>
        <Text style={styles.summaryLabel}>Top Trigger</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryValue, { color: '#046C4E' }]}>
          ${potentialSavings.toLocaleString()}
        </Text>
        <Text style={styles.summaryLabel}>Potential Savings</Text>
      </View>
    </View>
  </View>
);

// ============ MAIN COMPONENT ============
export default function SpendingPatternsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('patterns');
  
  // Data states
  const [patterns, setPatterns] = useState<SpendingPattern[]>([]);
  const [triggers, setTriggers] = useState<SpendingTrigger[]>([]);
  const [timePatterns, setTimePatterns] = useState<TimePattern[]>([]);
  const [weekdayPatterns, setWeekdayPatterns] = useState<WeekdayPattern[]>([]);
  const [correlations, setCorrelations] = useState<CategoryCorrelation[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Mock patterns
      setPatterns([
        {
          pattern_id: '1',
          title: 'Weekend Splurge',
          description: 'You tend to spend 3x more on weekends, especially on dining and entertainment.',
          pattern_type: 'time_based',
          impact_level: 'high',
          monthly_impact: 450,
          frequency: '8x per month',
          trend: 'up',
          trend_percent: 15,
          triggers: ['celebration', 'social_pressure', 'boredom'],
          suggestions: [
            'Set a weekend-specific budget of $100',
            'Plan free activities with friends',
            'Use cash only on weekends to limit spending',
          ],
          examples: ['Saturday brunch $65', 'Sunday shopping $120'],
          first_detected: '3 months ago',
        },
        {
          pattern_id: '2',
          title: 'Stress Shopping',
          description: 'Online purchases spike during stressful work periods, mainly late evenings.',
          pattern_type: 'emotional',
          impact_level: 'high',
          monthly_impact: 380,
          frequency: '5-6x per month',
          trend: 'stable',
          trend_percent: 2,
          triggers: ['stress', 'impulse', 'convenience'],
          suggestions: [
            'Add items to cart but wait 24 hours before buying',
            'Unsubscribe from promotional emails',
            'Try a stress-relief activity instead (walk, meditation)',
          ],
          examples: ['Amazon orders after 10pm', 'Comfort food delivery'],
          first_detected: '6 months ago',
        },
        {
          pattern_id: '3',
          title: 'Coffee Habit',
          description: 'Daily coffee shop visits averaging $6.50, mostly during morning commute.',
          pattern_type: 'habitual',
          impact_level: 'medium',
          monthly_impact: 195,
          frequency: 'Daily',
          trend: 'down',
          trend_percent: 8,
          triggers: ['routine', 'convenience'],
          suggestions: [
            'Invest in a quality coffee maker ($150 = 23 days of coffee)',
            'Limit coffee shop visits to 2x per week as a treat',
            'Make coffee at home and bring in a thermos',
          ],
          examples: ['Starbucks $7.25', 'Local cafe $5.50'],
          first_detected: '8 months ago',
        },
        {
          pattern_id: '4',
          title: 'Subscription Creep',
          description: 'Multiple overlapping streaming and app subscriptions, some unused.',
          pattern_type: 'habitual',
          impact_level: 'medium',
          monthly_impact: 85,
          frequency: 'Monthly',
          trend: 'up',
          trend_percent: 20,
          triggers: ['marketing', 'convenience'],
          suggestions: [
            'Audit all subscriptions this weekend',
            'Cancel services unused in past 30 days',
            'Share family plans where possible',
          ],
          examples: ['Netflix + Hulu + Disney+ overlap', 'Unused Audible membership'],
          first_detected: '2 months ago',
        },
        {
          pattern_id: '5',
          title: 'Social Dining',
          description: 'Spending more when eating out with groups, often splitting bills unevenly.',
          pattern_type: 'social',
          impact_level: 'low',
          monthly_impact: 120,
          frequency: '3x per month',
          trend: 'stable',
          trend_percent: 0,
          triggers: ['social_pressure', 'celebration'],
          suggestions: [
            'Suggest splitting bills by what each person ordered',
            'Offer to organize at lower-cost venues',
            'Eat a snack before to order less',
          ],
          examples: ['Group dinners averaging $55 when solo would be $25'],
          first_detected: '4 months ago',
        },
      ]);

      // Mock triggers
      setTriggers([
        {
          trigger_id: '1',
          trigger_type: 'stress',
          occurrence_count: 23,
          total_amount: 890,
          avg_amount: 38.70,
          common_categories: ['Food Delivery', 'Shopping', 'Entertainment'],
          common_times: ['Evening', 'Late Night'],
          trend: 'up',
        },
        {
          trigger_id: '2',
          trigger_type: 'impulse',
          occurrence_count: 18,
          total_amount: 720,
          avg_amount: 40,
          common_categories: ['Shopping', 'Amazon', 'Clothing'],
          common_times: ['Afternoon', 'Weekend'],
          trend: 'stable',
        },
        {
          trigger_id: '3',
          trigger_type: 'social_pressure',
          occurrence_count: 12,
          total_amount: 580,
          avg_amount: 48.33,
          common_categories: ['Dining', 'Drinks', 'Events'],
          common_times: ['Evening', 'Weekend'],
          trend: 'down',
        },
        {
          trigger_id: '4',
          trigger_type: 'convenience',
          occurrence_count: 35,
          total_amount: 420,
          avg_amount: 12,
          common_categories: ['Coffee', 'Snacks', 'Uber'],
          common_times: ['Morning', 'Lunch'],
          trend: 'stable',
        },
        {
          trigger_id: '5',
          trigger_type: 'boredom',
          occurrence_count: 15,
          total_amount: 340,
          avg_amount: 22.67,
          common_categories: ['Gaming', 'Streaming', 'Food'],
          common_times: ['Afternoon', 'Evening'],
          trend: 'down',
        },
        {
          trigger_id: '6',
          trigger_type: 'routine',
          occurrence_count: 42,
          total_amount: 315,
          avg_amount: 7.50,
          common_categories: ['Coffee', 'Lunch', 'Transit'],
          common_times: ['Morning', 'Lunch'],
          trend: 'stable',
        },
      ]);

      // Mock time patterns
      setTimePatterns([
        { period: 'morning', label: 'Morning', amount: 420, transactions: 45, avg_per_transaction: 9.33, top_category: 'Coffee', is_peak: false },
        { period: 'afternoon', label: 'Afternoon', amount: 680, transactions: 38, avg_per_transaction: 17.89, top_category: 'Lunch', is_peak: false },
        { period: 'evening', label: 'Evening', amount: 1250, transactions: 52, avg_per_transaction: 24.04, top_category: 'Dining', is_peak: true },
        { period: 'night', label: 'Night', amount: 580, transactions: 28, avg_per_transaction: 20.71, top_category: 'Online Shopping', is_peak: false },
      ]);

      // Mock weekday patterns
      setWeekdayPatterns([
        { day: 'Monday', short: 'Mon', amount: 320, transactions: 12, is_highest: false },
        { day: 'Tuesday', short: 'Tue', amount: 280, transactions: 10, is_highest: false },
        { day: 'Wednesday', short: 'Wed', amount: 350, transactions: 14, is_highest: false },
        { day: 'Thursday', short: 'Thu', amount: 410, transactions: 16, is_highest: false },
        { day: 'Friday', short: 'Fri', amount: 520, transactions: 22, is_highest: false },
        { day: 'Saturday', short: 'Sat', amount: 680, transactions: 28, is_highest: true },
        { day: 'Sunday', short: 'Sun', amount: 450, transactions: 20, is_highest: false },
      ]);

      // Mock correlations
      setCorrelations([
        { category: 'Food & Dining', icon: 'fork.knife', color: '#F59E0B', emotional_percent: 65, planned_percent: 35, avg_emotional_amount: 42, avg_planned_amount: 28 },
        { category: 'Shopping', icon: 'bag.fill', color: '#EC4899', emotional_percent: 78, planned_percent: 22, avg_emotional_amount: 85, avg_planned_amount: 120 },
        { category: 'Entertainment', icon: 'gamecontroller.fill', color: '#8B5CF6', emotional_percent: 55, planned_percent: 45, avg_emotional_amount: 35, avg_planned_amount: 45 },
        { category: 'Transport', icon: 'car.fill', color: '#0891B2', emotional_percent: 25, planned_percent: 75, avg_emotional_amount: 28, avg_planned_amount: 22 },
      ]);

    } catch (error) {
      console.error('Error fetching patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatternPress = (pattern: SpendingPattern) => {
    // TODO: Navigate to pattern detail
    console.log('Pattern pressed:', pattern.title);
  };

  const highImpactCount = patterns.filter(p => p.impact_level === 'high').length;
  const topTrigger = triggers.length > 0 
    ? triggerTypeConfig[triggers.sort((a, b) => b.total_amount - a.total_amount)[0].trigger_type].label
    : 'None';
  const potentialSavings = patterns
    .filter(p => p.impact_level === 'high' || p.impact_level === 'medium')
    .reduce((sum, p) => sum + Math.round(p.monthly_impact * 0.3), 0);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Analyzing your patterns...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'patterns' && (
          <>
            <InsightsSummary
              totalPatterns={patterns.length}
              highImpactPatterns={highImpactCount}
              topTrigger={topTrigger}
              potentialSavings={potentialSavings}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Detected Patterns</Text>
              <Text style={styles.sectionSubtitle}>Tap to see details and tips</Text>
            </View>

            {patterns.map((pattern) => (
              <PatternCard
                key={pattern.pattern_id}
                pattern={pattern}
                onPress={() => handlePatternPress(pattern)}
              />
            ))}
          </>
        )}

        {activeTab === 'triggers' && (
          <>
            <View style={styles.triggerSummary}>
              <Text style={styles.triggerSummaryTitle}>Understanding Your Triggers</Text>
              <Text style={styles.triggerSummaryText}>
                Triggers are emotional or situational factors that lead to unplanned spending. 
                Recognizing them is the first step to better financial habits.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Top Triggers</Text>
              <Text style={styles.sectionSubtitle}>Based on the last 30 days</Text>
            </View>

            {triggers.map((trigger) => (
              <TriggerCard key={trigger.trigger_id} trigger={trigger} />
            ))}

            <CategoryCorrelationCard data={correlations} />
          </>
        )}

        {activeTab === 'timing' && (
          <>
            <TimeOfDayChart data={timePatterns} />
            <WeekdayChart data={weekdayPatterns} />

            {/* Peak Spending Alert */}
            <View style={styles.peakAlertCard}>
              <View style={styles.peakAlertIcon}>
                <SFSymbol name="exclamationmark.triangle.fill" size={24} color="#DC2626" />
              </View>
              <View style={styles.peakAlertContent}>
                <Text style={styles.peakAlertTitle}>Peak Spending Time</Text>
                <Text style={styles.peakAlertText}>
                  You spend 42% more during <Text style={styles.peakAlertHighlight}>Saturday evenings</Text>. 
                  Consider setting a reminder to pause before purchases during this time.
                </Text>
              </View>
            </View>

            {/* Time-based Tips */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <SFSymbol name="lightbulb.fill" size={20} color="#F59E0B" />
                <Text style={styles.tipsTitle}>Time-Based Tips</Text>
              </View>
              
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>
                  Enable "Sleep Mode" on shopping apps after 9pm
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>
                  Plan weekend activities in advance to avoid impulse spending
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>
                  Morning coffee habit costs ~$195/month — try home brewing
                </Text>
              </View>
            </View>
          </>
        )}
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
    paddingBottom: 16,
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
  headerSpacer: {
    width: 80,
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

  // Tab Selector
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
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
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#046C4E',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  summaryValueSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Section Header
  sectionHeader: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Pattern Card
  patternCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  patternCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patternTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patternCardHeaderInfo: {
    flex: 1,
  },
  patternCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  patternCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  impactBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  patternFrequency: {
    fontSize: 13,
    color: '#8E8E93',
  },
  patternTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  patternTrendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  patternDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  patternImpactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  patternImpactItem: {
    flex: 1,
    alignItems: 'center',
  },
  patternImpactLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 4,
  },
  patternImpactValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  patternDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 12,
  },
  triggerIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  triggerIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  suggestionPreviewText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  patternCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Trigger Summary
  triggerSummary: {
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    padding: 16,
  },
  triggerSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
  },
  triggerSummaryText: {
    fontSize: 14,
    color: '#6B21A8',
    lineHeight: 20,
  },

  // Trigger Card
  triggerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  triggerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  triggerCardInfo: {
    flex: 1,
  },
  triggerCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  triggerCardDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  triggerCardStats: {
    alignItems: 'flex-end',
  },
  triggerCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  triggerCardCount: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  triggerCardExpanded: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  triggerStatRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  triggerStatItem: {
    flex: 1,
  },
  triggerStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  triggerStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  triggerDetailSection: {
    marginBottom: 12,
  },
  triggerDetailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  triggerDetailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerDetailTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  triggerDetailTagText: {
    fontSize: 13,
    color: '#6B7280',
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 12,
  },

  // Time Chart
  timeChart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
  },
  timeChartBars: {
    flexDirection: 'row',
    height: 200,
    gap: 12,
  },
  timeChartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeChartAmount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  timeChartBarWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  timeChartBar: {
    width: '100%',
    borderRadius: 8,
  },
  timeChartLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  timeChartLabelPeak: {
    color: '#DC2626',
    fontWeight: '600',
  },
  peakBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  peakBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Weekday Chart
  weekdayChart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  weekdayBars: {
    flexDirection: 'row',
    height: 160,
    gap: 8,
  },
  weekdayBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayBarWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekdayBar: {
    width: '100%',
    borderRadius: 6,
  },
  weekdayLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 8,
  },
  weekdayLabelHighest: {
    color: '#DC2626',
    fontWeight: '600',
  },
  weekdayAmount: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },

  // Correlation Card
  correlationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  correlationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  correlationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  correlationInfo: {
    flex: 1,
  },
  correlationCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  correlationBars: {
    flexDirection: 'row',
    gap: 4,
  },
  correlationBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  correlationBar: {
    height: '100%',
  },
  correlationBarEmotional: {
    backgroundColor: '#EC4899',
  },
  correlationBarPlanned: {
    backgroundColor: '#046C4E',
  },
  correlationAmounts: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  correlationAmountEmotional: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EC4899',
  },
  correlationAmountPlanned: {
    fontSize: 13,
    fontWeight: '600',
    color: '#046C4E',
    marginTop: 2,
  },
  correlationLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
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
    fontSize: 13,
    color: '#6B7280',
  },

  // Peak Alert Card
  peakAlertCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  peakAlertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peakAlertContent: {
    flex: 1,
  },
  peakAlertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  peakAlertText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  peakAlertHighlight: {
    fontWeight: '700',
  },

  // Tips Card
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});