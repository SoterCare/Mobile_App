/**
 * VitalsChartCard — Body Temperature only
 *
 * - No metric selector (single metric)
 * - Loading shimmer, empty state, error+retry
 * - Inline AreaLineChart
 * - Expand button → full-screen modal forced into landscape
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Shadows } from '@/theme/shadows';
import { Colors, Radius } from '@/theme/tokens';
import AreaLineChart from './AreaLineChart';
import { VitalDataPoint, PeriodType } from '@/data/mockVitals';

interface VitalsChartCardProps {
  data: VitalDataPoint[];
  unit: string;
  yAxisLabel: string;
  minValue: number;
  maxValue: number;
  period: PeriodType;
  /** Human-readable label shown in the card header */
  periodLabel: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  style?: ViewStyle;
}

// ── Shimmer ──────────────────────────────────────────────────────────────────
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

// ── Main ─────────────────────────────────────────────────────────────────────
const VitalsChartCard: React.FC<VitalsChartCardProps> = ({
  data,
  unit,
  yAxisLabel,
  minValue,
  maxValue,
  period,
  periodLabel,
  isLoading,
  error,
  onRetry,
  style,
}) => {
  const [fullscreen, setFullscreen] = useState(false);

  const allNull = data.length > 0 && data.every(d => d.value === null || d.value === undefined);
  const isEmpty = !isLoading && !error && (data.length === 0 || allNull);

  const openFullscreen = async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } catch (_) {}
    setFullscreen(true);
  };

  const closeFullscreen = async () => {
    setFullscreen(false);
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } catch (_) {}
  };

  return (
    <View style={[styles.container, Shadows.card, style]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerMetric}>Body Temperature</Text>
          <Text style={styles.headerLabel}>{periodLabel}</Text>
        </View>
        {!isLoading && !error && !isEmpty && (
          <TouchableOpacity
            onPress={openFullscreen}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="expand-outline" size={18} color="#9AABB8" />
          </TouchableOpacity>
        )}
      </View>

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
          <Ionicons name="thermometer-outline" size={30} color="#C5D0D8" />
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

      {/* ── Full-screen landscape modal ── */}
      <Modal
        visible={fullscreen}
        animationType="fade"
        transparent={false}
        supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={closeFullscreen}
      >
        <SafeAreaView style={styles.fsBg} edges={['top', 'left', 'right', 'bottom']}>
          {/* Modal header */}
          <View style={styles.fsHeader}>
            <View>
              <Text style={styles.fsTitle}>Body Temperature</Text>
              <Text style={styles.fsSub}>{periodLabel}</Text>
            </View>
            <TouchableOpacity
              onPress={closeFullscreen}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#4A4A4A" />
            </TouchableOpacity>
          </View>

          {/* Larger landscape chart */}
          <View style={styles.fsChartWrap}>
            {isEmpty ? (
              <View style={styles.stateBox}>
                <Ionicons name="thermometer-outline" size={30} color="#C5D0D8" />
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
                height={260}
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

// ── Styles ───────────────────────────────────────────────────────────────────
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
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  headerMetric: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 2,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9AABB8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: '#FEE2E2',
  },
  retryText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  // Fullscreen
  fsBg: {
    flex: 1,
    backgroundColor: Colors.screenBg,
  },
  fsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  fsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#EF4444',
  },
  fsSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  fsChartWrap: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
});
