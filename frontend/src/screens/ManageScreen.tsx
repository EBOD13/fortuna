// src/screens/ManageScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Import reusable components
import TabSelector from '../components/navigation/TabSelector';
import {
  DependentCard,
  BillCard,
  SummaryCard,
  Dependent,
  Bill,
} from '../components/cards';

// Import the new IncomeCard - check the actual export
import IncomeCard from '../components/cards/IncomeCard';

import { RootStackParamList } from '../navigation/types';

// Import API hooks
import { useIncomes } from '../hooks/useIncome';

// ============ TYPES ============
type TabType = 'dependents' | 'bills' | 'income';

type AddOption = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  screen: keyof RootStackParamList;
};

// Define the type based on what IncomeCard actually expects
type IncomeCardItem = {
  id: string;
  name: string;
  source_kind: string;
  earning_model: string;
  rate_value: number | null;
  rate_unit: string | null;
  pay_frequency: string | null;
  amount_behavior: string;
  status: string;
  start_date: string;
  end_date: string | null;
  is_time_bound: boolean;
  default_allocation_mode: string;
  restricted_usage: boolean;
  priority_level: number;
  current_balance: number;
  // Add other fields that IncomeCard might need
};

// ============ ADD OPTIONS ============
const addOptions: AddOption[] = [
  {
    id: 'dependent',
    label: 'Add Dependent',
    subtitle: 'Child, spouse, parent, or pet',
    icon: 'person.2.fill',
    color: '#2563EB',
    screen: 'AddDependentScreen',
  },
  {
    id: 'bill',
    label: 'Add Bill',
    subtitle: 'Recurring bills and subscriptions',
    icon: 'doc.text.fill',
    color: '#F59E0B',
    screen: 'AddBillScreen',
  },
  {
    id: 'income',
    label: 'Add Income Source',
    subtitle: 'Employment, freelance, or passive',
    icon: 'dollarsign.circle.fill',
    color: '#046C4E',
    screen: 'AddIncomeScreen',
  },
];

// ============ HEADER COMPONENT ============
const AppHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity style={styles.headerButton}>
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

// ============ ADD DROPDOWN MODAL ============
type AddDropdownProps = {
  visible: boolean;
  onClose: () => void;
  defaultTab?: TabType;
};

const AddDropdown = ({ visible, onClose, defaultTab }: AddDropdownProps) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleSelect = (option: AddOption) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(option.screen as any);
    }, 100);
  };

  const getOrderedOptions = () => {
    if (!defaultTab) return addOptions;
    
    const tabToOptionId: Record<TabType, string> = {
      dependents: 'dependent',
      bills: 'bill',
      income: 'income',
    };
    
    const preferredId = tabToOptionId[defaultTab];
    const preferred = addOptions.find(o => o.id === preferredId);
    const others = addOptions.filter(o => o.id !== preferredId);
    
    return preferred ? [preferred, ...others] : addOptions;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add New</Text>
          
          <View style={styles.modalList}>
            {getOrderedOptions().map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.modalOption,
                  index === 0 && styles.modalOptionFirst,
                ]}
                onPress={() => handleSelect(option)}
                activeOpacity={0.7}
              >
                <View style={[styles.modalOptionIcon, { backgroundColor: option.color + '15' }]}>
                  <SFSymbol name={option.icon} size={24} color={option.color} />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionLabel}>{option.label}</Text>
                  <Text style={styles.modalOptionSubtitle}>{option.subtitle}</Text>
                </View>
                <SFSymbol name="chevron.right" size={16} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ============ TABS CONFIG ============
const tabs = [
  { id: 'dependents', label: 'Dependents', icon: 'person.2.fill' },
  { id: 'bills', label: 'Bills', icon: 'doc.text.fill' },
  { id: 'income', label: 'Income', icon: 'dollarsign.circle.fill' },
];

