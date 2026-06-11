import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, ActivityIndicator, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';
import { Shadows } from '@/theme/shadows';
import { ToggleSwitch } from '@/components/ai-summary/ToggleSwitch';
import { GenerateButton } from '@/components/ai-summary/GenerateButton';
import { summaryService, SummaryResponse } from '@/services/summaryService';
import { Colors, Radius, circle, SCREEN_PADDING } from '@/theme/tokens';
import { ScreenTitle } from '@/components/ui/ScreenTitle';
import { Calendar } from 'react-native-calendars';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';

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

    useEffect(() => {
        if (isLoading) {
            const timeout = setTimeout(() => {
                console.warn('Loading state auto-reset after 30 seconds');
                setIsLoading(false);
            }, 30000);
            return () => clearTimeout(timeout);
        }
    }, [isLoading]);

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
        if (isLoading) return;

        setIsLoading(true);

        try {
            let data;

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 15000)
            );

            if (activeTab === 'today') {
                data = await Promise.race([
                    summaryService.generateTodaySummary(),
                    timeoutPromise
                ]);
                setSummaryData({
                    summary: data.summary || 'No summary available',
                    fromTime: data.from || '12.00 AM',
                    toTime: data.to || formatTime(new Date()),
                });
            } else {
                data = await Promise.race([
                    summaryService.generatePreviousSummary(selectedDate),
                    timeoutPromise
                ]);
                setSummaryData({
                    summary: data.summary || 'No summary available',
                    date: data.date || formatDate(selectedDate),
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

    const swipeHandlers = useSwipeTabs();

    return (
        <SafeAreaView style={styles.container} edges={['top']} {...(swipeHandlers as any)}>
            <StatusBar style="dark" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <ScreenTitle>AI Summary</ScreenTitle>

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

                {/* Generate Button */}
                <View style={styles.generateButtonContainer}>
                    <GenerateButton onPress={handleGenerate} isLoading={isLoading} />
                    {__DEV__ && isLoading && (
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={() => {
                                console.log('Manual reset triggered');
                                setIsLoading(false);
                            }}
                        >
                            <Text style={styles.resetButtonText}>Force Stop Loading</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Summary Content */}
                {summaryData && (
                    <View style={styles.summarySection}>
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

                        <View style={[styles.summaryCard, Shadows.card]}>
                            <Text style={styles.summaryTitle}>Summary</Text>
                            <Text style={styles.summaryText}>{summaryData.summary}</Text>
                        </View>

                        <View style={styles.metricsRow}>
                            {renderMetricChip(
                                <View style={[styles.iconWrapper, { backgroundColor: '#FFF5E6' }]}>
                                    <FontAwesome5 name="thermometer-half" size={18} color="#FFA500" />
                                </View>,
                                'Temperature'
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Calendar Date Picker Modal */}
            <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowDatePicker(false)}
                >
                    <Pressable style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Date</Text>
                        <Calendar
                            current={selectedDate.toISOString().slice(0, 10)}
                            onDayPress={(day: any) => {
                                setSelectedDate(new Date(day.dateString));
                                setShowDatePicker(false);
                            }}
                            markedDates={{
                                [selectedDate.toISOString().slice(0, 10)]: {
                                    selected: true,
                                    selectedColor: Colors.brand,
                                },
                            }}
                            theme={{
                                arrowColor: Colors.brand,
                                todayTextColor: Colors.brand,
                                selectedDayBackgroundColor: Colors.brand,
                            }}
                            maxDate={new Date().toISOString().slice(0, 10)}
                        />
                    </Pressable>
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
    scrollView: {
        flex: 1,
    },
    historyCard: {
        backgroundColor: Colors.cardBg,
        padding: 16,
        borderRadius: Radius.md,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    historyCardActive: {
        borderColor: Colors.brand,
        backgroundColor: Colors.brandSurface,
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
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 16,
        paddingBottom: 40,
    },
    controlsRow: {
        marginBottom: 24,
        alignItems: 'center',
    },
    helperText: {
        fontSize: 15,
        color: '#888888',
        marginBottom: 36,
        marginTop: 12,
        fontWeight: '500',
        marginLeft: 4,
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
        marginLeft: 4,
    },
    datePill: {
        backgroundColor: Colors.cardBg,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: Radius.pill,
        ...Shadows.card,
    },
    datePillText: {
        fontSize: 15,
        color: '#333333',
        fontWeight: '500',
    },
    generateButtonContainer: {
        marginBottom: 24,
    },
    resetButton: {
        marginTop: 12,
        padding: 8,
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        borderRadius: Radius.xs,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
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
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.xl,
        padding: 24,
        marginBottom: 24,
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
        backgroundColor: Colors.cardBg,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: Radius.lg,
        gap: 10,
        ...Shadows.card,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: circle(36),
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricLabel: {
        fontSize: 15,
        color: '#333333',
        fontWeight: '600',
    },
    // Modal styles matching Timeline screen
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
        color: '#333333',
        marginBottom: 16,
        textAlign: 'center',
    },
});