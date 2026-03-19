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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  SegmentedControl,
  VitalsChartCard,
  ActivityTimeline,
  ActivityStatsCards,
} from '../../../components/timeline';
import { TimelineColors } from '../../../theme/colors';
import { Shadows } from '../../../theme/shadows';
import {
  getVitalData,
  vitalYAxisConfig,
  VitalType,
  PeriodType,
  ActivityEvent,
} from '../../../data/mockVitals';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';

const BACKGROUND_COLOR = '#F6F6F6';

// Period options for segmented control
const PERIOD_OPTIONS = [
  { key: 'day', label: 'Day' },
  { key: 'month', label: 'Month' },
  { key: 'custom', label: 'Custom' },
];

// Filter options for activity timeline
const FILTER_OPTIONS = ['All', 'Movements', 'Falls', 'Urine'];

export default function TimelineScreen() {
  const router = useRouter();
  const {
    selectedDeviceId,
    availableLogDates,
    historicalLogs,
    liveLogs,
    logsError,
    isLoadingLogs,
    loadAvailableLogDates,
    loadLogsByRange,
    connectionState,
  } = useRaspberryPi();

  const [period, setPeriod] = useState<PeriodType>('day');
  const [vital, setVital] = useState<VitalType>('temp'); // Defaulting to temp
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Modal states
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [chartExpandedVisible, setChartExpandedVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const toDayDisplay = useCallback((iso: string) => iso.replace(/-/g, '/').slice(0, 10), []);

  const dayOptions = useMemo(() => {
    if (!availableLogDates.length) return [];
    return availableLogDates.map(toDayDisplay);
  }, [availableLogDates, toDayDisplay]);

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
    loadAvailableLogDates();
  }, [loadAvailableLogDates]);

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

  const fetchLogsForSelection = useCallback(async (mode: PeriodType, option: string) => {
    if (!option) return;

    const toIsoStart = (value: string) => new Date(`${value.replace(/\//g, '-')}T00:00:00.000Z`);
    const toIsoEnd = (value: string) => new Date(`${value.replace(/\//g, '-')}T23:59:59.999Z`);

    if (mode === 'day') {
      const start = toIsoStart(option);
      const end = toIsoEnd(option);
      await loadLogsByRange(start.toISOString(), end.toISOString());
      return;
    }

    if (mode === 'month') {
      const [year, month] = option.split('/').map((v) => Number(v));
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      await loadLogsByRange(start.toISOString(), end.toISOString());
      return;
    }

    const [rawStart, rawEnd] = option.split(' - ');
    const start = toIsoStart(rawStart);
    const end = toIsoEnd(rawEnd || rawStart);
    await loadLogsByRange(start.toISOString(), end.toISOString());
  }, [loadLogsByRange]);

  React.useEffect(() => {
    const selection = period === 'day' ? selectedDay : period === 'month' ? selectedMonth : selectedRange;
    if (!selection || !selectedDeviceId) return;
    fetchLogsForSelection(period, selection);
  }, [period, selectedDay, selectedMonth, selectedRange, selectedDeviceId, fetchLogsForSelection]);

  // Get current date display text based on period
  const dateDisplayText = useMemo(() => {
    switch (period) {
      case 'day':
        return selectedDay || 'No date';
      case 'month':
        return selectedMonth || 'No month';
      case 'custom':
        return selectedRange || 'No range';
    }
  }, [period, selectedDay, selectedMonth, selectedRange]);

  // Get date picker options based on period
  const datePickerOptions = useMemo(() => {
    switch (period) {
      case 'day':
        return dayOptions;
      case 'month':
        return monthOptions;
      case 'custom':
        return customRangeOptions;
    }
  }, [period, dayOptions, monthOptions, customRangeOptions]);

  // Get vital data for chart
  const chartData = useMemo(() => {
    const points = historicalLogs
      .filter((log) => typeof log.temperature === 'number' || (log.data as any)?.temperature)
      .slice(0, 24)
      .map((log) => {
        const ts = String(log.timestamp || '');
        const label = ts ? new Date(ts).toISOString().slice(11, 16) : '--:--';
        const value = Number(log.temperature ?? (log.data as any)?.temperature ?? 0);
        return { xLabel: label, value };
      })
      .reverse();

    return points.length > 0 ? points : getVitalData(vital, period);
  }, [historicalLogs, vital, period]);

  // Get y-axis config for current vital
  const yAxisConfig = useMemo(() => {
    return vitalYAxisConfig[vital];
  }, [vital]);

  // Get filtered activity events
  const filteredEvents = useMemo((): ActivityEvent[] => {
    const sourceLogs = [...liveLogs, ...historicalLogs].slice(0, 40);
    const mapped: ActivityEvent[] = sourceLogs.map((log, index) => {
      const rawType = String(log.type || log.eventType || '').toLowerCase();
      const type: ActivityEvent['type'] = rawType.includes('fall')
        ? 'fall'
        : rawType.includes('connect')
          ? 'connected'
          : rawType.includes('disconnect')
            ? 'disconnected'
            : 'movement';

      return {
        id: String(log.id || `${log.timestamp}-${index}`),
        type,
        label: String(log.title || log.type || 'Activity Detected'),
        time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--:--',
      };
    });

    if (mapped.length === 0 && activeFilter === 'All') {
      return [];
    }

    if (activeFilter === 'All') {
      return mapped;
    }
    const filterMap: Record<string, ActivityEvent['type']> = {
      Movements: 'movement',
      Falls: 'fall',
      Urine: 'movement',
    };
    const filterType = filterMap[activeFilter];
    return mapped.filter((event) => event.type === filterType);
  }, [activeFilter, historicalLogs, liveLogs]);

  // Get activity stats based on period
  const activityStats = useMemo(() => {
    return {
      movements: filteredEvents.filter((event) => event.type === 'movement').length,
      falls: filteredEvents.filter((event) => event.type === 'fall').length,
      urine: filteredEvents.filter((event) => event.label.toLowerCase().includes('urine')).length,
    };
  }, [filteredEvents]);

  // Get activity section title based on period
  const activityTitle = useMemo(() => {
    switch (period) {
      case 'day':
        return 'Activity Timeline';
      case 'month':
        return 'Monthly Activity';
      case 'custom':
        return 'Custom Activity';
    }
  }, [period]);

  // Handlers
  const handlePeriodChange = useCallback((key: string) => {
    setPeriod(key as PeriodType);
  }, []);

  const handleDateSelect = useCallback(
    async (option: string) => {
      switch (period) {
        case 'day':
          setSelectedDay(option);
          break;
        case 'month':
          setSelectedMonth(option);
          break;
        case 'custom':
          setSelectedRange(option);
          break;
      }

      await fetchLogsForSelection(period, option);
      setDatePickerVisible(false);
    },
    [period, fetchLogsForSelection]
  );

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          {/* Top Header - Export Button */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={[styles.exportButton]}
              onPress={handleExportReport}
              activeOpacity={0.7}
            >
              <Text style={styles.exportButtonText}>Export Report</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={TimelineColors.textMedium}
              />
            </TouchableOpacity>
          </View>

          {/* Dashboard Title */}
          <Text style={styles.headerTitle}>Temperature Statistics</Text>

          {/* Period Segmented Control */}
          <SegmentedControl
            options={PERIOD_OPTIONS}
            activeKey={period}
            onChange={handlePeriodChange}
            variant="pillButtons"
            style={styles.periodControl}
          />

          {/* Date Selector */}
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setDatePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateSelectorText}>{dateDisplayText}</Text>
            <Ionicons
              name="caret-down"
              size={16}
              color={"#666"}
            />
          </TouchableOpacity>

          <View style={styles.statusRow}>
            <Text style={styles.statusText}>Backend Sync: {connectionState}</Text>
            {isLoadingLogs ? <Text style={styles.statusText}>Loading logs...</Text> : null}
            {logsError ? <Text style={styles.statusError}>{logsError}</Text> : null}
          </View>

          {/* Flex container for bottom alignment */}
          <View style={styles.flexContainer}>
            {/* Chart Card */}
            <VitalsChartCard
              data={chartData}
              yAxisLabel={yAxisConfig.label}
              minValue={yAxisConfig.minValue}
              maxValue={yAxisConfig.maxValue}
              onExpand={handleExpandChart}
              style={styles.chartCard}
            />

            {/* Activity Section (varies by period) */}
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
          <View style={[styles.modalContent, Shadows.card]}>
            <Text style={styles.modalTitle}>Select Date</Text>
            {datePickerOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => handleDateSelect(option)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    option ===
                    (period === 'day'
                      ? selectedDay
                      : period === 'month'
                        ? selectedMonth
                        : selectedRange) && styles.modalOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
              <Text style={styles.expandedModalTitle}>
                {yAxisConfig.label}
              </Text>
              <TouchableOpacity
                onPress={() => setChartExpandedVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={TimelineColors.textDark}
                />
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
          <View style={[styles.modalContent, Shadows.card]}>
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
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={TimelineColors.primaryCyan}
                  />
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
    backgroundColor: '#F7F7F7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 110, // Original padding for tab bar safety
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
    paddingBottom: 16, // Extra padding as requested
  },
  // Top Header
  topHeader: {
    alignItems: 'flex-end',
    marginTop: 5,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginHorizontal: 4,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  // Dashboard Title
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 40,
    marginTop: -35,
    marginLeft: 4,
  },
  // Period control
  periodControl: {
    marginBottom: 20
  },
  // Date selector
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
  // Vital control
  vitalControl: {
    display: 'none',
  },
  // Chart card
  chartCard: {
    marginTop: 16,
  },
  // Activity section
  activitySection: {
    // marginBottom and marginTop managed by parent container
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: TimelineColors.cardBackground,
    borderRadius: 16,
    padding: 20,
    minWidth: 280,
    maxWidth: '80%',
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
  // Expanded modal
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