// ============ MAIN COMPONENT ============
export default function ManageScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<TabType>('income');
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Fetch income data
  const { data: apiIncome = [], isLoading: incomeLoading } = useIncomes();

  // Transform API data to match IncomeCard expectations
  const income: IncomeCardItem[] = apiIncome.map(i => ({
    id: i.id || '',
    name: i.name || 'Unnamed Income',
    source_kind: i.source_kind || 'other',
    earning_model: i.earning_model || 'fixed',
    rate_value: i.rate_value || null,
    rate_unit: i.rate_unit || null,
    pay_frequency: i.pay_frequency || null,
    amount_behavior: i.amount_behavior || 'fixed',
    status: i.status || 'active',
    start_date: i.start_date || new Date().toISOString().split('T')[0],
    end_date: i.end_date || null,
    is_time_bound: i.is_time_bound || false,
    default_allocation_mode: i.default_allocation_mode || 'spend',
    restricted_usage: i.restricted_usage || false,
    priority_level: i.priority_level || 5,
    current_balance: i.current_balance || 0,
  }));

  // Determine loading state
  const loading = activeTab === 'income' ? incomeLoading : false;

  // Calculate summary data
  const getSummaryData = () => {
    switch (activeTab) {
      case 'dependents':
        return {
          title: 'Monthly Dependent Costs',
          mainValue: '$0',
          subtitle: 'Coming soon',
          icon: 'person.2.fill',
          color: '#2563EB',
        };
      case 'bills':
        return {
          title: 'Monthly Bills',
          mainValue: '$0',
          subtitle: 'Coming soon',
          icon: 'doc.text.fill',
          color: '#F59E0B',
        };
      case 'income':
        // Calculate total monthly income
        const totalIncome = income.reduce((sum, i) => {
          const base = i.rate_value || 0;
          return sum + base;
        }, 0);
        
        // Calculate guaranteed income (fixed amount behavior)
        const guaranteedIncome = income
          .filter(i => i.amount_behavior === 'fixed')
          .reduce((sum, i) => {
            const base = i.rate_value || 0;
            return sum + base;
          }, 0);
          
        return {
          title: 'Monthly Income',
          mainValue: `$${totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          subtitle: `Guaranteed: $${guaranteedIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          icon: 'dollarsign.circle.fill',
          color: '#046C4E',
        };
    }
  };

  const summaryData = getSummaryData();

  // Handle card press
  const handleIncomePress = (item: IncomeCardItem) => {
    navigation.navigate('IncomeDetailScreen', { incomeId: item.id });
  };

  // Get section title
  const getSectionTitle = () => {
    switch (activeTab) {
      case 'dependents':
        return 'Your Dependents';
      case 'bills':
        return 'Upcoming Bills';
      case 'income':
        return 'Income Sources';
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
        </View>
      );
    }

    switch (activeTab) {
      case 'dependents':
        return (
          <View style={styles.comingSoonContainer}>
            <SFSymbol name="person.2.fill" size={48} color="#C7C7CC" />
            <Text style={styles.comingSoonText}>Dependents coming soon</Text>
          </View>
        );
      case 'bills':
        return (
          <View style={styles.comingSoonContainer}>
            <SFSymbol name="doc.text.fill" size={48} color="#C7C7CC" />
            <Text style={styles.comingSoonText}>Bills coming soon</Text>
          </View>
        );
      case 'income':
        return (
          <FlatList
            data={income}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              // Check if IncomeCard expects specific props
              // Try different prop names based on what the component actually needs
              const propsToPass: any = {
                item: item,
                onPress: () => handleIncomePress(item),
              };
              
              return <IncomeCard {...propsToPass} />;
            }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <SFSymbol name="dollarsign.circle" size={48} color="#C7C7CC" />
                <Text style={styles.emptyText}>No income sources added yet</Text>
                <TouchableOpacity 
                  style={styles.addFirstButton}
                  onPress={() => setAddModalVisible(true)}
                >
                  <Text style={styles.addFirstButtonText}>Add your first income source</Text>
                </TouchableOpacity>
              </View>
            }
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader />

      <View style={styles.content}>
        {/* Tab Selector */}
        <TabSelector
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        />

        {/* Summary Card */}
        <SummaryCard
          title={summaryData.title}
          mainValue={summaryData.mainValue}
          subtitle={summaryData.subtitle}
          icon={summaryData.icon}
          color={summaryData.color}
        />

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setAddModalVisible(true)}
          >
            <SFSymbol name="plus.circle.fill" size={30} color="#046C4E" />
          </TouchableOpacity>
        </View>

        {/* List Content */}
        {renderContent()}
      </View>

      {/* Add Dropdown Modal */}
      <AddDropdown
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        defaultTab={activeTab}
      />
    </View>
  );
}

// ============ STYLES ============
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
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  addFirstButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#046C4E',
    borderRadius: 12,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 16,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalList: {
    paddingHorizontal: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalOptionFirst: {
    backgroundColor: '#F8F8F8',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  modalOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  modalOptionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 3,
  },
  cancelButton: {
    marginTop: 20,
    marginHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
});