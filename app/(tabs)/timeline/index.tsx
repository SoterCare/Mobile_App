/**
 * Timeline Screen — Vitals Statistics + Activity
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import {
  SegmentedControl,
  VitalsChartCard,
  ActivityTimeline,
  ActivityStatsCards,
} from '../../../components/timeline';
import { TimelineColors } from '../../../theme/colors';
import { Shadows } from '../../../theme/shadows';
import { Colors, Radius } from '@/theme/tokens';
import {
  PeriodType,
  ActivityEvent,
  METRIC_CONFIG,
  vitalYAxisConfig,
} from '../../../data/mockVitals';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';
import { timelineService } from '@/services/timelineService';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';

const PERIOD_OPTIONS = [
  { key: 'day',    label: 'Day'    },
  { key: 'month',  label: 'Month'  },
  { key: 'custom', label: 'Custom' },
];

const FILTER_OPTIONS = ['All', 'Falls', 'Moisture', 'SOS'];

// Always display body temp — only metric shown in the chart
const TEMP_METRIC = METRIC_CONFIG['temp'];

export default function TimelineScreen() {
  const router = useRouter();
  const { selectedDeviceId } = useRaspberryPi();

  // Live socket for chart patching (period=day, today only)
  const { vitals: liveVitals } = useRealtimeVitals(selectedDeviceId || undefined);

  const [period, setPeriod]           = useState<PeriodType>('day');
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toISOString().slice(0, 10).replace(/-/g, '/')
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7).replace(/-/g, '/')
  );
  const [selectedRange, setSelectedRange] = useState<string>('');
  const [activeFilter, setActiveFilter]   = useState('All');

  const [datePickerVisible, setDatePickerVisible]   = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [timelineDateOptions, setTimelineDateOptions] = useState<string[]>([]);

  const toDayDisplay = useCallback((iso: string) => iso.replace(/-/g, '/').slice(0, 10), []);

  const dayOptions = useMemo(
    () => (Array.isArray(timelineDateOptions) ? timelineDateOptions.map(toDayDisplay) : []),
    [timelineDateOptions, toDayDisplay]
  );
  const monthOptions = useMemo(() => {
    const unique = new Set(dayOptions.map(d => d.slice(0, 7)));
    return Array.from(unique);
  }, [dayOptions]);
  const customRangeOptions = useMemo(() => {
    if (dayOptions.length < 2) return dayOptions.length === 1 ? [`${dayOptions[0]} - ${dayOptions[0]}`] : [];
    const end   = dayOptions[dayOptions.length - 1];
    const start = dayOptions[Math.max(0, dayOptions.length - 7)];
    return [`${start} - ${end}`];
  }, [dayOptions]);

  React.useEffect(() => {
    if (!selectedDeviceId) return;
    timelineService.getDateOptions(selectedDeviceId, 'day').then(res => {
      setTimelineDateOptions(res.options || []);
    }).catch(e => console.error('Failed to load date options:', e));
  }, [selectedDeviceId]);

  React.useEffect(() => {
    if (!selectedDay   && dayOptions.length   > 0) setSelectedDay(dayOptions[dayOptions.length - 1]);
    if (!selectedMonth && monthOptions.length > 0) setSelectedMonth(monthOptions[monthOptions.length - 1]);
    if (!selectedRange && customRangeOptions.length > 0) setSelectedRange(customRangeOptions[0]);
  }, [dayOptions, monthOptions, customRangeOptions, selectedDay, selectedMonth, selectedRange]);

  // ── Chart + timeline state ───────────────────────────────────────────────
  const [vitalsData, setVitalsData]         = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<ActivityEvent[]>([]);
  const [stats, setStats]                   = useState<any>(null);
  const [isLoading, setIsLoading]           = useState(false);
  const [chartError, setChartError]         = useState<string | null>(null);

  // ── Fetch timeline data ──────────────────────────────────────────────────
  const fetchTimelineData = useCallback(async () => {
    if (!selectedDeviceId) return;

    const dateQuery =
      period === 'day'    ? selectedDay   :
      period === 'month'  ? selectedMonth :
      selectedRange;

    if (!dateQuery) return;

    let apiDate      = '';
    let apiStartDate: string | undefined;
    let apiEndDate:   string | undefined;

    if (period === 'day') {
      apiDate = selectedDay.replace(/\//g, '-');

    } else if (period === 'month') {
      const raw = selectedMonth.replace(/\//g, '-');
      apiDate = raw.length === 7 ? `${raw}-01` : raw;

    } else if (period === 'custom' && dateQuery.includes(' - ')) {
      const [start, end] = dateQuery.split(' - ');
      apiStartDate = start.replace(/\//g, '-');
      apiEndDate   = end.replace(/\//g, '-');
    }

    const formattedMonth = selectedMonth.replace(/\//g, '-');
    const apiFilter = ({ All: 'all', Falls: 'fall', Moisture: 'moisture', SOS: 'sos' } as Record<string,string>)[activeFilter] || 'all';

    setIsLoading(true);
    setChartError(null);

    try {
      const [vitalsResponse, eventsResponse, statsResponse, moistureVitalsResponse] = await Promise.all([
        timelineService.getVitalsTimeline(
          selectedDeviceId, TEMP_METRIC.apiMetric, period, apiDate, apiStartDate, apiEndDate
        ),
        timelineService.getEventsTimeline(
          selectedDeviceId, period, apiDate, apiFilter, apiStartDate, apiEndDate
        ),
        (period === 'month' || period === 'custom')
          ? timelineService.getTimelineStats(selectedDeviceId, period, apiDate, formattedMonth)
          : Promise.resolve(null),
        (period === 'month' || period === 'custom')
          ? timelineService.getVitalsTimeline(
              selectedDeviceId, 'moisture', period, apiDate, apiStartDate, apiEndDate
            ).catch(() => null)
          : Promise.resolve(null),
      ]);

      setVitalsData(vitalsResponse);
      setTimelineEvents(eventsResponse?.events || []);

      if (statsResponse || moistureVitalsResponse) {
        // Count moisture readings that exceeded 5% threshold
        const moisturePoints: any[] = moistureVitalsResponse?.points ?? [];
        const moistureCount = moisturePoints.filter(
          (p: any) => p.value !== null && p.value !== undefined && Number(p.value) > 5
        ).length;

        setStats({
          movements: statsResponse?.movements ?? 0,
          falls:     statsResponse?.falls     ?? 0,
          // prefer backend moisture count if provided, otherwise count from raw vitals > 5%
          moisture:  statsResponse?.moisture ?? (moistureCount > 0 ? moistureCount : (statsResponse?.urine ?? 0)),
        });
      }
    } catch (e) {
      console.error('Failed to fetch timeline data', e);
      setChartError('Could not load data.');
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedDeviceId, period, selectedDay, selectedMonth, selectedRange, activeFilter,
  ]);

  React.useEffect(() => { fetchTimelineData(); }, [fetchTimelineData]);

  useFocusEffect(
    useCallback(() => { fetchTimelineData(); }, [fetchTimelineData])
  );

  // ── Live socket → patch today's day-view chart in local time ────────────
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  React.useEffect(() => {
    if (period !== 'day' || !liveVitals?.timestamp) return;
    const selISO = selectedDay.replace(/\//g, '-');
    if (selISO !== todayISO) return;

    // Use LOCAL hour so it aligns with how the backend buckets day data
    const hour = new Date(liveVitals.timestamp).getHours();
    if (hour < 0 || hour > 23) return;

    const newValue = liveVitals.temperature ?? null;
    if (newValue === null) return;

    setVitalsData((prev: any) => {
      if (!prev?.points || !Array.isArray(prev.points)) return prev;
      const pts = [...prev.points];
      if (hour >= pts.length) return prev;
      const existing = pts[hour]?.value;
      pts[hour] = {
        ...pts[hour],
        value: existing !== null && existing !== undefined
          ? (Number(existing) + newValue) / 2
          : newValue,
      };
      return { ...prev, points: pts };
    });
  }, [liveVitals, period, selectedDay, todayISO]);

  // ── Derived chart data ───────────────────────────────────────────────────
  const chartData = useMemo(() => vitalsData?.points ?? [], [vitalsData]);

  const yAxisCfg = useMemo(() => {
    if (vitalsData?.yAxis) return vitalsData.yAxis;
    const fb = vitalYAxisConfig['temp'];
    return { label: fb.label, minValue: fb.minValue, maxValue: fb.maxValue };
  }, [vitalsData]);

  // ── Period label ─────────────────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    switch (period) {
      case 'day':    return selectedDay.replace(/\//g, '-');
      case 'month':  return selectedMonth.replace(/\//g, '-');
      case 'custom': return selectedRange || 'Custom range';
      default:       return selectedDay.replace(/\//g, '-');
    }
  }, [period, selectedDay, selectedMonth, selectedRange]);

  const datePickerOptions = useMemo(() => {
    switch (period) {
      case 'day':    return dayOptions;
      case 'month':  return monthOptions;
      case 'custom': return customRangeOptions;
      default:       return dayOptions;
    }
  }, [period, dayOptions, monthOptions, customRangeOptions]);

  const activityStats = useMemo(() => stats ?? { movements: 0, falls: 0, moisture: 0 }, [stats]);
  const activityTitle = useMemo(() => {
    switch (period) {
      case 'day':    return 'Activity Timeline';
      case 'month':  return 'Monthly Activity';
      case 'custom': return 'Custom Activity';
      default:       return 'Activity';
    }
  }, [period]);

  const handlePeriodChange = useCallback((key: string) => {
    setPeriod(key as PeriodType);
    setVitalsData(null);
    setChartError(null);
  }, []);

  const handleDateSelect = useCallback((option: string) => {
    switch (period) {
      case 'day':    setSelectedDay(option);   break;
      case 'month':  setSelectedMonth(option); break;
      case 'custom': setSelectedRange(option); break;
    }
    setDatePickerVisible(false);
  }, [period]);

  const handleFilterSelect = useCallback((filter: string) => {
    setActiveFilter(filter);
    setFilterModalVisible(false);
  }, []);

  const handleTrashPress = useCallback(() => {
    router.push('/(tabs)/timeline/recycle-bin');
  }, [router]);

  const swipeHandlers = useSwipeTabs();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']} {...(swipeHandlers as any)}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>
          {/* ── Top row ── */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => router.push('/export-report' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.exportButtonText}>Export Report</Text>
              <Ionicons name="chevron-forward" size={14} color={TimelineColors.textMedium} />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>Temperature Statistics</Text>

          {/* ── Period tabs ── */}
          <SegmentedControl
            options={PERIOD_OPTIONS}
            activeKey={period}
            onChange={handlePeriodChange}
            variant="pillButtons"
            style={styles.periodControl}
          />

          {/* ── Date label (tap to open picker) ── */}
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setDatePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateSelectorText}>{periodLabel}</Text>
            <Ionicons name="caret-down" size={16} color="#666" />
          </TouchableOpacity>

          {/* ── Vitals chart card ── */}
          <VitalsChartCard
            data={chartData}
            unit={TEMP_METRIC.unit}
            yAxisLabel={yAxisCfg.label ?? TEMP_METRIC.yAxisLabel}
            minValue={yAxisCfg.minValue ?? TEMP_METRIC.fallbackMin}
            maxValue={yAxisCfg.maxValue ?? TEMP_METRIC.fallbackMax}
            period={period}
            periodLabel={periodLabel}
            isLoading={isLoading}
            error={chartError}
            onRetry={fetchTimelineData}
            style={styles.chartCard}
          />

          {/* ── Activity section ── */}
          <View style={[styles.bottomSection, { marginTop: 16 }]}>
            {period === 'day' ? (
              <ActivityTimeline
                events={timelineEvents}
                onFilterPress={() => setFilterModalVisible(true)}
                onTrashPress={handleTrashPress}
                style={styles.activitySection}
              />
            ) : (
              <ActivityStatsCards
                stats={activityStats}
                title={activityTitle}
                style={styles.activitySection}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Date Picker Modal ── */}
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDatePickerVisible(false)}>
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {period === 'day'   ? 'Select Date'  :
               period === 'month' ? 'Select Month' :
                                    'Select Range'}
            </Text>

            {period === 'day' ? (
              <Calendar
                current={selectedDay.replace(/\//g, '-')}
                onDayPress={(day: any) => handleDateSelect(day.dateString.replace(/-/g, '/'))}
                markedDates={{
                  [selectedDay.replace(/\//g, '-')]: {
                    selected: true,
                    selectedColor: TimelineColors.primaryCyan,
                  },
                }}
                theme={{
                  arrowColor: TimelineColors.primaryCyan,
                  todayTextColor: TimelineColors.primaryCyan,
                  selectedDayBackgroundColor: TimelineColors.primaryCyan,
                }}
              />
            ) : (
              datePickerOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOption}
                  onPress={() => handleDateSelect(option)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      option === (period === 'month' ? selectedMonth : selectedRange) &&
                        styles.modalOptionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Filter Modal ── */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Activities</Text>
            {FILTER_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => handleFilterSelect(option)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    option === activeFilter && styles.modalOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
                {option === activeFilter && (
                  <Ionicons name="checkmark" size={18} color={TimelineColors.primaryCyan} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.screenBg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 110,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topHeader: {
    alignItems: 'flex-end',
    marginTop: 5,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    gap: 2,
    ...Shadows.card,
    marginHorizontal: 4,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 24,
    marginLeft: 4,
  },
  periodControl: {
    marginBottom: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateSelectorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  chartCard: {
    marginTop: 12,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  activitySection: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TimelineColors.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: TimelineColors.borderLight,
  },
  modalOptionText: {
    fontSize: 15,
    color: TimelineColors.textMedium,
  },
  modalOptionTextActive: {
    color: TimelineColors.primaryCyan,
    fontWeight: '600',
  },
});
