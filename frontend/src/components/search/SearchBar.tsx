// src/components/search/SearchBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Keyboard,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============ TYPES ============
export type SearchCategory = 
  | 'all' 
  | 'expenses' 
  | 'goals' 
  | 'budgets' 
  | 'bills' 
  | 'income' 
  | 'dependents'
  | 'categories';

export type SearchResultType = 
  | 'expense' 
  | 'goal' 
  | 'budget' 
  | 'bill' 
  | 'income' 
  | 'dependent'
  | 'category'
  | 'suggestion';

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  amount?: number;
  date?: string;
  metadata?: Record<string, any>;
};

export type RecentSearch = {
  id: string;
  query: string;
  category?: SearchCategory;
  timestamp: string;
};

export type SearchSuggestion = {
  id: string;
  text: string;
  category?: SearchCategory;
  icon?: string;
};

// ============ CONFIG ============
const categoryConfig: Record<SearchCategory, { label: string; icon: string; color: string }> = {
  all: { label: 'All', icon: 'magnifyingglass', color: '#6B7280' },
  expenses: { label: 'Expenses', icon: 'creditcard.fill', color: '#DC2626' },
  goals: { label: 'Goals', icon: 'target', color: '#046C4E' },
  budgets: { label: 'Budgets', icon: 'chart.pie.fill', color: '#7C3AED' },
  bills: { label: 'Bills', icon: 'doc.text.fill', color: '#F59E0B' },
  income: { label: 'Income', icon: 'arrow.down.circle.fill', color: '#22C55E' },
  dependents: { label: 'Dependents', icon: 'person.2.fill', color: '#3B82F6' },
  categories: { label: 'Categories', icon: 'folder.fill', color: '#EC4899' },
};

const resultTypeConfig: Record<SearchResultType, { icon: string; color: string }> = {
  expense: { icon: 'creditcard.fill', color: '#DC2626' },
  goal: { icon: 'target', color: '#046C4E' },
  budget: { icon: 'chart.pie.fill', color: '#7C3AED' },
  bill: { icon: 'doc.text.fill', color: '#F59E0B' },
  income: { icon: 'arrow.down.circle.fill', color: '#22C55E' },
  dependent: { icon: 'person.fill', color: '#3B82F6' },
  category: { icon: 'folder.fill', color: '#EC4899' },
  suggestion: { icon: 'magnifyingglass', color: '#8E8E93' },
};

// ============ PROPS ============
export type SearchBarProps = {
  placeholder?: string;
  onSearch: (query: string, category: SearchCategory) => void;
  onResultPress?: (result: SearchResult) => void;
  onClear?: () => void;
  results?: SearchResult[];
  recentSearches?: RecentSearch[];
  suggestions?: SearchSuggestion[];
  showCategories?: boolean;
  categories?: SearchCategory[];
  initialCategory?: SearchCategory;
  autoFocus?: boolean;
  variant?: 'inline' | 'modal' | 'header';
  loading?: boolean;
};

