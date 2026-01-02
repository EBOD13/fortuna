// components/AddMenu.tsx
/**
 * Add Menu - iOS-style bottom sheet for quick actions
 * 
 * Usage:
 * <AddMenu
 *   visible={showMenu}
 *   onClose={() => setShowMenu(false)}
 *   onSelect={(action) => handleAction(action)}
 * />
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

// Types
export type AddMenuAction = 
  | 'log_income'
  | 'log_expense'
  | 'update_goal'
  | 'make_payment';

export interface AddMenuItem {
  id: AddMenuAction;
  title: string;
  subtitle: string;
  icon: string;
}

// Menu items configuration
const MENU_ITEMS: AddMenuItem[] = [
  {
    id: 'log_income',
    title: 'Log Income',
    subtitle: 'Record earnings from work or other sources',
    icon: '💵',
  },
  {
    id: 'log_expense',
    title: 'Log Expense',
    subtitle: 'Track a purchase with emotional context',
    icon: '💳',
  },
  {
    id: 'update_goal',
    title: 'Update Goal',
    subtitle: 'Add money to your savings goals',
    icon: '🎯',
  },
  {
    id: 'make_payment',
    title: 'Make a Payment',
    subtitle: 'Pay a bill or recurring expense',
    icon: '📝',
  },
];

interface AddMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: AddMenuAction) => void;
}

export const AddMenu: React.FC<AddMenuProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Quick Actions</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index === MENU_ITEMS.length - 1 && styles.menuItemLast,
                ]}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Safe area spacer for iPhone */}
          <View style={styles.safeAreaSpacer} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// Floating Add Button for Tab Bar
interface AddButtonProps {
  onPress: () => void;
}

export const AddButton: React.FC<AddButtonProps> = ({ onPress }) => (
  <TouchableOpacity style={styles.addButton} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.addButtonText}>+</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },

  // Bottom Sheet
  sheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Handle
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.charcoal[50],
    borderRadius: 2,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  title: {
    ...typography.title.medium,
    color: colors.text.primary,
  },
  closeText: {
    ...typography.body.medium,
    color: colors.text.muted,
  },

  // Menu Container
  menuContainer: {
    paddingTop: spacing.md,
  },

  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.dark,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },

  // Menu Icon
  menuIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuIcon: {
    fontSize: 24,
  },

  // Menu Content
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...typography.title.small,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.text.muted,
  },

  // Chevron
  chevron: {
    fontSize: 24,
    color: colors.text.muted,
  },

  // Safe Area Spacer (for iPhone home indicator)
  safeAreaSpacer: {
    height: 34,
  },

  // Floating Add Button
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.emerald[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.emerald,
  },
  addButtonText: {
    fontSize: 32,
    color: colors.text.primary,
    fontWeight: '300',
    marginTop: -2,
  },
});