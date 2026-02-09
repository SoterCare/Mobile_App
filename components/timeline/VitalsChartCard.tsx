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
          <TouchableOpacity
            onPress={onExpand}
            style={styles.expandButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="expand-outline"
              size={16}
              color={TimelineColors.textLight}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chart */}
      <AreaLineChart
        data={data}
        yAxisLabel={yAxisLabel}
        minValue={minValue}
        maxValue={maxValue}
        height={160}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: TimelineColors.cardBackground,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
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
    fontSize: 11,
    color: TimelineColors.textLight,
  },
  expandButton: {
    padding: 4,
  },
});

export default VitalsChartCard;
