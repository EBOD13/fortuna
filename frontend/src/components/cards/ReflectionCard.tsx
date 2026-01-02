// src/components/cards/ReflectionCard.tsx
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
export type ReflectionType = 'weekly' | 'monthly' | 'yearly';
export type MoodRating = 1 | 2 | 3 | 4 | 5;

export type ReflectionPromptCategory = 'wins' | 'challenges' | 'lessons' | 'goals' | 'gratitude' | 'general';

export type ReflectionResponse = {
  prompt_id: string;
  question: string;
  response: string;
  category: ReflectionPromptCategory;
};

export type Reflection = {
  reflection_id: string;
  type: ReflectionType;
  period: string;
  period_label: string;
  mood_rating: MoodRating;
  financial_rating: MoodRating;
  responses: ReflectionResponse[];
  created_at: string;
  updated_at?: string;
  highlights?: string[];
  tags?: string[];
};

// ============ CONFIG ============
const moodConfig: Record<MoodRating, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😢', label: 'Struggling', color: '#DC2626' },
  2: { emoji: '😕', label: 'Difficult', color: '#F59E0B' },
  3: { emoji: '😐', label: 'Okay', color: '#6B7280' },
  4: { emoji: '🙂', label: 'Good', color: '#2563EB' },
  5: { emoji: '😄', label: 'Great', color: '#046C4E' },
};

const categoryConfig: Record<ReflectionPromptCategory, { icon: string; color: string; label: string }> = {
  wins: { icon: 'trophy.fill', color: '#F59E0B', label: 'Win' },
  challenges: { icon: 'exclamationmark.triangle.fill', color: '#DC2626', label: 'Challenge' },
  lessons: { icon: 'lightbulb.fill', color: '#2563EB', label: 'Lesson' },
  goals: { icon: 'target', color: '#046C4E', label: 'Goal' },
  gratitude: { icon: 'heart.fill', color: '#EC4899', label: 'Gratitude' },
  general: { icon: 'text.bubble.fill', color: '#6B7280', label: 'Note' },
};

const typeConfig: Record<ReflectionType, { icon: string; label: string }> = {
  weekly: { icon: 'calendar.badge.clock', label: 'Weekly' },
  monthly: { icon: 'calendar', label: 'Monthly' },
  yearly: { icon: 'calendar.badge.checkmark', label: 'Yearly' },
};

// ============ PROPS ============
export type ReflectionCardProps = {
  reflection: Reflection;
  variant?: 'default' | 'compact' | 'expanded';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  initialExpanded?: boolean;
};

