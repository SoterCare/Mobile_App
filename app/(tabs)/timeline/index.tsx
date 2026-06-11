/**
 * Timeline Screen - Vitals Statistics
 * Displays vital signs charts and activity timelines/stats
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
import { GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
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
  vitalYAxisConfig,
  VitalType,
  PeriodType,
  ActivityEvent,
} from '../../../data/mockVitals';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { timelineService } from '@/services/timelineService';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';

const BACKGROUND_COLOR = '#F6F6F6';

const PERIOD_OPTIONS = [
  { key: 'day', label: 'Day' },
  { key: 'month', label: 'Month' },
  { key: 'custom', label: 'Custom' },
];

const FILTER_OPTIONS = ['All', 'Movements', 'Falls', 'Urine'];

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

  const [period, setPeriod] = useState<PeriodType>('day');
  const [vital, setVital] = useState<VitalType>('temp');
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().slice(0, 10).replace(/-/g, '/'));
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7).replace(/-/g, '/'));
  const [selectedRange, setSelectedRange] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [chartExpandedVisible, setChartExpandedVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [timelineDateOptions, setTimelineDateOptions] = useState<string[]>([]);

  const toDayDisplay = useCallback((iso: string) => iso.replace(/-/g, '/').slice(0, 10), []);

  const dayOptions = useMemo(() => {
    return Array.isArray(timelineDateOptions) ? timelineDateOptions.map(toDayDisplay) : [];
  }, [timelineDateOptions, toDayDisplay]);

  const monthOptions = useMemo(() => {
    const unique = new Set(dayOptions.map((day) => day.slice(0, 7)));
    return Array.from(unique);
  }, [dayOptions]);

  const customRangeOptions = useMemo(() => {
    if (dayOptions.length < 2) return dayOptions.length === 1 ? [`${dayOptions[0]} - ${dayOptions[0]}`] : [];
    const end = dayOptions[dayOptions.length - 1];
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
    if (!selectedDay && dayOptions.length > 0) {
      setSelectedDay(dayOptions[dayOptions.length - 1]);
    }
    if (!selectedMonth && monthOptions.length > 0) {
      setSelectedMonth(monthOptions[monthOptions.length - 1]);
    }
    if (!selectedRange && customRangeOptions.length > 0) {
      setSelectedRange(customRangeOptions[0]);
    }
  }, [dayOptions, monthOptions, customRangeOptions, selectedDay, selectedMonth, selectedRange]);

  const [vitalsData, setVitalsData] = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<any>(null);

  const fetchTimelineData = useCallback(async () => {
    if (!selectedDeviceId) return;

    const dateQuery = period === 'day' ? selectedDay : (period === 'month' ? selectedMonth : selectedRange);

    if (!dateQuery) return;
    if (period === 'month' && !selectedMonth) return;

    const rawFormattedDate = dateQuery ? dateQuery.replace(/\//g, '-') : '';
    const formattedMonth = selectedMonth ? selectedMonth.replace(/\//g, '-') : '';

    let apiDate = rawFormattedDate;
    let apiStartDate;
    let apiEndDate;

    if (period === 'custom' && rawFormattedDate.includes(' - ')) {
      const [start, end] = rawFormattedDate.split(' - ');
      apiStartDate = start;
      apiEndDate = end;
      apiDate = '';
    } else if (period === 'month' && rawFormattedDate.length === 7) {
      apiDate = `${rawFormattedDate}-01`;
    }

    const apiMetric = vital;

    const filterMap: Record<string, string> = { All: 'all', Movements: 'movement', Falls: 'fall', Urine: 'urine' };
    const apiFilter = filterMap[activeFilter] || 'all';

    setIsLoading(true);

    try {
      const [vitalsResponse, eventsResponse, statsResponse] = await Promise.all([
        timelineService.getVitalsTimeline(selectedDeviceId, apiMetric, period, apiDate, apiStartDate, apiEndDate),
        timelineService.getEventsTimeline(selectedDeviceId, period, apiDate, apiFilter, apiStartDate, apiEndDate),
        period === 'month' ? timelineService.getTimelineStats(selectedDeviceId, period, apiDate, formattedMonth) : Promise.resolve(null)
      ]);

      setVitalsData(vitalsResponse);
      setTimelineEvents(eventsResponse?.events || []);
      if (statsResponse) {
        setStats(statsResponse);
      }
    } catch (e) {
      console.error('Failed to fetch timeline data', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeviceId, period, selectedDay, selectedMonth, selectedRange, activeFilter, vital]);

  React.useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  const dateDisplayText = useMemo(() => {
    switch (period) {
      case 'day': return selectedDay || 'No date';
      case 'month': return selectedMonth || 'No month';
      case 'custom': return selectedRange || 'No range';
    }
  }, [period, selectedDay, selectedMonth, selectedRange]);

  const datePickerOptions = useMemo(() => {
    switch (period) {
      case 'day': return dayOptions;
      case 'month': return monthOptions;
      case 'custom': return customRangeOptions;
    }
  }, [period, dayOptions, monthOptions, customRangeOptions]);

  const [isLoading, setIsLoading] = useState(false);

  const chartData = useMemo(() => {
    if (vitalsData?.points) return vitalsData.points;
    return [];
  }, [vitalsData, vital, period]);

  const yAxisConfig = useMemo(() => {
    if (vitalsData?.yAxis) return vitalsData.yAxis;
    return vitalYAxisConfig[vital];
  }, [vital, vitalsData]);

  const filteredEvents = timelineEvents;

  const activityStats = useMemo(() => {
    if (stats) return stats;
    return { movements: 0, falls: 0, urine: 0 };
  }, [stats]);

  const activityTitle = useMemo(() => {
    switch (period) {
      case 'day': return 'Activity Timeline';
      case 'month': return 'Monthly Activity';
      case 'custom': return 'Custom Activity';
    }
  }, [period]);

  const handlePeriodChange = useCallback((key: string) => {
    setPeriod(key as PeriodType);
  }, []);

  const handleDateSelect = useCallback(async (option: string) => {
    switch (period) {
      case 'day': setSelectedDay(option); break;
      case 'month': setSelectedMonth(option); break;
      case 'custom': setSelectedRange(option); break;
    }
    setDatePickerVisible(false);
  }, [period]);

  const handleExportReport = useCallback(() => {
    router.push('/export-report');
  }, [router]);

  const handleExpandChart = useCallback(() => {
    setChartExpandedVisible(true);
  }, []);

  const handleFilterSelect = useCallback((filter: string) => {
    setActiveFilter(filter);
    setFilterModalVisible(false);
  }, []);

  const handleTrashPress = useCallback(() => {
    router.push('/(tabs)/timeline/recycle-bin');
  }, [router]);

  const swipeGesture = useSwipeTabs();

  return (
    <GestureDetector gesture={swipeGesture}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={[styles.exportButton]}
              onPress={() => router.push('/export-report' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.exportButtonText}>Export Report</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={TimelineColors.textMedium}
                marginTop={3}
                marginRight={-4}
                marginLeft={2}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>Temperature Statistics</Text>

          <SegmentedControl
            options={PERIOD_OPTIONS}
            activeKey={period}
            onChange={handlePeriodChange}
            variant="pillButtons"
            style={styles.periodControl}
          />

          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setDatePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateSelectorText}>{dateDisplayText}</Text>
            <Ionicons name="caret-down" size={16} color={"#666"} />
          </TouchableOpacity>

          <View style={styles.statusRow}>
            <Text style={styles.statusText}>Backend Sync: {connectionState}</Text>
            {isLoading ? <Text style={styles.statusText}>Loading timeline...</Text> : null}
            {logsError ? <Text style={styles.statusError}>{logsError}</Text> : null}
          </View>

          <View style={styles.flexContainer}>
            <VitalsChartCard
              data={chartData}
              yAxisLabel={yAxisConfig.label}
              minValue={yAxisConfig.minValue}
              maxValue={yAxisConfig.maxValue}
              onExpand={handleExpandChart}
              style={styles.chartCard}
            />

            <View style={[styles.bottomSection, { marginTop: 12 }]}>
              {period === 'day' ? (
                <ActivityTimeline
                  events={filteredEvents}
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
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDatePickerVisible(false)}
        >
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {period === 'day' ? 'Date' : 'Period'}
            </Text>

            {period === 'day' ? (
              <Calendar
                current={selectedDay.replace(/\//g, '-')}
                onDayPress={(day: any) => {
                  handleDateSelect(day.dateString.replace(/-/g, '/'));
                }}
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
              datePickerOptions.map((option) => (
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

      {/* Chart Expanded Modal */}
      <Modal
        visible={chartExpandedVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChartExpandedVisible(false)}
      >
        <View style={styles.expandedModalContainer}>
          <SafeAreaView style={styles.expandedModalSafeArea}>
            <View style={styles.expandedModalHeader}>
              <Text style={styles.expandedModalTitle}>{yAxisConfig.label}</Text>
              <TouchableOpacity
                onPress={() => setChartExpandedVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={TimelineColors.textDark} />
              </TouchableOpacity>
            </View>
            <View style={styles.expandedChartContainer}>
              <VitalsChartCard
                data={chartData}
                yAxisLabel={yAxisConfig.label}
                minValue={yAxisConfig.minValue}
                maxValue={yAxisConfig.maxValue}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Activities</Text>
            {FILTER_OPTIONS.map((option) => (
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
    </GestureDetector>
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
  flexContainer: {
    flex: 1,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
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
  statusRow: {
    marginTop: 6,
    marginBottom: 8,
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusError: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  vitalControl: {
    display: 'none',
  },
  chartCard: {
    marginTop: 16,
  },
  activitySection: {},
  // Modal styles matching AI Summary screen
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
  expandedModalContainer: {
    flex: 1,
    backgroundColor: TimelineColors.background,
  },
  expandedModalSafeArea: {
    flex: 1,
  },
  expandedModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  expandedModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TimelineColors.textDark,
  },
  expandedChartContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
});