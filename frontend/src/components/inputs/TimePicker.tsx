// src/components/inputs/TimePicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TYPES ============
export type TimePickerVariant = 'field' | 'compact' | 'inline';
export type TimeFormat = '12h' | '24h';

export type TimeValue = {
  hours: number;
  minutes: number;
};

export type TimePickerProps = {
  value?: TimeValue;
  onChange: (time: TimeValue) => void;
  variant?: TimePickerVariant;
  format?: TimeFormat;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  showIcon?: boolean;
  minuteInterval?: 1 | 5 | 10 | 15 | 30;
  minTime?: TimeValue;
  maxTime?: TimeValue;
};

export type TimeRangePickerProps = {
  startTime?: TimeValue;
  endTime?: TimeValue;
  onChangeStart: (time: TimeValue) => void;
  onChangeEnd: (time: TimeValue) => void;
  label?: string;
  format?: TimeFormat;
  disabled?: boolean;
  error?: string;
};

// ============ HELPERS ============
const formatTime = (time: TimeValue, format: TimeFormat = '12h'): string => {
  if (format === '24h') {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
  }
  
  const period = time.hours >= 12 ? 'PM' : 'AM';
  const hours12 = time.hours % 12 || 12;
  return `${hours12}:${time.minutes.toString().padStart(2, '0')} ${period}`;
};

const getCurrentTime = (): TimeValue => {
  const now = new Date();
  return {
    hours: now.getHours(),
    minutes: now.getMinutes(),
  };
};

const isTimeInRange = (time: TimeValue, minTime?: TimeValue, maxTime?: TimeValue): boolean => {
  const timeMinutes = time.hours * 60 + time.minutes;
  
  if (minTime) {
    const minMinutes = minTime.hours * 60 + minTime.minutes;
    if (timeMinutes < minMinutes) return false;
  }
  
  if (maxTime) {
    const maxMinutes = maxTime.hours * 60 + maxTime.minutes;
    if (timeMinutes > maxMinutes) return false;
  }
  
  return true;
};

// ============ TIME OF DAY CONFIG ============
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

const getTimeOfDay = (hours: number): TimeOfDay => {
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'afternoon';
  if (hours >= 17 && hours < 21) return 'evening';
  return 'night';
};

const timeOfDayConfig: Record<TimeOfDay, { label: string; icon: string; color: string }> = {
  morning: { label: 'Morning', icon: 'sunrise.fill', color: '#F59E0B' },
  afternoon: { label: 'Afternoon', icon: 'sun.max.fill', color: '#F97316' },
  evening: { label: 'Evening', icon: 'sunset.fill', color: '#8B5CF6' },
  night: { label: 'Night', icon: 'moon.fill', color: '#3B82F6' },
};

// ============ QUICK TIME PRESETS ============
const quickTimePresets = [
  { label: 'Now', getValue: getCurrentTime },
  { label: '8:00 AM', getValue: () => ({ hours: 8, minutes: 0 }) },
  { label: '12:00 PM', getValue: () => ({ hours: 12, minutes: 0 }) },
  { label: '5:00 PM', getValue: () => ({ hours: 17, minutes: 0 }) },
  { label: '8:00 PM', getValue: () => ({ hours: 20, minutes: 0 }) },
];

