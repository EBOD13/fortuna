// src/screens/AddCategoryScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

// ============ TYPES ============
type CategoryType = 'fixed' | 'variable' | 'discretionary';

type IconOption = {
  id: string;
  name: string;
  label: string;
};

type ColorOption = {
  id: string;
  color: string;
  label: string;
};

type ParentCategory = {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
};

type FormData = {
  category_name: string;
  category_type: CategoryType | null;
  parent_category_id: string | null;
  is_essential: boolean;
  monthly_budget: string;
  icon: string;
  color: string;
  seasonality_factor: string;
  notes: string;
};

// ============ CATEGORY TYPE OPTIONS ============
const categoryTypeOptions = [
  {
    id: 'fixed',
    label: 'Fixed',
    description: 'Same amount every month (rent, insurance)',
    icon: 'lock.fill',
    color: '#2563EB',
  },
  {
    id: 'variable',
    label: 'Variable',
    description: 'Changes month to month (groceries, utilities)',
    icon: 'arrow.up.arrow.down',
    color: '#F59E0B',
  },
  {
    id: 'discretionary',
    label: 'Discretionary',
    description: 'Optional spending (entertainment, dining out)',
    icon: 'sparkles',
    color: '#7C3AED',
  },
];

// ============ ICON OPTIONS ============
const iconOptions: IconOption[] = [
  // Essentials
  { id: 'house.fill', name: 'house.fill', label: 'Housing' },
  { id: 'bolt.fill', name: 'bolt.fill', label: 'Utilities' },
  { id: 'cart.fill', name: 'cart.fill', label: 'Groceries' },
  { id: 'car.fill', name: 'car.fill', label: 'Transportation' },
  { id: 'fuelpump.fill', name: 'fuelpump.fill', label: 'Gas' },
  { id: 'cross.case.fill', name: 'cross.case.fill', label: 'Healthcare' },
  { id: 'pills.fill', name: 'pills.fill', label: 'Pharmacy' },
  { id: 'shield.fill', name: 'shield.fill', label: 'Insurance' },
  
  // Food & Drink
  { id: 'fork.knife', name: 'fork.knife', label: 'Dining' },
  { id: 'cup.and.saucer.fill', name: 'cup.and.saucer.fill', label: 'Coffee' },
  { id: 'takeoutbag.and.cup.and.straw.fill', name: 'takeoutbag.and.cup.and.straw.fill', label: 'Takeout' },
  
  // Entertainment
  { id: 'film.fill', name: 'film.fill', label: 'Movies' },
  { id: 'tv.fill', name: 'tv.fill', label: 'Streaming' },
  { id: 'gamecontroller.fill', name: 'gamecontroller.fill', label: 'Gaming' },
  { id: 'music.note', name: 'music.note', label: 'Music' },
  { id: 'ticket.fill', name: 'ticket.fill', label: 'Events' },
  
  // Shopping
  { id: 'bag.fill', name: 'bag.fill', label: 'Shopping' },
  { id: 'tshirt.fill', name: 'tshirt.fill', label: 'Clothing' },
  { id: 'gift.fill', name: 'gift.fill', label: 'Gifts' },
  
  // Personal
  { id: 'figure.walk', name: 'figure.walk', label: 'Fitness' },
  { id: 'heart.fill', name: 'heart.fill', label: 'Wellness' },
  { id: 'sparkles', name: 'sparkles', label: 'Personal Care' },
  { id: 'scissors', name: 'scissors', label: 'Haircut' },
  
  // Education & Work
  { id: 'book.fill', name: 'book.fill', label: 'Education' },
  { id: 'graduationcap.fill', name: 'graduationcap.fill', label: 'Tuition' },
  { id: 'briefcase.fill', name: 'briefcase.fill', label: 'Work' },
  { id: 'desktopcomputer', name: 'desktopcomputer', label: 'Tech' },
  
  // Pets
  { id: 'pawprint.fill', name: 'pawprint.fill', label: 'Pets' },
  
  // Travel
  { id: 'airplane', name: 'airplane', label: 'Travel' },
  { id: 'bed.double.fill', name: 'bed.double.fill', label: 'Lodging' },
  
  // Finance
  { id: 'creditcard.fill', name: 'creditcard.fill', label: 'Payments' },
  { id: 'banknote.fill', name: 'banknote.fill', label: 'Cash' },
  { id: 'percent', name: 'percent', label: 'Fees' },
  
  // Subscriptions
  { id: 'repeat', name: 'repeat', label: 'Subscriptions' },
  { id: 'iphone', name: 'iphone', label: 'Phone' },
  { id: 'wifi', name: 'wifi', label: 'Internet' },
  
  // Other
  { id: 'questionmark.circle.fill', name: 'questionmark.circle.fill', label: 'Other' },
  { id: 'ellipsis.circle.fill', name: 'ellipsis.circle.fill', label: 'Misc' },
];

