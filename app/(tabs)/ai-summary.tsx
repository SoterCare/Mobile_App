import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, FlatList, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Shadows } from '@/theme/shadows';
import { ToggleSwitch } from '@/components/ai-summary/ToggleSwitch';
import { GenerateButton } from '@/components/ai-summary/GenerateButton';
import { summaryService, SummaryResponse } from '@/services/summaryService';
import { TimelineColors } from '@/theme/colors';

export default function AISummaryScreen() {
    const [activeTab, setActiveTab] = useState<'today' | 'previous'>('today');
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [historyList, setHistoryList] = useState<SummaryResponse[]>([]);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<SummaryResponse | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [summaryData, setSummaryData] = useState<any>(null);

    const handleTabToggle = (tab: 'today' | 'previous') => setActiveTab(tab);

    const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (date) setSelectedDate(date);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMetricChip = (icon: React.ReactNode, label: string) => (
        <View style={styles.metricChip}>
            {icon}
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    );

    useEffect(() => {
        if (activeTab === 'previous') {
            fetchHistory();
        } else {
            setSummary(null);
            setSelectedHistoryItem(null);
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await summaryService.getHistory();
            setHistoryList(data);
            if (data.length > 0) {
                setSelectedHistoryItem(data[0]);
            }
        } catch (error: any) {
            console.error('Fetch history error:', error);
            setHistoryList([]);
        } finally {
            setIsLoading(false);
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

    const formatDate = (dateInput: string | Date) => {
        const date = new Date(dateInput);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderHistoryItem = ({ item }: { item: SummaryResponse }) => (
        <TouchableOpacity
            style={[
                styles.historyCard,
                selectedHistoryItem?.id === item.id && styles.historyCardActive
            ]}
            onPress={() => setSelectedHistoryItem(item)}
        >
            <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.historyType}>{item.type}</Text>
        </TouchableOpacity>
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

                {/* Controls Row: Toggle Container */}
                <View style={styles.controlsRow}>
                    <ToggleSwitch activeTab={activeTab} onToggle={handleTabToggle} />
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
                                <View style={[styles.iconWrapper, { backgroundColor: '#FFF5E6' }]}>
                                    <FontAwesome5 name="thermometer-half" size={18} color="#FFA500" />
                                </View>,
                                'Temperature'
                            )}
                            {renderMetricChip(
                                <View style={[styles.iconWrapper, { backgroundColor: '#FFEBEB' }]}>
                                    <FontAwesome5 name="heartbeat" size={18} color="#FF6B6B" />
                                </View>,
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
    historyCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    historyCardActive: {
        borderColor: TimelineColors.primaryCyan,
        backgroundColor: '#F0FBFC',
    },
    historyDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 4,
    },
    historyType: {
        fontSize: 14,
        color: '#666666',
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
    },
    controlsRow: {
        marginBottom: 24,
        width: '100%',
        alignItems: 'center',
    },
    helperText: {
        fontSize: 15,
        color: '#888888',
        marginBottom: 24,
    },
    datePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    selectDateLabel: {
        fontSize: 15,
        color: '#888888',
        fontWeight: '500',
    },
    datePill: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    datePillText: {
        fontSize: 15,
        color: '#333333',
        fontWeight: '500',
    },
    generateButtonContainer: {
        marginBottom: 24,
    },
    summarySection: {
        flex: 1,
    },
    reportHeader: {
        marginBottom: 20,
    },
    reportLabel: {
        fontSize: 15,
        color: '#888888',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    reportTime: {
        fontSize: 15,
        color: '#888888',
        fontWeight: 'bold',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 16,
        color: '#777777',
        lineHeight: 24,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    metricChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricLabel: {
        fontSize: 15,
        color: '#333333',
        fontWeight: '600',
    },
});