// ============ WHEEL PICKER ITEM ============
type WheelItemProps = {
  value: string;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

const WheelItem = ({ value, isSelected, onPress, disabled }: WheelItemProps) => (
  <TouchableOpacity
    style={[
      styles.wheelItem,
      isSelected && styles.wheelItemSelected,
      disabled && styles.wheelItemDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Text style={[
      styles.wheelItemText,
      isSelected && styles.wheelItemTextSelected,
      disabled && styles.wheelItemTextDisabled,
    ]}>
      {value}
    </Text>
  </TouchableOpacity>
);

// ============ TIME PICKER COMPONENT ============
export default function TimePicker({
  value,
  onChange,
  variant = 'field',
  format = '12h',
  label,
  placeholder = 'Select time',
  disabled = false,
  error,
  helperText,
  showIcon = true,
  minuteInterval = 5,
  minTime,
  maxTime,
}: TimePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [tempHours, setTempHours] = useState(value?.hours ?? 12);
  const [tempMinutes, setTempMinutes] = useState(value?.minutes ?? 0);
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>(
    value ? (value.hours >= 12 ? 'PM' : 'AM') : 'AM'
  );
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (value) {
      setTempHours(format === '12h' ? (value.hours % 12 || 12) : value.hours);
      setTempMinutes(value.minutes);
      setTempPeriod(value.hours >= 12 ? 'PM' : 'AM');
    }
  }, [value, format]);

  const handleConfirm = () => {
    let hours = tempHours;
    if (format === '12h') {
      if (tempPeriod === 'PM' && tempHours !== 12) {
        hours = tempHours + 12;
      } else if (tempPeriod === 'AM' && tempHours === 12) {
        hours = 0;
      }
    }
    
    const newTime = { hours, minutes: tempMinutes };
    
    if (isTimeInRange(newTime, minTime, maxTime)) {
      onChange(newTime);
      setShowModal(false);
    }
  };

  const handleNow = () => {
    const now = getCurrentTime();
    // Round to nearest interval
    const roundedMinutes = Math.round(now.minutes / minuteInterval) * minuteInterval;
    onChange({ hours: now.hours, minutes: roundedMinutes % 60 });
    setShowModal(false);
  };

  const generateHours = (): number[] => {
    if (format === '24h') {
      return Array.from({ length: 24 }, (_, i) => i);
    }
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  const generateMinutes = (): number[] => {
    return Array.from({ length: 60 / minuteInterval }, (_, i) => i * minuteInterval);
  };

  const timeOfDay = value ? getTimeOfDay(value.hours) : null;
  const todConfig = timeOfDay ? timeOfDayConfig[timeOfDay] : null;

  // ============ INLINE VARIANT ============
  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
        
        <View style={styles.inlinePickerContainer}>
          {/* Hours */}
          <View style={styles.inlineColumn}>
            <Text style={styles.inlineColumnLabel}>Hour</Text>
            <ScrollView 
              style={styles.inlineScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.inlineScrollContent}
            >
              {generateHours().map((hour) => (
                <WheelItem
                  key={hour}
                  value={hour.toString().padStart(2, '0')}
                  isSelected={tempHours === hour}
                  onPress={() => setTempHours(hour)}
                />
              ))}
            </ScrollView>
          </View>

          <Text style={styles.inlineColon}>:</Text>

          {/* Minutes */}
          <View style={styles.inlineColumn}>
            <Text style={styles.inlineColumnLabel}>Min</Text>
            <ScrollView 
              style={styles.inlineScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.inlineScrollContent}
            >
              {generateMinutes().map((minute) => (
                <WheelItem
                  key={minute}
                  value={minute.toString().padStart(2, '0')}
                  isSelected={tempMinutes === minute}
                  onPress={() => setTempMinutes(minute)}
                />
              ))}
            </ScrollView>
          </View>

          {/* AM/PM */}
          {format === '12h' && (
            <View style={styles.inlineColumn}>
              <Text style={styles.inlineColumnLabel}> </Text>
              <View style={styles.periodColumn}>
                <WheelItem
                  value="AM"
                  isSelected={tempPeriod === 'AM'}
                  onPress={() => setTempPeriod('AM')}
                />
                <WheelItem
                  value="PM"
                  isSelected={tempPeriod === 'PM'}
                  onPress={() => setTempPeriod('PM')}
                />
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.inlineConfirmButton} onPress={handleConfirm}>
          <Text style={styles.inlineConfirmText}>Set Time</Text>
        </TouchableOpacity>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
      </View>
    );
  }

  // ============ FIELD / COMPACT VARIANT ============
  return (
    <View style={styles.fieldContainer}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          variant === 'compact' ? styles.compactField : styles.field,
          error && styles.fieldError,
          disabled && styles.fieldDisabled,
        ]}
        onPress={() => !disabled && setShowModal(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {showIcon && (
          <SFSymbol 
            name="clock.fill" 
            size={variant === 'compact' ? 16 : 18} 
            color={disabled ? '#C7C7CC' : todConfig?.color || '#8E8E93'} 
          />
        )}
        <Text style={[
          variant === 'compact' ? styles.compactFieldText : styles.fieldText,
          !value && styles.fieldPlaceholder,
          disabled && styles.fieldTextDisabled,
        ]}>
          {value ? formatTime(value, format) : placeholder}
        </Text>
        {todConfig && value && (
          <View style={[styles.timeOfDayBadge, { backgroundColor: todConfig.color + '15' }]}>
            <SFSymbol name={todConfig.icon} size={12} color={todConfig.color} />
            <Text style={[styles.timeOfDayText, { color: todConfig.color }]}>
              {todConfig.label}
            </Text>
          </View>
        )}
        <SFSymbol 
          name="chevron.down" 
          size={12} 
          color={disabled ? '#C7C7CC' : '#C7C7CC'} 
        />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
      
      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{label || 'Select Time'}</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Presets - COMPACT */}
          <View style={styles.presetsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsContainer}
            >
              {quickTimePresets.map((preset, index) => {
                const presetValue = preset.getValue();
                const isSelected = value && 
                  value.hours === presetValue.hours && 
                  value.minutes === presetValue.minutes;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.presetChip,
                      isSelected && styles.presetChipSelected,
                    ]}
                    onPress={() => {
                      const newTime = preset.getValue();
                      onChange(newTime);
                      setTempHours(format === '12h' ? (newTime.hours % 12 || 12) : newTime.hours);
                      setTempMinutes(newTime.minutes);
                      setTempPeriod(newTime.hours >= 12 ? 'PM' : 'AM');
                    }}
                  >
                    {preset.label === 'Now' && (
                      <SFSymbol name="clock.fill" size={12} color={isSelected ? '#FFFFFF' : '#6B7280'} />
                    )}
                    <Text style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextSelected,
                    ]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Time Display */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeDisplayText}>
              {format === '12h' 
                ? `${tempHours}:${tempMinutes.toString().padStart(2, '0')} ${tempPeriod}`
                : `${tempHours.toString().padStart(2, '0')}:${tempMinutes.toString().padStart(2, '0')}`
              }
            </Text>
            {(() => {
              let displayHours = tempHours;
              if (format === '12h') {
                if (tempPeriod === 'PM' && tempHours !== 12) displayHours = tempHours + 12;
                else if (tempPeriod === 'AM' && tempHours === 12) displayHours = 0;
              }
              const tod = getTimeOfDay(displayHours);
              const config = timeOfDayConfig[tod];
              return (
                <View style={[styles.timeDisplayBadge, { backgroundColor: config.color + '20' }]}>
                  <SFSymbol name={config.icon} size={16} color={config.color} />
                  <Text style={[styles.timeDisplayBadgeText, { color: config.color }]}>
                    {config.label}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* Picker Wheels */}
          <View style={styles.pickerContainer}>
            {/* Hours Column */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerColumnLabel}>Hour</Text>
              <ScrollView
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerScrollContent}
              >
                {generateHours().map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.pickerItem,
                      tempHours === hour && styles.pickerItemSelected,
                    ]}
                    onPress={() => setTempHours(hour)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      tempHours === hour && styles.pickerItemTextSelected,
                    ]}>
                      {format === '12h' ? hour : hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.pickerColon}>:</Text>

            {/* Minutes Column */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerColumnLabel}>Min</Text>
              <ScrollView
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerScrollContent}
              >
                {generateMinutes().map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.pickerItem,
                      tempMinutes === minute && styles.pickerItemSelected,
                    ]}
                    onPress={() => setTempMinutes(minute)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      tempMinutes === minute && styles.pickerItemTextSelected,
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* AM/PM Column */}
            {format === '12h' && (
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}> </Text>
                <View style={styles.periodPickerColumn}>
                  <TouchableOpacity
                    style={[
                      styles.periodItem,
                      tempPeriod === 'AM' && styles.periodItemSelected,
                    ]}
                    onPress={() => setTempPeriod('AM')}
                  >
                    <Text style={[
                      styles.periodItemText,
                      tempPeriod === 'AM' && styles.periodItemTextSelected,
                    ]}>
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodItem,
                      tempPeriod === 'PM' && styles.periodItemSelected,
                    ]}
                    onPress={() => setTempPeriod('PM')}
                  >
                    <Text style={[
                      styles.periodItemText,
                      tempPeriod === 'PM' && styles.periodItemTextSelected,
                    ]}>
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Now Button */}
          <TouchableOpacity style={styles.nowButton} onPress={handleNow}>
            <SFSymbol name="clock.badge.checkmark.fill" size={16} color="#007AFF" />
            <Text style={styles.nowButtonText}>Set to Current Time</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ============ TIME RANGE PICKER ============
