/**
 * VitalsChartCard
 *
 * Contains:
 *  - Period label in header
 *  - Metric selector chips (Body Temp / Room Temp / Moisture)
 *  - Loading shimmer, empty state, error+retry
 *  - Inline AreaLineChart
 *  - Expand button → full-screen modal
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Shadows } from '@/theme/shadows';
import { Colors, Radius } from '@/theme/tokens';
import AreaLineChart from './AreaLineChart';
import { VitalDataPoint, MetricType, PeriodType, METRIC_CONFIG } from '@/data/mockVitals';

interface VitalsChartCardProps {
  data: VitalDataPoint[];
  unit: string;
  yAxisLabel: string;
  minValue: number;
  maxValue: number;
  period: PeriodType;
  /** Human-readable label shown in the card header, e.g. "Jun 12 2026" */
  periodLabel: string;
  selectedMetric: MetricType;
  onMetricChange: (m: MetricType) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  style?: ViewStyle;
}

// ── Shimmer placeholder ─────────────────────────────────────────────────────
const Shimmer = ({ height }: { height: number }) => {
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.85, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return <Animated.View style={[styles.shimmer, { height, opacity: anim }]} />;
};

// ── Main component ──────────────────────────────────────────────────────────
const VitalsChartCard: React.FC<VitalsChartCardProps> = ({
  data,
  unit,
  yAxisLabel,
  minValue,
  maxValue,
  period,
  periodLabel,
  selectedMetric,
  onMetricChange,
  isLoading,
  error,
  onRetry,
  style,
}) => {
  const [fullscreen, setFullscreen] = useState(false);

  const allNull = data.length > 0 && data.every(d => d.value === null || d.value === undefined);
  const isEmpty = !isLoading && !error && (data.length === 0 || allNull);

  const METRIC_KEYS = Object.keys(METRIC_CONFIG) as MetricType[];

  return (
    <View style={[styles.container, Shadows.card, style]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{periodLabel}</Text>
        {!isLoading && !error && !isEmpty && (
          <TouchableOpacity
            onPress={() => setFullscreen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="expand-outline" size={16} color="#9AABB8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Metric chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {METRIC_KEYS.map(key => {
          const cfg = METRIC_CONFIG[key];
          const active = selectedMetric === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onMetricChange(key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Chart / state area ── */}
      {isLoading ? (
        <Shimmer height={180} />
      ) : error ? (
        <View style={styles.stateBox}>
          <Ionicons name="cloud-offline-outline" size={30} color="#C5D0D8" />
          <Text style={styles.stateText}>Could not load data.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : isEmpty ? (
        <View style={styles.stateBox}>
          <Ionicons name="stats-chart-outline" size={30} color="#C5D0D8" />
          <Text style={styles.stateText}>No readings for this period</Text>
        </View>
      ) : (
        <AreaLineChart
          data={data}
          unit={unit}
          yAxisLabel={yAxisLabel}
          minValue={minValue}
          maxValue={maxValue}
          period={period}
          height={180}
        />
      )}

      {/* ── Full-screen modal ── */}
      <Modal
        visible={fullscreen}
        animationType="fade"
        transparent={false}
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => setFullscreen(false)}
      >
        <SafeAreaView style={styles.fsBg} edges={['top', 'left', 'right', 'bottom']}>
          {/* Modal header */}
          <View style={styles.fsHeader}>
            <View>
              <Text style={styles.fsTitle}>{yAxisLabel}</Text>
              <Text style={styles.fsSub}>{periodLabel}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setFullscreen(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#4A4A4A" />
            </TouchableOpacity>
          </View>

          {/* Metric chips in fullscreen too */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chipRow, { paddingHorizontal: 20 }]}
            style={{ marginBottom: 12 }}
          >
            {METRIC_KEYS.map(key => {
              const cfg = METRIC_CONFIG[key];
              const active = selectedMetric === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => { onMetricChange(key); }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Larger chart */}
          <View style={styles.fsChartWrap}>
            {isEmpty ? (
              <View style={styles.stateBox}>
                <Ionicons name="stats-chart-outline" size={30} color="#C5D0D8" />
                <Text style={styles.stateText}>No readings for this period</Text>
              </View>
            ) : (
              <AreaLineChart
                data={data}
                unit={unit}
                yAxisLabel={yAxisLabel}
                minValue={minValue}
                maxValue={maxValue}
                period={period}
                height={320}
                dense
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default VitalsChartCard;

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 8,
    marginHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9AABB8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chipScroll: {
    marginBottom: 12,
  },
  chipRow: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#DDE5EA',
    backgroundColor: '#F7FAFB',
  },
  chipActive: {
    backgroundColor: Colors.brandTint,
    borderColor: Colors.brand,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7B88',
  },
  chipTextActive: {
    color: Colors.brandDark,
    fontWeight: '700',
  },
  shimmer: {
    backgroundColor: '#E4EAF0',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  stateBox: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stateText: {
    fontSize: 13,
    color: '#A0ACB8',
    fontWeight: '500',
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.brandTint,
  },
  retryText: {
    fontSize: 13,
    color: Colors.brandDark,
    fontWeight: '600',
  },
  // Fullscreen modal
  fsBg: {
    flex: 1,
    backgroundColor: Colors.screenBg,
  },
  fsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  fsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  fsSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  fsChartWrap: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
});
