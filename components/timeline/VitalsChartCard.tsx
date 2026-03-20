/**
 * VitalsChartCard component
 * White rounded card containing the chart with header text and expand action
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimelineColors } from '../../theme/colors';
import { Shadows } from '../../theme/shadows';
import AreaLineChart from './AreaLineChart';
import { VitalDataPoint } from '../../data/mockVitals';

interface VitalsChartCardProps {
  data: VitalDataPoint[];
  yAxisLabel: string;
  minValue: number;
  maxValue: number;
  onExpand?: () => void;
  style?: ViewStyle;
}

const VitalsChartCard: React.FC<VitalsChartCardProps> = ({
  data,
  yAxisLabel,
  minValue,
  maxValue,
  onExpand,
  style,
}) => {
  return (
    <View style={[styles.container, Shadows.card, style]}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.spacer} />
        <View style={styles.headerRight}>
          <Text style={styles.headerText}>Last 24 Hours</Text>
        </View>
      </View>

      {/* Chart & Absolute Expand Button */}
      <View style={styles.chartContainer}>
        <AreaLineChart
          data={data}
          yAxisLabel={yAxisLabel}
          minValue={minValue}
          maxValue={maxValue}
          height={180}
        />
        <TouchableOpacity
          onPress={onExpand}
          style={styles.expandButtonAbsolute}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="expand-outline"
            size={14}
            color={TimelineColors.textLight}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 8,
    marginHorizontal: 4, // Reduced padding bottom
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  spacer: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
  },
  chartContainer: {
    position: 'relative',
    width: '100%',
  },
  expandButtonAbsolute: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    padding: 6,
    zIndex: 10,
  },
});

export default VitalsChartCard;
