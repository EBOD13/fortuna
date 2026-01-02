// src/components/cards/InsightCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
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
export type InsightType = 
  | 'tip' 
  | 'warning' 
  | 'positive' 
  | 'pattern' 
  | 'alert' 
  | 'suggestion'
  | 'achievement'
  | 'reminder';

export type InsightPriority = 'high' | 'medium' | 'low';

export type InsightAction = {
  label: string;
  onPress: () => void;
  style?: 'primary' | 'secondary' | 'destructive';
};

export type RelatedData = {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  trendIsPositive?: boolean;
};

export type Insight = {
  insight_id: string;
  type: InsightType;
  title: string;
  description: string;
  priority?: InsightPriority;
  timestamp?: string;
  expandedContent?: string;
  relatedData?: RelatedData[];
  actions?: InsightAction[];
  dismissible?: boolean;
  onDismiss?: () => void;
  category?: string;
  source?: string;
};

// ============ CONFIG ============
const typeConfig: Record<InsightType, { 
  icon: string; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  tip: { 
    icon: 'lightbulb.fill', 
    color: '#F59E0B', 
    bgColor: '#FEF3C7',
    label: 'Tip',
  },
  warning: { 
    icon: 'exclamationmark.triangle.fill', 
    color: '#DC2626', 
    bgColor: '#FEF2F2',
    label: 'Warning',
  },
  positive: { 
    icon: 'checkmark.circle.fill', 
    color: '#046C4E', 
    bgColor: '#D1FAE5',
    label: 'Good News',
  },
  pattern: { 
    icon: 'waveform.path.ecg.rectangle.fill', 
    color: '#7C3AED', 
    bgColor: '#EDE9FE',
    label: 'Pattern',
  },
  alert: { 
    icon: 'bell.badge.fill', 
    color: '#DC2626', 
    bgColor: '#FEF2F2',
    label: 'Alert',
  },
  suggestion: { 
    icon: 'sparkles', 
    color: '#2563EB', 
    bgColor: '#DBEAFE',
    label: 'Suggestion',
  },
  achievement: { 
    icon: 'trophy.fill', 
    color: '#F59E0B', 
    bgColor: '#FEF3C7',
    label: 'Achievement',
  },
  reminder: { 
    icon: 'clock.fill', 
    color: '#6B7280', 
    bgColor: '#F3F4F6',
    label: 'Reminder',
  },
};

const priorityConfig: Record<InsightPriority, { borderColor: string }> = {
  high: { borderColor: '#DC2626' },
  medium: { borderColor: '#F59E0B' },
  low: { borderColor: 'transparent' },
};

// ============ PROPS ============
export type InsightCardProps = {
  insight: Insight;
  variant?: 'default' | 'compact' | 'featured';
  showType?: boolean;
  showTimestamp?: boolean;
  onPress?: () => void;
};

