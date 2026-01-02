// src/components/inputs/DatePickerComponent.tsx
/**
 * Clean iOS-style Date Picker Component
 * Simple, elegant, and user-friendly
 */

import React, { useState, useEffect } from 'react';
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
export type DatePickerProps = {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  showIcon?: boolean;
};

// ============ HELPERS ============
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

const isDateInRange = (date: Date, minDate?: Date, maxDate?: Date): boolean => {
  if (minDate && date < minDate) return false;
  if (maxDate && date > maxDate) return false;
  return true;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const generateYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 100; i <= currentYear + 10; i++) {
    years.push(i);
  }
  return years;
};

// ============ CALENDAR GRID ============
type CalendarGridProps = {
  selectedDate?: Date;
  currentMonth: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
};

const CalendarGrid = ({
  selectedDate,
  currentMonth,
  onSelectDate,
  minDate,
  maxDate,
}: CalendarGridProps) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days: (number | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <View style={styles.calendarGrid}>
      {/* Day Headers */}
      <View style={styles.dayHeadersRow}>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>
      
      {/* Calendar Days */}
      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }
          
          const date = new Date(year, month, day);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const isDisabled = !isDateInRange(date, minDate, maxDate);
          
          return (
            <TouchableOpacity
              key={day}
              style={styles.dayCell}
              onPress={() => !isDisabled && onSelectDate(date)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <View style={[
                styles.dayContent,
                isSelected && styles.dayContentSelected,
                isTodayDate && !isSelected && styles.dayContentToday,
              ]}>
                <Text style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                  isTodayDate && !isSelected && styles.dayTextToday,
                  isDisabled && styles.dayTextDisabled,
                ]}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ============ YEAR PICKER ============
type YearPickerProps = {
  selectedYear: number;
  onSelectYear: (year: number) => void;
  minDate?: Date;
  maxDate?: Date;
};

