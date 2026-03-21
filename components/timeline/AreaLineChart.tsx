/**
 * AreaLineChart component using react-native-svg and d3-shape
 * Renders a smooth area chart with gradient fill and line
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
  Line,
  Circle,
} from 'react-native-svg';
import { line, area, curveMonotoneX } from 'd3-shape';
import { TimelineColors } from '../../theme/colors';
import { VitalDataPoint } from '../../data/mockVitals';

interface AreaLineChartProps {
  data: VitalDataPoint[];
  yAxisLabel: string;
  minValue: number;
  maxValue: number;
  height?: number;
}

const PADDING = { top: 20, right: 20, bottom: 30, left: 45 };
const X_AXIS_LABELS = ['00:00', '06:00', '12:00', '18:00', '24:00'];

const AreaLineChart: React.FC<AreaLineChartProps> = ({
  data,
  yAxisLabel,
  minValue,
  maxValue,
  height = 180,
}) => {
  const [chartWidth, setChartWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setChartWidth(width);
  }, []);

  if (chartWidth === 0 || data.length === 0) {
    return (
      <View style={[styles.container, { height }]} onLayout={onLayout}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  const contentWidth = chartWidth - PADDING.left - PADDING.right;
  const contentHeight = height - PADDING.top - PADDING.bottom;

  // Calculate dynamic max and min to prevent SVG values shooting out of bounds
  const validValues = data.filter(d => d.value !== null && d.value !== undefined).map(d => Number(d.value));
  const actualMaxValue = validValues.length > 0 ? Math.max(maxValue, ...validValues) : maxValue;
  const actualMinValue = validValues.length > 0 ? Math.min(minValue, ...validValues) : minValue;

  // Scale functions
  const xScale = (index: number): number => {
    return PADDING.left + (index / (data.length - 1)) * contentWidth;
  };

  const yScale = (value: number): number => {
    // Prevent division by zero if max and min are equal
    const range = actualMaxValue - actualMinValue;
    const safeRange = range === 0 ? 1 : range;
    const normalized = (value - actualMinValue) / safeRange;
    return PADDING.top + contentHeight * (1 - normalized);
  };

  // Generate a valid subset of data to bridge gaps where telemetry nulls appear (interpolates curve over blanks)
  const validData = data
    .map((d, index) => ({ ...d, originalIndex: index }))
    .filter(d => d.value !== null && d.value !== undefined);

  // Generate line path connecting valid points
  const lineGenerator = line<typeof validData[0]>()
    .x((d) => xScale(d.originalIndex))
    .y((d) => yScale(Number(d.value)))
    .curve(curveMonotoneX);

  const linePath = lineGenerator(validData) || '';

  // Generate area path connecting valid points
  const areaGenerator = area<typeof validData[0]>()
    .x((d) => xScale(d.originalIndex))
    .y0(PADDING.top + contentHeight)
    .y1((d) => yScale(Number(d.value)))
    .curve(curveMonotoneX);

  const areaPath = areaGenerator(validData) || '';

  // Y-axis labels (3 values: min, mid, max)
  const yAxisValues = [
    actualMaxValue,
    (actualMaxValue + actualMinValue) / 2,
    actualMinValue,
  ];

  // Calculate x positions for time labels
  const getXLabelPosition = (label: string): number => {
    const labelMap: Record<string, number> = {
      '00:00': 0,
      '06:00': 0.25,
      '12:00': 0.5,
      '18:00': 0.75,
      '24:00': 1,
    };
    const ratio = labelMap[label] ?? 0;
    return PADDING.left + ratio * contentWidth;
  };

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      {/* Y-axis label */}
      <View style={styles.yAxisLabelContainer}>
        <Text style={styles.yAxisLabel}>{yAxisLabel}</Text>
      </View>

      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={TimelineColors.chartLineRed} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={TimelineColors.chartLineRed} stopOpacity={0.05} />
          </LinearGradient>
        </Defs>

        {/* Grid lines (horizontal) */}
        {yAxisValues.map((value, index) => {
          const y = yScale(value);
          return (
            <Line
              key={`grid-${index}`}
              x1={PADDING.left}
              y1={y}
              x2={chartWidth - PADDING.right}
              y2={y}
              stroke={TimelineColors.borderLight}
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.5}
            />
          );
        })}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <Path
          d={linePath}
          stroke={TimelineColors.chartLineRed}
          strokeWidth={2.5}
          fill="none"
        />

        {/* Data Point Markers */}
        <G>
          {data.map((d, i) => {
            if (d.value === null || d.value === undefined) return null;
            return (
              <Circle
                key={`point-${i}`}
                cx={xScale(i)}
                cy={yScale(d.value)}
                r={3}
                fill={TimelineColors.chartLineRed}
              />
            );
          })}
        </G>

        {/* Y-axis values */}
        <G>
          {yAxisValues.map((value, index) => {
            const y = yScale(value);
            const displayValue = value % 1 === 0 ? value.toString() : value.toFixed(1);
            return (
              <SvgText
                key={`y-label-${index}`}
                x={PADDING.left - 8}
                y={y + 4}
                fontSize={10}
                fill={TimelineColors.textLight}
                textAnchor="end"
              >
                {displayValue}
              </SvgText>
            );
          })}
        </G>

        {/* X-axis labels */}
        <G>
          {X_AXIS_LABELS.map((label, index) => {
            const x = getXLabelPosition(label);
            return (
              <SvgText
                key={`x-label-${index}`}
                x={x}
                y={height - 8}
                fontSize={10}
                fill={TimelineColors.textLight}
                textAnchor="middle"
              >
                {label === '24:00' ? '24:00' : label}
              </SvgText>
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    backgroundColor: TimelineColors.background,
    borderRadius: 8,
  },
  yAxisLabelContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 30,
    width: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  yAxisLabel: {
    fontSize: 9,
    color: TimelineColors.textLight,
    transform: [{ rotate: '-90deg' }],
    width: 100,
    textAlign: 'center',
  },
});

export default AreaLineChart;