// ============ COMPONENT ============
export default function InsightCard({
  insight,
  variant = 'default',
  showType = true,
  showTimestamp = false,
  onPress,
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[insight.type];
  const priority = insight.priority ? priorityConfig[insight.priority] : null;

  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const hasExpandableContent = insight.expandedContent || insight.relatedData?.length;

  // ============ COMPACT VARIANT ============
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: config.bgColor }]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={[styles.compactIcon, { backgroundColor: config.color + '20' }]}>
          <SFSymbol name={config.icon} size={16} color={config.color} />
        </View>
        <View style={styles.compactContent}>
          <Text style={[styles.compactTitle, { color: config.color }]} numberOfLines={1}>
            {insight.title}
          </Text>
          <Text style={styles.compactDescription} numberOfLines={1}>
            {insight.description}
          </Text>
        </View>
        {onPress && (
          <SFSymbol name="chevron.right" size={14} color={config.color} />
        )}
      </TouchableOpacity>
    );
  }

  // ============ FEATURED VARIANT ============
  if (variant === 'featured') {
    return (
      <View style={[styles.featuredCard, { backgroundColor: config.bgColor }]}>
        {insight.dismissible && (
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={insight.onDismiss}
          >
            <SFSymbol name="xmark" size={14} color={config.color} />
          </TouchableOpacity>
        )}

        <View style={styles.featuredHeader}>
          <View style={[styles.featuredIconContainer, { backgroundColor: config.color + '20' }]}>
            <SFSymbol name={config.icon} size={32} color={config.color} />
          </View>
          {showType && (
            <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.featuredTitle, { color: config.color }]}>
          {insight.title}
        </Text>
        <Text style={styles.featuredDescription}>
          {insight.description}
        </Text>

        {insight.relatedData && insight.relatedData.length > 0 && (
          <View style={styles.featuredDataRow}>
            {insight.relatedData.map((data, index) => (
              <View key={index} style={styles.featuredDataItem}>
                <Text style={styles.featuredDataLabel}>{data.label}</Text>
                <View style={styles.featuredDataValueRow}>
                  <Text style={[styles.featuredDataValue, { color: config.color }]}>
                    {data.value}
                  </Text>
                  {data.trend && (
                    <SFSymbol
                      name={data.trend === 'up' ? 'arrow.up' : data.trend === 'down' ? 'arrow.down' : 'minus'}
                      size={12}
                      color={data.trendIsPositive ? '#046C4E' : '#DC2626'}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {insight.actions && insight.actions.length > 0 && (
          <View style={styles.featuredActions}>
            {insight.actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.featuredActionButton,
                  action.style === 'primary' && { backgroundColor: config.color },
                  action.style === 'secondary' && { backgroundColor: config.color + '20' },
                  action.style === 'destructive' && { backgroundColor: '#DC2626' },
                ]}
                onPress={action.onPress}
              >
                <Text style={[
                  styles.featuredActionText,
                  action.style === 'primary' && { color: '#FFFFFF' },
                  action.style === 'secondary' && { color: config.color },
                  action.style === 'destructive' && { color: '#FFFFFF' },
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showTimestamp && insight.timestamp && (
          <Text style={styles.featuredTimestamp}>{insight.timestamp}</Text>
        )}
      </View>
    );
  }

  // ============ DEFAULT VARIANT ============
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: config.bgColor },
        priority && priority.borderColor !== 'transparent' && {
          borderLeftWidth: 4,
          borderLeftColor: priority.borderColor,
        },
      ]}
      onPress={hasExpandableContent ? handleToggleExpand : onPress}
      activeOpacity={hasExpandableContent || onPress ? 0.7 : 1}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <SFSymbol name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: config.color }]} numberOfLines={2}>
              {insight.title}
            </Text>
            {insight.dismissible && (
              <TouchableOpacity 
                style={styles.dismissButtonSmall}
                onPress={insight.onDismiss}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <SFSymbol name="xmark.circle.fill" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            )}
          </View>
          {showType && (
            <View style={styles.metaRow}>
              <Text style={[styles.typeLabel, { color: config.color }]}>
                {config.label}
              </Text>
              {insight.category && (
                <>
                  <Text style={styles.metaSeparator}>•</Text>
                  <Text style={styles.categoryLabel}>{insight.category}</Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>
        {insight.description}
      </Text>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedSection}>
          {insight.expandedContent && (
            <Text style={styles.expandedContent}>
              {insight.expandedContent}
            </Text>
          )}

          {/* Related Data */}
          {insight.relatedData && insight.relatedData.length > 0 && (
            <View style={styles.relatedDataContainer}>
              {insight.relatedData.map((data, index) => (
                <View key={index} style={styles.relatedDataItem}>
                  <Text style={styles.relatedDataLabel}>{data.label}</Text>
                  <View style={styles.relatedDataValueContainer}>
                    <Text style={styles.relatedDataValue}>{data.value}</Text>
                    {data.trend && (
                      <View style={[
                        styles.trendBadge,
                        { backgroundColor: data.trendIsPositive ? '#D1FAE5' : '#FEF2F2' }
                      ]}>
                        <SFSymbol
                          name={data.trend === 'up' ? 'arrow.up' : data.trend === 'down' ? 'arrow.down' : 'minus'}
                          size={10}
                          color={data.trendIsPositive ? '#046C4E' : '#DC2626'}
                        />
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      {insight.actions && insight.actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {insight.actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                action.style === 'primary' && { backgroundColor: config.color },
                action.style === 'destructive' && { backgroundColor: '#DC2626' },
              ]}
              onPress={action.onPress}
            >
              <Text style={[
                styles.actionButtonText,
                action.style === 'primary' && { color: '#FFFFFF' },
                action.style === 'destructive' && { color: '#FFFFFF' },
                (!action.style || action.style === 'secondary') && { color: config.color },
              ]}>
                {action.label}
              </Text>
              {(action.style === 'secondary' || !action.style) && (
                <SFSymbol name="chevron.right" size={12} color={config.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {showTimestamp && insight.timestamp && (
          <Text style={styles.timestamp}>{insight.timestamp}</Text>
        )}
        {hasExpandableContent && (
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={handleToggleExpand}
          >
            <Text style={[styles.expandButtonText, { color: config.color }]}>
              {expanded ? 'Show less' : 'Show more'}
            </Text>
            <SFSymbol 
              name={expanded ? 'chevron.up' : 'chevron.down'} 
              size={12} 
              color={config.color} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Source Attribution */}
      {insight.source && (
        <View style={styles.sourceContainer}>
          <SFSymbol name="sparkles" size={10} color="#8E8E93" />
          <Text style={styles.sourceText}>Powered by {insight.source}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============ INSIGHT LIST COMPONENT ============
export type InsightListProps = {
  insights: Insight[];
  variant?: 'default' | 'compact' | 'featured';
  title?: string;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  maxItems?: number;
  emptyMessage?: string;
};

export function InsightList({
  insights,
  variant = 'default',
  title,
  showSeeAll = false,
  onSeeAll,
  maxItems,
  emptyMessage = 'No insights available',
}: InsightListProps) {
  const displayInsights = maxItems ? insights.slice(0, maxItems) : insights;

  if (insights.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <SFSymbol name="sparkles" size={32} color="#C7C7CC" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {title && (
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{title}</Text>
          {showSeeAll && onSeeAll && (
            <TouchableOpacity onPress={onSeeAll}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.listContent}>
        {displayInsights.map((insight, index) => (
          <InsightCard
            key={insight.insight_id}
            insight={insight}
            variant={variant}
          />
        ))}
      </View>
    </View>
  );
}

// ============ INSIGHT BANNER COMPONENT ============
export type InsightBannerProps = {
  insight: Insight;
  onPress?: () => void;
  onDismiss?: () => void;
};

export function InsightBanner({ insight, onPress, onDismiss }: InsightBannerProps) {
  const config = typeConfig[insight.type];

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: config.bgColor }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.bannerIcon, { backgroundColor: config.color + '20' }]}>
        <SFSymbol name={config.icon} size={18} color={config.color} />
      </View>
      <View style={styles.bannerContent}>
        <Text style={[styles.bannerTitle, { color: config.color }]} numberOfLines={1}>
          {insight.title}
        </Text>
        <Text style={styles.bannerDescription} numberOfLines={1}>
          {insight.description}
        </Text>
      </View>
      {onDismiss ? (
        <TouchableOpacity 
          style={styles.bannerDismiss}
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <SFSymbol name="xmark" size={14} color={config.color} />
        </TouchableOpacity>
      ) : (
        <SFSymbol name="chevron.right" size={14} color={config.color} />
      )}
    </TouchableOpacity>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  // Default Card
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  dismissButtonSmall: {
    padding: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#8E8E93',
    marginHorizontal: 6,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  expandedContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  relatedDataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  relatedDataItem: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
    padding: 12,
    minWidth: '45%',
    flex: 1,
  },
  relatedDataLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  relatedDataValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  relatedDataValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  trendBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timestamp: {
    fontSize: 11,
    color: '#8E8E93',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sourceText: {
    fontSize: 10,
    color: '#8E8E93',
  },

  // Compact Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Featured Card
  featuredCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  dismissButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featuredIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  featuredDataRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  featuredDataItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    padding: 14,
  },
  featuredDataLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  featuredDataValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredDataValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  featuredActions: {
    flexDirection: 'row',
    gap: 12,
  },
  featuredActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  featuredActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  featuredTimestamp: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
  },

  // List
  listContainer: {
    marginBottom: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  listContent: {
    gap: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bannerDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  bannerDismiss: {
    padding: 4,
  },
});