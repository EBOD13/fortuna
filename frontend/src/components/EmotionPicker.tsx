// mobile/src/components/EmotionPicker.tsx
/**
 * Emotion Picker - Core Fortuna Feature
 * Select emotions when logging expenses
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { EmotionType } from '../types';

interface Emotion {
  type: EmotionType;
  emoji: string;
  label: string;
  category: 'positive' | 'neutral' | 'negative' | 'risk';
}

const EMOTIONS: Emotion[] = [
  { type: 'happy', emoji: '😊', label: 'Happy', category: 'positive' },
  { type: 'excited', emoji: '🤩', label: 'Excited', category: 'positive' },
  { type: 'celebratory', emoji: '🎉', label: 'Celebrating', category: 'positive' },
  { type: 'planned', emoji: '📋', label: 'Planned', category: 'neutral' },
  { type: 'neutral', emoji: '😐', label: 'Neutral', category: 'neutral' },
  { type: 'bored', emoji: '😑', label: 'Bored', category: 'risk' },
  { type: 'tired', emoji: '😴', label: 'Tired', category: 'risk' },
  { type: 'stressed', emoji: '😰', label: 'Stressed', category: 'negative' },
  { type: 'anxious', emoji: '😟', label: 'Anxious', category: 'negative' },
  { type: 'frustrated', emoji: '😤', label: 'Frustrated', category: 'negative' },
  { type: 'sad', emoji: '😢', label: 'Sad', category: 'negative' },
  { type: 'guilty', emoji: '😔', label: 'Guilty', category: 'negative' },
  { type: 'impulsive', emoji: '⚡', label: 'Impulsive', category: 'risk' },
];

interface EmotionPickerProps {
  selectedEmotion?: EmotionType;
  onSelect: (emotion: EmotionType) => void;
  compact?: boolean;
}

export const EmotionPicker: React.FC<EmotionPickerProps> = ({
  selectedEmotion,
  onSelect,
  compact = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  const selectedEmotionData = EMOTIONS.find((e) => e.type === selectedEmotion);

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.compactEmoji}>
            {selectedEmotionData?.emoji || '😶'}
          </Text>
          <Text style={styles.compactLabel}>
            {selectedEmotionData?.label || 'How did you feel?'}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How did you feel?</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>Done</Text>
              </TouchableOpacity>
            </View>
            <EmotionGrid
              selectedEmotion={selectedEmotion}
              onSelect={(emotion) => {
                onSelect(emotion);
                setShowModal(false);
              }}
            />
          </View>
        </Modal>
      </>
    );
  }

  return (
    <EmotionGrid selectedEmotion={selectedEmotion} onSelect={onSelect} />
  );
};

// Emotion Grid Component
interface EmotionGridProps {
  selectedEmotion?: EmotionType;
  onSelect: (emotion: EmotionType) => void;
}

const EmotionGrid: React.FC<EmotionGridProps> = ({
  selectedEmotion,
  onSelect,
}) => {
  const categories = [
    { key: 'positive', label: 'Positive' },
    { key: 'neutral', label: 'Neutral' },
    { key: 'risk', label: 'Risky' },
    { key: 'negative', label: 'Negative' },
  ];

  return (
    <ScrollView style={styles.grid} showsVerticalScrollIndicator={false}>
      {categories.map((category) => (
        <View key={category.key} style={styles.categorySection}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          <View style={styles.emotionRow}>
            {EMOTIONS.filter((e) => e.category === category.key).map((emotion) => (
              <TouchableOpacity
                key={emotion.type}
                style={[
                  styles.emotionButton,
                  selectedEmotion === emotion.type && styles.emotionSelected,
                  { borderColor: colors.emotions[emotion.type] || colors.gray[300] },
                ]}
                onPress={() => onSelect(emotion.type)}
              >
                <Text style={styles.emoji}>{emotion.emoji}</Text>
                <Text
                  style={[
                    styles.emotionLabel,
                    selectedEmotion === emotion.type && styles.emotionLabelSelected,
                  ]}
                >
                  {emotion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

// Additional Questions Component
interface EmotionQuestionsProps {
  wasNecessary: boolean;
  wasUrgent: boolean;
  stressLevel: number;
  onChangeNecessary: (value: boolean) => void;
  onChangeUrgent: (value: boolean) => void;
  onChangeStress: (value: number) => void;
}

export const EmotionQuestions: React.FC<EmotionQuestionsProps> = ({
  wasNecessary,
  wasUrgent,
  stressLevel,
  onChangeNecessary,
  onChangeUrgent,
  onChangeStress,
}) => {
  return (
    <View style={styles.questionsContainer}>
      <Text style={styles.questionTitle}>Quick reflection</Text>
      
      {/* Was it necessary? */}
      <View style={styles.questionRow}>
        <Text style={styles.questionText}>Was this purchase necessary?</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, wasNecessary && styles.toggleSelected]}
            onPress={() => onChangeNecessary(true)}
          >
            <Text style={[styles.toggleText, wasNecessary && styles.toggleTextSelected]}>
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !wasNecessary && styles.toggleSelected]}
            onPress={() => onChangeNecessary(false)}
          >
            <Text style={[styles.toggleText, !wasNecessary && styles.toggleTextSelected]}>
              No
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Was it urgent? */}
      <View style={styles.questionRow}>
        <Text style={styles.questionText}>Was it urgent?</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, wasUrgent && styles.toggleSelected]}
            onPress={() => onChangeUrgent(true)}
          >
            <Text style={[styles.toggleText, wasUrgent && styles.toggleTextSelected]}>
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !wasUrgent && styles.toggleSelected]}
            onPress={() => onChangeUrgent(false)}
          >
            <Text style={[styles.toggleText, !wasUrgent && styles.toggleTextSelected]}>
              No
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stress Level */}
      <View style={styles.questionRow}>
        <Text style={styles.questionText}>Stress level: {stressLevel}/10</Text>
        <View style={styles.stressRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.stressButton,
                stressLevel >= level && {
                  backgroundColor:
                    level <= 3
                      ? colors.success
                      : level <= 6
                      ? colors.warning
                      : colors.error,
                },
              ]}
              onPress={() => onChangeStress(level)}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Compact mode
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  compactEmoji: {
    fontSize: 24,
  },
  compactLabel: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    ...typography.title.medium,
    color: colors.text.primary,
  },
  closeButton: {
    ...typography.label.large,
    color: colors.primary[500],
  },

  // Grid
  grid: {
    flex: 1,
    padding: spacing.md,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryLabel: {
    ...typography.label.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  emotionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emotionButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    minWidth: 70,
  },
  emotionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  emoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  emotionLabel: {
    ...typography.label.small,
    color: colors.text.secondary,
  },
  emotionLabelSelected: {
    color: colors.primary[700],
    fontWeight: '600',
  },

  // Questions
  questionsContainer: {
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
  },
  questionTitle: {
    ...typography.title.small,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  questionRow: {
    marginBottom: spacing.md,
  },
  questionText: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  toggleSelected: {
    backgroundColor: colors.primary[500],
  },
  toggleText: {
    ...typography.label.medium,
    color: colors.text.secondary,
  },
  toggleTextSelected: {
    color: colors.text.inverse,
  },
  stressRow: {
    flexDirection: 'row',
    gap: 4,
  },
  stressButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.gray[200],
  },
});