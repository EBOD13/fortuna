// src/components/charts/ChartComponents.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

export type DataPoint = {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number;
  secondaryColor?: string;
  icon?: string;
  metadata?: Record<string, any>;
};

export type TrendDirection = 'up' | 'down' | 'stable';

// ============================================================================
// PROGRESS CIRCLE
// ============================================================================

export type ProgressCircleProps = {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  centerContent?: React.ReactNode;
  label?: string;
};

export function ProgressCircle({
  progress,
  size = 120,
  strokeWidth = 10,
  color = '#046C4E',
  backgroundColor = '#E5E5EA',
  showPercentage = true,
  centerContent,
  label,
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const progressOffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <View style={[styles.progressCircleContainer, { width: size, height: size }]}>
      {/* Background Circle */}
      <View
        style={[
          styles.progressCircleTrack,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          },
        ]}
      />
      {/* Progress Arc - Simplified with border */}
      <View
        style={[
          styles.progressCircleProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: clampedProgress > 50 ? color : 'transparent',
            borderLeftColor: clampedProgress > 75 ? color : 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      {/* Center Content */}
      <View style={styles.progressCircleCenter}>
        {centerContent || (
          showPercentage && (
            <Text style={[styles.progressCircleText, { fontSize: size * 0.22 }]}>
              {Math.round(clampedProgress)}%
            </Text>
          )
        )}
        {label && <Text style={styles.progressCircleLabel}>{label}</Text>}
      </View>
    </View>
  );
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

export type ProgressBarProps = {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  segments?: { value: number; color: string; label?: string }[];
  overflowColor?: string;
};

export function ProgressBar({
  progress,
  height = 8,
  color = '#046C4E',
  backgroundColor = '#E5E5EA',
  showLabel = false,
  label,
  segments,
  overflowColor = '#DC2626',
}: ProgressBarProps) {
  const isOverflow = progress > 100;
  const displayProgress = Math.min(progress, 100);

  if (segments && segments.length > 0) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    
    return (
      <View style={styles.progressBarContainer}>
        {showLabel && (
          <View style={styles.progressBarLabelRow}>
            <Text style={styles.progressBarLabel}>{label}</Text>
            <Text style={styles.progressBarValue}>{Math.round(progress)}%</Text>
          </View>
        )}
        <View style={[styles.progressBarTrack, { height, backgroundColor }]}>
          {segments.map((segment, index) => {
            const width = total > 0 ? (segment.value / total) * 100 : 0;
            const previousWidth = segments
              .slice(0, index)
              .reduce((sum, s) => sum + (total > 0 ? (s.value / total) * 100 : 0), 0);
            
            return (
              <View
                key={index}
                style={[
                  styles.progressBarSegment,
                  {
                    width: `${width}%`,
                    left: `${previousWidth}%`,
                    backgroundColor: segment.color,
                    height,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.progressBarContainer}>
      {showLabel && (
        <View style={styles.progressBarLabelRow}>
          <Text style={styles.progressBarLabel}>{label}</Text>
          <Text style={[
            styles.progressBarValue,
            isOverflow ? { color: overflowColor } : null
          ]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
      <View style={[styles.progressBarTrack, { height, backgroundColor }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${displayProgress}%`,
              backgroundColor: isOverflow ? overflowColor : color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ============================================================================
// BAR CHART
// ============================================================================

export type BarChartProps = {
  data: DataPoint[];
  height?: number;
  barWidth?: number;
  spacing?: number;
  showValues?: boolean;
  showLabels?: boolean;
  horizontal?: boolean;
  maxValue?: number;
  color?: string;
  stacked?: boolean;
};

export function BarChart({
  data,
  height = 150,
  barWidth = 32,
  spacing = 12,
  showValues = false,
  showLabels = true,
  horizontal = false,
  maxValue,
  color = '#046C4E',
  stacked = false,
}: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value + (d.secondaryValue || 0))) * 1.1;
  const chartWidth = data.length * (barWidth + spacing);

  if (horizontal) {
    return (
      <View style={styles.horizontalBarChart}>
        {data.map((item, index) => {
          const barLength = max > 0 ? (item.value / max) * 100 : 0;
          
          return (
            <View key={index} style={styles.horizontalBarRow}>
              <Text style={styles.horizontalBarLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <View style={styles.horizontalBarTrack}>
                <View
                  style={[
                    styles.horizontalBarFill,
                    {
                      width: `${barLength}%`,
                      backgroundColor: item.color || color,
                      height: barWidth * 0.6,
                    },
                  ]}
                />
              </View>
              {showValues && (
                <Text style={styles.horizontalBarValue}>
                  {typeof item.value === 'number' && item.value >= 1000
                    ? `$${(item.value / 1000).toFixed(1)}k`
                    : `$${item.value}`}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.barChartContainer, { height: height + 30 }]}>
      <View style={[styles.barChartContent, { height }]}>
        {data.map((item, index) => {
          const barHeight = max > 0 ? (item.value / max) * height : 0;
          const secondaryHeight = item.secondaryValue && max > 0 
            ? (item.secondaryValue / max) * height 
            : 0;

          return (
            <View
              key={index}
              style={[styles.barWrapper, { width: barWidth, marginHorizontal: spacing / 2 }]}
            >
              {showValues && (
                <Text style={styles.barValue}>
                  {typeof item.value === 'number' && item.value >= 1000
                    ? `${(item.value / 1000).toFixed(1)}k`
                    : item.value}
                </Text>
              )}
              <View style={styles.barContainer}>
                {stacked && item.secondaryValue ? (
                  <>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: secondaryHeight,
                          backgroundColor: item.secondaryColor || '#E5E5EA',
                          width: barWidth,
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: item.color || color,
                          width: barWidth,
                        },
                      ]}
                    />
                  </>
                ) : (
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: item.color || color,
                        width: barWidth,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      },
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
      {showLabels && (
        <View style={styles.barLabels}>
          {data.map((item, index) => (
            <Text
              key={index}
              style={[styles.barLabel, { width: barWidth + spacing }]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// LINE CHART (Simplified)
// ============================================================================

export type LineChartProps = {
  data: DataPoint[];
  height?: number;
  color?: string;
  fillColor?: string;
  showDots?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
};

export function LineChart({
  data,
  height = 150,
  color = '#046C4E',
  fillColor,
  showDots = true,
  showLabels = true,
  showValues = false,
  showGrid = true,
}: LineChartProps) {
  const max = Math.max(...data.map(d => d.value)) * 1.1;
  const min = Math.min(...data.map(d => d.value)) * 0.9;
  const range = max - min || 1;
  const chartWidth = SCREEN_WIDTH - 80;
  const pointSpacing = chartWidth / (data.length - 1 || 1);

  const getY = (value: number) => {
    return height - ((value - min) / range) * height;
  };

  return (
    <View style={[styles.lineChartContainer, { height: height + 40 }]}>
      {/* Grid Lines */}
      {showGrid && (
        <View style={[styles.lineChartGrid, { height }]}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
      )}

      {/* Chart Area */}
      <View style={[styles.lineChartContent, { height }]}>
        {/* Connection Lines */}
        {data.map((item, index) => {
          if (index === 0) return null;
          const prevItem = data[index - 1];
          const x1 = (index - 1) * pointSpacing;
          const y1 = getY(prevItem.value);
          const x2 = index * pointSpacing;
          const y2 = getY(item.value);
          
          // Calculate line angle and length
          const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

          return (
            <View
              key={`line-${index}`}
              style={[
                styles.lineSegment,
                {
                  width: length,
                  left: x1,
                  top: y1,
                  backgroundColor: color,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: 'left center',
                },
              ]}
            />
          );
        })}

        {/* Data Points */}
        {showDots && data.map((item, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.dataDot,
              {
                left: index * pointSpacing - 5,
                top: getY(item.value) - 5,
                backgroundColor: color,
                borderColor: '#FFFFFF',
              },
            ]}
          />
        ))}

        {/* Values */}
        {showValues && data.map((item, index) => (
          <Text
            key={`value-${index}`}
            style={[
              styles.lineChartValue,
              {
                left: index * pointSpacing - 20,
                top: getY(item.value) - 22,
              },
            ]}
          >
            ${item.value}
          </Text>
        ))}
      </View>

      {/* Labels */}
      {showLabels && (
        <View style={styles.lineChartLabels}>
          {data.map((item, index) => (
            <Text
              key={`label-${index}`}
              style={[
                styles.lineChartLabel,
                { left: index * pointSpacing - 15, width: 30 },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// PIE/DONUT CHART
// ============================================================================

export type PieChartProps = {
  data: DataPoint[];
  size?: number;
  donut?: boolean;
  donutWidth?: number;
  showLegend?: boolean;
  showPercentages?: boolean;
  centerContent?: React.ReactNode;
};

export function PieChart({
  data,
  size = 160,
  donut = true,
  donutWidth = 24,
  showLegend = true,
  showPercentages = false,
  centerContent,
}: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const defaultColors = ['#046C4E', '#2563EB', '#7C3AED', '#F59E0B', '#DC2626', '#EC4899', '#0891B2'];
  
  // Calculate segments
  let currentAngle = 0;
  const segments = data.map((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: item.color || defaultColors[index % defaultColors.length],
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <View style={styles.pieChartContainer}>
      <View style={[styles.pieChart, { width: size, height: size }]}>
        {/* Segments - Simplified conic representation */}
        {segments.map((segment, index) => {
          const rotation = segment.startAngle;
          const segmentAngle = segment.endAngle - segment.startAngle;
          
          // For simplicity, render quadrant-based segments
          if (segmentAngle <= 0) return null;
          
          return (
            <View
              key={index}
              style={[
                styles.pieSegment,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: donut ? donutWidth : size / 2,
                  borderColor: 'transparent',
                  borderTopColor: segment.color,
                  borderRightColor: segmentAngle > 90 ? segment.color : 'transparent',
                  borderBottomColor: segmentAngle > 180 ? segment.color : 'transparent',
                  borderLeftColor: segmentAngle > 270 ? segment.color : 'transparent',
                  transform: [{ rotate: `${rotation - 90}deg` }],
                },
              ]}
            />
          );
        })}
        
        {/* Donut Center */}
        {donut && (
          <View style={[
            styles.pieCenter,
            { 
              width: size - donutWidth * 2, 
              height: size - donutWidth * 2,
              borderRadius: (size - donutWidth * 2) / 2,
            }
          ]}>
            {centerContent}
          </View>
        )}
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={styles.pieLegend}>
          {segments.map((segment, index) => (
            <View key={index} style={styles.pieLegendItem}>
              <View style={[styles.pieLegendDot, { backgroundColor: segment.color }]} />
              <Text style={styles.pieLegendLabel} numberOfLines={1}>
                {segment.label}
              </Text>
              {showPercentages && (
                <Text style={styles.pieLegendValue}>
                  {segment.percentage.toFixed(0)}%
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// SPENDING BREAKDOWN CHART
// ============================================================================

export type SpendingBreakdownProps = {
  data: {
    category: string;
    amount: number;
    budget?: number;
    color: string;
    icon: string;
    trend?: TrendDirection;
    trendValue?: number;
  }[];
  showBudget?: boolean;
  maxItems?: number;
};

export function SpendingBreakdown({
  data,
  showBudget = true,
  maxItems = 5,
}: SpendingBreakdownProps) {
  const sortedData = [...data].sort((a, b) => b.amount - a.amount).slice(0, maxItems);
  const maxAmount = Math.max(...sortedData.map(d => Math.max(d.amount, d.budget || 0)));

  return (
    <View style={styles.spendingBreakdown}>
      {sortedData.map((item, index) => {
        const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
        const budgetPercentage = item.budget && maxAmount > 0 
          ? (item.budget / maxAmount) * 100 
          : 0;
        const isOverBudget = item.budget && item.amount > item.budget;

        return (
          <View key={index} style={styles.spendingBreakdownItem}>
            <View style={styles.spendingBreakdownHeader}>
              <View style={styles.spendingBreakdownLeft}>
                <View style={[styles.spendingBreakdownIcon, { backgroundColor: item.color + '15' }]}>
                  <SFSymbol name={item.icon} size={16} color={item.color} />
                </View>
                <Text style={styles.spendingBreakdownCategory}>{item.category}</Text>
              </View>
              <View style={styles.spendingBreakdownRight}>
                <Text style={[
                  styles.spendingBreakdownAmount,
                  isOverBudget ? { color: '#DC2626' } : null
                ]}>
                  ${item.amount.toLocaleString()}
                </Text>
                {item.trend && (
                  <View style={[
                    styles.trendBadge,
                    { backgroundColor: item.trend === 'up' ? '#FEF2F2' : '#D1FAE5' }
                  ]}>
                    <SFSymbol 
                      name={item.trend === 'up' ? 'arrow.up' : item.trend === 'down' ? 'arrow.down' : 'minus'} 
                      size={8} 
                      color={item.trend === 'up' ? '#DC2626' : '#046C4E'} 
                    />
                    {item.trendValue && (
                      <Text style={[
                        styles.trendValue,
                        { color: item.trend === 'up' ? '#DC2626' : '#046C4E' }
                      ]}>
                        {item.trendValue}%
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.spendingBreakdownBar}>
              {showBudget && item.budget && (
                <View
                  style={[
                    styles.spendingBreakdownBudgetLine,
                    { left: `${budgetPercentage}%` },
                  ]}
                />
              )}
              <View
                style={[
                  styles.spendingBreakdownFill,
                  {
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: isOverBudget ? '#DC2626' : item.color,
                  },
                ]}
              />
            </View>
            
            {showBudget && item.budget && (
              <Text style={styles.spendingBreakdownBudgetText}>
                Budget: ${item.budget.toLocaleString()}
                {isOverBudget && (
                  <Text style={{ color: '#DC2626' }}>
                    {' '}(${(item.amount - item.budget).toLocaleString()} over)
                  </Text>
                )}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// TREND INDICATOR
// ============================================================================

export type TrendIndicatorProps = {
  value: number;
  direction: TrendDirection;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  positiveIsGood?: boolean;
};

export function TrendIndicator({
  value,
  direction,
  label,
  size = 'medium',
  positiveIsGood = false,
}: TrendIndicatorProps) {
  const isGood = positiveIsGood ? direction === 'up' : direction === 'down';
  const color = direction === 'stable' ? '#8E8E93' : isGood ? '#046C4E' : '#DC2626';
  const bgColor = direction === 'stable' ? '#F2F2F7' : isGood ? '#D1FAE5' : '#FEF2F2';
  
  const sizeConfig = {
    small: { padding: 4, fontSize: 10, iconSize: 8 },
    medium: { padding: 6, fontSize: 12, iconSize: 10 },
    large: { padding: 8, fontSize: 14, iconSize: 12 },
  };
  
  const config = sizeConfig[size];

  return (
    <View style={[
      styles.trendIndicator,
      { backgroundColor: bgColor, padding: config.padding }
    ]}>
      <SFSymbol 
        name={direction === 'up' ? 'arrow.up' : direction === 'down' ? 'arrow.down' : 'minus'} 
        size={config.iconSize} 
        color={color} 
      />
      <Text style={[styles.trendIndicatorValue, { fontSize: config.fontSize, color }]}>
        {value}%
      </Text>
      {label && (
        <Text style={[styles.trendIndicatorLabel, { fontSize: config.fontSize - 2 }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

export type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  trend?: {
    direction: TrendDirection;
    value: number;
    label?: string;
  };
  size?: 'small' | 'medium' | 'large';
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = '#046C4E',
  trend,
  size = 'medium',
}: StatCardProps) {
  const sizeConfig = {
    small: { titleSize: 11, valueSize: 18, padding: 12 },
    medium: { titleSize: 12, valueSize: 24, padding: 16 },
    large: { titleSize: 14, valueSize: 32, padding: 20 },
  };
  
  const config = sizeConfig[size];

  return (
    <View style={[styles.statCard, { padding: config.padding }]}>
      <View style={styles.statCardHeader}>
        {icon && (
          <View style={[styles.statCardIcon, { backgroundColor: iconColor + '15' }]}>
            <SFSymbol name={icon} size={14} color={iconColor} />
          </View>
        )}
        <Text style={[styles.statCardTitle, { fontSize: config.titleSize }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.statCardValue, { fontSize: config.valueSize }]}>
        {value}
      </Text>
      {(subtitle || trend) && (
        <View style={styles.statCardFooter}>
          {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
          {trend && (
            <TrendIndicator 
              value={trend.value} 
              direction={trend.direction}
              label={trend.label}
              size="small"
            />
          )}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// MINI SPARKLINE
// ============================================================================

export type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showEndDot?: boolean;
};

export function Sparkline({
  data,
  width = 60,
  height = 24,
  color = '#046C4E',
  showEndDot = true,
}: SparklineProps) {
  if (data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pointSpacing = width / (data.length - 1);

  const getY = (value: number) => {
    return height - ((value - min) / range) * height;
  };

  return (
    <View style={[styles.sparklineContainer, { width, height }]}>
      {data.map((value, index) => {
        if (index === 0) return null;
        const prevValue = data[index - 1];
        const x1 = (index - 1) * pointSpacing;
        const y1 = getY(prevValue);
        const x2 = index * pointSpacing;
        const y2 = getY(value);
        
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

        return (
          <View
            key={index}
            style={[
              styles.sparklineLine,
              {
                width: length,
                left: x1,
                top: y1,
                backgroundColor: color,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: 'left center',
              },
            ]}
          />
        );
      })}
      {showEndDot && (
        <View
          style={[
            styles.sparklineDot,
            {
              left: (data.length - 1) * pointSpacing - 3,
              top: getY(data[data.length - 1]) - 3,
              backgroundColor: color,
            },
          ]}
        />
      )}
    </View>
  );
}

// ============================================================================
// COMPARISON BAR
// ============================================================================

export type ComparisonBarProps = {
  label: string;
  currentValue: number;
  previousValue: number;
  currentLabel?: string;
  previousLabel?: string;
  currentColor?: string;
  previousColor?: string;
  format?: (value: number) => string;
};

export function ComparisonBar({
  label,
  currentValue,
  previousValue,
  currentLabel = 'Current',
  previousLabel = 'Previous',
  currentColor = '#046C4E',
  previousColor = '#C7C7CC',
  format = (v) => `$${v.toLocaleString()}`,
}: ComparisonBarProps) {
  const max = Math.max(currentValue, previousValue);
  const currentWidth = max > 0 ? (currentValue / max) * 100 : 0;
  const previousWidth = max > 0 ? (previousValue / max) * 100 : 0;
  const change = previousValue > 0 
    ? ((currentValue - previousValue) / previousValue) * 100 
    : 0;

  return (
    <View style={styles.comparisonBar}>
      <View style={styles.comparisonBarHeader}>
        <Text style={styles.comparisonBarLabel}>{label}</Text>
        <TrendIndicator
          value={Math.abs(Math.round(change))}
          direction={change > 0 ? 'up' : change < 0 ? 'down' : 'stable'}
          size="small"
        />
      </View>
      
      <View style={styles.comparisonBarRow}>
        <Text style={styles.comparisonBarPeriod}>{currentLabel}</Text>
        <View style={styles.comparisonBarTrack}>
          <View
            style={[
              styles.comparisonBarFill,
              { width: `${currentWidth}%`, backgroundColor: currentColor },
            ]}
          />
        </View>
        <Text style={styles.comparisonBarValue}>{format(currentValue)}</Text>
      </View>
      
      <View style={styles.comparisonBarRow}>
        <Text style={styles.comparisonBarPeriod}>{previousLabel}</Text>
        <View style={styles.comparisonBarTrack}>
          <View
            style={[
              styles.comparisonBarFill,
              { width: `${previousWidth}%`, backgroundColor: previousColor },
            ]}
          />
        </View>
        <Text style={[styles.comparisonBarValue, { color: '#8E8E93' }]}>
          {format(previousValue)}
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// WEEK HEATMAP
// ============================================================================

export type WeekHeatmapProps = {
  data: { day: string; value: number; label?: string }[];
  maxValue?: number;
  color?: string;
  showLabels?: boolean;
};

export function WeekHeatmap({
  data,
  maxValue,
  color = '#046C4E',
  showLabels = true,
}: WeekHeatmapProps) {
  const max = maxValue || Math.max(...data.map(d => d.value));
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.weekHeatmap}>
      {data.map((item, index) => {
        const intensity = max > 0 ? item.value / max : 0;
        const opacity = 0.15 + intensity * 0.85;

        return (
          <View key={index} style={styles.weekHeatmapDay}>
            <View
              style={[
                styles.weekHeatmapCell,
                { backgroundColor: color, opacity },
              ]}
            />
            {showLabels && (
              <Text style={styles.weekHeatmapLabel}>
                {item.label || days[index]}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Progress Circle
  progressCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleTrack: {
    position: 'absolute',
  },
  progressCircleProgress: {
    position: 'absolute',
  },
  progressCircleCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleText: {
    fontWeight: '700',
    color: '#000',
  },
  progressCircleLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Progress Bar
  progressBarContainer: {
    width: '100%',
  },
  progressBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBarLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressBarValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  progressBarTrack: {
    width: '100%',
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    borderRadius: 4,
  },
  progressBarSegment: {
    position: 'absolute',
    top: 0,
  },

  // Bar Chart
  barChartContainer: {
    width: '100%',
  },
  barChartContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  barWrapper: {
    alignItems: 'center',
  },
  barValue: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 4,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 2,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  barLabel: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
  },
  horizontalBarChart: {
    gap: 12,
  },
  horizontalBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalBarLabel: {
    width: 70,
    fontSize: 12,
    color: '#6B7280',
  },
  horizontalBarTrack: {
    flex: 1,
    height: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  horizontalBarFill: {
    borderRadius: 4,
  },
  horizontalBarValue: {
    width: 50,
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
  },

  // Line Chart
  lineChartContainer: {
    width: '100%',
    position: 'relative',
  },
  lineChartGrid: {
    position: 'absolute',
    width: '100%',
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F2F2F7',
    width: '100%',
  },
  lineChartContent: {
    position: 'relative',
    marginHorizontal: 20,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
  },
  dataDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  lineChartValue: {
    position: 'absolute',
    fontSize: 10,
    color: '#6B7280',
    width: 40,
    textAlign: 'center',
  },
  lineChartLabels: {
    position: 'relative',
    height: 20,
    marginTop: 8,
    marginHorizontal: 20,
  },
  lineChartLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Pie Chart
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChart: {
    position: 'relative',
  },
  pieSegment: {
    position: 'absolute',
  },
  pieCenter: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  pieLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pieLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pieLegendLabel: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: 80,
  },
  pieLegendValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },

  // Spending Breakdown
  spendingBreakdown: {
    gap: 16,
  },
  spendingBreakdownItem: {
    gap: 8,
  },
  spendingBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spendingBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spendingBreakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spendingBreakdownCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  spendingBreakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spendingBreakdownAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  trendValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  spendingBreakdownBar: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  spendingBreakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  spendingBreakdownBudgetLine: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: '#000',
    borderRadius: 1,
  },
  spendingBreakdownBudgetText: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Trend Indicator
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    gap: 3,
  },
  trendIndicatorValue: {
    fontWeight: '600',
  },
  trendIndicatorLabel: {
    color: '#8E8E93',
  },

  // Stat Card
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardTitle: {
    color: '#8E8E93',
    fontWeight: '500',
  },
  statCardValue: {
    fontWeight: '700',
    color: '#000',
  },
  statCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statCardSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // Sparkline
  sparklineContainer: {
    position: 'relative',
  },
  sparklineLine: {
    position: 'absolute',
    height: 1.5,
  },
  sparklineDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Comparison Bar
  comparisonBar: {
    gap: 8,
  },
  comparisonBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  comparisonBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  comparisonBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparisonBarPeriod: {
    width: 60,
    fontSize: 11,
    color: '#8E8E93',
  },
  comparisonBarTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    overflow: 'hidden',
  },
  comparisonBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  comparisonBarValue: {
    width: 60,
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
  },

  // Week Heatmap
  weekHeatmap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  weekHeatmapDay: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  weekHeatmapCell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
  },
  weekHeatmapLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
});