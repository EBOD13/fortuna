// src/components/forms/Dropdown.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

export type DropdownOption = {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  subtitle?: string;
};

type DropdownProps = {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  optional?: boolean;
};

export const Dropdown = ({
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
  optional,
}: DropdownProps) => {
  const [visible, setVisible] = useState(false);
  const selected = options.find(o => o.id === selectedId);

  return (
    <>
      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {optional && <Text style={styles.optional}>Optional</Text>}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          {selected ? (
            <Text style={styles.selectedText}>{selected.label}</Text>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
          <SFSymbol
            name="chevron.down"
            size={16}
            color="#8E8E93"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modal} onPress={e => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{label}</Text>

            <FlatList
              data={options}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.id);
                    setVisible(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionLabel}>{item.label}</Text>
                    {item.subtitle && (
                      <Text style={styles.optionSubtitle}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>

                  {selectedId === item.id && (
                    <SFSymbol
                      name="checkmark.circle.fill"
                      size={22}
                      color="#046C4E"
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '600' },
  optional: {
    marginLeft: 8,
    fontSize: 12,
    color: '#8E8E93',
  },
  button: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: { color: '#C7C7CC', fontSize: 17 },
  selectedText: { fontSize: 17 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
    alignSelf: 'center',
    marginVertical: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  optionLabel: { fontSize: 17, fontWeight: '500' },
  optionSubtitle: { fontSize: 14, color: '#8E8E93' },
});
