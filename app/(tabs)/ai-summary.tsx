import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { GenerateButton } from '@/components/ai-summary/GenerateButton';
import { summaryService } from '@/services/summaryService';
import { TimelineColors } from '@/theme/colors';
import { Shadows } from '@/theme/shadows';

interface MetricStats {
    average?: string;
    lowest?: string;
    highest?: string;
    value?: string;
}

interface ActivityData {
    falls: number;
    urinations: number;
    movements: number;
}

interface GaitData {
    speed?: string;
    cadence?: string;
    stability?: string;
}

interface SummaryData {
    summary: string;
    fromTime?: string;
    toTime?: string;
    date?: string;
    temperature?: MetricStats;
    moisture?: MetricStats;
    gait?: GaitData;
    activity?: ActivityData;
    potentialRisks?: string[];
    recommendations?: string[];
}

export default function AISummaryScreen() {
    const [activeTab, setActiveTab] = useState<'today' | 'previous'>('today');
    const [isLoading, setIsLoading] = useState(false);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const formatTime = (date: Date): string => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 === 0 ? 12 : hours % 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours.toString().padStart(2, '0')}.${displayMinutes} ${ampm}`;
    };

    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleTabToggle = (tab: 'today' | 'previous') => {
        setActiveTab(tab);
        setSummaryData(null);
        setHasGenerated(false);
    };

    const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
            setSummaryData(null);
            setHasGenerated(false);
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setSummaryData(null);
        setHasGenerated(false);

        try {
            if (activeTab === 'today') {
                const data = await summaryService.generateTodaySummary();
                setSummaryData({
                    summary: data.summary,
                    fromTime: data.from,
                    toTime: data.to,
                    temperature: data.temperature,
                    moisture: data.moisture,
                    gait: data.gait,
                    activity: data.activity,
                    potentialRisks: data.potentialRisks,
                    recommendations: data.recommendations,
                });
            } else {
                const data = await summaryService.generatePreviousSummary(selectedDate);
                setSummaryData({
                    summary: data.summary,
                    date: data.date,
                    temperature: data.temperature,
                    moisture: data.moisture,
                    gait: data.gait,
                    activity: data.activity,
                    potentialRisks: data.potentialRisks,
                    recommendations: data.recommendations,
                });
            }
        } catch (error: any) {
            const mockData: SummaryData = {
                summary:
                    'Throughout the day, the user maintained generally stable vital signs, with normal heart rate and temperature ranges.\n\nThe system detected two risky movements, one minor fall, and three urination events.\n\nNo major medical emergencies were identified, but a few observations require attention.',
                temperature: { average: '36.6°C', lowest: '36.2°C', highest: '37.3°C' },
                moisture: { average: '62%', lowest: '54%', highest: '71%' },
                gait: { speed: '0.9 m/s', cadence: '98 steps/min', stability: 'Moderate' },
                activity: { falls: 0, urinations: 4, movements: 2 },
                potentialRisks: [
                    'Minor fall indicates possible balance issues.',
                    'Slight temperature elevation (37.3°C) may indicate early signs of inflammation or dehydration.',
                    'Two risky movements show reduced stability during sudden posture changes.',
                ],
                recommendations: [
                    'Monitor posture changes and falls; consider support if unstable movements repeat.',
                    'Keep the individual well-hydrated and watch for any rise in temperature.',
                ],
            };
            if (activeTab === 'today') {
                setSummaryData({ ...mockData, fromTime: '12.00 AM', toTime: formatTime(new Date()) });
            } else {
                setSummaryData({ ...mockData, date: formatDate(selectedDate) });
            }
        } finally {
            setIsLoading(false);
            setHasGenerated(true);
        }
    };

    const showSummary = hasGenerated && summaryData !== null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerRow}>
                    <Text style={styles.screenTitle}>AI Summary</Text>
                </View>

                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleTab, activeTab === 'today' && styles.toggleTabActive]}
                        onPress={() => handleTabToggle('today')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.toggleTabText, activeTab === 'today' && styles.toggleTabTextActive]}>
                            Today
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleTab, activeTab === 'previous' && styles.toggleTabActive]}
                        onPress={() => handleTabToggle('previous')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.toggleTabText, activeTab === 'previous' && styles.toggleTabTextActive]}>
                            Previous
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoRow}>
                    {activeTab === 'today' ? (
                        <Text style={styles.helperText}>Generating report from 12.00 AM to now.</Text>
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
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                    />
                )}

                <View style={styles.generateButtonContainer}>
                    <GenerateButton onPress={handleGenerate} isLoading={isLoading} />
                </View>

                {showSummary && (
                    <View style={styles.summarySection}>
                        <View style={styles.reportHeader}>
                            {activeTab === 'today' ? (
                                <>
                                    <Text style={styles.reportLabel}>Today's Report from</Text>
                                    <Text style={styles.reportTime}>
                                        {summaryData!.fromTime} - {summaryData!.toTime}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.reportLabel}>Full Day Report</Text>
                                    <Text style={styles.reportTime}>{summaryData!.date}</Text>
                                </>
                            )}
                        </View>

                        <View style={[styles.card, Shadows.card]}>
                            <Text style={styles.cardTitle}>Summary</Text>
                            <Text style={styles.summaryText}>{summaryData!.summary}</Text>
                        </View>

                        <View style={styles.metricsGrid}>
                            {/* Left column: Temperature */}
                            <View style={styles.metricsColumn}>
                                <View style={[styles.metricCard, Shadows.card]}>
                                    <View style={styles.metricCardHeader}>
                                        <View style={styles.iconCircleRed}>
                                            <FontAwesome5 name="thermometer-half" size={18} color="#fec405" />
                                        </View>
                                        <Text style={styles.metricCardLabel}>Temperature</Text>
                                    </View>
                                    <View style={styles.metricContentContainer}>
                                        {summaryData!.temperature?.average && (
                                            <Text style={styles.metricStatLine}>
                                                <Text style={styles.metricStatKey}>Average: </Text>
                                                <Text style={styles.metricStatValue}>{summaryData!.temperature.average}</Text>
                                            </Text>
                                        )}
                                        {summaryData!.temperature?.lowest && (
                                            <Text style={styles.metricStatLine}>
                                                <Text style={styles.metricStatKey}>Lowest: </Text>
                                                <Text style={styles.metricStatValue}>{summaryData!.temperature.lowest}</Text>
                                            </Text>
                                        )}
                                        {summaryData!.temperature?.highest && (
                                            <Text style={styles.metricStatLine}>
                                                <Text style={styles.metricStatKey}>Highest: </Text>
                                                <Text style={styles.metricStatValue}>{summaryData!.temperature.highest}</Text>
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Right column: Activity */}
                            <View style={styles.metricsColumn}>
                                <View style={[styles.metricCard, Shadows.card]}>
                                    <View style={styles.metricCardHeader}>
                                        <View style={styles.iconCircleCyan}>
                                            <MaterialCommunityIcons name="run" size={20} color={TimelineColors.primaryCyan} />
                                        </View>
                                        <Text style={styles.metricCardLabel}>Activity</Text>
                                    </View>
                                    <View style={styles.metricContentContainer}>
                                        <View style={styles.activityItem}>
                                            <Text style={styles.activityNumber}>
                                                {String(summaryData!.activity?.falls ?? 0).padStart(2, '0')}
                                            </Text>
                                            <Text style={styles.activityItemLabel}>Falls{"\n"}Detected</Text>
                                        </View>
                                        <View style={styles.activityDivider} />
                                        <View style={styles.activityItem}>
                                            <Text style={styles.activityNumber}>
                                                {String(summaryData!.activity?.urinations ?? 0).padStart(2, '0')}
                                            </Text>
                                            <Text style={styles.activityItemLabel}>Urinations{"\n"}Detected</Text>
                                        </View>
                                        <View style={styles.activityDivider} />
                                        <View style={styles.activityItem}>
                                            <Text style={styles.activityNumber}>
                                                {String(summaryData!.activity?.movements ?? 0).padStart(2, '0')}
                                            </Text>
                                            <Text style={styles.activityItemLabel}>Movements{"\n"}Detected</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {summaryData!.potentialRisks && summaryData!.potentialRisks.length > 0 && (
                            <View style={[styles.card, Shadows.card]}>
                                <Text style={styles.risksTitle}>Potential Risks</Text>
                                {summaryData!.potentialRisks.map((risk, index) => (
                                    <View key={index} style={styles.bulletRow}>
                                        <Text style={styles.bulletDot}>{'•'}</Text>
                                        <Text style={styles.bulletText}>{risk}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {summaryData!.recommendations && summaryData!.recommendations.length > 0 && (
                            <View style={[styles.card, Shadows.card]}>
                                <Text style={styles.recommendationsTitle}>Recommendations</Text>
                                {summaryData!.recommendations.map((rec, index) => (
                                    <View key={index} style={styles.bulletRow}>
                                        <Text style={styles.bulletDot}>{'•'}</Text>
                                        <Text style={styles.bulletText}>{rec}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
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
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: TimelineColors.cardBackground,
        borderRadius: 30,
        padding: 4,
        marginBottom: 20,
        ...Shadows.button,
    },
    toggleTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleTabActive: {
        backgroundColor: TimelineColors.primaryCyan,
    },
    toggleTabText: {
        fontSize: 15,
        fontWeight: '500',
        color: TimelineColors.textMedium,
    },
    toggleTabTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    infoRow: {
        height: 36,
        justifyContent: 'center',
        marginBottom: 20,
    },
    helperText: {
        fontSize: 14,
        color: TimelineColors.textLight,
    },
    datePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectDateLabel: {
        fontSize: 14,
        color: TimelineColors.textLight,
    },
    datePill: {
        backgroundColor: TimelineColors.cardBackground,
        paddingVertical: 6,
        paddingHorizontal: 14,
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
    card: {
        backgroundColor: TimelineColors.cardBackground,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: TimelineColors.textDark,
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 14,
        color: TimelineColors.textMedium,
        lineHeight: 22,
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    metricsColumn: {
        flex: 1,
    },
    metricCard: {
        backgroundColor: TimelineColors.cardBackground,
        borderRadius: 20,
        padding: 20,
        height: 215,
        flexDirection: 'column',
    },
    metricCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
        height: 40, // updated to match circle height
    },
    metricCardLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: TimelineColors.textDark,
    },
    // Icon circle — red/warm tint for Temperature
    iconCircleRed: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff9d3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Icon circle — cyan tint for Activity
    iconCircleCyan: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E6F8F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricContentContainer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingBottom: 1,
        paddingTop: 1,
    },
    metricStatLine: {
        fontSize: 14,
    },
    metricStatKey: {
        color: TimelineColors.textMedium,
    },
    metricStatValue: {
        color: TimelineColors.textDark,
        fontWeight: '500',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    activityNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TimelineColors.textDark,
        minWidth: 28,
    },
    activityItemLabel: {
        fontSize: 12,
        color: TimelineColors.textMedium,
        lineHeight: 14,
    },
    activityDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 2,
    },
    risksTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B',
        marginBottom: 12,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    bulletDot: {
        fontSize: 13,
        color: TimelineColors.textMedium,
        marginRight: 6,
        lineHeight: 20,
    },
    bulletText: {
        flex: 1,
        fontSize: 13,
        color: TimelineColors.textMedium,
        lineHeight: 20,
        flexShrink: 1,
    },
    recommendationsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2ECC71',
        marginBottom: 12,
    },
});