import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Shadows } from '@/theme/shadows';
import { ToggleSwitch } from '@/components/ai-summary/ToggleSwitch';
import { GenerateButton } from '@/components/ai-summary/GenerateButton';
import { summaryService, UsageInfo } from '@/services/summaryService';
import { Colors, Radius, circle, SCREEN_PADDING } from '@/theme/tokens';
import { ScreenTitle } from '@/components/ui/ScreenTitle';
import { Calendar } from 'react-native-calendars';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';

const DOT_COUNT = 5;

export default function AISummaryScreen() {
    const [activeTab, setActiveTab] = useState<'today' | 'previous'>('today');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [todaySummary, setTodaySummary] = useState<any>(null);
    const [previousSummary, setPreviousSummary] = useState<any>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Active tab's summary — each tab keeps its own result.
    const summaryData = activeTab === 'today' ? todaySummary : previousSummary;
    const setSummaryData = activeTab === 'today' ? setTodaySummary : setPreviousSummary;
    const [usage, setUsage] = useState<UsageInfo>({ usedToday: 0, limitPerDay: 5 });

    const dotAnims = useRef(Array.from({ length: DOT_COUNT }, () => new Animated.Value(1))).current;
    const prevUsedToday = useRef(0);
    const shouldAnimateDots = useRef(false);

    // On mount: load today's usage count.
    useEffect(() => {
        summaryService.getUsage().then((data) => {
            setUsage(data);
            prevUsedToday.current = data.usedToday; // skip animation for pre-existing dots
        });
    }, []);

    // Spring-animate only dots added by a fresh generate (not pre-existing on load).
    useEffect(() => {
        const prev = prevUsedToday.current;
        const curr = Math.min(usage.usedToday, DOT_COUNT);
        if (curr > prev && shouldAnimateDots.current) {
            for (let i = prev; i < curr; i++) {
                dotAnims[i].setValue(0.4);
                Animated.spring(dotAnims[i], {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 5,
                }).start();
            }
            shouldAnimateDots.current = false;
        }
        prevUsedToday.current = curr;
    }, [usage.usedToday]);

    const handleTabToggle = (tab: 'today' | 'previous') => setActiveTab(tab);

    const handleSpeak = async (text: string) => {
        if (isSpeaking) {
            await Speech.stop();
            setIsSpeaking(false);
            return;
        }
        setIsSpeaking(true);
        Speech.speak(text, {
            language: 'en',
            rate: 0.9,
            onDone: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        Speech.stop();
        setIsSpeaking(false);
    }, [activeTab]);

    useEffect(() => {
        if (isLoading) {
            const timeout = setTimeout(() => {
                console.warn('Loading state auto-reset after 90 seconds');
                setIsLoading(false);
            }, 90000);
            return () => clearTimeout(timeout);
        }
    }, [isLoading]);

    const handleGenerate = async () => {
        if (isLoading) return;

        setIsLoading(true);

        try {
            let data;

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 60000)
            );

            if (activeTab === 'today') {
                data = await Promise.race([
                    summaryService.generateTodaySummary(),
                    timeoutPromise,
                ]);
                setSummaryData({
                    summary: data.summary || 'No summary available',
                    fromTime: data.from || '12.00 AM',
                    toTime: data.to || formatTime(new Date()),
                    report: data.report ?? null,
                });
            } else {
                data = await Promise.race([
                    summaryService.generatePreviousSummary(selectedDate),
                    timeoutPromise,
                ]);
                setSummaryData({
                    summary: data.summary || 'No summary available',
                    date: data.date || formatDate(selectedDate),
                    report: data.report ?? null,
                });
            }

            shouldAnimateDots.current = true;
            setUsage({ usedToday: data.usedToday ?? usage.usedToday, limitPerDay: data.limitPerDay ?? 5 });
        } catch (error: any) {
            console.error('Generate summary error:', error);
            const errData = error?.response?.data;
            if (error?.response?.status === 403 && typeof errData?.usedToday === 'number') {
                setUsage({ usedToday: errData.usedToday, limitPerDay: errData.limitPerDay ?? 5 });
            }
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

                {/* Generation counter */}
                <View style={styles.usageRow}>
                    <Text style={styles.usageLabel}>Today</Text>
                    <View style={styles.usageDots}>
                        {Array.from({ length: DOT_COUNT }).map((_, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.usageDot,
                                    i < usage.usedToday && styles.usageDotFilled,
                                    { transform: [{ scale: dotAnims[i] }] },
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={styles.usageCount}>{usage.usedToday} of {usage.limitPerDay}</Text>
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
                    <GenerateButton
                        onPress={handleGenerate}
                        isLoading={isLoading}
                        limitReached={usage.usedToday >= usage.limitPerDay}
                    />
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
                            <View style={styles.summaryCardHeader}>
                                <Text style={styles.summaryTitle}>Summary</Text>
                                <TouchableOpacity
                                    style={[styles.ttsButton, isSpeaking && styles.ttsButtonActive]}
                                    onPress={() => handleSpeak(
                                        /^\s*\{/.test(summaryData.summary)
                                            ? 'Summary unavailable. Please regenerate.'
                                            : summaryData.summary
                                    )}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={isSpeaking ? 'stop-circle' : 'volume-high'}
                                        size={20}
                                        color={isSpeaking ? '#FFFFFF' : Colors.brand}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.summaryText}>
                                {/^\s*\{/.test(summaryData.summary) ? 'Summary unavailable — please regenerate.' : summaryData.summary}
                            </Text>
                        </View>

                        {summaryData.report && (
                            <>
                                <View style={[styles.statsCard, Shadows.card]}>
                                    <Text style={styles.statsTitle}>Temperature</Text>
                                    {[
                                        { label: 'Patient', td: summaryData.report.patient_temp },
                                        { label: 'Room', td: summaryData.report.room_temp },
                                    ].map(({ label, td }) => td ? (
                                        <View key={label} style={styles.tempRow}>
                                            <Text style={styles.tempLabel}>{label}</Text>
                                            <View style={styles.tempValues}>
                                                <Text style={styles.tempStat}>Min {td.min?.toFixed(1)}°C</Text>
                                                <Text style={styles.tempStat}>Avg {td.avg?.toFixed(1)}°C</Text>
                                                <Text style={styles.tempStat}>Max {td.max?.toFixed(1)}°C</Text>
                                            </View>
                                        </View>
                                    ) : null)}
                                </View>

                                {(summaryData.report.suggestions?.length ?? 0) > 0 && (
                                    <View style={[styles.statsCard, Shadows.card]}>
                                        <Text style={styles.statsTitle}>Suggestions</Text>
                                        {summaryData.report.suggestions.map((s: string, i: number) => (
                                            <View key={i} style={styles.suggestionRow}>
                                                <Text style={styles.suggestionBullet}>{'•'}</Text>
                                                <Text style={styles.suggestionText}>{s}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                <View style={[styles.statsCard, Shadows.card]}>
                                    <Text style={styles.statsTitle}>Notable Events</Text>
                                    {(summaryData.report.notable_events?.length ?? 0) === 0 ? (
                                        <Text style={styles.noEvents}>No notable events today</Text>
                                    ) : (
                                        summaryData.report.notable_events.map((event: string, i: number) => (
                                            <Text key={i} style={styles.eventItem}>{'•'} {event}</Text>
                                        ))
                                    )}
                                </View>
                            </>
                        )}
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
    usageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        marginLeft: 4,
    },
    usageLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888888',
    },
    usageDots: {
        flexDirection: 'row',
        gap: 6,
    },
    usageDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E0E0E0',
    },
    usageDotFilled: {
        backgroundColor: Colors.brand,
    },
    usageCount: {
        fontSize: 13,
        color: '#888888',
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
        gap: 8,
    },
    reportHeaderTop: {
        gap: 4,
    },
    reportLabel: {
        fontSize: 15,
        color: '#888888',
        fontWeight: 'bold',
    },
    reportTime: {
        fontSize: 15,
        color: '#888888',
        fontWeight: 'bold',
    },
    cachedBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        paddingVertical: 2,
        paddingHorizontal: 10,
    },
    cachedBadgeText: {
        fontSize: 12,
        color: '#999999',
        fontWeight: '500',
    },
    summaryCard: {
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.xl,
        padding: 24,
        marginBottom: 24,
    },
    summaryCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
    },
    ttsButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.brandSurface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ttsButtonActive: {
        backgroundColor: Colors.brand,
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
    statsCard: {
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.xl,
        padding: 20,
        marginBottom: 16,
    },
    statsTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 14,
    },
    tempRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    tempLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555555',
        width: 60,
    },
    tempValues: {
        flexDirection: 'row',
        gap: 12,
    },
    tempStat: {
        fontSize: 14,
        color: '#777777',
        fontWeight: '500',
    },
    noEvents: {
        fontSize: 14,
        color: '#AAAAAA',
        fontStyle: 'italic',
    },
    eventItem: {
        fontSize: 14,
        color: '#555555',
        lineHeight: 22,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 10,
    },
    suggestionBullet: {
        fontSize: 16,
        color: Colors.brand,
        lineHeight: 22,
        fontWeight: '700',
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#555555',
        lineHeight: 22,
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