const YearPicker = ({ selectedYear, onSelectYear, minDate, maxDate }: YearPickerProps) => {
  const years = generateYears();
  
  return (
    <ScrollView 
      style={styles.yearPicker}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.yearPickerContent}>
        {years.map((year) => {
          const isSelected = year === selectedYear;
          const isCurrentYear = year === new Date().getFullYear();
          
          return (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearItem,
                isSelected && styles.yearItemSelected,
                isCurrentYear && !isSelected && styles.yearItemCurrent,
              ]}
              onPress={() => onSelectYear(year)}
            >
              <Text style={[
                styles.yearText,
                isSelected && styles.yearTextSelected,
                isCurrentYear && !isSelected && styles.yearTextCurrent,
              ]}>
                {year}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

// ============ MONTH PICKER ============
type MonthPickerProps = {
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
  selectedYear: number;
  minDate?: Date;
  maxDate?: Date;
};

const MonthPicker = ({ selectedMonth, onSelectMonth, selectedYear, minDate, maxDate }: MonthPickerProps) => {
  const isMonthDisabled = (month: number): boolean => {
    const date = new Date(selectedYear, month, 1);
    const lastDay = new Date(selectedYear, month + 1, 0);
    
    if (minDate) {
      const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      if (lastDay < minMonth) return true;
    }
    
    if (maxDate) {
      const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      if (date > maxMonth) return true;
    }
    
    return false;
  };

  return (
    <View style={styles.monthPicker}>
      {MONTHS.map((month, index) => {
        const isSelected = index === selectedMonth;
        const disabled = isMonthDisabled(index);
        
        return (
          <TouchableOpacity
            key={month}
            style={[
              styles.monthItem,
              isSelected && styles.monthItemSelected,
              disabled && styles.monthItemDisabled,
            ]}
            onPress={() => !disabled && onSelectMonth(index)}
            disabled={disabled}
          >
            <Text style={[
              styles.monthText,
              isSelected && styles.monthTextSelected,
              disabled && styles.monthTextDisabled,
            ]}>
              {month}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function DatePickerComponent({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  error,
  helperText,
  showIcon = true,
}: DatePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [pickerMode, setPickerMode] = useState<'calendar' | 'year' | 'month'>('calendar');
  const [selectedYear, setSelectedYear] = useState(currentMonth.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.getMonth());
  const insets = useSafeAreaInsets();

  // Update selected year/month when current month changes
  useEffect(() => {
    if (pickerMode === 'calendar') {
      setSelectedYear(currentMonth.getFullYear());
      setSelectedMonth(currentMonth.getMonth());
    }
  }, [currentMonth, pickerMode]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    onChange(date);
    setShowModal(false);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onChange(today);
    setShowModal(false);
  };

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    setPickerMode('month');
  };

  const handleSelectMonth = (month: number) => {
    setSelectedMonth(month);
    const newDate = new Date(selectedYear, month, 1);
    setCurrentMonth(newDate);
    setPickerMode('calendar');
  };

  const renderModalContent = () => {
    if (pickerMode === 'year') {
      return (
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setPickerMode('calendar')}
            >
              <SFSymbol name="chevron.left" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Year</Text>
            <View style={{ width: 44 }} />
          </View>
          
          <YearPicker
            selectedYear={selectedYear}
            onSelectYear={handleSelectYear}
            minDate={minDate}
            maxDate={maxDate}
          />
        </View>
      );
    }

    if (pickerMode === 'month') {
      return (
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setPickerMode('year')}
            >
              <SFSymbol name="chevron.left" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Month</Text>
            <View style={{ width: 44 }} />
          </View>
          
          <View style={styles.yearDisplay}>
            <Text style={styles.yearDisplayText}>{selectedYear}</Text>
          </View>
          
          <MonthPicker
            selectedMonth={selectedMonth}
            onSelectMonth={handleSelectMonth}
            selectedYear={selectedYear}
            minDate={minDate}
            maxDate={maxDate}
          />
        </View>
      );
    }

    // Calendar mode (default)
    return (
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Date</Text>
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => value && setShowModal(false)}
          >
            <Text style={[styles.doneButtonText, !value && styles.doneButtonTextDisabled]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Month/Year Navigation */}
        <View style={styles.monthYearContainer}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <SFSymbol name="chevron.left" size={18} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.monthYearButton}
            onPress={() => setPickerMode('year')}
          >
            <Text style={styles.monthYearText}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <SFSymbol name="chevron.down" size={12} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <SFSymbol name="chevron.right" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <CalendarGrid
            selectedDate={value}
            currentMonth={currentMonth}
            onSelectDate={handleSelectDate}
            minDate={minDate}
            maxDate={maxDate}
          />
        </View>
        
        {/* Today Button */}
        <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.field,
          error && styles.fieldError,
          disabled && styles.fieldDisabled,
        ]}
        onPress={() => !disabled && setShowModal(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {showIcon && (
          <SFSymbol 
            name="calendar" 
            size={18} 
            color={disabled ? '#C7C7CC' : '#8E8E93'} 
          />
        )}
        <Text style={[
          styles.fieldText,
          !value && styles.fieldPlaceholder,
          disabled && styles.fieldTextDisabled,
        ]}>
          {value ? formatDate(value) : placeholder}
        </Text>
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
        onRequestClose={() => {
          if (pickerMode !== 'calendar') {
            setPickerMode('calendar');
          } else {
            setShowModal(false);
          }
        }}
      >
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          {renderModalContent()}
        </View>
      </Modal>
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  // Container
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  
  // Field
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
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
  fieldPlaceholder: {
    color: '#8E8E93',
  },
  fieldTextDisabled: {
    color: '#8E8E93',
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
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalContent: {
    flex: 1,
  },
  
  // Modal Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 44,
    alignItems: 'flex-start',
  },
  cancelButton: {
    width: 60,
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  doneButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  doneButtonTextDisabled: {
    color: '#C7C7CC',
  },
  
  // Month/Year Navigation
  monthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    padding: 8,
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  
  // Year Display
  yearDisplay: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  yearDisplayText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  
  // Calendar Container
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  
  // Calendar Grid
  calendarGrid: {
    width: '100%',
  },
  dayHeadersRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayContent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayContentSelected: {
    backgroundColor: '#007AFF',
  },
  dayContentToday: {
    backgroundColor: '#F2F2F7',
  },
  dayText: {
    fontSize: 16,
    color: '#000',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextToday: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: '#C7C7CC',
  },
  
  // Today Button
  todayButton: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  todayButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  
  // Year Picker
  yearPicker: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  yearPickerContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  yearItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 4,
  },
  yearItemSelected: {
    backgroundColor: '#007AFF',
  },
  yearItemCurrent: {
    backgroundColor: '#F2F2F7',
  },
  yearText: {
    fontSize: 18,
    color: '#000',
  },
  yearTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  yearTextCurrent: {
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // Month Picker
  monthPicker: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  monthItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 4,
  },
  monthItemSelected: {
    backgroundColor: '#007AFF',
  },
  monthItemDisabled: {
    opacity: 0.3,
  },
  monthText: {
    fontSize: 18,
    color: '#000',
  },
  monthTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  monthTextDisabled: {
    color: '#8E8E93',
  },
});