// ============ COLOR OPTIONS ============
const colorOptions: ColorOption[] = [
  { id: 'green', color: '#046C4E', label: 'Green' },
  { id: 'blue', color: '#2563EB', label: 'Blue' },
  { id: 'purple', color: '#7C3AED', label: 'Purple' },
  { id: 'pink', color: '#EC4899', label: 'Pink' },
  { id: 'red', color: '#DC2626', label: 'Red' },
  { id: 'orange', color: '#EA580C', label: 'Orange' },
  { id: 'amber', color: '#F59E0B', label: 'Amber' },
  { id: 'teal', color: '#0891B2', label: 'Teal' },
  { id: 'cyan', color: '#06B6D4', label: 'Cyan' },
  { id: 'indigo', color: '#4F46E5', label: 'Indigo' },
  { id: 'gray', color: '#6B7280', label: 'Gray' },
  { id: 'slate', color: '#475569', label: 'Slate' },
];

// ============ MOCK PARENT CATEGORIES ============
const parentCategories: ParentCategory[] = [
  { category_id: '1', category_name: 'Food & Groceries', icon: 'cart.fill', color: '#046C4E' },
  { category_id: '2', category_name: 'Housing', icon: 'house.fill', color: '#2563EB' },
  { category_id: '3', category_name: 'Transportation', icon: 'car.fill', color: '#F59E0B' },
  { category_id: '4', category_name: 'Entertainment', icon: 'film.fill', color: '#EC4899' },
  { category_id: '5', category_name: 'Healthcare', icon: 'cross.case.fill', color: '#DC2626' },
  { category_id: '6', category_name: 'Personal Care', icon: 'sparkles', color: '#7C3AED' },
];

// ============ HEADER ============
const FormHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="xmark" size={20} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>New Category</Text>
      <View style={styles.headerButtonPlaceholder} />
    </View>
  );
};

// ============ SECTION HEADER ============
const SectionHeader = ({ title, icon, color }: { title: string; icon?: string; color?: string }) => (
  <View style={styles.sectionHeaderContainer}>
    {icon && (
      <View style={[styles.sectionHeaderIcon, { backgroundColor: (color || '#046C4E') + '15' }]}>
        <SFSymbol name={icon} size={16} color={color || '#046C4E'} />
      </View>
    )}
    <Text style={styles.sectionHeader}>{title}</Text>
  </View>
);

// ============ INPUT FIELD ============
type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  prefix?: string;
  optional?: boolean;
  multiline?: boolean;
};

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  prefix,
  optional = false,
  multiline = false,
}: InputFieldProps) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputLabelRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      {optional && <Text style={styles.optionalBadge}>Optional</Text>}
    </View>
    <View style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}>
      {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  </View>
);

// ============ TOGGLE SWITCH ============
type ToggleSwitchProps = {
  label: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
};

const ToggleSwitch = ({ label, description, value, onToggle }: ToggleSwitchProps) => (
  <TouchableOpacity style={styles.toggleContainer} onPress={onToggle} activeOpacity={0.7}>
    <View style={styles.toggleContent}>
      <Text style={styles.toggleLabel}>{label}</Text>
      {description && <Text style={styles.toggleDescription}>{description}</Text>}
    </View>
    <View style={[styles.toggle, value && styles.toggleActive]}>
      <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
    </View>
  </TouchableOpacity>
);

// ============ CATEGORY TYPE SELECTOR ============
type DropdownSelectorProps = {
  selected: CategoryType | null;
  onSelect: (type: CategoryType) => void;
};

