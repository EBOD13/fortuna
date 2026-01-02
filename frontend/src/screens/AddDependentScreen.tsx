// src/screens/AddDependentScreen.tsx
/**
 * Add Dependent Screen
 * Multi-step form for adding a dependent (human or pet)
 * Aligned with backend API schema
 */

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
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useCreateDependent } from '../hooks/useDependent';
import type { 
  CreateDependentRequest, 
  DependentType, 
  DependentCategory 
} from '../api/types/dependent';

// ============ TYPES ============
type SharedPartner = {
  id: string;
  name: string;
  contribution: string;
};

type FormData = {
  dependent_name: string;
  dependent_type: DependentType | null;
  dependent_category: DependentCategory | null;
  relationship: string;
  date_of_birth: string;
  age: string;
  monthly_cost_estimate: string;
  shared_responsibility: boolean;
  shared_partners: SharedPartner[];
  your_share_percentage: string;
  special_needs: string;
  notes: string;
  pet_breed: string;
};

// ============ CATEGORY CONFIGS ============
const humanCategories: { id: DependentCategory; label: string; icon: string; relationships: string[] }[] = [
  { id: 'child', label: 'Child', icon: 'figure.child', relationships: ['Son', 'Daughter'] },
  { id: 'spouse', label: 'Spouse/Partner', icon: 'heart.fill', relationships: ['Spouse', 'Partner'] },
  { id: 'parent', label: 'Parent', icon: 'figure.stand', relationships: ['Mother', 'Father'] },
  { id: 'sibling', label: 'Sibling', icon: 'person.2.fill', relationships: ['Brother', 'Sister'] },
  { id: 'other_family', label: 'Other Family', icon: 'person.3.fill', relationships: ['Grandparent', 'Other'] },
];

const petCategories: { id: DependentCategory; label: string; icon: string; relationship: string }[] = [
  { id: 'dog', label: 'Dog', icon: 'pawprint.fill', relationship: 'Dog' },
  { id: 'cat', label: 'Cat', icon: 'cat.fill', relationship: 'Cat' },
  { id: 'bird', label: 'Bird', icon: 'bird.fill', relationship: 'Bird' },
  { id: 'fish', label: 'Fish', icon: 'fish.fill', relationship: 'Fish' },
  { id: 'other_pet', label: 'Other Pet', icon: 'hare.fill', relationship: 'Pet' },
];