// ============ INLINE SEARCH BAR ============
export default function SearchBar({
  placeholder = 'Search...',
  onSearch,
  onResultPress,
  onClear,
  results = [],
  recentSearches = [],
  suggestions = [],
  showCategories = true,
  categories = ['all', 'expenses', 'goals', 'budgets', 'bills', 'income'],
  initialCategory = 'all',
  autoFocus = false,
  variant = 'inline',
  loading = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>(initialCategory);
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: showResults ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showResults]);

  const handleSearch = (text: string) => {
    setQuery(text);
    setShowResults(text.length > 0 || isFocused);
    onSearch(text, selectedCategory);
  };

  const handleClear = () => {
    setQuery('');
    setShowResults(false);
    onClear?.();
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowResults(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (query.length === 0) {
      setTimeout(() => setShowResults(false), 200);
    }
  };

  const handleCategoryChange = (category: SearchCategory) => {
    setSelectedCategory(category);
    onSearch(query, category);
  };

  const handleResultPress = (result: SearchResult) => {
    onResultPress?.(result);
    setShowResults(false);
    Keyboard.dismiss();
  };

  const handleRecentSearchPress = (recent: RecentSearch) => {
    setQuery(recent.query);
    if (recent.category) setSelectedCategory(recent.category);
    onSearch(recent.query, recent.category || selectedCategory);
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    if (suggestion.category) setSelectedCategory(suggestion.category);
    onSearch(suggestion.text, suggestion.category || selectedCategory);
  };

  // ============ RENDER SEARCH INPUT ============
  const renderSearchInput = () => (
    <View style={[
      styles.searchContainer,
      isFocused && styles.searchContainerFocused,
      variant === 'header' && styles.searchContainerHeader,
    ]}>
      <SFSymbol name="magnifyingglass" size={18} color="#8E8E93" />
      <TextInput
        ref={inputRef}
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        value={query}
        onChangeText={handleSearch}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {loading && (
        <View style={styles.loadingIndicator}>
          <SFSymbol name="arrow.triangle.2.circlepath" size={16} color="#8E8E93" />
        </View>
      )}
      {query.length > 0 && !loading && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <SFSymbol name="xmark.circle.fill" size={18} color="#C7C7CC" />
        </TouchableOpacity>
      )}
    </View>
  );

  // ============ RENDER CATEGORY PILLS ============
  const renderCategoryPills = () => {
    if (!showCategories || categories.length <= 1) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryPillsContainer}
        style={styles.categoryPills}
      >
        {categories.map((category) => {
          const config = categoryConfig[category];
          const isSelected = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryPill,
                isSelected && { backgroundColor: config.color + '20', borderColor: config.color },
              ]}
              onPress={() => handleCategoryChange(category)}
            >
              <SFSymbol
                name={config.icon}
                size={14}
                color={isSelected ? config.color : '#8E8E93'}
              />
              <Text style={[
                styles.categoryPillText,
                isSelected && { color: config.color, fontWeight: '600' },
              ]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // ============ RENDER RESULTS ============
  const renderResults = () => {
    if (!showResults) return null;

    return (
      <Animated.View style={[
        styles.resultsContainer,
        {
          opacity: animatedHeight,
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, SCREEN_HEIGHT * 0.5],
          }),
        },
      ]}>
        <ScrollView
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <View style={styles.resultsSection}>
              <View style={styles.resultsSectionHeader}>
                <Text style={styles.resultsSectionTitle}>Recent Searches</Text>
                <TouchableOpacity>
                  <Text style={styles.resultsSectionAction}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.slice(0, 5).map((recent) => (
                <TouchableOpacity
                  key={recent.id}
                  style={styles.recentSearchItem}
                  onPress={() => handleRecentSearchPress(recent)}
                >
                  <SFSymbol name="clock.arrow.circlepath" size={16} color="#8E8E93" />
                  <Text style={styles.recentSearchText}>{recent.query}</Text>
                  {recent.category && recent.category !== 'all' && (
                    <View style={[
                      styles.recentSearchCategoryBadge,
                      { backgroundColor: categoryConfig[recent.category].color + '15' },
                    ]}>
                      <Text style={[
                        styles.recentSearchCategoryText,
                        { color: categoryConfig[recent.category].color },
                      ]}>
                        {categoryConfig[recent.category].label}
                      </Text>
                    </View>
                  )}
                  <SFSymbol name="arrow.up.left" size={14} color="#C7C7CC" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Suggestions */}
          {query.length === 0 && suggestions.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsSectionTitle}>Suggestions</Text>
              {suggestions.slice(0, 5).map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <SFSymbol
                    name={suggestion.icon || 'sparkles'}
                    size={16}
                    color="#F59E0B"
                  />
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search Results */}
          {query.length > 0 && results.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsSectionTitle}>
                {results.length} Result{results.length !== 1 ? 's' : ''}
              </Text>
              {results.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  style={styles.resultItem}
                  onPress={() => handleResultPress(result)}
                >
                  <View style={[
                    styles.resultIcon,
                    { backgroundColor: result.iconColor + '15' },
                  ]}>
                    <SFSymbol name={result.icon} size={18} color={result.iconColor} />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {result.title}
                    </Text>
                    {result.subtitle && (
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {result.subtitle}
                      </Text>
                    )}
                  </View>
                  {result.amount !== undefined && (
                    <Text style={styles.resultAmount}>
                      ${result.amount.toLocaleString()}
                    </Text>
                  )}
                  <SFSymbol name="chevron.right" size={14} color="#C7C7CC" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* No Results */}
          {query.length > 0 && results.length === 0 && !loading && (
            <View style={styles.noResults}>
              <View style={styles.noResultsIcon}>
                <SFSymbol name="magnifyingglass" size={32} color="#C7C7CC" />
              </View>
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>
                Try a different search term or category
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  // ============ INLINE VARIANT ============
  if (variant === 'inline') {
    return (
      <View style={styles.container}>
        {renderSearchInput()}
        {renderCategoryPills()}
        {renderResults()}
      </View>
    );
  }

  // ============ HEADER VARIANT ============
  if (variant === 'header') {
    return (
      <View style={styles.headerContainer}>
        {renderSearchInput()}
      </View>
    );
  }

  // Modal variant handled by SearchModal component
  return (
    <View style={styles.container}>
      {renderSearchInput()}
      {renderCategoryPills()}
      {renderResults()}
    </View>
  );
}

// ============ SEARCH MODAL ============
export type SearchModalProps = {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string, category: SearchCategory) => void;
  onResultPress?: (result: SearchResult) => void;
  results?: SearchResult[];
  recentSearches?: RecentSearch[];
  suggestions?: SearchSuggestion[];
  categories?: SearchCategory[];
  loading?: boolean;
  title?: string;
};

export function SearchModal({
  visible,
  onClose,
  onSearch,
  onResultPress,
  results = [],
  recentSearches = [],
  suggestions = [],
  categories = ['all', 'expenses', 'goals', 'budgets', 'bills', 'income'],
  loading = false,
  title = 'Search',
}: SearchModalProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setQuery('');
      setSelectedCategory('all');
    }
  }, [visible]);

  const handleSearch = (text: string) => {
    setQuery(text);
    onSearch(text, selectedCategory);
  };

  const handleCategoryChange = (category: SearchCategory) => {
    setSelectedCategory(category);
    onSearch(query, category);
  };

  const handleResultPress = (result: SearchResult) => {
    onResultPress?.(result);
    onClose();
  };

  const handleRecentSearchPress = (recent: RecentSearch) => {
    setQuery(recent.query);
    if (recent.category) setSelectedCategory(recent.category);
    onSearch(recent.query, recent.category || selectedCategory);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.modalCancelButton} />
        </View>

        {/* Search Input */}
        <View style={styles.modalSearchContainer}>
          <SFSymbol name="magnifyingglass" size={18} color="#8E8E93" />
          <TextInput
            ref={inputRef}
            style={styles.modalSearchInput}
            placeholder="Search expenses, goals, budgets..."
            placeholderTextColor="#C7C7CC"
            value={query}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {loading && (
            <SFSymbol name="arrow.triangle.2.circlepath" size={16} color="#8E8E93" />
          )}
          {query.length > 0 && !loading && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <SFSymbol name="xmark.circle.fill" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills - COMPACT VERSION */}
        <View style={styles.categoryPillsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modalCategoryPills}
          >
            {categories.map((category) => {
              const config = categoryConfig[category];
              const isSelected = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.modalCategoryPill,
                    isSelected && { backgroundColor: config.color + '20', borderColor: config.color },
                  ]}
                  onPress={() => handleCategoryChange(category)}
                >
                  <SFSymbol
                    name={config.icon}
                    size={12} // Smaller icon
                    color={isSelected ? config.color : '#8E8E93'}
                  />
                  <Text style={[
                    styles.modalCategoryPillText,
                    isSelected && { color: config.color, fontWeight: '600' },
                  ]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results */}
        <ScrollView
          style={styles.modalResults}
          contentContainerStyle={styles.modalResultsContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <View style={styles.resultsSection}>
              <View style={styles.resultsSectionHeader}>
                <Text style={styles.resultsSectionTitle}>Recent Searches</Text>
                <TouchableOpacity>
                  <Text style={styles.resultsSectionAction}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.slice(0, 8).map((recent) => (
                <TouchableOpacity
                  key={recent.id}
                  style={styles.recentSearchItem}
                  onPress={() => handleRecentSearchPress(recent)}
                >
                  <SFSymbol name="clock.arrow.circlepath" size={16} color="#8E8E93" />
                  <Text style={styles.recentSearchText}>{recent.query}</Text>
                  {recent.category && recent.category !== 'all' && (
                    <View style={[
                      styles.recentSearchCategoryBadge,
                      { backgroundColor: categoryConfig[recent.category].color + '15' },
                    ]}>
                      <Text style={[
                        styles.recentSearchCategoryText,
                        { color: categoryConfig[recent.category].color },
                      ]}>
                        {categoryConfig[recent.category].label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Suggestions */}
          {query.length === 0 && suggestions.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsSectionTitle}>Try Searching</Text>
              <View style={styles.suggestionsGrid}>
                {suggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={styles.suggestionChip}
                    onPress={() => {
                      setQuery(suggestion.text);
                      onSearch(suggestion.text, selectedCategory);
                    }}
                  >
                    <SFSymbol
                      name={suggestion.icon || 'magnifyingglass'}
                      size={10} // Smaller icon
                      color="#6B7280"
                    />
                    <Text style={styles.suggestionChipText}>{suggestion.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Search Results */}
          {query.length > 0 && results.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsSectionTitle}>
                {results.length} Result{results.length !== 1 ? 's' : ''}
              </Text>
              {results.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  style={styles.modalResultItem}
                  onPress={() => handleResultPress(result)}
                >
                  <View style={[
                    styles.resultIcon,
                    { backgroundColor: result.iconColor + '15' },
                  ]}>
                    <SFSymbol name={result.icon} size={20} color={result.iconColor} />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {result.title}
                    </Text>
                    {result.subtitle && (
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {result.subtitle}
                      </Text>
                    )}
                  </View>
                  <View style={styles.modalResultRight}>
                    {result.amount !== undefined && (
                      <Text style={styles.resultAmount}>
                        ${result.amount.toLocaleString()}
                      </Text>
                    )}
                    {result.date && (
                      <Text style={styles.resultDate}>{result.date}</Text>
                    )}
                  </View>
                  <SFSymbol name="chevron.right" size={14} color="#C7C7CC" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* No Results */}
          {query.length > 0 && results.length === 0 && !loading && (
            <View style={styles.noResults}>
              <View style={styles.noResultsIcon}>
                <SFSymbol name="magnifyingglass" size={40} color="#C7C7CC" />
              </View>
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>
                Try searching for something else or{'\n'}select a different category
              </Text>
            </View>
          )}

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <SFSymbol name="arrow.triangle.2.circlepath" size={24} color="#8E8E93" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============ SEARCH BUTTON ============
export type SearchButtonProps = {
  onPress: () => void;
  placeholder?: string;
  variant?: 'default' | 'compact' | 'icon';
};

export function SearchButton({
  onPress,
  placeholder = 'Search...',
  variant = 'default',
}: SearchButtonProps) {
  if (variant === 'icon') {
    return (
      <TouchableOpacity style={styles.searchIconButton} onPress={onPress}>
        <SFSymbol name="magnifyingglass" size={20} color="#000" />
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={styles.searchButtonCompact} onPress={onPress}>
        <SFSymbol name="magnifyingglass" size={16} color="#8E8E93" />
        <Text style={styles.searchButtonCompactText}>{placeholder}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.searchButton} onPress={onPress}>
      <SFSymbol name="magnifyingglass" size={18} color="#8E8E93" />
      <Text style={styles.searchButtonText}>{placeholder}</Text>
    </TouchableOpacity>
  );
}

// ============ QUICK SEARCH CHIPS ============
export type QuickSearchChipsProps = {
  chips: { label: string; query: string; category?: SearchCategory; icon?: string }[];
  onChipPress: (query: string, category?: SearchCategory) => void;
};

export function QuickSearchChips({ chips, onChipPress }: QuickSearchChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickSearchChips}
    >
      {chips.map((chip, index) => (
        <TouchableOpacity
          key={index}
          style={styles.quickSearchChip}
          onPress={() => onChipPress(chip.query, chip.category)}
        >
          {chip.icon && (
            <SFSymbol name={chip.icon} size={10} color="#6B7280" />
          )}
          <Text style={styles.quickSearchChipText}>{chip.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Search Input
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchContainerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#046C4E',
  },
  searchContainerHeader: {
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  clearButton: {
    padding: 2,
  },
  loadingIndicator: {
    padding: 2,
  },

  // Category Pills - COMPACT VERSION
  categoryPillsSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  categoryPills: {
    maxHeight: 44,
  },
  categoryPillsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4, // Reduced from 5
    height: 28, // Fixed height
  },
  categoryPillText: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // Modal Category Pills - EXTRA COMPACT
  modalCategoryPills: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },
  modalCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 3, // Minimal gap
    height: 26,
  },
  modalCategoryPillText: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Results Container
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultsList: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  resultsSection: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  resultsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  resultsSectionAction: {
    fontSize: 13,
    color: '#DC2626',
  },

  // Recent Searches
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8, // Reduced from 10
  },
  recentSearchText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  recentSearchCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recentSearchCategoryText: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Suggestions
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8, // Reduced from 10
  },
  suggestionText: {
    fontSize: 15,
    color: '#000',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4, // Minimal gap
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Results
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  resultAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  resultDate: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // No Results
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  modalCancelButton: {
    width: 60,
  },
  modalCancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  modalResults: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalResultsContent: {
    paddingBottom: 40,
  },
  modalResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  modalResultRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Search Button
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  searchButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  searchButtonCompactText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick Search Chips
  quickSearchChips: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  quickSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 4, // Minimal gap
  },
  quickSearchChipText: {
    fontSize: 12,
    color: '#6B7280',
  },
});