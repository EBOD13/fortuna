// src/components/modals/FilterSheet.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============ TYPES ============
export type DateRangeOption = 
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | 'last_week' 
  | 'this_month' 
  | 'last_month' 
  | 'last_30_days'
  | 'last_90_days'
  | 'this_year' 
  | 'custom';

export type ExpenseCategoryFilter = 
  | 'all'
  | 'food' 
  | 'dining' 
  | 'groceries' 
  | 'transport' 
  | 'entertainment' 
  | 'shopping' 
  | 'utilities' 
  | 'healthcare' 
  | 'education' 
  | 'personal' 
  | 'gifts' 
  | 'travel' 
  | 'subscriptions'
  | 'housing'
  | 'insurance'
  | 'childcare'
  | 'pets'
  | 'fitness'
  | 'beauty'
  | 'other';

export type EmotionFilter = 
  | 'all'
  | 'happy' 
  | 'excited' 
  | 'content' 
  | 'neutral' 
  | 'stressed' 
  | 'anxious' 
  | 'sad' 
  | 'frustrated' 
  | 'guilty' 
  | 'impulsive'
  | 'bored'
  | 'celebratory';

export type SortOption = 
  | 'date_desc' 
  | 'date_asc' 
  | 'amount_desc' 
  | 'amount_asc' 
  | 'category';

export type ExpenseTypeFilter = 'all' | 'planned' | 'impulse' | 'need' | 'want' | 'recurring';

export type FilterState = {
  dateRange: DateRangeOption;
  customStartDate?: string;
  customEndDate?: string;
  categories: ExpenseCategoryFilter[];
  emotions: EmotionFilter[];
  expenseTypes: ExpenseTypeFilter[];
  minAmount?: number;
  maxAmount?: number;
  sortBy: SortOption;
  searchQuery?: string;
};

export type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
  showEmotions?: boolean;
  showExpenseTypes?: boolean;
  showAmountRange?: boolean;
  showSearch?: boolean;
  title?: string;
};

