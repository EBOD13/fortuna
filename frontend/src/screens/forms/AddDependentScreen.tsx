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
import { RootStackParamList } from '../../navigation/types';
import { Dropdown, DropdownOption } from '../../components/form/Dropdown';

// ============ TYPES ============
type DependentType = 'human' | 'animal';

type DependentCategory =
  | 'child'
  | 'spouse'
  | 'parent'
  | 'sibling'
  | 'other_family'
  | 'dog'
  | 'cat'
  | 'bird'
  | 'fish'
  | 'other_pet';

type RelationshipType =
  | 'Son'
  | 'Daughter'
  | 'Spouse'
  | 'Partner'
  | 'Mother'
  | 'Father'
  | 'Brother'
  | 'Sister'
  | 'Grandparent'
  | 'Other'
  | 'Pet';

type SharedPartner = {
  id: string;
  name: string;
  contribution: string;
};

type FormData = {
  dependent_name: string;
  dependent_type: DependentType | null;
  dependent_category: DependentCategory | null;
  relationship: RelationshipType | null;
  date_of_birth: string;
  monthly_cost_estimate: string;
  shared_responsibility: boolean;
  shared_partners: SharedPartner[];
  special_needs: string;
  notes: string;
};

// ============ HEADER ============
const FormHeader = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Add Dependent</Text>

      <View style={{ width: 60 }} />
    </View>
  );
};

// ============ INPUT FIELD ============
type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  prefix?: string;
  optional?: boolean;
};

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
  prefix,
  optional = false,
}: InputFieldProps) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputLabelRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      {optional && <Text style={styles.optionalBadge}>Optional</Text>}
    </View>

    <View style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}>
      {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  </View>
);

// ============ MAIN ============
export default function AddDependentScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    dependent_name: '',
    dependent_type: null,
    dependent_category: null,
    relationship: null,
    date_of_birth: '',
    monthly_cost_estimate: '',
    shared_responsibility: false,
    shared_partners: [],
    special_needs: '',
    notes: '',
  });

  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // ============ DROPDOWN OPTIONS ============
  const relationshipOptions: DropdownOption[] =
    formData.dependent_type === 'animal'
      ? [{ id: 'Pet', label: 'Pet' }]
      : [
          { id: 'Son', label: 'Son' },
          { id: 'Daughter', label: 'Daughter' },
          { id: 'Spouse', label: 'Spouse' },
          { id: 'Partner', label: 'Partner' },
          { id: 'Mother', label: 'Mother' },
          { id: 'Father', label: 'Father' },
          { id: 'Brother', label: 'Brother' },
          { id: 'Sister', label: 'Sister' },
          { id: 'Grandparent', label: 'Grandparent' },
          { id: 'Other', label: 'Other' },
        ];

  // ============ STEP 1 ============
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What type of dependent?</Text>

      <TouchableOpacity
        style={styles.typeCard}
        onPress={() => updateForm('dependent_type', 'human')}
      >
        <Text style={styles.typeText}>Human</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.typeCard}
        onPress={() => {
          updateForm('dependent_type', 'animal');
          updateForm('relationship', 'Pet');
        }}
      >
        <Text style={styles.typeText}>Pet</Text>
      </TouchableOpacity>
    </View>
  );

  // ============ STEP 2 ============
  const renderStep2 = () => (
    <ScrollView contentContainerStyle={styles.stepContainer}>
      <InputField
        label="Name"
        placeholder="Dependent name"
        value={formData.dependent_name}
        onChangeText={text => updateForm('dependent_name', text)}
      />

      <Dropdown
        label="Relationship"
        placeholder="Select relationship"
        options={relationshipOptions}
        selectedId={formData.relationship}
        onSelect={id => updateForm('relationship', id as RelationshipType)}
        optional={formData.dependent_type === 'animal'}
      />

      <InputField
        label={formData.dependent_type === 'animal' ? 'Age (years)' : 'Date of Birth'}
        placeholder={formData.dependent_type === 'animal' ? 'e.g. 3' : 'MM/DD/YYYY'}
        value={formData.date_of_birth}
        onChangeText={text => updateForm('date_of_birth', text)}
        keyboardType={formData.dependent_type === 'animal' ? 'numeric' : 'default'}
        optional
      />
    </ScrollView>
  );

  // ============ FOOTER ============
  const handleNext = () => {
    if (currentStep < 2) setCurrentStep(s => s + 1);
    else submit();
  };

  const submit = async () => {
    setLoading(true);
    await new Promise<void>(r => setTimeout(r, 800));
    setLoading(false);
    Alert.alert('Success', 'Dependent added', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <FormHeader currentStep={currentStep} totalSteps={2} />

      {currentStep === 1 ? renderStep1() : renderStep2()}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {currentStep === 2 ? 'Add Dependent' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  cancelText: { color: '#DC2626', fontSize: 16 },

  stepContainer: { padding: 24 },

  stepTitle: { fontSize: 26, fontWeight: '700', marginBottom: 20 },

  typeCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  typeText: { fontSize: 18, fontWeight: '600' },

  inputContainer: { marginBottom: 20 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  inputLabel: { fontWeight: '600' },
  optionalBadge: {
    marginLeft: 8,
    fontSize: 12,
    color: '#8E8E93',
  },
  inputWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  inputWrapperMultiline: { height: 120 },
  input: { fontSize: 16 },
  inputMultiline: { height: '100%' },
  inputPrefix: { marginRight: 4 },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFF',
  },
  primaryButton: {
    backgroundColor: '#046C4E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFF', fontWeight: '600', fontSize: 17 },
});