const CategoryTypeDropdown = ({ selected, onSelect }: DropdownSelectorProps) => {
  const [visible, setVisible] = useState(false);
  const selectedOption = categoryTypeOptions.find(o => o.id === selected);

  return (
    <>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={selectedOption ? { color: selectedOption.color, fontWeight: '600', fontSize: 16 } : styles.dropdownPlaceholder}>
          {selectedOption?.label || 'Select Type'}
        </Text>
        <SFSymbol name="chevron.down" size={16} color="#8E8E93" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Category Type</Text>
            <FlatList
              data={categoryTypeOptions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selected === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.parentOption, isSelected && { backgroundColor: item.color + '15' }]}
                    onPress={() => {
                      onSelect(item.id as CategoryType);
                      setVisible(false);
                    }}
                  >
                    <View style={[styles.parentOptionIcon, { backgroundColor: item.color + '15' }]}>
                      <SFSymbol name={item.icon} size={20} color={item.color} />
                    </View>
                    <Text style={[styles.parentOptionName, isSelected && { color: item.color }]}>{item.label}</Text>
                    {isSelected && <SFSymbol name="checkmark.circle.fill" size={22} color={item.color} />}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

// ============ ICON PICKER ============
type IconPickerProps = {
  selected: string;
  color: string;
  onSelect: (icon: string) => void;
};

const IconPicker = ({ selected, color, onSelect }: IconPickerProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Icon</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.pickerPreview, { backgroundColor: color + '15' }]}>
            <SFSymbol name={selected} size={28} color={color} />
          </View>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerLabel}>
              {iconOptions.find(i => i.id === selected)?.label || 'Select Icon'}
            </Text>
            <Text style={styles.pickerHint}>Tap to change</Text>
          </View>
          <SFSymbol name="chevron.right" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Icon</Text>
            
            <FlatList
              data={iconOptions}
              keyExtractor={item => item.id}
              numColumns={4}
              contentContainerStyle={styles.iconGrid}
              renderItem={({ item }) => {
                const isSelected = selected === item.id;
                return (
                <TouchableOpacity
                    style={[styles.iconOption, isSelected && { borderColor: color + '40' }]}
                    onPress={() => {
                        onSelect(item.id);
                        setVisible(false);
                    }}
                    >
                    <View style={styles.iconOptionContent}>
                        {/* Add space above the icon */}
                        <View style={{ marginTop: 12 }}>  
                        <SFSymbol
                            name={item.name}
                            size={28}
                            color={isSelected ? color : '#000'}
                        />
                        </View>

                        <Text style={[styles.iconOptionLabel, isSelected && { color }]} numberOfLines={1}>
                        {item.label}
                        </Text>
                </View>
                </TouchableOpacity>

                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

// ============ COLOR PICKER ============
type ColorPickerProps = {
  selected: string;
  onSelect: (color: string) => void;
};

const ColorPicker = ({ selected, onSelect }: ColorPickerProps) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>Color</Text>
    <View style={styles.colorGrid}>
      {colorOptions.map((option) => {
        const isSelected = selected === option.color;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.colorOption,
              { backgroundColor: option.color },
              isSelected && styles.colorOptionSelected,
            ]}
            onPress={() => onSelect(option.color)}
          >
            {isSelected && <SFSymbol name="checkmark" size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ============ PARENT CATEGORY SELECTOR ============
type ParentCategorySelectorProps = {
  selected: string | null;
  onSelect: (id: string | null) => void;
};

const ParentCategorySelector = ({ selected, onSelect }: ParentCategorySelectorProps) => {
  const [visible, setVisible] = useState(false);
  const selectedParent = parentCategories.find(c => c.category_id === selected);

  return (
    <>
      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>Parent Category</Text>
          <Text style={styles.optionalBadge}>Optional</Text>
        </View>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          {selectedParent ? (
            <View style={styles.parentSelected}>
              <View style={[styles.parentIcon, { backgroundColor: selectedParent.color + '15' }]}>
                <SFSymbol name={selectedParent.icon} size={18} color={selectedParent.color} />
              </View>
              <Text style={styles.parentName}>{selectedParent.category_name}</Text>
            </View>
          ) : (
            <Text style={styles.dropdownPlaceholder}>None (top-level category)</Text>
          )}
          <SFSymbol name="chevron.down" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Parent Category</Text>
            
            {/* None option */}
            <TouchableOpacity
              style={[
                styles.parentOption,
                selected === null && styles.parentOptionSelected,
              ]}
              onPress={() => {
                onSelect(null);
                setVisible(false);
              }}
            >
              <View style={[styles.parentOptionIcon, { backgroundColor: '#E5E5EA' }]}>
                <SFSymbol name="folder" size={20} color="#8E8E93" />
              </View>
              <Text style={styles.parentOptionName}>None (top-level category)</Text>
              {selected === null && (
                <SFSymbol name="checkmark.circle.fill" size={22} color="#046C4E" />
              )}
            </TouchableOpacity>

            <View style={styles.parentDivider} />

            <FlatList
              data={parentCategories}
              keyExtractor={item => item.category_id}
              renderItem={({ item }) => {
                const isSelected = selected === item.category_id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.parentOption,
                      isSelected && styles.parentOptionSelected,
                    ]}
                    onPress={() => {
                      onSelect(item.category_id);
                      setVisible(false);
                    }}
                  >
                    <View style={[styles.parentOptionIcon, { backgroundColor: item.color + '15' }]}>
                      <SFSymbol name={item.icon} size={20} color={item.color} />
                    </View>
                    <Text style={styles.parentOptionName}>{item.category_name}</Text>
                    {isSelected && (
                      <SFSymbol name="checkmark.circle.fill" size={22} color="#046C4E" />
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.modalList}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

// ============ MAIN COMPONENT ============
export default function AddCategoryScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    category_name: '',
    category_type: null,
    parent_category_id: null,
    is_essential: false,
    monthly_budget: '',
    icon: 'folder.fill',
    color: '#046C4E',
    seasonality_factor: '1.0',
    notes: '',
  });

  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const canSubmit = () => {
    return (
      formData.category_name.trim() !== '' &&
      formData.category_type !== null
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Missing Information', 'Please enter a category name and select a type.');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: API call to create category
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Category Created! 📁',
        `"${formData.category_name}" has been added to your categories.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FormHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Preview */}
        <PreviewCard
          name={formData.category_name}
          icon={formData.icon}
          color={formData.color}
          type={formData.category_type}
          isEssential={formData.is_essential}
          budget={parseFloat(formData.monthly_budget) || undefined}
        />

        {/* Basic Info */}
        <SectionHeader title="Basic Info" icon="info.circle.fill" color="#2563EB" />

        <InputField
          label="Category Name"
          placeholder="e.g., Groceries, Rent, Entertainment"
          value={formData.category_name}
          onChangeText={(text) => updateForm('category_name', text)}
        />

        {/* Category Type */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Category Type</Text>
          <CategoryTypeDropdown
            selected={formData.category_type}
            onSelect={(type) => updateForm('category_type', type)}
          />
        </View>

        {/* Appearance */}
        <SectionHeader title="Appearance" icon="paintpalette.fill" color="#7C3AED" />

        <IconPicker
          selected={formData.icon}
          color={formData.color}
          onSelect={(icon) => updateForm('icon', icon)}
        />

        <ColorPicker
          selected={formData.color}
          onSelect={(color) => updateForm('color', color)}
        />

        {/* Organization */}
        <SectionHeader title="Organization" icon="folder.fill" color="#F59E0B" />

        <ParentCategorySelector
          selected={formData.parent_category_id}
          onSelect={(id) => updateForm('parent_category_id', id)}
        />

        <ToggleSwitch
          label="Essential Category"
          description="Mark as a necessary expense (needs vs wants)"
          value={formData.is_essential}
          onToggle={() => updateForm('is_essential', !formData.is_essential)}
        />

        {/* Budget */}
        <SectionHeader title="Budget" icon="dollarsign.circle.fill" color="#046C4E" />

        <InputField
          label="Default Monthly Budget"
          placeholder="0.00"
          value={formData.monthly_budget}
          onChangeText={(text) => updateForm('monthly_budget', text)}
          keyboardType="decimal-pad"
          prefix="$"
          optional
        />

        <InputField
          label="Seasonality Factor"
          placeholder="1.0"
          value={formData.seasonality_factor}
          onChangeText={(text) => updateForm('seasonality_factor', text)}
          keyboardType="decimal-pad"
          optional
        />

        {/* Info about seasonality */}
        <View style={styles.infoCard}>
          <SFSymbol name="info.circle.fill" size={20} color="#2563EB" />
          <Text style={styles.infoCardText}>
            Seasonality factor adjusts budget expectations. Use 1.2 for categories that spike 20% in certain months (like utilities in summer).
          </Text>
        </View>

        {/* Notes */}
        <SectionHeader title="Notes" icon="note.text" color="#6B7280" />

        <InputField
          label="Notes"
          placeholder="Any additional notes about this category..."
          value={formData.notes}
          onChangeText={(text) => updateForm('notes', text)}
          multiline
          optional
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
    
              <Text style={styles.submitButtonText}>Create Category</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}






// ============ PREVIEW CARD ============
type PreviewCardProps = {
  name: string;
  icon: string;
  color: string;
  type: CategoryType | null;
  isEssential: boolean;
  budget?: number;
};

const PreviewCard = ({ name, icon, color, type, isEssential, budget }: PreviewCardProps) => (
  <View style={styles.previewCard}>
    <Text style={styles.previewTitle}>Preview</Text>
    <View style={styles.previewContent}>
      <View style={[styles.previewIcon, { backgroundColor: color + '15' }]}>
        <SFSymbol name={icon} size={28} color={color} />
      </View>
      <View style={styles.previewInfo}>
        <Text style={styles.previewName}>{name || 'Category Name'}</Text>
        <View style={styles.previewBadges}>
          {type && (
            <View style={[styles.previewBadge, { backgroundColor: categoryTypeOptions.find(t => t.id === type)?.color + '15' }]}>
              <Text style={[styles.previewBadgeText, { color: categoryTypeOptions.find(t => t.id === type)?.color }]}>
                {type}
              </Text>
            </View>
          )}
          {isEssential && (
            <View style={[styles.previewBadge, { backgroundColor: '#DC262615' }]}>
              <Text style={[styles.previewBadgeText, { color: '#DC2626' }]}>Essential</Text>
            </View>
          )}
        </View>
      </View>
      {budget && budget > 0 && (
        <Text style={[styles.previewBudget, { color }]}>${budget}/mo</Text>
      )}
    </View>
  </View>
);

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
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPlaceholder: {
    width: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Section Header
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    gap: 10,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Input
  inputContainer: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  optionalBadge: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputWrapperMultiline: {
    height: 80,
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  inputPrefix: {
    fontSize: 17,
    color: '#8E8E93',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  inputMultiline: {
    height: '100%',
  },

  // Category Type Selector
  typeSelector: {
    gap: 12,
  },
  typeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  typeOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  typeOptionDesc: {
    fontSize: 13,
    color: '#8E8E93',
  },
  typeOptionCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Icon Picker
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  pickerPreview: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pickerContent: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  pickerHint: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Icon Grid
  iconGrid: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
iconOption: {
  flex: 1,
  alignItems: 'center',        
  padding: 16,
  margin: 6,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: 'transparent',
  backgroundColor: '#F8F8F8',
  minHeight: 80,  // enough height for icon + 20px label gap
},

iconOptionContent: {
  alignItems: 'center',
  justifyContent: 'flex-start',  // top-align the content
},

iconOptionLabel: {
  fontSize: 11,
  color: '#8E8E93',
  marginTop: 20,  // space between icon and label
  textAlign: 'center',
},




  // Color Picker
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Dropdown
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dropdownPlaceholder: {
    fontSize: 17,
    color: '#8E8E93',
  },

  // Parent Category
  parentSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  parentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  parentOptionSelected: {
    backgroundColor: '#046C4E08',
  },
  parentOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  parentOptionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  parentDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },

  // Modal
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
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 300,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#046C4E',
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },

  // Preview Card
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  previewBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  previewBudget: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2563EB10',
    borderRadius: 14,
    padding: 16,
    marginTop: -8,
    marginBottom: 20,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },

  // Bottom
  bottomSpacer: {
    height: 120,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#046C4E',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});