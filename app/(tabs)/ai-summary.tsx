import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { ToggleSwitch } from '@/components/ai-summary/ToggleSwitch';
import { GenerateButton } from '@/components/ai-summary/GenerateButton';
import { summaryService } from '@/services/summaryService';
import { TimelineColors } from '@/theme/colors';
import { Shadows } from '@/theme/shadows';

interface SummaryData {
    summary: string;
    fromTime?: string;
    toTime?: string;
    date?: string;
}

export default function AISummaryScreen() {
    const [activeTab, setActiveTab] = useState<'today' | 'previous'>('today');
    const [isLoading, setIsLoading] = useState(false);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Format time for display (e.g., "12.00 AM")
    const formatTime = (date: Date): string => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 === 0 ? 12 : hours % 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours.toString().padStart(2, '0')}.${displayMinutes}${ampm}`;
    };

    // Format date for display (e.g., "07/12/2025")
    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Current time string
    const currentTimeString = useMemo(() => formatTime(new Date()), []);

    const handleTabToggle = (tab: 'today' | 'previous') => {
        setActiveTab(tab);
        setSummaryData(null); // Reset summary when switching tabs
    };

    const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
            setSummaryData(null); // Reset summary when date changes
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'today') {
                const data = await summaryService.generateTodaySummary();
                setSummaryData({
                    summary: data.summary,
                    fromTime: data.from,
                    toTime: data.to,
                });
            } else {
                const data = await summaryService.generatePreviousSummary(selectedDate);
                setSummaryData({
                    summary: data.summary,
                    date: data.date,
                });
            }
        } catch (error: any) {
            console.error('Generate summary error:', error);
            if (activeTab === 'today') {
                setSummaryData({
                    summary: 'Unable to generate summary. Please try again later.',
                    fromTime: '12.00 AM',
                    toTime: formatTime(new Date()),
                });
            } else {
                setSummaryData({
                    summary: 'Unable to generate summary. Please try again later.',
                    date: formatDate(selectedDate),
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderMetricChip = (icon: React.ReactNode, label: string) => (
        <View style={styles.metricChip}>
            {icon}
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Row */}
                <View style={styles.headerRow}>
                    <Text style={styles.screenTitle}>AI Summary</Text>
                </View>

                {/* Controls Row: Toggle + Logo */}
                <View style={styles.controlsRow}>
                    <ToggleSwitch activeTab={activeTab} onToggle={handleTabToggle} />
                    <Image
                        source={require('@/assets/images/SoterCare-Primary-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Helper Text or Date Picker */}
                {activeTab === 'today' ? (
                    <Text style={styles.helperText}>
                        Generating report from 12.00 AM to now.
                    </Text>
                ) : (
                    <View style={styles.datePickerRow}>
                        <Text style={styles.selectDateLabel}>Select Date</Text>
                        <TouchableOpacity
                            style={styles.datePill}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.datePillText}>{formatDate(selectedDate)}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Date Picker Modal */}
                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                    />
                )}

                {/* Generate Button */}
                <View style={styles.generateButtonContainer}>
                    <GenerateButton onPress={handleGenerate} isLoading={isLoading} />
                </View>

                {/* Summary Content - Only show after generation */}
                {summaryData && (
                    <View style={styles.summarySection}>
                        {/* Report Header */}
                        <View style={styles.reportHeader}>
                            {activeTab === 'today' ? (
                                <>
                                    <Text style={styles.reportLabel}>Today&apos;s Report from</Text>
                                    <Text style={styles.reportTime}>
                                        {summaryData.fromTime} - {summaryData.toTime}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.reportLabel}>Full Day Report</Text>
                                    <Text style={styles.reportTime}>{summaryData.date}</Text>
                                </>
                            )}
                        </View>

                        {/* Summary Card */}
                        <View style={[styles.summaryCard, Shadows.card]}>
                            <Text style={styles.summaryTitle}>Summary</Text>
                            <Text style={styles.summaryText}>{summaryData.summary}</Text>
                        </View>

                        {/* Metric Chips */}
                        <View style={styles.metricsRow}>
                            {renderMetricChip(
                                <FontAwesome5
                                    name="thermometer-half"
                                    size={18}
                                    color="#FF6B6B"
                                />,
                                'Temperature'
                            )}
                            {renderMetricChip(
                                <FontAwesome5
                                    name="heartbeat"
                                    size={18}
                                    color="#FF6B6B"
                                />,
                                'Heart Rate'
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: TimelineColors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },
    headerRow: {
        marginBottom: 16,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: TimelineColors.textDark,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    logo: {
        width: 80,
        height: 60,
    },
    helperText: {
        fontSize: 14,
        color: TimelineColors.textLight,
        marginBottom: 20,
    },
    datePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    selectDateLabel: {
        fontSize: 14,
        color: TimelineColors.textLight,
    },
    datePill: {
        backgroundColor: TimelineColors.cardBackground,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        ...Shadows.button,
    },
    datePillText: {
        fontSize: 14,
        color: TimelineColors.textDark,
        fontWeight: '500',
    },
    generateButtonContainer: {
        marginBottom: 24,
    },
    summarySection: {
        flex: 1,
    },
    reportHeader: {
        marginBottom: 16,
    },
    reportLabel: {
        fontSize: 14,
        color: TimelineColors.textDark,
        fontWeight: '600',
        marginBottom: 2,
    },
    reportTime: {
        fontSize: 14,
        color: TimelineColors.textMedium,
    },
    summaryCard: {
        backgroundColor: TimelineColors.cardBackground,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: TimelineColors.textDark,
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 14,
        color: TimelineColors.textMedium,
        lineHeight: 22,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    metricChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: TimelineColors.cardBackground,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
        ...Shadows.button,
    },
    metricLabel: {
        fontSize: 13,
        color: TimelineColors.textDark,
        fontWeight: '500',
    },
});
