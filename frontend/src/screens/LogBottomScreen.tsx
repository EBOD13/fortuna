// src/screens/LogScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActionSheetIOS,
  Platform,
  Modal,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Header Component (same as other screens)
const AppHeader = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity style={styles.headerButton}>
        <SFSymbol name="bell" size={22} color="#000" />
      </TouchableOpacity>
      
      <Text style={styles.appName}>Fortuna</Text>
      
      <TouchableOpacity style={styles.headerButton}>
        <SFSymbol name="person.circle" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

// Menu option type
type MenuOption = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
};

const menuOptions: MenuOption[] = [
  {
    id: 'income',
    title: 'Log Income',
    subtitle: 'Record earnings from work or other sources',
    icon: 'dollarsign.circle.fill',
    color: '#046C4E',
  },
  {
    id: 'expense',
    title: 'Add Expense',
    subtitle: 'Track spending with emotional insights',
    icon: 'cart.fill',
    color: '#DC2626',
  },
  {
    id: 'goal',
    title: 'Update Goal',
    subtitle: 'Add money towards a savings goal',
    icon: 'target',
    color: '#2563EB',
  },
  {
    id: 'payment',
    title: 'Make Payment',
    subtitle: 'Pay a bill or category expense',
    icon: 'creditcard.fill',
    color: '#7C3AED',
  },
];

export default function LogScreen() {
  const [showAndroidSheet, setShowAndroidSheet] = useState(false);
  const insets = useSafeAreaInsets();

  const handleOptionSelect = (optionId: string) => {
    switch (optionId) {
      case 'income':
        console.log('Navigate to Log Income screen');
        // TODO: Navigate to income logging screen
        break;
      case 'expense':
        console.log('Navigate to Add Expense screen (with emotional questions)');
        // TODO: Navigate to expense screen with emotional tracking
        break;
      case 'goal':
        console.log('Navigate to Update Goal screen');
        // TODO: Navigate to goal update screen
        break;
      case 'payment':
        console.log('Navigate to Make Payment screen');
        // TODO: Navigate to payment screen
        break;
    }
    setShowAndroidSheet(false);
  };

  const showActionSheet = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            'Cancel',
            '💵  Log Income',
            '🛒  Add Expense',
            '🎯  Update Goal',
            '💳  Make Payment',
          ],
          cancelButtonIndex: 0,
          title: 'What would you like to log?',
          message: 'Choose an action to record your financial activity',
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              handleOptionSelect('income');
              break;
            case 2:
              handleOptionSelect('expense');
              break;
            case 3:
              handleOptionSelect('goal');
              break;
            case 4:
              handleOptionSelect('payment');
              break;
          }
        }
      );
    } else {
      // Show custom modal for Android
      setShowAndroidSheet(true);
    }
  };

  // Custom bottom sheet for Android (iOS uses native ActionSheet)
  const AndroidBottomSheet = () => (
    <Modal
      visible={showAndroidSheet}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAndroidSheet(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowAndroidSheet(false)}
      >
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.sheetHandle} />
          
          <Text style={styles.sheetTitle}>What would you like to log?</Text>
          <Text style={styles.sheetMessage}>
            Choose an action to record your financial activity
          </Text>

          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.sheetOption}
              onPress={() => handleOptionSelect(option.id)}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color + '15' }]}>
                <SFSymbol name={option.icon} size={24} color={option.color} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <SFSymbol name="chevron.right" size={16} color="#8E8E93" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowAndroidSheet(false)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <AppHeader />
      
      <View style={styles.content}>
        {/* Main Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={showActionSheet}>
          <View style={styles.addButtonInner}>
            <SFSymbol name="plus.circle.fill" size={64} color="#046C4E" />
          </View>
          <Text style={styles.addButtonText}>Tap to Log</Text>
          <Text style={styles.addButtonSubtext}>
            Income, expenses, goals & payments
          </Text>
        </TouchableOpacity>

        {/* Quick action cards */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            {menuOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.quickActionCard}
                onPress={() => handleOptionSelect(option.id)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: option.color + '15' }]}>
                  <SFSymbol name={option.icon} size={28} color={option.color} />
                </View>
                <Text style={styles.quickActionText}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Android Bottom Sheet */}
      <AndroidBottomSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  addButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  addButtonSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  quickActions: {
    marginTop: 32,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  // Modal / Bottom Sheet styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  sheetMessage: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  cancelButton: {
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#DC2626',
  },
});