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
  Alert,
  Pressable,
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
  activityEventsDay,
  activityStatsMonth,
  activityStatsCustom,
  VitalType,
  PeriodType,
  ActivityEvent,
} from '../../../data/mockVitals';

const BACKGROUND_COLOR = '#F6F6F6';

// Period options for segmented control
const PERIOD_OPTIONS = [
  { key: 'day', label: 'Day' },
  { key: 'month', label: 'Month' },
  { key: 'custom', label: 'Custom' },
];

// Vital type options for segmented control
const VITAL_OPTIONS = [
  { key: 'heart', label: 'Heart rate' },
  { key: 'spo2', label: 'Blood O₂' },
  { key: 'temp', label: 'Temperature' },
];

// Date options for picker modal
const DAY_OPTIONS = [
  '2025/11/01',
  '2025/11/02',
  '2025/11/03',
  '2025/11/04',
  '2025/11/05',
  '2025/11/06',
  '2025/11/07',
];

const MONTH_OPTIONS = [
  '2025/09',
  '2025/10',
  '2025/11',
  '2025/12',
];

const CUSTOM_RANGE_OPTIONS = [
  '2025/11/01 - 2025/11/07',
  '2025/11/08 - 2025/11/14',
  '2025/10/01 - 2025/10/31',
];

// Filter options for activity timeline
const FILTER_OPTIONS = ['All', 'Movements', 'Falls', 'Urine'];

export default function TimelineScreen() {
  const router = useRouter();

  // State
  const [period, setPeriod] = useState<PeriodType>('day');
  const [vital, setVital] = useState<VitalType>('heart');
  const [selectedDay, setSelectedDay] = useState('2025/11/01');
  const [selectedMonth, setSelectedMonth] = useState('2025/11');
  const [selectedRange, setSelectedRange] = useState('2025/11/01 - 2025/11/07');
  const [activeFilter, setActiveFilter] = useState('All');

  // Modal states
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [chartExpandedVisible, setChartExpandedVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Get current date display text based on period
  const dateDisplayText = useMemo(() => {
    switch (period) {
      case 'day':
        return selectedDay;
      case 'month':
        return selectedMonth;
      case 'custom':
        return selectedRange;
    }
  }, [period, selectedDay, selectedMonth, selectedRange]);

  // Get date picker options based on period
  const datePickerOptions = useMemo(() => {
    switch (period) {
      case 'day':
        return DAY_OPTIONS;
      case 'month':
        return MONTH_OPTIONS;
      case 'custom':
        return CUSTOM_RANGE_OPTIONS;
    }
  }, [period]);

  // Get vital data for chart
  const chartData = useMemo(() => {
    return getVitalData(vital, period);
  }, [vital, period]);

  // Get y-axis config for current vital
  const yAxisConfig = useMemo(() => {
    return vitalYAxisConfig[vital];
  }, [vital]);

  // Get filtered activity events
  const filteredEvents = useMemo((): ActivityEvent[] => {
    if (activeFilter === 'All') {
      return activityEventsDay;
    }
    const filterMap: Record<string, ActivityEvent['type']> = {
      Movements: 'movement',
      Falls: 'fall',
      Urine: 'urine',
    };
    const filterType = filterMap[activeFilter];
    return activityEventsDay.filter((event) => event.type === filterType);
  }, [activeFilter]);

  // Get activity stats based on period
  const activityStats = useMemo(() => {
    return period === 'month' ? activityStatsMonth : activityStatsCustom;
  }, [period]);

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

  const handleVitalChange = useCallback((key: string) => {
    setVital(key as VitalType);
  }, []);

  const handleDateSelect = useCallback(
    (option: string) => {
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
      setDatePickerVisible(false);
    },
    [period]
  );

  const handleExportReport = useCallback(() => {
    Alert.alert(
      'Export Report',
      `Exporting report with:\n\nPeriod: ${period.toUpperCase()}\nVital: ${vital.toUpperCase()}\nDate: ${dateDisplayText}`,
      [{ text: 'OK' }]
    );
  }, [period, vital, dateDisplayText]);

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
      <View style={styles.mainContent}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Vitals Statistics</Text>
          <TouchableOpacity
            style={[styles.exportButton, Shadows.button]}
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
            size={12}
            color={TimelineColors.textMedium}
          />
        </TouchableOpacity>

        {/* Vital Segmented Control */}
        <SegmentedControl
          options={VITAL_OPTIONS}
          activeKey={vital}
          onChange={handleVitalChange}
          variant="capsuleTabs"
          style={styles.vitalControl}
        />

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
          <View style={styles.bottomSection}>
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
    backgroundColor: BACKGROUND_COLOR,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110, // Original padding for tab bar safety
  },
  flexContainer: {
    flex: 1,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16, // Extra padding as requested
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  // Period control
  periodControl: {
    marginBottom: 16,
  },
  // Date selector
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dateSelectorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  // Vital control
  vitalControl: {
    marginBottom: 8,
    marginHorizontal: 0,
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