// ============ COMPONENT ============
export default function ReflectionCard({
  reflection,
  variant = 'default',
  onPress,
  onEdit,
  onDelete,
  showActions = false,
  initialExpanded = false,
}: ReflectionCardProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  
  const moodCfg = moodConfig[reflection.mood_rating];
  const financialCfg = moodConfig[reflection.financial_rating];
  const typeCfg = typeConfig[reflection.type];

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      toggleExpanded();
    }
  };

  // ============ COMPACT VARIANT ============
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.compactLeft}>
          <Text style={styles.compactPeriod}>{reflection.period_label}</Text>
          <Text style={styles.compactDate}>{reflection.created_at}</Text>
        </View>
        <View style={styles.compactMoods}>
          <View style={[styles.compactMoodBadge, { backgroundColor: moodCfg.color + '15' }]}>
            <Text style={styles.compactMoodEmoji}>{moodCfg.emoji}</Text>
          </View>
          <View style={[styles.compactMoodBadge, { backgroundColor: financialCfg.color + '15' }]}>
            <SFSymbol name="dollarsign.circle.fill" size={14} color={financialCfg.color} />
          </View>
        </View>
        <SFSymbol name="chevron.right" size={14} color="#C7C7CC" />
      </TouchableOpacity>
    );
  }

  // ============ EXPANDED VARIANT ============
  if (variant === 'expanded') {
    return (
      <View style={styles.expandedCard}>
        {/* Header */}
        <View style={styles.expandedHeader}>
          <View>
            <View style={styles.expandedTypeRow}>
              <SFSymbol name={typeCfg.icon} size={14} color="#8E8E93" />
              <Text style={styles.expandedType}>{typeCfg.label} Reflection</Text>
            </View>
            <Text style={styles.expandedPeriod}>{reflection.period_label}</Text>
            <Text style={styles.expandedDate}>Completed {reflection.created_at}</Text>
          </View>
          {showActions && (
            <View style={styles.expandedActions}>
              {onEdit && (
                <TouchableOpacity style={styles.expandedActionButton} onPress={onEdit}>
                  <SFSymbol name="pencil" size={16} color="#007AFF" />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity style={styles.expandedActionButton} onPress={onDelete}>
                  <SFSymbol name="trash" size={16} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Mood Ratings */}
        <View style={styles.expandedMoodSection}>
          <View style={styles.expandedMoodItem}>
            <Text style={styles.expandedMoodLabel}>Overall Mood</Text>
            <View style={[styles.expandedMoodBadge, { backgroundColor: moodCfg.color + '15' }]}>
              <Text style={styles.expandedMoodEmoji}>{moodCfg.emoji}</Text>
              <Text style={[styles.expandedMoodText, { color: moodCfg.color }]}>
                {moodCfg.label}
              </Text>
            </View>
          </View>
          <View style={styles.expandedMoodDivider} />
          <View style={styles.expandedMoodItem}>
            <Text style={styles.expandedMoodLabel}>Financial Feeling</Text>
            <View style={[styles.expandedMoodBadge, { backgroundColor: financialCfg.color + '15' }]}>
              <SFSymbol name="dollarsign.circle.fill" size={18} color={financialCfg.color} />
              <Text style={[styles.expandedMoodText, { color: financialCfg.color }]}>
                {financialCfg.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Responses */}
        <View style={styles.expandedResponses}>
          {reflection.responses.map((response, index) => {
            const catCfg = categoryConfig[response.category];
            return (
              <View key={response.prompt_id} style={styles.expandedResponseItem}>
                <View style={styles.expandedResponseHeader}>
                  <View style={[styles.expandedResponseIcon, { backgroundColor: catCfg.color + '15' }]}>
                    <SFSymbol name={catCfg.icon} size={14} color={catCfg.color} />
                  </View>
                  <Text style={styles.expandedResponseQuestion}>{response.question}</Text>
                </View>
                <Text style={styles.expandedResponseText}>{response.response}</Text>
              </View>
            );
          })}
        </View>

        {/* Tags */}
        {reflection.tags && reflection.tags.length > 0 && (
          <View style={styles.expandedTags}>
            {reflection.tags.map((tag, index) => (
              <View key={index} style={styles.expandedTag}>
                <Text style={styles.expandedTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  // ============ DEFAULT VARIANT ============
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.period}>{reflection.period_label}</Text>
          <Text style={styles.date}>{reflection.created_at}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.moodBadge, { backgroundColor: moodCfg.color + '15' }]}>
            <Text style={styles.moodEmoji}>{moodCfg.emoji}</Text>
          </View>
          <View style={[styles.moodBadge, { backgroundColor: financialCfg.color + '15' }]}>
            <SFSymbol name="dollarsign.circle.fill" size={16} color={financialCfg.color} />
          </View>
        </View>
      </View>

      {/* Highlights Preview */}
      {reflection.highlights && reflection.highlights.length > 0 && !expanded && (
        <View style={styles.highlightsPreview}>
          {reflection.highlights.slice(0, 2).map((highlight, index) => (
            <Text key={index} style={styles.highlightText} numberOfLines={1}>
              • {highlight}
            </Text>
          ))}
        </View>
      )}

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Mood Details */}
          <View style={styles.moodDetails}>
            <View style={styles.moodDetailItem}>
              <Text style={styles.moodDetailLabel}>Overall</Text>
              <View style={styles.moodDetailValue}>
                <Text style={styles.moodDetailEmoji}>{moodCfg.emoji}</Text>
                <Text style={[styles.moodDetailText, { color: moodCfg.color }]}>
                  {moodCfg.label}
                </Text>
              </View>
            </View>
            <View style={styles.moodDetailDivider} />
            <View style={styles.moodDetailItem}>
              <Text style={styles.moodDetailLabel}>Financial</Text>
              <View style={styles.moodDetailValue}>
                <SFSymbol name="dollarsign.circle.fill" size={16} color={financialCfg.color} />
                <Text style={[styles.moodDetailText, { color: financialCfg.color }]}>
                  {financialCfg.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Responses */}
          <View style={styles.responses}>
            {reflection.responses.map((response) => {
              const catCfg = categoryConfig[response.category];
              return (
                <View key={response.prompt_id} style={styles.responseItem}>
                  <View style={styles.responseHeader}>
                    <View style={[styles.responseIcon, { backgroundColor: catCfg.color + '15' }]}>
                      <SFSymbol name={catCfg.icon} size={12} color={catCfg.color} />
                    </View>
                    <Text style={[styles.responseCategoryLabel, { color: catCfg.color }]}>
                      {catCfg.label}
                    </Text>
                  </View>
                  <Text style={styles.responseText}>{response.response}</Text>
                </View>
              );
            })}
          </View>

          {/* Actions */}
          {showActions && (
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                  <SFSymbol name="pencil" size={14} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.actionButtonDestructive]} 
                  onPress={onDelete}
                >
                  <SFSymbol name="trash" size={14} color="#DC2626" />
                  <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {expanded ? 'Tap to collapse' : 'Tap to view details'}
        </Text>
        <SFSymbol 
          name={expanded ? 'chevron.up' : 'chevron.down'} 
          size={12} 
          color="#C7C7CC" 
        />
      </View>
    </TouchableOpacity>
  );
}

// ============ REFLECTION LIST ============
export type ReflectionListProps = {
  reflections: Reflection[];
  variant?: 'default' | 'compact';
  onReflectionPress?: (reflection: Reflection) => void;
  onEdit?: (reflection: Reflection) => void;
  onDelete?: (reflection: Reflection) => void;
  showActions?: boolean;
  emptyMessage?: string;
  groupByYear?: boolean;
};

export function ReflectionList({
  reflections,
  variant = 'default',
  onReflectionPress,
  onEdit,
  onDelete,
  showActions = false,
  emptyMessage = 'No reflections yet',
  groupByYear = false,
}: ReflectionListProps) {
  if (reflections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <SFSymbol name="doc.text" size={32} color="#C7C7CC" />
        </View>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  if (groupByYear) {
    // Group reflections by year
    const grouped = reflections.reduce((acc, reflection) => {
      const year = reflection.period.split('-')[0];
      if (!acc[year]) acc[year] = [];
      acc[year].push(reflection);
      return acc;
    }, {} as Record<string, Reflection[]>);

    const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
      <View style={styles.listContainer}>
        {years.map((year) => (
          <View key={year} style={styles.yearGroup}>
            <Text style={styles.yearLabel}>{year}</Text>
            {grouped[year].map((reflection) => (
              <ReflectionCard
                key={reflection.reflection_id}
                reflection={reflection}
                variant={variant}
                onPress={() => onReflectionPress?.(reflection)}
                onEdit={onEdit ? () => onEdit(reflection) : undefined}
                onDelete={onDelete ? () => onDelete(reflection) : undefined}
                showActions={showActions}
              />
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {reflections.map((reflection) => (
        <ReflectionCard
          key={reflection.reflection_id}
          reflection={reflection}
          variant={variant}
          onPress={() => onReflectionPress?.(reflection)}
          onEdit={onEdit ? () => onEdit(reflection) : undefined}
          onDelete={onDelete ? () => onDelete(reflection) : undefined}
          showActions={showActions}
        />
      ))}
    </View>
  );
}

// ============ REFLECTION SUMMARY CARD ============
export type ReflectionSummaryProps = {
  totalReflections: number;
  currentStreak: number;
  longestStreak: number;
  avgMood: number;
  avgFinancialRating: number;
  mostCommonWin?: string;
  mostCommonChallenge?: string;
};

export function ReflectionSummaryCard({
  totalReflections,
  currentStreak,
  longestStreak,
  avgMood,
  avgFinancialRating,
  mostCommonWin,
  mostCommonChallenge,
}: ReflectionSummaryProps) {
  const getMoodEmoji = (rating: number): string => {
    if (rating >= 4.5) return '😄';
    if (rating >= 3.5) return '🙂';
    if (rating >= 2.5) return '😐';
    if (rating >= 1.5) return '😕';
    return '😢';
  };

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIcon, { backgroundColor: '#7C3AED15' }]}>
          <SFSymbol name="chart.bar.fill" size={18} color="#7C3AED" />
        </View>
        <Text style={styles.summaryTitle}>Reflection Journey</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryStatItem}>
          <Text style={styles.summaryStatValue}>{totalReflections}</Text>
          <Text style={styles.summaryStatLabel}>Total</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStatItem}>
          <View style={styles.summaryStreakValue}>
            <Text style={styles.summaryStatValue}>{currentStreak}</Text>
            {currentStreak > 0 && <Text style={styles.summaryStreakFire}>🔥</Text>}
          </View>
          <Text style={styles.summaryStatLabel}>Streak</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStatItem}>
          <View style={styles.summaryMoodValue}>
            <Text style={styles.summaryMoodEmoji}>{getMoodEmoji(avgMood)}</Text>
            <Text style={styles.summaryStatValueSmall}>{avgMood.toFixed(1)}</Text>
          </View>
          <Text style={styles.summaryStatLabel}>Avg Mood</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStatItem}>
          <View style={styles.summaryMoodValue}>
            <SFSymbol name="dollarsign.circle.fill" size={16} color="#046C4E" />
            <Text style={styles.summaryStatValueSmall}>{avgFinancialRating.toFixed(1)}</Text>
          </View>
          <Text style={styles.summaryStatLabel}>Financial</Text>
        </View>
      </View>

      {/* Insights */}
      {(mostCommonWin || mostCommonChallenge) && (
        <View style={styles.summaryInsights}>
          {mostCommonWin && (
            <View style={styles.summaryInsightRow}>
              <View style={[styles.summaryInsightIcon, { backgroundColor: '#F59E0B15' }]}>
                <SFSymbol name="trophy.fill" size={12} color="#F59E0B" />
              </View>
              <Text style={styles.summaryInsightText} numberOfLines={1}>
                Top win: <Text style={styles.summaryInsightHighlight}>{mostCommonWin}</Text>
              </Text>
            </View>
          )}
          {mostCommonChallenge && (
            <View style={styles.summaryInsightRow}>
              <View style={[styles.summaryInsightIcon, { backgroundColor: '#DC262615' }]}>
                <SFSymbol name="exclamationmark.triangle.fill" size={12} color="#DC2626" />
              </View>
              <Text style={styles.summaryInsightText} numberOfLines={1}>
                Top challenge: <Text style={styles.summaryInsightHighlight}>{mostCommonChallenge}</Text>
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Streak Info */}
      {longestStreak > 0 && (
        <View style={styles.summaryStreakInfo}>
          <SFSymbol name="flame.fill" size={12} color="#F59E0B" />
          <Text style={styles.summaryStreakInfoText}>
            Longest streak: {longestStreak} months
          </Text>
        </View>
      )}
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  // Default Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  period: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: '#8E8E93',
  },
  moodBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 18,
  },
  highlightsPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  highlightText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 14,
    marginBottom: 12,
  },
  moodDetails: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  moodDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  moodDetailDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 12,
  },
  moodDetailLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 6,
  },
  moodDetailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodDetailEmoji: {
    fontSize: 18,
  },
  moodDetailText: {
    fontSize: 14,
    fontWeight: '600',
  },
  responses: {
    gap: 12,
  },
  responseItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  responseIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseCategoryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  responseText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  actionButtonDestructive: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#C7C7CC',
  },

  // Compact Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  compactLeft: {
    flex: 1,
  },
  compactPeriod: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  compactDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  compactMoods: {
    flexDirection: 'row',
    gap: 6,
    marginRight: 10,
  },
  compactMoodBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMoodEmoji: {
    fontSize: 14,
  },

  // Expanded Variant
  expandedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  expandedTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  expandedType: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  expandedPeriod: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  expandedDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  expandedActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedMoodSection: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  expandedMoodItem: {
    flex: 1,
    alignItems: 'center',
  },
  expandedMoodDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  expandedMoodLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 10,
  },
  expandedMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  expandedMoodEmoji: {
    fontSize: 22,
  },
  expandedMoodText: {
    fontSize: 15,
    fontWeight: '600',
  },
  expandedResponses: {
    gap: 14,
  },
  expandedResponseItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  expandedResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  expandedResponseIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedResponseQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  expandedResponseText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  expandedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  expandedTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  expandedTagText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // List
  listContainer: {
    gap: 0,
  },
  yearGroup: {
    marginBottom: 20,
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    paddingHorizontal: 4,
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  summaryGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
  summaryStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  summaryStatValueSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  summaryStatLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  summaryStreakValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  summaryStreakFire: {
    fontSize: 14,
  },
  summaryMoodValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryMoodEmoji: {
    fontSize: 16,
  },
  summaryInsights: {
    gap: 10,
    marginBottom: 12,
  },
  summaryInsightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryInsightIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInsightText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  summaryInsightHighlight: {
    fontWeight: '600',
    color: '#000',
  },
  summaryStreakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  summaryStreakInfoText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});