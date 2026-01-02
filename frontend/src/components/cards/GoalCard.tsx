// src/components/cards/GoalCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

export type GoalMilestone = {
  milestone_id: string;
  milestone_name: string;
  target_amount: number;
  target_date: string;
  achieved_date?: string;
  is_achieved: boolean;
};

export type Goal = {
  goal_id: string;
  goal_name: string;
  goal_type: 'savings' | 'investment' | 'debt_payoff' | 'purchase' | 'emergency' | 'retirement' | 'education' | 'other';
  target_amount: number;
  current_amount: number;
  deadline_date?: string;
  priority_level: number; // 1-10
  is_mandatory: boolean;
  monthly_allocation?: number;
  treat_as_bill: boolean;
  confidence_score?: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  milestones?: GoalMilestone[];
  created_at: string;
};

type Props = {
  item: Goal;
  onPress?: (item: Goal) => void;
};

export default function GoalCard({ item, onPress }: Props) {
  const progress = (item.current_amount / item.target_amount) * 100;
  const remaining = item.target_amount - item.current_amount;

  const getGoalIcon = () => {
    switch (item.goal_type) {
      case 'savings':
        return 'banknote.fill';
      case 'investment':
        return 'chart.line.uptrend.xyaxis';
      case 'debt_payoff':
        return 'creditcard.fill';
      case 'purchase':
        return 'bag.fill';
      case 'emergency':
        return 'shield.fill';
      case 'retirement':
        return 'figure.walk';
      case 'education':
        return 'book.fill';
      default:
        return 'target';
    }
  };

  const getGoalColor = () => {
    switch (item.goal_type) {
      case 'savings':
        return '#046C4E';
      case 'investment':
        return '#2563EB';
      case 'debt_payoff':
        return '#DC2626';
      case 'purchase':
        return '#7C3AED';
      case 'emergency':
        return '#F59E0B';
      case 'retirement':
        return '#0891B2';
      case 'education':
        return '#DB2777';
      default:
        return '#8E8E93';
    }
  };

  const getPriorityLabel = () => {
    if (item.priority_level >= 8) return 'High';
    if (item.priority_level >= 5) return 'Medium';
    return 'Low';
  };

  const getPriorityColor = () => {
    if (item.priority_level >= 8) return '#DC2626';
    if (item.priority_level >= 5) return '#F59E0B';
    return '#8E8E93';
  };

  const getDaysRemaining = () => {
    if (!item.deadline_date) return null;
    const today = new Date();
    const deadline = new Date(item.deadline_date);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTimeRemainingText = () => {
    const days = getDaysRemaining();
    if (days === null) return 'No deadline';
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    if (days < 30) return `${days} days left`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''} left`;
    }
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} left`;
  };

  const getConfidenceLabel = () => {
    if (!item.confidence_score) return null;
    if (item.confidence_score >= 0.8) return 'On Track';
    if (item.confidence_score >= 0.5) return 'At Risk';
    return 'Behind';
  };

  const getConfidenceColor = () => {
    if (!item.confidence_score) return '#8E8E93';
    if (item.confidence_score >= 0.8) return '#046C4E';
    if (item.confidence_score >= 0.5) return '#F59E0B';
    return '#DC2626';
  };

  const color = getGoalColor();
  const daysRemaining = getDaysRemaining();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <SFSymbol name={getGoalIcon()} size={24} color={color} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.goalName}>{item.goal_name}</Text>
          <Text style={styles.goalType}>
            {item.goal_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {item.is_mandatory && (
            <View style={styles.mandatoryBadge}>
              <SFSymbol name="exclamationmark.circle.fill" size={14} color="#DC2626" />
            </View>
          )}
          {item.treat_as_bill && (
            <View style={styles.billBadge}>
              <SFSymbol name="repeat.circle.fill" size={14} color="#2563EB" />
            </View>
          )}
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.currentAmount}>
            ${item.current_amount.toLocaleString()}
          </Text>
          <Text style={styles.targetAmount}>
            of ${item.target_amount.toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(progress, 100)}%`, backgroundColor: color },
            ]}
          />
          {/* Milestone markers */}
          {item.milestones?.map((milestone, index) => {
            const milestonePosition = (milestone.target_amount / item.target_amount) * 100;
            return (
              <View
                key={milestone.milestone_id}
                style={[
                  styles.milestoneMarker,
                  { left: `${milestonePosition}%` },
                  milestone.is_achieved && styles.milestoneAchieved,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.progressFooter}>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          <Text style={styles.remainingAmount}>
            ${remaining.toLocaleString()} to go
          </Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.detailsSection}>
        {/* Time Remaining */}
        <View style={styles.detailItem}>
          <SFSymbol
            name="calendar"
            size={14}
            color={daysRemaining !== null && daysRemaining < 30 ? '#F59E0B' : '#8E8E93'}
          />
          <Text
            style={[
              styles.detailText,
              daysRemaining !== null && daysRemaining < 30 && styles.urgentText,
            ]}
          >
            {getTimeRemainingText()}
          </Text>
        </View>

        {/* Monthly Allocation */}
        {item.monthly_allocation && (
          <View style={styles.detailItem}>
            <SFSymbol name="dollarsign.arrow.circlepath" size={14} color="#8E8E93" />
            <Text style={styles.detailText}>
              ${item.monthly_allocation.toLocaleString()}/mo
            </Text>
          </View>
        )}

        {/* Priority */}
        <View style={styles.detailItem}>
          <SFSymbol name="flag.fill" size={14} color={getPriorityColor()} />
          <Text style={[styles.detailText, { color: getPriorityColor() }]}>
            {getPriorityLabel()} Priority
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerBadges}>
          {/* Confidence Score */}
          {item.confidence_score !== undefined && (
            <View style={[styles.badge, { backgroundColor: getConfidenceColor() + '15' }]}>
              <SFSymbol name="chart.bar.fill" size={12} color={getConfidenceColor()} />
              <Text style={[styles.badgeText, { color: getConfidenceColor() }]}>
                {getConfidenceLabel()}
              </Text>
            </View>
          )}

          {/* Status */}
          {item.status !== 'active' && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    item.status === 'completed'
                      ? '#046C4E15'
                      : item.status === 'paused'
                      ? '#F59E0B15'
                      : '#DC262615',
                },
              ]}
            >
              <SFSymbol
                name={
                  item.status === 'completed'
                    ? 'checkmark.circle.fill'
                    : item.status === 'paused'
                    ? 'pause.circle.fill'
                    : 'xmark.circle.fill'
                }
                size={12}
                color={
                  item.status === 'completed'
                    ? '#046C4E'
                    : item.status === 'paused'
                    ? '#F59E0B'
                    : '#DC2626'
                }
              />
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      item.status === 'completed'
                        ? '#046C4E'
                        : item.status === 'paused'
                        ? '#F59E0B'
                        : '#DC2626',
                  },
                ]}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Milestones indicator */}
        {item.milestones && item.milestones.length > 0 && (
          <View style={styles.milestonesIndicator}>
            <SFSymbol name="flag.checkered" size={12} color="#8E8E93" />
            <Text style={styles.milestonesText}>
              {item.milestones.filter(m => m.is_achieved).length}/{item.milestones.length} milestones
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  goalType: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 3,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  mandatoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC262615',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB15',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress Section
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  currentAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
  },
  targetAmount: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  milestoneMarker: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 14,
    backgroundColor: '#C7C7CC',
    borderRadius: 2,
    transform: [{ translateX: -2 }],
  },
  milestoneAchieved: {
    backgroundColor: '#046C4E',
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  progressPercentage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  remainingAmount: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Details Section
  detailsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  urgentText: {
    color: '#F59E0B',
    fontWeight: '500',
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerBadges: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  milestonesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestonesText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});