// src/screens/GoalDetailScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { ProgressCircle as ChartProgressCircle, ProgressBar, LineChart, StatCard as ChartStatCard } from '../components/charts/ChartComponents';
import { useGoal } from '../hooks/useGoal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TYPES ============
type GoalType = 
  | 'emergency' 
  | 'savings' 
  | 'debt_payoff' 
  | 'investment' 
  | 'retirement' 
  | 'education' 
  | 'travel' 
  | 'purchase' 
  | 'other';

type GoalStatus = 'active' | 'paused' | 'completed';

type Milestone = {
  milestone_id: string;
  milestone_name: string;
  target_amount: number;
  target_date: string;
  achieved_date?: string;
  is_achieved: boolean;
};

type ProgressEntry = {
  progress_id: string;
  amount_added: number;
  new_total: number;
  progress_percentage: number;
  contribution_date: string;
  source: string;
  notes?: string;
};

type Goal = {
  goal_id: string;
  goal_name: string;
  goal_type: GoalType;
  target_amount: number;
  current_amount: number;
  deadline_date?: string;
  priority_level: number;
  is_mandatory: boolean;
  monthly_allocation: number;
  treat_as_bill: boolean;
  confidence_score: number;
  status: GoalStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  milestones: Milestone[];
  progress_history: ProgressEntry[];
};

// ============ GOAL TYPE CONFIG ============
const goalTypeConfig: Record<GoalType, { icon: string; color: string; label: string }> = {
  emergency: { icon: 'shield.fill', color: '#DC2626', label: 'Emergency Fund' },
  savings: { icon: 'banknote.fill', color: '#046C4E', label: 'Savings' },
  debt_payoff: { icon: 'creditcard.fill', color: '#7C3AED', label: 'Debt Payoff' },
  investment: { icon: 'chart.line.uptrend.xyaxis', color: '#2563EB', label: 'Investment' },
  retirement: { icon: 'figure.walk', color: '#F59E0B', label: 'Retirement' },
  education: { icon: 'graduationcap.fill', color: '#0891B2', label: 'Education' },
  travel: { icon: 'airplane', color: '#EC4899', label: 'Travel' },
  purchase: { icon: 'cart.fill', color: '#8B5CF6', label: 'Purchase' },
  other: { icon: 'star.fill', color: '#6B7280', label: 'Other' },
};

// ============ HEADER ============
type HeaderProps = {
  goal: Goal | null;
  onEdit: () => void;
  onDelete: () => void;
};

const Header = ({ goal, onEdit, onDelete }: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="chevron.left" size={20} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Goal Details</Text>
      <TouchableOpacity 
        style={styles.headerButton} 
        onPress={() => setShowMenu(!showMenu)}
      >
        <SFSymbol name="ellipsis" size={20} color="#000" />
      </TouchableOpacity>

      {showMenu && (
        <View style={[styles.menuDropdown, { top: insets.top + 56 }]}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { setShowMenu(false); onEdit(); }}
          >
            <SFSymbol name="pencil" size={18} color="#000" />
            <Text style={styles.menuItemText}>Edit Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, styles.menuItemDanger]} 
            onPress={() => { setShowMenu(false); onDelete(); }}
          >
            <SFSymbol name="trash" size={18} color="#DC2626" />
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete Goal</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============ PROGRESS CIRCLE ============
type ProgressCircleProps = {
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
};