// ============ MAIN COMPONENT ============
export default function AddDependentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { createDependent, isSubmitting } = useCreateDependent();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<FormData>({
    dependent_name: '',
    dependent_type: null,
    dependent_category: null,
    relationship: '',
    date_of_birth: '',
    age: '',
    monthly_cost_estimate: '',
    shared_responsibility: false,
    shared_partners: [],
    your_share_percentage: '100',
    special_needs: '',
    notes: '',
    pet_breed: '',
  });

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const getRelationships = (): string[] => {
    if (formData.dependent_type === 'animal') {
      const pet = petCategories.find(p => p.id === formData.dependent_category);
      return pet ? [pet.relationship] : [];
    }
    const human = humanCategories.find(h => h.id === formData.dependent_category);
    return human ? human.relationships : [];
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.dependent_type !== null;
      case 2: return formData.dependent_name.trim() !== '' && 
                     formData.dependent_category !== null && 
                     formData.relationship !== '';
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!formData.dependent_category || !formData.dependent_type) {
      Alert.alert('Error', 'Please complete all required fields.');
      return;
    }

    const requestData: CreateDependentRequest = {
      dependent_name: formData.dependent_name.trim(),
      relationship: formData.relationship,
      dependent_type: formData.dependent_type,
      dependent_category: formData.dependent_category,
      date_of_birth: formData.date_of_birth || undefined,
      age: formData.age ? parseInt(formData.age) : undefined,
      pet_type: formData.dependent_type === 'animal' ? formData.dependent_category : undefined,
      pet_breed: formData.pet_breed || undefined,
      monthly_cost_estimate: formData.monthly_cost_estimate 
        ? parseFloat(formData.monthly_cost_estimate) : undefined,
      shared_responsibility: formData.shared_responsibility,
      your_share_percentage: parseFloat(formData.your_share_percentage),
      cost_sharing_partners: formData.shared_partners.map(p => p.name).filter(Boolean),
      special_needs: formData.special_needs || undefined,
      notes: formData.notes || undefined,
    };

    const result = await createDependent(requestData);
    
    if (result) {
      Alert.alert('Success!', `${formData.dependent_name} has been added.`, 
        [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  };

  // ============ RENDER ============
  const progress = (currentStep / totalSteps) * 100;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <SFSymbol name="xmark" size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add Dependent</Text>
          <Text style={styles.headerStep}>Step {currentStep} of {totalSteps}</Text>
        </View>
        <View style={styles.headerButton} />
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContainer}>
          {/* Step 1: Type */}
          {currentStep === 1 && (
            <>
              <Text style={styles.stepTitle}>What type of dependent?</Text>
              <Text style={styles.stepSubtitle}>Select human or pet</Text>
              <View style={styles.typeCards}>
                {[
                  { type: 'human' as const, icon: 'figure.stand', color: '#2563EB', title: 'Human', sub: 'Child, spouse, parent, sibling' },
                  { type: 'animal' as const, icon: 'pawprint.fill', color: '#F59E0B', title: 'Pet', sub: 'Dog, cat, bird, fish' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.type}
                    style={[styles.selectionCard, formData.dependent_type === item.type && styles.selectionCardSelected]}
                    onPress={() => {
                      updateForm('dependent_type', item.type);
                      updateForm('dependent_category', null);
                      updateForm('relationship', '');
                    }}
                  >
                    <View style={[styles.selectionIcon, { backgroundColor: item.color + '15' }]}>
                      <SFSymbol name={item.icon} size={24} color={item.color} />
                    </View>
                    <View style={styles.selectionContent}>
                      <Text style={styles.selectionTitle}>{item.title}</Text>
                      <Text style={styles.selectionSubtitle}>{item.sub}</Text>
                    </View>
                    {formData.dependent_type === item.type && (
                      <SFSymbol name="checkmark.circle.fill" size={24} color="#046C4E" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <>
              <Text style={styles.stepTitle}>Basic Information</Text>
              <Text style={styles.stepSubtitle}>Tell us about your dependent</Text>
              
              {/* Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder={formData.dependent_type === 'animal' ? "Pet's name" : "Dependent's name"}
                    placeholderTextColor="#C7C7CC"
                    value={formData.dependent_name}
                    onChangeText={(t) => updateForm('dependent_name', t)}
                  />
                </View>
              </View>

              {/* Category */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>Category</Text>
                <View style={styles.chipGrid}>
                  {(formData.dependent_type === 'human' ? humanCategories : petCategories).map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, formData.dependent_category === cat.id && styles.chipSelected]}
                      onPress={() => {
                        updateForm('dependent_category', cat.id);
                        // Auto-set relationship for pets or single-option categories
                        if (formData.dependent_type === 'animal') {
                          const pet = petCategories.find(p => p.id === cat.id);
                          if (pet) updateForm('relationship', pet.relationship);
                        } else {
                          updateForm('relationship', '');
                        }
                      }}
                    >
                      <SFSymbol name={cat.icon} size={18} color={formData.dependent_category === cat.id ? '#FFF' : '#046C4E'} />
                      <Text style={[styles.chipText, formData.dependent_category === cat.id && styles.chipTextSelected]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Relationship (Human only) */}
              {formData.dependent_type === 'human' && formData.dependent_category && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionLabel}>Relationship</Text>
                  <View style={styles.chipGrid}>
                    {getRelationships().map((rel) => (
                      <TouchableOpacity
                        key={rel}
                        style={[styles.chip, formData.relationship === rel && styles.chipSelected]}
                        onPress={() => updateForm('relationship', rel)}
                      >
                        <Text style={[styles.chipText, formData.relationship === rel && styles.chipTextSelected]}>
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Age/DOB */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {formData.dependent_type === 'animal' ? 'Age (years)' : 'Date of Birth'}
                  <Text style={styles.optional}> (Optional)</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder={formData.dependent_type === 'animal' ? 'e.g., 3' : 'YYYY-MM-DD'}
                    placeholderTextColor="#C7C7CC"
                    value={formData.dependent_type === 'animal' ? formData.age : formData.date_of_birth}
                    onChangeText={(t) => updateForm(formData.dependent_type === 'animal' ? 'age' : 'date_of_birth', t)}
                    keyboardType={formData.dependent_type === 'animal' ? 'numeric' : 'default'}
                  />
                </View>
              </View>
            </>
          )}

          {/* Step 3: Cost */}
          {currentStep === 3 && (
            <>
              <Text style={styles.stepTitle}>Cost Information</Text>
              <Text style={styles.stepSubtitle}>Estimate monthly costs</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Estimated Monthly Cost<Text style={styles.optional}> (Optional)</Text></Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#C7C7CC"
                    value={formData.monthly_cost_estimate}
                    onChangeText={(t) => updateForm('monthly_cost_estimate', t)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.toggleContainer} 
                onPress={() => updateForm('shared_responsibility', !formData.shared_responsibility)}
              >
                <View style={styles.toggleContent}>
                  <Text style={styles.toggleLabel}>Shared Financial Responsibility</Text>
                  <Text style={styles.toggleDescription}>Do you share costs with someone?</Text>
                </View>
                <View style={[styles.toggle, formData.shared_responsibility && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, formData.shared_responsibility && styles.toggleKnobActive]} />
                </View>
              </TouchableOpacity>

              {formData.shared_responsibility && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Your Share</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="50"
                      placeholderTextColor="#C7C7CC"
                      value={formData.your_share_percentage}
                      onChangeText={(t) => updateForm('your_share_percentage', t)}
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputSuffix}>%</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Step 4: Additional */}
          {currentStep === 4 && (
            <>
              <Text style={styles.stepTitle}>Additional Details</Text>
              <Text style={styles.stepSubtitle}>Optional information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Special Needs<Text style={styles.optional}> (Optional)</Text></Text>
                <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    placeholder="Medical conditions, allergies..."
                    placeholderTextColor="#C7C7CC"
                    value={formData.special_needs}
                    onChangeText={(t) => updateForm('special_needs', t)}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes<Text style={styles.optional}> (Optional)</Text></Text>
                <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    placeholder="Any additional notes..."
                    placeholderTextColor="#C7C7CC"
                    value={formData.notes}
                    onChangeText={(t) => updateForm('notes', t)}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Name</Text>
                  <Text style={styles.summaryValue}>{formData.dependent_name || '—'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Type</Text>
                  <Text style={styles.summaryValue}>{formData.relationship || '—'}</Text>
                </View>
                {formData.monthly_cost_estimate && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Monthly Cost</Text>
                    <Text style={styles.summaryValue}>${formData.monthly_cost_estimate}</Text>
                  </View>
                )}
                {formData.shared_responsibility && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Your Share</Text>
                    <Text style={styles.summaryValue}>{formData.your_share_percentage}%</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + 20 }]}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(s => s - 1)}>
            <SFSymbol name="chevron.left" size={18} color="#046C4E" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === totalSteps ? 'Add Dependent' : 'Continue'}
              </Text>
              {currentStep < totalSteps && <SFSymbol name="chevron.right" size={18} color="#FFFFFF" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { position: 'absolute', left: 0, right: 0, alignItems: 'center', top: 0, bottom: 20, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  headerStep: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  progressBarContainer: { height: 4, backgroundColor: '#E5E5EA', borderRadius: 2, marginTop: 16, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#046C4E', borderRadius: 2 },
  scrollView: { flex: 1 },
  stepContainer: { padding: 24 },
  stepTitle: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 8 },
  stepSubtitle: { fontSize: 16, color: '#8E8E93', marginBottom: 32 },
  typeCards: { gap: 16 },
  selectionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: 'transparent' },
  selectionCardSelected: { borderColor: '#046C4E', backgroundColor: '#046C4E08' },
  selectionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  selectionContent: { flex: 1 },
  selectionTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  selectionSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  inputContainer: { marginBottom: 24 },
  inputLabel: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 10 },
  optional: { fontWeight: '400', color: '#8E8E93' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 18, height: 56, borderWidth: 1, borderColor: '#E5E5EA' },
  inputWrapperMultiline: { height: 100, alignItems: 'flex-start', paddingVertical: 14 },
  inputPrefix: { fontSize: 17, color: '#8E8E93', marginRight: 4 },
  inputSuffix: { fontSize: 17, color: '#8E8E93', marginLeft: 4 },
  input: { flex: 1, fontSize: 17, color: '#000' },
  inputMultiline: { height: '100%', textAlignVertical: 'top' },
  sectionContainer: { marginBottom: 24 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 14 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, gap: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  chipSelected: { backgroundColor: '#046C4E', borderColor: '#046C4E' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#000' },
  chipTextSelected: { color: '#FFF' },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 20 },
  toggleContent: { flex: 1, marginRight: 16 },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
  toggleDescription: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  toggle: { width: 52, height: 32, borderRadius: 16, backgroundColor: '#E5E5EA', padding: 2 },
  toggleActive: { backgroundColor: '#046C4E' },
  toggleKnob: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF' },
  toggleKnobActive: { transform: [{ translateX: 20 }] },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginTop: 24, borderWidth: 1, borderColor: '#046C4E30' },
  summaryTitle: { fontSize: 17, fontWeight: '600', color: '#046C4E', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 15, color: '#8E8E93' },
  summaryValue: { fontSize: 15, fontWeight: '500', color: '#000' },
  bottomButtons: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', gap: 12 },
  backButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F2F7', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 24, gap: 8 },
  backButtonText: { fontSize: 17, fontWeight: '600', color: '#046C4E' },
  nextButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#046C4E', borderRadius: 16, paddingVertical: 18, gap: 8 },
  nextButtonDisabled: { backgroundColor: '#C7C7CC' },
  nextButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
});