// ============ CONFIG ============
const dateRangeOptions: { value: DateRangeOption; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const categoryOptions: { value: ExpenseCategoryFilter; label: string; icon: string; color: string }[] = [
  { value: 'all', label: 'All', icon: 'square.grid.2x2.fill', color: '#6B7280' },
  { value: 'food', label: 'Food', icon: 'fork.knife', color: '#F59E0B' },
  { value: 'dining', label: 'Dining', icon: 'fork.knife.circle.fill', color: '#F97316' },
  { value: 'groceries', label: 'Groceries', icon: 'cart.fill', color: '#84CC16' },
  { value: 'transport', label: 'Transport', icon: 'car.fill', color: '#3B82F6' },
  { value: 'entertainment', label: 'Entertainment', icon: 'film.fill', color: '#8B5CF6' },
  { value: 'shopping', label: 'Shopping', icon: 'bag.fill', color: '#EC4899' },
  { value: 'utilities', label: 'Utilities', icon: 'bolt.fill', color: '#F59E0B' },
  { value: 'healthcare', label: 'Healthcare', icon: 'heart.fill', color: '#EF4444' },
  { value: 'education', label: 'Education', icon: 'book.fill', color: '#6366F1' },
  { value: 'personal', label: 'Personal', icon: 'person.fill', color: '#14B8A6' },
  { value: 'gifts', label: 'Gifts', icon: 'gift.fill', color: '#F472B6' },
  { value: 'travel', label: 'Travel', icon: 'airplane', color: '#0EA5E9' },
  { value: 'subscriptions', label: 'Subscriptions', icon: 'repeat', color: '#7C3AED' },
  { value: 'housing', label: 'Housing', icon: 'house.fill', color: '#78716C' },
  { value: 'childcare', label: 'Childcare', icon: 'figure.and.child.holdinghands', color: '#FB923C' },
  { value: 'pets', label: 'Pets', icon: 'pawprint.fill', color: '#A78BFA' },
  { value: 'fitness', label: 'Fitness', icon: 'figure.run', color: '#22C55E' },
  { value: 'other', label: 'Other', icon: 'ellipsis.circle.fill', color: '#6B7280' },
];

const emotionOptions: { value: EmotionFilter; label: string; emoji: string; color: string }[] = [
  { value: 'all', label: 'All', emoji: '🔘', color: '#6B7280' },
  { value: 'happy', label: 'Happy', emoji: '😊', color: '#22C55E' },
  { value: 'excited', label: 'Excited', emoji: '🤩', color: '#F59E0B' },
  { value: 'content', label: 'Content', emoji: '😌', color: '#14B8A6' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#6B7280' },
  { value: 'stressed', label: 'Stressed', emoji: '😰', color: '#EF4444' },
  { value: 'anxious', label: 'Anxious', emoji: '😟', color: '#F97316' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: '#3B82F6' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤', color: '#DC2626' },
  { value: 'guilty', label: 'Guilty', emoji: '😔', color: '#7C3AED' },
  { value: 'impulsive', label: 'Impulsive', emoji: '🙈', color: '#EC4899' },
  { value: 'bored', label: 'Bored', emoji: '😑', color: '#9CA3AF' },
  { value: 'celebratory', label: 'Celebratory', emoji: '🎉', color: '#FBBF24' },
];

const expenseTypeOptions: { value: ExpenseTypeFilter; label: string; icon: string; color: string }[] = [
  { value: 'all', label: 'All Types', icon: 'square.grid.2x2.fill', color: '#6B7280' },
  { value: 'planned', label: 'Planned', icon: 'checkmark.circle.fill', color: '#046C4E' },
  { value: 'impulse', label: 'Impulse', icon: 'bolt.fill', color: '#DC2626' },
  { value: 'need', label: 'Needs', icon: 'star.fill', color: '#2563EB' },
  { value: 'want', label: 'Wants', icon: 'sparkles', color: '#F59E0B' },
  { value: 'recurring', label: 'Recurring', icon: 'repeat', color: '#7C3AED' },
];

const sortOptions: { value: SortOption; label: string; icon: string }[] = [
  { value: 'date_desc', label: 'Newest First', icon: 'arrow.down' },
  { value: 'date_asc', label: 'Oldest First', icon: 'arrow.up' },
  { value: 'amount_desc', label: 'Highest Amount', icon: 'arrow.down' },
  { value: 'amount_asc', label: 'Lowest Amount', icon: 'arrow.up' },
  { value: 'category', label: 'By Category', icon: 'folder.fill' },
];

const defaultFilters: FilterState = {
  dateRange: 'this_month',
  categories: ['all'],
  emotions: ['all'],
  expenseTypes: ['all'],
  sortBy: 'date_desc',
};

// ============ COMPONENT ============
export default function FilterSheet({
  visible,
  onClose,
  onApply,
  initialFilters,
  showEmotions = true,
  showExpenseTypes = true,
  showAmountRange = true,
  showSearch = true,
  title = 'Filter Expenses',
}: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    ...initialFilters,
  });
  
  const [expandedSection, setExpandedSection] = useState<string | null>('date');

  useEffect(() => {
    if (visible && initialFilters) {
      setFilters({ ...defaultFilters, ...initialFilters });
    }
  }, [visible, initialFilters]);

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleCategory = (category: ExpenseCategoryFilter) => {
    if (category === 'all') {
      setFilters(prev => ({ ...prev, categories: ['all'] }));
    } else {
      setFilters(prev => {
        const current = prev.categories.filter(c => c !== 'all');
        const exists = current.includes(category);
        const updated = exists 
          ? current.filter(c => c !== category)
          : [...current, category];
        return { ...prev, categories: updated.length === 0 ? ['all'] : updated };
      });
    }
  };

  const toggleEmotion = (emotion: EmotionFilter) => {
    if (emotion === 'all') {
      setFilters(prev => ({ ...prev, emotions: ['all'] }));
    } else {
      setFilters(prev => {
        const current = prev.emotions.filter(e => e !== 'all');
        const exists = current.includes(emotion);
        const updated = exists 
          ? current.filter(e => e !== emotion)
          : [...current, emotion];
        return { ...prev, emotions: updated.length === 0 ? ['all'] : updated };
      });
    }
  };

  const toggleExpenseType = (type: ExpenseTypeFilter) => {
    if (type === 'all') {
      setFilters(prev => ({ ...prev, expenseTypes: ['all'] }));
    } else {
      setFilters(prev => {
        const current = prev.expenseTypes.filter(t => t !== 'all');
        const exists = current.includes(type);
        const updated = exists 
          ? current.filter(t => t !== type)
          : [...current, type];
        return { ...prev, expenseTypes: updated.length === 0 ? ['all'] : updated };
      });
    }
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.dateRange !== 'this_month') count++;
    if (!filters.categories.includes('all')) count += filters.categories.length;
    if (!filters.emotions.includes('all')) count += filters.emotions.length;
    if (!filters.expenseTypes.includes('all')) count += filters.expenseTypes.length;
    if (filters.minAmount !== undefined) count++;
    if (filters.maxAmount !== undefined) count++;
    if (filters.searchQuery) count++;
    if (filters.sortBy !== 'date_desc') count++;
    return count;
  };

  // ============ SECTION HEADER ============
  const SectionHeader = ({ 
    title, 
    icon, 
    section,
    badge,
  }: { 
    title: string; 
    icon: string; 
    section: string;
    badge?: number;
  }) => (
    <TouchableOpacity 
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <SFSymbol name={icon} size={18} color="#000" />
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
        {badge !== undefined && badge > 0 && (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <SFSymbol 
        name={expandedSection === section ? 'chevron.up' : 'chevron.down'} 
        size={14} 
        color="#8E8E93" 
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{title}</Text>
            {getActiveFilterCount() > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{getActiveFilterCount()}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={handleReset}>
            <Text style={styles.headerResetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Search */}
          {showSearch && (
            <View style={styles.searchSection}>
              <View style={styles.searchInputContainer}>
                <SFSymbol name="magnifyingglass" size={16} color="#8E8E93" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search expenses..."
                  placeholderTextColor="#C7C7CC"
                  value={filters.searchQuery || ''}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, searchQuery: text }))}
                />
                {filters.searchQuery && (
                  <TouchableOpacity 
                    onPress={() => setFilters(prev => ({ ...prev, searchQuery: undefined }))}
                  >
                    <SFSymbol name="xmark.circle.fill" size={16} color="#C7C7CC" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Date Range */}
          <View style={styles.section}>
            <SectionHeader 
              title="Date Range" 
              icon="calendar" 
              section="date"
              badge={filters.dateRange !== 'this_month' ? 1 : 0}
            />
            {expandedSection === 'date' && (
              <View style={styles.sectionContent}>
                <View style={styles.optionsGrid}>
                  {dateRangeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dateOption,
                        filters.dateRange === option.value && styles.dateOptionSelected,
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, dateRange: option.value }))}
                    >
                      <Text style={[
                        styles.dateOptionText,
                        filters.dateRange === option.value && styles.dateOptionTextSelected,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {filters.dateRange === 'custom' && (
                  <View style={styles.customDateRow}>
                    <View style={styles.customDateInput}>
                      <Text style={styles.customDateLabel}>From</Text>
                      <TextInput
                        style={styles.customDateField}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor="#C7C7CC"
                        value={filters.customStartDate || ''}
                        onChangeText={(text) => setFilters(prev => ({ ...prev, customStartDate: text }))}
                      />
                    </View>
                    <View style={styles.customDateInput}>
                      <Text style={styles.customDateLabel}>To</Text>
                      <TextInput
                        style={styles.customDateField}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor="#C7C7CC"
                        value={filters.customEndDate || ''}
                        onChangeText={(text) => setFilters(prev => ({ ...prev, customEndDate: text }))}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <SectionHeader 
              title="Categories" 
              icon="folder.fill" 
              section="categories"
              badge={filters.categories.includes('all') ? 0 : filters.categories.length}
            />
            {expandedSection === 'categories' && (
              <View style={styles.sectionContent}>
                <View style={styles.chipGrid}>
                  {categoryOptions.map((option) => {
                    const isSelected = filters.categories.includes(option.value);
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.chip,
                          isSelected && { backgroundColor: option.color + '20', borderColor: option.color },
                        ]}
                        onPress={() => toggleCategory(option.value)}
                      >
                        <SFSymbol 
                          name={option.icon} 
                          size={14} 
                          color={isSelected ? option.color : '#8E8E93'} 
                        />
                        <Text style={[
                          styles.chipText,
                          isSelected && { color: option.color },
                        ]}>
                          {option.label}
                        </Text>
                        {isSelected && option.value !== 'all' && (
                          <SFSymbol name="checkmark" size={12} color={option.color} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Emotions */}
          {showEmotions && (
            <View style={styles.section}>
              <SectionHeader 
                title="Emotions" 
                icon="heart.fill" 
                section="emotions"
                badge={filters.emotions.includes('all') ? 0 : filters.emotions.length}
              />
              {expandedSection === 'emotions' && (
                <View style={styles.sectionContent}>
                  <View style={styles.chipGrid}>
                    {emotionOptions.map((option) => {
                      const isSelected = filters.emotions.includes(option.value);
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.chip,
                            isSelected && { backgroundColor: option.color + '20', borderColor: option.color },
                          ]}
                          onPress={() => toggleEmotion(option.value)}
                        >
                          <Text style={styles.chipEmoji}>{option.emoji}</Text>
                          <Text style={[
                            styles.chipText,
                            isSelected && { color: option.color },
                          ]}>
                            {option.label}
                          </Text>
                          {isSelected && option.value !== 'all' && (
                            <SFSymbol name="checkmark" size={12} color={option.color} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Expense Types */}
          {showExpenseTypes && (
            <View style={styles.section}>
              <SectionHeader 
                title="Expense Type" 
                icon="tag.fill" 
                section="types"
                badge={filters.expenseTypes.includes('all') ? 0 : filters.expenseTypes.length}
              />
              {expandedSection === 'types' && (
                <View style={styles.sectionContent}>
                  <View style={styles.chipGrid}>
                    {expenseTypeOptions.map((option) => {
                      const isSelected = filters.expenseTypes.includes(option.value);
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.chip,
                            isSelected && { backgroundColor: option.color + '20', borderColor: option.color },
                          ]}
                          onPress={() => toggleExpenseType(option.value)}
                        >
                          <SFSymbol 
                            name={option.icon} 
                            size={14} 
                            color={isSelected ? option.color : '#8E8E93'} 
                          />
                          <Text style={[
                            styles.chipText,
                            isSelected && { color: option.color },
                          ]}>
                            {option.label}
                          </Text>
                          {isSelected && option.value !== 'all' && (
                            <SFSymbol name="checkmark" size={12} color={option.color} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Amount Range */}
          {showAmountRange && (
            <View style={styles.section}>
              <SectionHeader 
                title="Amount Range" 
                icon="dollarsign.circle.fill" 
                section="amount"
                badge={(filters.minAmount !== undefined || filters.maxAmount !== undefined) ? 1 : 0}
              />
              {expandedSection === 'amount' && (
                <View style={styles.sectionContent}>
                  <View style={styles.amountRow}>
                    <View style={styles.amountInput}>
                      <Text style={styles.amountLabel}>Min</Text>
                      <View style={styles.amountFieldContainer}>
                        <Text style={styles.amountPrefix}>$</Text>
                        <TextInput
                          style={styles.amountField}
                          placeholder="0"
                          placeholderTextColor="#C7C7CC"
                          keyboardType="numeric"
                          value={filters.minAmount?.toString() || ''}
                          onChangeText={(text) => {
                            const num = parseFloat(text);
                            setFilters(prev => ({ 
                              ...prev, 
                              minAmount: isNaN(num) ? undefined : num 
                            }));
                          }}
                        />
                      </View>
                    </View>
                    <View style={styles.amountDivider}>
                      <Text style={styles.amountDividerText}>to</Text>
                    </View>
                    <View style={styles.amountInput}>
                      <Text style={styles.amountLabel}>Max</Text>
                      <View style={styles.amountFieldContainer}>
                        <Text style={styles.amountPrefix}>$</Text>
                        <TextInput
                          style={styles.amountField}
                          placeholder="∞"
                          placeholderTextColor="#C7C7CC"
                          keyboardType="numeric"
                          value={filters.maxAmount?.toString() || ''}
                          onChangeText={(text) => {
                            const num = parseFloat(text);
                            setFilters(prev => ({ 
                              ...prev, 
                              maxAmount: isNaN(num) ? undefined : num 
                            }));
                          }}
                        />
                      </View>
                    </View>
                  </View>
                  
                  {/* Quick Amount Presets */}
                  <View style={styles.amountPresets}>
                    {[
                      { min: 0, max: 25, label: 'Under $25' },
                      { min: 25, max: 50, label: '$25-$50' },
                      { min: 50, max: 100, label: '$50-$100' },
                      { min: 100, max: undefined, label: '$100+' },
                    ].map((preset, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.amountPreset,
                          filters.minAmount === preset.min && filters.maxAmount === preset.max && 
                            styles.amountPresetSelected,
                        ]}
                        onPress={() => setFilters(prev => ({ 
                          ...prev, 
                          minAmount: preset.min, 
                          maxAmount: preset.max 
                        }))}
                      >
                        <Text style={[
                          styles.amountPresetText,
                          filters.minAmount === preset.min && filters.maxAmount === preset.max && 
                            styles.amountPresetTextSelected,
                        ]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Sort By */}
          <View style={styles.section}>
            <SectionHeader 
              title="Sort By" 
              icon="arrow.up.arrow.down" 
              section="sort"
              badge={filters.sortBy !== 'date_desc' ? 1 : 0}
            />
            {expandedSection === 'sort' && (
              <View style={styles.sectionContent}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      filters.sortBy === option.value && styles.sortOptionSelected,
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
                  >
                    <View style={styles.sortOptionLeft}>
                      <SFSymbol 
                        name={option.icon} 
                        size={16} 
                        color={filters.sortBy === option.value ? '#046C4E' : '#8E8E93'} 
                      />
                      <Text style={[
                        styles.sortOptionText,
                        filters.sortBy === option.value && styles.sortOptionTextSelected,
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                    {filters.sortBy === option.value && (
                      <SFSymbol name="checkmark" size={16} color="#046C4E" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={handleApply}
          >
            <SFSymbol name="line.3.horizontal.decrease" size={18} color="#FFFFFF" />
            <Text style={styles.applyButtonText}>
              Apply Filters
              {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============ FILTER BUTTON ============
export type FilterButtonProps = {
  onPress: () => void;
  activeCount?: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
};

export function FilterButton({ 
  onPress, 
  activeCount = 0, 
  label,
  size = 'medium',
}: FilterButtonProps) {
  const sizeConfig = {
    small: { padding: 6, iconSize: 14, fontSize: 12 },
    medium: { padding: 10, iconSize: 16, fontSize: 14 },
    large: { padding: 14, iconSize: 18, fontSize: 16 },
  };
  const config = sizeConfig[size];

  return (
    <TouchableOpacity 
      style={[
        styles.filterButton,
        { paddingHorizontal: config.padding, paddingVertical: config.padding - 2 },
        activeCount > 0 && styles.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <SFSymbol 
        name="line.3.horizontal.decrease" 
        size={config.iconSize} 
        color={activeCount > 0 ? '#046C4E' : '#6B7280'} 
      />
      {label && (
        <Text style={[
          styles.filterButtonText,
          { fontSize: config.fontSize },
          activeCount > 0 && styles.filterButtonTextActive,
        ]}>
          {label}
        </Text>
      )}
      {activeCount > 0 && (
        <View style={styles.filterButtonBadge}>
          <Text style={styles.filterButtonBadgeText}>{activeCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============ ACTIVE FILTERS BAR ============
export type ActiveFiltersBarProps = {
  filters: FilterState;
  onRemoveFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
};

export function ActiveFiltersBar({ 
  filters, 
  onRemoveFilter, 
  onClearAll,
}: ActiveFiltersBarProps) {
  const activeFilters: { type: string; label: string; value?: string }[] = [];

  if (filters.dateRange !== 'this_month') {
    const dateOption = dateRangeOptions.find(o => o.value === filters.dateRange);
    activeFilters.push({ type: 'dateRange', label: dateOption?.label || filters.dateRange });
  }

  if (!filters.categories.includes('all')) {
    filters.categories.forEach(cat => {
      const catOption = categoryOptions.find(o => o.value === cat);
      activeFilters.push({ type: 'category', label: catOption?.label || cat, value: cat });
    });
  }

  if (!filters.emotions.includes('all')) {
    filters.emotions.forEach(emotion => {
      const emotionOption = emotionOptions.find(o => o.value === emotion);
      activeFilters.push({ type: 'emotion', label: emotionOption?.emoji + ' ' + emotionOption?.label, value: emotion });
    });
  }

  if (!filters.expenseTypes.includes('all')) {
    filters.expenseTypes.forEach(type => {
      const typeOption = expenseTypeOptions.find(o => o.value === type);
      activeFilters.push({ type: 'expenseType', label: typeOption?.label || type, value: type });
    });
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    const label = filters.maxAmount !== undefined 
      ? `$${filters.minAmount || 0} - $${filters.maxAmount}`
      : `$${filters.minAmount}+`;
    activeFilters.push({ type: 'amount', label });
  }

  if (filters.searchQuery) {
    activeFilters.push({ type: 'search', label: `"${filters.searchQuery}"` });
  }

  if (activeFilters.length === 0) return null;

  return (
    <View style={styles.activeFiltersBar}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.activeFiltersContent}
      >
        {activeFilters.map((filter, index) => (
          <TouchableOpacity
            key={`${filter.type}-${filter.value || index}`}
            style={styles.activeFilterChip}
            onPress={() => onRemoveFilter(filter.type, filter.value)}
          >
            <Text style={styles.activeFilterText}>{filter.label}</Text>
            <SFSymbol name="xmark" size={10} color="#6B7280" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.clearAllButton}
          onPress={onClearAll}
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerResetText: {
    fontSize: 17,
    color: '#DC2626',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerBadge: {
    backgroundColor: '#046C4E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },

  // Search
  searchSection: {
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },

  // Sections
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sectionBadge: {
    backgroundColor: '#046C4E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionContent: {
    padding: 14,
    paddingTop: 0,
  },

  // Date Options
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateOptionSelected: {
    backgroundColor: '#046C4E15',
    borderColor: '#046C4E',
  },
  dateOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateOptionTextSelected: {
    color: '#046C4E',
    fontWeight: '600',
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  customDateInput: {
    flex: 1,
  },
  customDateLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  customDateField: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000',
  },

  // Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  chipEmoji: {
    fontSize: 14,
  },

  // Amount
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  amountInput: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  amountFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  amountPrefix: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 4,
  },
  amountField: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  amountDivider: {
    paddingBottom: 10,
  },
  amountDividerText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  amountPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  amountPreset: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  amountPresetSelected: {
    backgroundColor: '#046C4E15',
  },
  amountPresetText: {
    fontSize: 13,
    color: '#6B7280',
  },
  amountPresetTextSelected: {
    color: '#046C4E',
    fontWeight: '600',
  },

  // Sort
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  sortOptionSelected: {
    backgroundColor: '#046C4E08',
    marginHorizontal: -14,
    paddingHorizontal: 14,
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortOptionText: {
    fontSize: 15,
    color: '#000',
  },
  sortOptionTextSelected: {
    color: '#046C4E',
    fontWeight: '600',
  },

  // Footer
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#046C4E',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Filter Button
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#046C4E15',
  },
  filterButtonText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#046C4E',
  },
  filterButtonBadge: {
    backgroundColor: '#046C4E',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  filterButtonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Active Filters Bar
  activeFiltersBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  activeFiltersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 13,
    color: '#6B7280',
  },
  clearAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
});