const ProgressCircle = ({ percentage, size, strokeWidth, color }: ProgressCircleProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      {/* Background circle */}
      <View style={[styles.progressCircleBg, { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        borderWidth: strokeWidth,
      }]} />
      {/* This is a simplified version - in production use react-native-svg */}
      <View style={[styles.progressCircleInner, {
        width: size - strokeWidth * 2,
        height: size - strokeWidth * 2,
        borderRadius: (size - strokeWidth * 2) / 2,
        top: strokeWidth,
        left: strokeWidth,
      }]}>
        <Text style={[styles.progressCirclePercent, { color }]}>
          {Math.round(percentage)}%
        </Text>
        <Text style={styles.progressCircleLabel}>Complete</Text>
      </View>
      {/* Progress indicator */}
      <View style={[styles.progressIndicator, {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: color,
        borderRightColor: 'transparent',
        borderBottomColor: percentage > 25 ? color : 'transparent',
        borderLeftColor: percentage > 50 ? color : 'transparent',
        borderTopColor: percentage > 75 ? color : 'transparent',
        transform: [{ rotate: '-45deg' }],
      }]} />
    </View>
  );
};

// ============ STAT CARD ============
type StatCardProps = {
  icon: string;
  color: string;
  label: string;
  value: string;
  subtitle?: string;
};

const StatCard = ({ icon, color, label, value, subtitle }: StatCardProps) => (
  <View style={styles.statCard}>
    <View style={[styles.statCardIcon, { backgroundColor: color + '15' }]}>
      <SFSymbol name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statCardLabel}>{label}</Text>
    <Text style={styles.statCardValue}>{value}</Text>
    {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
  </View>
);

// ============ MILESTONE CARD ============
type MilestoneCardProps = {
  milestone: Milestone;
  currentAmount: number;
  goalColor: string;
};

const MilestoneCard = ({ milestone, currentAmount, goalColor }: MilestoneCardProps) => {
  const progress = Math.min((currentAmount / milestone.target_amount) * 100, 100);
  const isAchieved = milestone.is_achieved || currentAmount >= milestone.target_amount;

  return (
    <View style={[styles.milestoneCard, isAchieved && styles.milestoneCardAchieved]}>
      <View style={styles.milestoneCardHeader}>
        <View style={[
          styles.milestoneStatus,
          { backgroundColor: isAchieved ? '#046C4E' : '#E5E5EA' }
        ]}>
          {isAchieved ? (
            <SFSymbol name="checkmark" size={14} color="#FFFFFF" />
          ) : (
            <SFSymbol name="flag.fill" size={12} color="#8E8E93" />
          )}
        </View>
        <View style={styles.milestoneInfo}>
          <Text style={[styles.milestoneName, isAchieved && styles.milestoneNameAchieved]}>
            {milestone.milestone_name}
          </Text>
          <Text style={styles.milestoneDate}>
            {isAchieved 
              ? `Achieved ${milestone.achieved_date || 'recently'}` 
              : `Target: ${milestone.target_date}`
            }
          </Text>
        </View>
        <Text style={[styles.milestoneAmount, { color: isAchieved ? '#046C4E' : goalColor }]}>
          ${milestone.target_amount.toLocaleString()}
        </Text>
      </View>

      {!isAchieved && (
        <View style={styles.milestoneProgress}>
          <View style={styles.milestoneProgressBar}>
            <View 
              style={[
                styles.milestoneProgressFill, 
                { width: `${progress}%`, backgroundColor: goalColor }
              ]} 
            />
          </View>
          <Text style={styles.milestoneProgressText}>{progress.toFixed(0)}%</Text>
        </View>
      )}
    </View>
  );
};

// ============ PROGRESS HISTORY ITEM ============
type ProgressItemProps = {
  entry: ProgressEntry;
  goalColor: string;
  isLast: boolean;
};

const ProgressItem = ({ entry, goalColor, isLast }: ProgressItemProps) => (
  <View style={styles.progressItem}>
    <View style={styles.progressItemTimeline}>
      <View style={[styles.progressItemDot, { backgroundColor: goalColor }]} />
      {!isLast && <View style={styles.progressItemLine} />}
    </View>
    <View style={styles.progressItemContent}>
      <View style={styles.progressItemHeader}>
        <Text style={styles.progressItemAmount}>
          +${entry.amount_added.toLocaleString()}
        </Text>
        <Text style={styles.progressItemDate}>{entry.contribution_date}</Text>
      </View>
      <View style={styles.progressItemMeta}>
        <View style={styles.progressItemSource}>
          <SFSymbol name="arrow.down.circle.fill" size={14} color="#8E8E93" />
          <Text style={styles.progressItemSourceText}>{entry.source}</Text>
        </View>
        <Text style={styles.progressItemTotal}>
          Total: ${entry.new_total.toLocaleString()}
        </Text>
      </View>
      {entry.notes && (
        <Text style={styles.progressItemNotes}>{entry.notes}</Text>
      )}
    </View>
  </View>
);