export function TimeRangePicker({
  startTime,
  endTime,
  onChangeStart,
  onChangeEnd,
  label,
  format = '12h',
  disabled = false,
  error,
}: TimeRangePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.fieldContainer}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.rangeField,
          error && styles.fieldError,
          disabled && styles.fieldDisabled,
        ]}
        onPress={() => !disabled && setShowModal(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.rangeTimeBox}>
          <Text style={styles.rangeTimeLabel}>From</Text>
          <Text style={[styles.rangeTimeText, !startTime && styles.fieldPlaceholder]}>
            {startTime ? formatTime(startTime, format) : 'Start'}
          </Text>
        </View>
        
        <SFSymbol name="arrow.right" size={14} color="#C7C7CC" />
        
        <View style={styles.rangeTimeBox}>
          <Text style={styles.rangeTimeLabel}>To</Text>
          <Text style={[styles.rangeTimeText, !endTime && styles.fieldPlaceholder]}>
            {endTime ? formatTime(endTime, format) : 'End'}
          </Text>
        </View>
        
        <SFSymbol name="clock.fill" size={18} color="#8E8E93" />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Time Range</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Range Display */}
          <View style={styles.rangeDisplay}>
            <TouchableOpacity 
              style={[styles.rangeDisplayBox, selectingStart && styles.rangeDisplayBoxActive]}
              onPress={() => setSelectingStart(true)}
            >
              <Text style={styles.rangeDisplayLabel}>Start Time</Text>
              <Text style={[
                styles.rangeDisplayTime,
                selectingStart && styles.rangeDisplayTimeActive,
              ]}>
                {startTime ? formatTime(startTime, format) : 'Select'}
              </Text>
            </TouchableOpacity>
            
            <SFSymbol name="arrow.right" size={16} color="#C7C7CC" />
            
            <TouchableOpacity 
              style={[styles.rangeDisplayBox, !selectingStart && styles.rangeDisplayBoxActive]}
              onPress={() => setSelectingStart(false)}
            >
              <Text style={styles.rangeDisplayLabel}>End Time</Text>
              <Text style={[
                styles.rangeDisplayTime,
                !selectingStart && styles.rangeDisplayTimeActive,
              ]}>
                {endTime ? formatTime(endTime, format) : 'Select'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Embedded Time Picker */}
          <View style={styles.embeddedPicker}>
            <TimePicker
              value={selectingStart ? startTime : endTime}
              onChange={(time) => {
                if (selectingStart) {
                  onChangeStart(time);
                } else {
                  onChangeEnd(time);
                }
              }}
              variant="inline"
              format={format}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============ QUICK TIME BUTTONS ============
