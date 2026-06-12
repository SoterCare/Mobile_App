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
  MetricType,
  PeriodType,
  ActivityEvent,
  METRIC_CONFIG,
  vitalYAxisConfig,
} from '../../../data/mockVitals';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';
import { timelineService } from '@/services/timelineService';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';

const BACKGROUND_COLOR = '#F6F6F6';

const PERIOD_OPTIONS = [
  { key: 'day',    label: 'Day'    },
  { key: 'week',   label: 'Week'   },
  { key: 'month',  label: 'Month'  },
  { key: 'custom', label: 'Custom' },
];

const FILTER_OPTIONS = ['All', 'Falls', 'Urine', 'SOS'];

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtMonthAbbr(d: Date) {
  return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export default function TimelineScreen() {
  const router = useRouter();
  const {
    selectedDeviceId,
    historicalLogs,
    liveLogs,
    logsError,
    isLoadingLogs,
    loadLogsByRange,
    connectionState,
  } = useRaspberryPi();

  // ── Vitals live socket (for chart live-update when period=day & today) ──
  const { vitals: liveVitals } = useRealtimeVitals(selectedDeviceId || undefined);

  const [period, setPeriod]               = useState<PeriodType>('day');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('temp');
  const [selectedDay, setSelectedDay]     = useState<string>(
    new Date().toISOString().slice(0, 10).replace(/-/g, '/')
  );
  const [selectedWeekEnd, setSelectedWeekEnd] = useState<string>(
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

  // Fetch available dates once device is known
  React.useEffect(() => {
    if (!selectedDeviceId) return;
    timelineService.getDateOptions(selectedDeviceId, 'day').then(res => {
      setTimelineDateOptions(res.options || []);
    }).catch(e => console.error('Failed to load date options:', e));
  }, [selectedDeviceId]);

  // Default selections when options load
  React.useEffect(() => {
    if (!selectedDay   && dayOptions.length   > 0) setSelectedDay(dayOptions[dayOptions.length - 1]);
    if (!selectedMonth && monthOptions.length > 0) setSelectedMonth(monthOptions[monthOptions.length - 1]);
    if (!selectedRange && customRangeOptions.length > 0) setSelectedRange(customRangeOptions[0]);
  }, [dayOptions, monthOptions, customRangeOptions, selectedDay, selectedMonth, selectedRange]);

  // ── Chart + timeline state ──────────────────────────────────────────────
  const [vitalsData, setVitalsData]       = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<ActivityEvent[]>([]);
  const [stats, setStats]                 = useState<any>(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [chartError, setChartError]       = useState<string | null>(null);

  // ── Fetch timeline data ─────────────────────────────────────────────────
  const fetchTimelineData = useCallback(async () => {
    if (!selectedDeviceId) return;

    const dateQuery =
      period === 'day'    ? selectedDay   :
      period === 'week'   ? selectedWeekEnd :
      period === 'month'  ? selectedMonth :
      selectedRange;

    if (!dateQuery) return;
    if (period === 'month' && !selectedMonth) return;

    let apiDate       = '';
    let apiStartDate: string | undefined;
    let apiEndDate:   string | undefined;

    if (period === 'day') {
      apiDate = selectedDay.replace(/\//g, '-');

    } else if (period === 'week') {
      const endISO = selectedWeekEnd.replace(/\//g, '-');
      const endD   = new Date(endISO + 'T00:00:00Z');
      const startD = new Date(endD);
      startD.setUTCDate(startD.getUTCDate() - 6);
      apiStartDate = startD.toISOString().slice(0, 10);
      apiEndDate   = endISO;

    } else if (period === 'month') {
      // Pass YYYY-MM-01 as date; backend accepts month period
      const raw = selectedMonth.replace(/\//g, '-');
      apiDate = raw.length === 7 ? `${raw}-01` : raw;

    } else if (period === 'custom' && dateQuery.includes(' - ')) {
      const [start, end] = dateQuery.split(' - ');
      apiStartDate = start.replace(/\//g, '-');
      apiEndDate   = end.replace(/\//g, '-');
    }

    const formattedMonth = selectedMonth.replace(/\//g, '-');
    const apiFilter = ({ All: 'all', Falls: 'fall', Urine: 'urine', SOS: 'sos' } as Record<string,string>)[activeFilter] || 'all';
    const apiMetric = METRIC_CONFIG[selectedMetric].apiMetric;

    setIsLoading(true);
    setChartError(null);

    try {
      const [vitalsResponse, eventsResponse, statsResponse] = await Promise.all([
        timelineService.getVitalsTimeline(
          selectedDeviceId, apiMetric, period, apiDate, apiStartDate, apiEndDate
        ),
        timelineService.getEventsTimeline(
          selectedDeviceId, period, apiDate, apiFilter, apiStartDate, apiEndDate
        ),
        period === 'month'
          ? timelineService.getTimelineStats(selectedDeviceId, period, apiDate, formattedMonth)
          : Promise.resolve(null),
      ]);

      setVitalsData(vitalsResponse);
      setTimelineEvents(eventsResponse?.events || []);
      if (statsResponse) setStats(statsResponse);
    } catch (e) {
      console.error('Failed to fetch timeline data', e);
      setChartError('Could not load data.');
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedDeviceId, period, selectedDay, selectedWeekEnd,
    selectedMonth, selectedRange, activeFilter, selectedMetric,
  ]);

  React.useEffect(() => { fetchTimelineData(); }, [fetchTimelineData]);

  useFocusEffect(
    useCallback(() => { fetchTimelineData(); }, [fetchTimelineData])
  );

  // ── Live socket → update today's day-view chart ─────────────────────────
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  React.useEffect(() => {
    if (period !== 'day' || !liveVitals?.timestamp) return;
    const selISO = selectedDay.replace(/\//g, '-');
    if (selISO !== todayISO) return;

    const hour = new Date(liveVitals.timestamp).getUTCHours();
    if (hour < 0 || hour > 23) return;

    let newValue: number | null = null;
    if (selectedMetric === 'temp')     newValue = liveVitals.temperature    ?? null;
    if (selectedMetric === 'roomTemp') newValue = liveVitals.roomTemperature ?? null;
    if (selectedMetric === 'moisture') newValue = typeof liveVitals.moisture === 'number' ? liveVitals.moisture : null;

    if (newValue === null) return;

    setVitalsData((prev: any) => {
      if (!prev?.points || !Array.isArray(prev.points)) return prev;
      const pts = [...prev.points];
      if (hour >= pts.length) return prev;
      const existing = pts[hour]?.value;
      pts[hour] = {
        ...pts[hour],
        value: existing !== null && existing !== undefined
          ? (Number(existing) + newValue!) / 2
          : newValue!,
      };
      return { ...prev, points: pts };
    });
  }, [liveVitals, period, selectedDay, selectedMetric, todayISO]);

  // ── Derived chart data ──────────────────────────────────────────────────
  const chartData = useMemo(
    () => (vitalsData?.points ?? []),
    [vitalsData]
  );

  const yAxisCfg = useMemo(() => {
    if (vitalsData?.yAxis) return vitalsData.yAxis;
    const fallback = vitalYAxisConfig[selectedMetric];
    return { label: fallback.label, minValue: fallback.minValue, maxValue: fallback.maxValue };
  }, [vitalsData, selectedMetric]);

  const unit = METRIC_CONFIG[selectedMetric].unit;

  // ── Period label (shown in chart card header) ───────────────────────────
  const periodLabel = useMemo(() => {
    switch (period) {
      case 'day':    return selectedDay.replace(/\//g, '-');
      case 'week': {
        const end = new Date(selectedWeekEnd.replace(/\//g, '-') + 'T00:00:00Z');
        const start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 6);
        return `${fmtMonthAbbr(start)} – ${fmtMonthAbbr(end)}`;
      }
      case 'month':  return selectedMonth.replace(/\//g, '-');
      case 'custom': return selectedRange || 'Custom range';
    }
  }, [period, selectedDay, selectedWeekEnd, selectedMonth, selectedRange]);

  // ── Date selector display text (above chart) ────────────────────────────
  const dateDisplayText = periodLabel;

  const datePickerOptions = useMemo(() => {
    switch (period) {
      case 'day':    return dayOptions;
      case 'week':   return dayOptions;  // user picks the week's end date
      case 'month':  return monthOptions;
      case 'custom': return customRangeOptions;
    }
  }, [period, dayOptions, monthOptions, customRangeOptions]);

  const activityStats = useMemo(
    () => stats ?? { movements: 0, falls: 0, urine: 0 },
    [stats]
  );
  const activityTitle = useMemo(() => {
    switch (period) {
      case 'day':    return 'Activity Timeline';
      case 'week':   return 'Weekly Activity';
      case 'month':  return 'Monthly Activity';
      case 'custom': return 'Custom Activity';
    }
  }, [period]);

  const handlePeriodChange = useCallback((key: string) => {
    setPeriod(key as PeriodType);
    setVitalsData(null);
    setChartError(null);
  }, []);

  const handleMetricChange = useCallback((m: MetricType) => {
    setSelectedMetric(m);
    setVitalsData(null);
    setChartError(null);
  }, []);

  const handleDateSelect = useCallback(async (option: string) => {
    switch (period) {
      case 'day':    setSelectedDay(option);      break;
      case 'week':   setSelectedWeekEnd(option);  break;
      case 'month':  setSelectedMonth(option);    break;
      case 'custom': setSelectedRange(option);    break;
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.dateSelectorText}>{dateDisplayText}</Text>
            <Ionicons name="caret-down" size={16} color="#666" />
          </TouchableOpacity>

          {/* ── Vitals chart card ── */}
          <VitalsChartCard
            data={chartData}
            unit={unit}
            yAxisLabel={yAxisCfg.label ?? METRIC_CONFIG[selectedMetric].yAxisLabel}
            minValue={yAxisCfg.minValue ?? METRIC_CONFIG[selectedMetric].fallbackMin}
            maxValue={yAxisCfg.maxValue ?? METRIC_CONFIG[selectedMetric].fallbackMax}
            period={period}
            periodLabel={periodLabel}
            selectedMetric={selectedMetric}
            onMetricChange={handleMetricChange}
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
              {period === 'day'
                ? 'Select Date'
                : period === 'week'
                ? 'Select Week End Date'
                : period === 'month'
                ? 'Select Month'
                : 'Select Range'}
            </Text>

            {(period === 'day' || period === 'week') ? (
              <Calendar
                current={(period === 'day' ? selectedDay : selectedWeekEnd).replace(/\//g, '-')}
                onDayPress={(day: any) => {
                  handleDateSelect(day.dateString.replace(/-/g, '/'));
                }}
                markedDates={{
                  [(period === 'day' ? selectedDay : selectedWeekEnd).replace(/\//g, '-')]: {
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
  // Modals
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