// ============ SECTION HEADER ============
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
        <SFSymbol name={icon} size={16} color={color} />
      </View>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
    </View>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={[styles.sectionHeaderAction, { color }]}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ============ MAIN COMPONENT ============
export default function GoalDetailScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'GoalDetailScreen'>>();
  const goalId = route.params?.goalId;
  
  const { 
    goal: apiGoal, 
    contributions, 
    milestones: apiMilestones,
    isLoading, 
    error,
    deleteGoal,
    addContribution,
    pauseGoal,
    resumeGoal,
    completeGoal,
  } = useGoal(goalId);

  // Transform API goal to local format for display
  const goal: Goal | null = apiGoal ? {
    goal_id: apiGoal.goal_id,
    goal_name: apiGoal.goal_name,
    goal_type: apiGoal.goal_type as GoalType,
    target_amount: apiGoal.target_amount,
    current_amount: apiGoal.current_amount,
    deadline_date: apiGoal.target_date,
    priority_level: apiGoal.priority === 'critical' ? 10 : apiGoal.priority === 'high' ? 7 : apiGoal.priority === 'medium' ? 5 : 3,
    is_mandatory: apiGoal.priority === 'critical',
    monthly_allocation: apiGoal.monthly_contribution || 0,
    treat_as_bill: false,
    confidence_score: apiGoal.progress_percentage / 100,
    status: apiGoal.status as GoalStatus,
    notes: apiGoal.notes,
    created_at: apiGoal.created_at,
    updated_at: apiGoal.updated_at,
    milestones: apiMilestones.map(m => ({
      milestone_id: m.milestone_id,
      milestone_name: m.title,
      target_amount: m.target_amount,
      target_date: m.target_date || '',
      achieved_date: m.completed_at,
      is_achieved: m.is_completed,
    })),
    progress_history: contributions.map(c => ({
      progress_id: c.contribution_id,
      amount_added: c.amount,
      new_total: 0, // Would need cumulative calc
      progress_percentage: 0,
      contribution_date: c.contribution_date,
      source: c.source || 'Manual',
      notes: c.notes,
    })),
  } : null;

  const handleEdit = () => {
    navigation.navigate('EditGoalScreen', { goalId: goal?.goal_id || '' });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteGoal();
            if (success) {
              Alert.alert('Deleted', 'Goal has been deleted.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            }
          }
        },
      ]
    );
  };

  const handleAddFunds = () => {
    navigation.navigate('UpdateGoalScreen');
  };

  const handlePauseResume = async () => {
    if (goal?.status === 'paused') {
      await resumeGoal();
    } else {
      await pauseGoal();
    }
  };

  const handleComplete = async () => {
    Alert.alert(
      'Complete Goal',
      'Mark this goal as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: async () => {
            await completeGoal();
          }
        },
      ]
    );
  };

  const calculateDaysRemaining = () => {
    if (!goal?.deadline_date) return null;
    const deadline = new Date(goal.deadline_date);
    const today = new Date();
    const days = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const calculateMonthsToGoal = () => {
    if (!goal) return null;
    const remaining = goal.target_amount - goal.current_amount;
    if (goal.monthly_allocation <= 0) return null;
    return Math.ceil(remaining / goal.monthly_allocation);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header goal={null} onEdit={handleEdit} onDelete={handleDelete} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Loading goal details...</Text>
        </View>
      </View>
    );
  }

  if (error || !goal) {
    return (
      <View style={styles.container}>
        <Header goal={null} onEdit={handleEdit} onDelete={handleDelete} />
        <View style={styles.errorContainer}>
          <SFSymbol name="exclamationmark.triangle.fill" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error || 'Goal not found'}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const config = goalTypeConfig[goal.goal_type] || goalTypeConfig.other;
  const progress = (goal.current_amount / goal.target_amount) * 100;
  const remaining = goal.target_amount - goal.current_amount;
  const daysRemaining = calculateDaysRemaining();
  const monthsToGoal = calculateMonthsToGoal();
  const achievedMilestones = goal.milestones.filter(m => m.is_achieved).length;

  return (
    <View style={styles.container}>
      <Header goal={goal} onEdit={handleEdit} onDelete={handleDelete} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: config.color + '10' }]}>
          <View style={styles.heroTop}>
            <View style={[styles.goalTypeIcon, { backgroundColor: config.color + '20' }]}>
              <SFSymbol name={config.icon} size={28} color={config.color} />
            </View>
            <View style={styles.goalTypeBadges}>
              {goal.is_mandatory && (
                <View style={[styles.badge, { backgroundColor: '#DC262620' }]}>
                  <Text style={[styles.badgeText, { color: '#DC2626' }]}>Required</Text>
                </View>
              )}
              {goal.treat_as_bill && (
                <View style={[styles.badge, { backgroundColor: '#2563EB20' }]}>
                  <Text style={[styles.badgeText, { color: '#2563EB' }]}>Auto-Save</Text>
                </View>
              )}
              <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
                <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.goalName}>{goal.goal_name}</Text>
          
          {goal.status !== 'active' && (
            <View style={[
              styles.statusBanner,
              { backgroundColor: goal.status === 'completed' ? '#046C4E' : '#F59E0B' }
            ]}>
              <SFSymbol 
                name={goal.status === 'completed' ? 'checkmark.circle.fill' : 'pause.circle.fill'} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusBannerText}>
                {goal.status === 'completed' ? 'Goal Completed!' : 'Goal Paused'}
              </Text>
            </View>
          )}

          {/* Progress Circle & Amounts */}
          <View style={styles.progressSection}>
            <View style={styles.progressCircleContainer}>
              <ProgressCircle
                percentage={progress}
                size={140}
                strokeWidth={12}
                color={config.color}
              />
            </View>

            <View style={styles.amountsContainer}>
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Saved</Text>
                <Text style={[styles.amountValue, { color: config.color }]}>
                  ${goal.current_amount.toLocaleString()}
                </Text>
              </View>
              <View style={styles.amountDivider} />
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Remaining</Text>
                <Text style={styles.amountValueSecondary}>
                  ${remaining.toLocaleString()}
                </Text>
              </View>
              <View style={styles.amountDivider} />
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Target</Text>
                <Text style={styles.amountValueSecondary}>
                  ${goal.target_amount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Add Button */}
          {goal.status === 'active' && (
            <TouchableOpacity 
              style={[styles.addFundsButton, { backgroundColor: config.color }]}
              onPress={handleAddFunds}
            >
              <SFSymbol name="plus.circle.fill" size={22} color="#FFFFFF" />
              <Text style={styles.addFundsButtonText}>Add Funds</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="calendar"
            color="#2563EB"
            label="Deadline"
            value={goal.deadline_date || 'No deadline'}
            subtitle={daysRemaining !== null ? `${daysRemaining} days left` : undefined}
          />
          <StatCard
            icon="dollarsign.arrow.circlepath"
            color="#046C4E"
            label="Monthly"
            value={`$${goal.monthly_allocation.toLocaleString()}`}
            subtitle={monthsToGoal ? `${monthsToGoal} months to go` : undefined}
          />
          <StatCard
            icon="flag.fill"
            color="#F59E0B"
            label="Milestones"
            value={`${achievedMilestones}/${goal.milestones.length}`}
            subtitle="achieved"
          />
          <StatCard
            icon="chart.bar.fill"
            color="#7C3AED"
            label="Confidence"
            value={`${Math.round(goal.confidence_score * 100)}%`}
            subtitle="AI score"
          />
        </View>

        {/* Milestones Section */}
        {goal.milestones.length > 0 && (
          <>
            <SectionHeader
              title="Milestones"
              icon="flag.fill"
              color={config.color}
              action={{ 
                label: 'Add', 
                onPress: () => Alert.alert('Coming Soon', 'Add milestone functionality') 
              }}
            />
            <View style={styles.milestonesContainer}>
              {goal.milestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.milestone_id}
                  milestone={milestone}
                  currentAmount={goal.current_amount}
                  goalColor={config.color}
                />
              ))}
            </View>
          </>
        )}

        {/* Progress History Section */}
        {goal.progress_history.length > 0 && (
          <>
            <SectionHeader
              title="Progress History"
              icon="clock.fill"
              color={config.color}
              action={{ 
                label: 'See All', 
                onPress: () => Alert.alert('Coming Soon', 'Full history view') 
              }}
            />
            <View style={styles.progressHistoryContainer}>
              {goal.progress_history.slice(0, 5).map((entry, index) => (
                <ProgressItem
                  key={entry.progress_id}
                  entry={entry}
                  goalColor={config.color}
                  isLast={index === Math.min(goal.progress_history.length, 5) - 1}
                />
              ))}
            </View>
          </>
        )}

        {/* Notes Section */}
        {goal.notes && (
          <>
            <SectionHeader
              title="Notes"
              icon="note.text"
              color="#6B7280"
            />
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{goal.notes}</Text>
            </View>
          </>
        )}

        {/* Meta Info */}
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>Created: {goal.created_at}</Text>
          <Text style={styles.metaText}>Last updated: {goal.updated_at}</Text>
          {goal.completed_at && (
            <Text style={styles.metaText}>Completed: {goal.completed_at}</Text>
          )}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    zIndex: 100,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  menuDropdown: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 160,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
  },
  menuItemTextDanger: {
    color: '#DC2626',
  },

  // Loading & Error
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
  },
  errorButton: {
    backgroundColor: '#046C4E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 8,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTypeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    maxWidth: '60%',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Progress Section
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressCircleContainer: {
    marginBottom: 24,
  },
  progressCircleBg: {
    position: 'absolute',
    borderColor: '#E5E5EA',
  },
  progressCircleInner: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCirclePercent: {
    fontSize: 32,
    fontWeight: '700',
  },
  progressCircleLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  progressIndicator: {
    position: 'absolute',
  },
  amountsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  amountValueSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  amountDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
  },

  // Add Funds Button
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  addFundsButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statCardLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  statCardSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
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
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sectionHeaderAction: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Milestones
  milestonesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  milestoneCardAchieved: {
    backgroundColor: '#046C4E08',
    borderWidth: 1,
    borderColor: '#046C4E30',
  },
  milestoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  milestoneNameAchieved: {
    color: '#046C4E',
  },
  milestoneDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  milestoneAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  milestoneProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  milestoneProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  milestoneProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  milestoneProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    minWidth: 40,
    textAlign: 'right',
  },

  // Progress History
  progressHistoryContainer: {
    paddingHorizontal: 20,
  },
  progressItem: {
    flexDirection: 'row',
  },
  progressItemTimeline: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  progressItemDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressItemLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5EA',
    marginTop: 4,
  },
  progressItemContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  progressItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressItemAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#046C4E',
  },
  progressItemDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  progressItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressItemSource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressItemSourceText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  progressItemTotal: {
    fontSize: 13,
    color: '#8E8E93',
  },
  progressItemNotes: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Notes
  notesCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  notesText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },

  // Meta Info
  metaInfo: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Bottom
  bottomSpacer: {
    height: 40,
  },
});