export type QuickTimeButtonsProps = {
  onSelect: (time: TimeValue) => void;
  selectedTime?: TimeValue;
  options?: { label: string; hours: number; minutes: number }[];
};

export function QuickTimeButtons({ 
  onSelect, 
  selectedTime,
  options = [
    { label: 'Morning', hours: 9, minutes: 0 },
    { label: 'Noon', hours: 12, minutes: 0 },
    { label: 'Evening', hours: 18, minutes: 0 },
    { label: 'Now', hours: new Date().getHours(), minutes: Math.round(new Date().getMinutes() / 5) * 5 },
  ],
}: QuickTimeButtonsProps) {
  return (
    <View style={styles.quickTimeButtons}>
      {options.map((option, index) => {
        const isSelected = selectedTime && 
          selectedTime.hours === option.hours && 
          selectedTime.minutes === option.minutes;
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.quickTimeButton,
              isSelected && styles.quickTimeButtonSelected,
            ]}
            onPress={() => onSelect({ hours: option.hours, minutes: option.minutes })}
          >
            <Text style={[
              styles.quickTimeButtonText,
              isSelected && styles.quickTimeButtonTextSelected,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  // Field Container
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  
  // Field Styles
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  compactField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  fieldError: {
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  fieldText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  compactFieldText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  fieldPlaceholder: {
    color: '#C7C7CC',
  },
  fieldTextDisabled: {
    color: '#8E8E93',
  },

  // Time of Day Badge
  timeOfDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  timeOfDayText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Range Field
  rangeField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rangeTimeBox: {
    flex: 1,
  },
  rangeTimeLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 2,
  },
  rangeTimeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },

  // Error / Helper Text
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 6,
  },
  helperText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 6,
  },

  // Inline Container
  inlineContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  inlinePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inlineColumn: {
    alignItems: 'center',
  },
  inlineColumnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  inlineScroll: {
    height: 150,
    width: 60,
  },
  inlineScrollContent: {
    paddingVertical: 50,
  },
  inlineColon: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginTop: 20,
  },
  periodColumn: {
    gap: 8,
  },
  inlineConfirmButton: {
    backgroundColor: '#046C4E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  inlineConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Wheel Items
  wheelItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  wheelItemSelected: {
    backgroundColor: '#046C4E',
  },
  wheelItemDisabled: {
    opacity: 0.3,
  },
  wheelItemText: {
    fontSize: 18,
    color: '#000',
  },
  wheelItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  wheelItemTextDisabled: {
    color: '#C7C7CC',
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
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
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
  modalDoneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Presets Section
  presetsSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  presetsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
    height: 32,
  },
  presetChipSelected: {
    backgroundColor: '#046C4E',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  presetChipTextSelected: {
    color: '#FFFFFF',
  },

  // Time Display
  timeDisplay: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  timeDisplayText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#000',
    letterSpacing: 2,
  },
  timeDisplayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginTop: 12,
  },
  timeDisplayBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Picker Container
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  pickerColumn: {
    alignItems: 'center',
    width: 70,
  },
  pickerColumnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  pickerScroll: {
    height: 180,
  },
  pickerScrollContent: {
    paddingVertical: 60,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#046C4E',
  },
  pickerItemText: {
    fontSize: 20,
    color: '#000',
  },
  pickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickerColon: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000',
    marginTop: 70,
  },
  periodPickerColumn: {
    gap: 8,
  },
  periodItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  periodItemSelected: {
    backgroundColor: '#046C4E',
  },
  periodItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodItemTextSelected: {
    color: '#FFFFFF',
  },

  // Now Button
  nowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  nowButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Range Display
  rangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  rangeDisplayBox: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rangeDisplayBoxActive: {
    borderColor: '#046C4E',
    backgroundColor: '#046C4E08',
  },
  rangeDisplayLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  rangeDisplayTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  rangeDisplayTimeActive: {
    color: '#046C4E',
  },

  // Embedded Picker
  embeddedPicker: {
    marginHorizontal: 16,
    marginTop: 16,
  },

  // Quick Time Buttons
  quickTimeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickTimeButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
  },
  quickTimeButtonSelected: {
    backgroundColor: '#046C4E',
  },
  quickTimeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  quickTimeButtonTextSelected: {
    color: '#FFFFFF',
  },
});