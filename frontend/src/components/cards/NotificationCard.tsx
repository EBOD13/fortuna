// src/components/cards/NotificationCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

// ============ TYPES ============
export type NotificationType = 
  | 'budget_alert'
  | 'goal_milestone'
  | 'bill_reminder'
  | 'spending_alert'
  | 'income_received'
  | 'insight'
  | 'achievement'
  | 'tip'
  | 'system'
  | 'reminder';

export type NotificationPriority = 'high' | 'medium' | 'low';

export type NotificationAction = {
  label: string;
  action: string; // Action identifier for handling
  style?: 'primary' | 'secondary' | 'destructive';
};

export type Notification = {
  notification_id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: NotificationPriority;
  actions?: NotificationAction[];
  metadata?: {
    screen?: string;
    params?: Record<string, any>;
    amount?: number;
    progress?: number;
    category?: string;
  };
};

// ============ CONFIG ============
const typeConfig: Record<NotificationType, { 
  icon: string; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  budget_alert: { 
    icon: 'exclamationmark.triangle.fill', 
    color: '#DC2626', 
    bgColor: '#FEF2F2',
    label: 'Budget Alert',
  },
  goal_milestone: { 
    icon: 'flag.fill', 
    color: '#7C3AED', 
    bgColor: '#EDE9FE',
    label: 'Goal Update',
  },
  bill_reminder: { 
    icon: 'calendar.badge.clock', 
    color: '#F59E0B', 
    bgColor: '#FEF3C7',
    label: 'Bill Reminder',
  },
  spending_alert: { 
    icon: 'creditcard.fill', 
    color: '#DC2626', 
    bgColor: '#FEF2F2',
    label: 'Spending Alert',
  },
  income_received: { 
    icon: 'banknote.fill', 
    color: '#046C4E', 
    bgColor: '#D1FAE5',
    label: 'Income',
  },
  insight: { 
    icon: 'lightbulb.fill', 
    color: '#2563EB', 
    bgColor: '#DBEAFE',
    label: 'Insight',
  },
  achievement: { 
    icon: 'trophy.fill', 
    color: '#F59E0B', 
    bgColor: '#FEF3C7',
    label: 'Achievement',
  },
  tip: { 
    icon: 'sparkles', 
    color: '#EC4899', 
    bgColor: '#FCE7F3',
    label: 'Tip',
  },
  system: { 
    icon: 'gear', 
    color: '#6B7280', 
    bgColor: '#F3F4F6',
    label: 'System',
  },
  reminder: { 
    icon: 'bell.fill', 
    color: '#0891B2', 
    bgColor: '#CFFAFE',
    label: 'Reminder',
  },
};

// ============ PROPS ============
export type NotificationCardProps = {
  notification: Notification;
  variant?: 'default' | 'compact';
  onPress?: () => void;
  onDismiss?: () => void;
  onActionPress?: (action: NotificationAction) => void;
  showActions?: boolean;
};

// ============ COMPONENT ============
export default function NotificationCard({
  notification,
  variant = 'default',
  onPress,
  onDismiss,
  onActionPress,
  showActions = false,
}: NotificationCardProps) {
  const config = typeConfig[notification.type];

  // ============ COMPACT VARIANT ============
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[
          styles.compactCard,
          !notification.read && styles.compactCardUnread,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.compactIcon, { backgroundColor: config.bgColor }]}>
          <SFSymbol name={config.icon} size={16} color={config.color} />
        </View>
        <View style={styles.compactContent}>
          <Text style={[
            styles.compactTitle,
            !notification.read && styles.unreadText,
          ]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.compactMessage} numberOfLines={1}>
            {notification.message}
          </Text>
        </View>
        <View style={styles.compactRight}>
          <Text style={styles.compactTime}>{notification.timestamp}</Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  }

  // ============ DEFAULT VARIANT ============
  return (
    <TouchableOpacity
      style={[
        styles.card,
        !notification.read && styles.cardUnread,
        notification.priority === 'high' && styles.cardHighPriority,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Unread Indicator */}
      {!notification.read && <View style={styles.unreadIndicator} />}

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <SFSymbol name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title,
              !notification.read && styles.unreadText,
            ]} numberOfLines={2}>
              {notification.title}
            </Text>
            {onDismiss && (
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={onDismiss}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <SFSymbol name="xmark" size={14} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.typeLabel, { color: config.color }]}>
              {config.label}
            </Text>
            <Text style={styles.timestamp}>{notification.timestamp}</Text>
          </View>
        </View>
      </View>

      {/* Message */}
      <Text style={styles.message}>{notification.message}</Text>

      {/* Metadata Display */}
      {notification.metadata?.amount !== undefined && (
        <View style={styles.metadataContainer}>
          <View style={[styles.metadataBadge, { backgroundColor: config.bgColor }]}>
            <SFSymbol name="dollarsign.circle.fill" size={14} color={config.color} />
            <Text style={[styles.metadataText, { color: config.color }]}>
              ${notification.metadata.amount.toLocaleString()}
            </Text>
          </View>
          {notification.metadata.category && (
            <View style={styles.metadataBadge}>
              <Text style={styles.metadataCategoryText}>
                {notification.metadata.category}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Progress Bar (for goals) */}
      {notification.metadata?.progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${notification.metadata.progress}%`, backgroundColor: config.color }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{notification.metadata.progress}%</Text>
        </View>
      )}

      {/* Actions */}
      {showActions && notification.actions && notification.actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {notification.actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                action.style === 'primary' && { backgroundColor: config.color },
                action.style === 'destructive' && { backgroundColor: '#DC2626' },
              ]}
              onPress={() => onActionPress?.(action)}
            >
              <Text style={[
                styles.actionButtonText,
                (action.style === 'primary' || action.style === 'destructive') && { color: '#FFFFFF' },
                (!action.style || action.style === 'secondary') && { color: config.color },
              ]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============ NOTIFICATION GROUP COMPONENT ============
export type NotificationGroupProps = {
  title: string;
  notifications: Notification[];
  onNotificationPress: (notification: Notification) => void;
  variant?: 'default' | 'compact';
};

export function NotificationGroup({
  title,
  notifications,
  onNotificationPress,
  variant = 'default',
}: NotificationGroupProps) {
  if (notifications.length === 0) return null;

  return (
    <View style={styles.groupContainer}>
      <Text style={styles.groupTitle}>{title}</Text>
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.notification_id}
          notification={notification}
          variant={variant}
          onPress={() => onNotificationPress(notification)}
        />
      ))}
    </View>
  );
}

// ============ EMPTY STATE COMPONENT ============
export function NotificationEmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <SFSymbol name="bell.slash" size={48} color="#C7C7CC" />
      </View>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>
        You're all caught up! We'll notify you when there's something important.
      </Text>
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
    position: 'relative',
    overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: '#FAFBFF',
  },
  cardHighPriority: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#2563EB',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    fontWeight: '500',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metadataCategoryText: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 36,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Compact Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  compactCardUnread: {
    backgroundColor: '#FAFBFF',
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  compactMessage: {
    fontSize: 13,
    color: '#8E8E93',
  },
  compactRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  compactTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  // Group
  groupContainer: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});