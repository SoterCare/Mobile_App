import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';

export default function ExportReportScreen() {
    const router = useRouter();

    // Form State
    const [selectedDevice, setSelectedDevice] = useState('Device 01');
    const [isSingleDate, setIsSingleDate] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);
    const [reportData, setReportData] = useState<any[] | null>(null);

    const [selectedMetrics, setSelectedMetrics] = useState({
        heartRate: false,
        spo2: false,
        temperature: true,
    });
    const [exportFormat, setExportFormat] = useState<'CSV' | 'PDF'>('CSV');
    const [includeActivity, setIncludeActivity] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [isLoadingDates, setIsLoadingDates] = useState(true);

    // Fetch available dates on mount
    React.useEffect(() => {
        const fetchDates = async () => {
            try {
                const response = await apiClient.get(API_CONFIG.ENDPOINTS.LOGS.DATES);
                if (response.data && Array.isArray(response.data.dates)) {
                    const sorted = response.data.dates.sort();
                    setAvailableDates(sorted);

                    // Auto-select the most recent date if available
                    if (sorted.length > 0) {
                        const latestDate = new Date(sorted[sorted.length - 1]);
                        setStartDate(latestDate);
                        setEndDate(latestDate);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch available dates:', error);
            } finally {
                setIsLoadingDates(false);
            }
        };
        fetchDates();
    }, []);

    const toggleMetric = (metric: keyof typeof selectedMetrics) => {
        setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
    };

    // Helper: Format date as YYYY-MM-DD in Local Time
    const toLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentPicker = showPicker;
        setShowPicker(null);

        if (selectedDate && currentPicker) {
            // Strict Validation - Block invalid dates
            if (availableDates.length > 0) {
                const dateStr = toLocalDateString(selectedDate);

                // If specific date not found, reject update
                if (!availableDates.includes(dateStr)) {
                    Alert.alert(
                        'Invalid Date',
                        `No logs available for ${dateStr}. Please select a date displayed in the calendar range.`
                    );
                    return; // STOP EXECUTION - do not update state
                }
            }

            if (currentPicker === 'start') setStartDate(selectedDate);
            if (currentPicker === 'end') setEndDate(selectedDate);
        }
    };

    const handleAction = async () => {
        // Step 2: Export Data
        if (reportData) {
            try {
                if (exportFormat === 'CSV') {
                    await generateAndShareCSV(reportData);
                } else {
                    await generateAndSharePDF(reportData);
                }
            } catch (error) {
                Alert.alert('Save Failed', 'Could not save the file.');
            }
            return;
        }

        // Step 1: Generate Data
        try {
            setIsExporting(true);

            // Validation: Metrics
            if (!selectedMetrics.heartRate && !selectedMetrics.spo2 && !selectedMetrics.temperature) {
                Alert.alert('Selection Error', 'Please select at least one metric to export.');
                setIsExporting(false);
                return;
            }

            // Validation: Dates
            const startStr = toLocalDateString(startDate);
            const endStr = toLocalDateString(endDate);

            if (isSingleDate) {
                if (!availableDates.includes(startStr)) {
                    Alert.alert('No Data', `No logs found for ${startStr}.`);
                    setIsExporting(false);
                    return;
                }
            } else {
                // Check intersection
                // Assumption: availableDates strings are sortable YYYY-MM-DD
                const hasData = availableDates.some(date => date >= startStr && date <= endStr);
                if (!hasData) {
                    Alert.alert('No Data', 'No logs found for the selected date range.');
                    setIsExporting(false);
                    return;
                }
            }

            const payload = {
                device: selectedDevice,
                startDate: startDate.toISOString(), // Backend likely expects ISO for querying, but we validated availability against local date string
                endDate: endDate.toISOString(),
                isSingleDate,
                metrics: selectedMetrics,
                format: exportFormat,
                includeActivity
            };

            const url = API_CONFIG.ENDPOINTS.REPORTS.EXPORT;
            console.log(`Sending Report Request to [${url}]:`, JSON.stringify(payload, null, 2));

            const response = await apiClient.post(url, payload);
            console.log('Report Response Status:', response.status);

            // Handle response wrapping
            const data = Array.isArray(response.data) ? response.data : (response.data.data || []);

            if (!data || data.length === 0) {
                Alert.alert('No Data', 'No records found for the selected criteria.');
                return;
            }

            setReportData(data);
            Alert.alert('Report Generated', 'Data received. Click "Export" to save the file.');

        } catch (error) {
            console.error('Export Error:', error);
            Alert.alert('Generation Failed', 'Failed to generate report from backend.');
        } finally {
            setIsExporting(false);
        }
    };

    // Calculate constraints without mutating state
    const sortedDates = [...availableDates].sort();
    const minDate = sortedDates.length > 0 ? new Date(sortedDates[0]) : undefined;
    const maxDate = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1]) : new Date();

    const generateAndShareCSV = async (data: any[]) => {
        let csvContent = "Timestamp";
        if (selectedMetrics.heartRate) csvContent += ",Heart Rate (bpm)";
        if (selectedMetrics.spo2) csvContent += ",SpO2 (%)";
        if (selectedMetrics.temperature) csvContent += ",Temperature (°C)";
        csvContent += "\n";

        data.forEach(row => {
            let rowStr = `"${row.timestamp}"`;
            if (selectedMetrics.heartRate) rowStr += `,${row.heartRate}`;
            if (selectedMetrics.spo2) rowStr += `,${row.spo2}`;
            if (selectedMetrics.temperature) rowStr += `,${row.temperature}`;
            csvContent += rowStr + "\n";
        });

        const fileUri = FileSystem.documentDirectory + `SoterCare_Report_${Date.now()}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        } else {
            Alert.alert('Saved', 'CSV saved to documents.');
        }
    };

    const generateAndSharePDF = async (data: any[]) => {
        let headers = "<th>Timestamp</th>";
        if (selectedMetrics.heartRate) headers += "<th>Heart Rate</th>";
        if (selectedMetrics.spo2) headers += "<th>SpO2</th>";
        if (selectedMetrics.temperature) headers += "<th>Temp (°C)</th>";

        let rows = data.map(row => {
            let r = `<tr><td>${row.timestamp}</td>`;
            if (selectedMetrics.heartRate) r += `<td>${row.heartRate}</td>`;
            if (selectedMetrics.spo2) r += `<td>${row.spo2}</td>`;
            if (selectedMetrics.temperature) r += `<td>${row.temperature}</td>`;
            r += "</tr>";
            return r;
        }).join('');

        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: Helvetica; padding: 20px; }
                        h1 { color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f3f7; }
                    </style>
                </head>
                <body>
                    <h1>SoterCare Report</h1>
                    <p>Device: ${selectedDevice}</p>
                    <p>Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
                    <table>
                        <tr>${headers}</tr>
                        ${rows}
                    </table>
                </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Export Report',
                    headerTitleStyle: { fontSize: 20, fontWeight: '600', color: '#333' },
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#f2f3f7' },
                    headerTintColor: '#333',
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Select Device */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Device</Text>
                    <NeumorphicButton
                        onPress={() => { }}
                        style={styles.dropdownButton}
                        contentStyle={{ backgroundColor: '#A0E4EB', paddingHorizontal: 16, borderRadius: 20, justifyContent: 'space-between', width: '100%' }}
                        label={selectedDevice}
                        icon={<IconSymbol name="chevron.down" size={20} color="#555" />}
                        variant="primary"
                    />
                </View>

                {/* Select Date */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Date</Text>
                    <View style={styles.dateRow}>
                        <NeumorphicButton
                            onPress={() => setShowPicker('start')}
                            label={startDate.toLocaleDateString()}
                            style={styles.dateButton}
                            contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 20 }}
                            textStyle={styles.dateButtonText}
                        />
                        <NeumorphicButton
                            onPress={() => setShowPicker('end')}
                            label={endDate.toLocaleDateString()}
                            style={styles.dateButton}
                            contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 20 }}
                            textStyle={styles.dateButtonText}
                        />
                    </View>

                    {showPicker && (
                        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 10, marginTop: 10 }}>
                            <Calendar
                                current={toLocalDateString(startDate)}
                                minDate={minDate ? toLocalDateString(minDate) : undefined}
                                maxDate={maxDate ? toLocalDateString(maxDate) : undefined}
                                onDayPress={(day: any) => {
                                    const date = new Date(day.dateString);

                                    // Validation (Redundant if disabled, but safe)
                                    if (!availableDates.includes(day.dateString)) return;

                                    if (isSingleDate) {
                                        setStartDate(date);
                                        setEndDate(date);
                                    } else {
                                        // Range selection logic
                                        // If start selected and end is same as start (initial), set end
                                        // Or if picking new start
                                        if (startDate.getTime() === endDate.getTime()) {
                                            if (date < startDate) {
                                                setStartDate(date);
                                            } else {
                                                setEndDate(date);
                                            }
                                        } else {
                                            // Reset to new start
                                            setStartDate(date);
                                            setEndDate(date);
                                        }
                                    }
                                }}
                                markingType={'period'}
                                markedDates={(() => {
                                    const marks: any = {};

                                    // 1. Mark holes as disabled
                                    if (availableDates.length > 0) {
                                        const startRange = new Date(availableDates[0]);
                                        const endRange = new Date(availableDates[availableDates.length - 1]);

                                        for (let d = new Date(startRange); d <= endRange; d.setDate(d.getDate() + 1)) {
                                            const dateStr = toLocalDateString(d);
                                            if (!availableDates.includes(dateStr)) {
                                                marks[dateStr] = { disabled: true, disableTouchEvent: true, color: '#f9f9f9', textColor: '#d0d0d0' };
                                            }
                                        }
                                    }

                                    // 2. Mark Selection
                                    const sStr = toLocalDateString(startDate);
                                    const eStr = toLocalDateString(endDate);

                                    if (isSingleDate) {
                                        marks[sStr] = { ...marks[sStr], selected: true, color: '#81D4FA', textColor: 'white', startingDay: true, endingDay: true };
                                    } else {
                                        // Fill range
                                        let current = new Date(startDate);
                                        const end = new Date(endDate);

                                        while (current <= end) {
                                            const str = toLocalDateString(current);
                                            const isStart = str === sStr;
                                            const isEnd = str === eStr;

                                            // Keep disabled state if it was disabled (hole in range), but apply selection overlay?
                                            // If a hole is IN the selection, we might want to show it as selected but maybe different color?
                                            // For now, overwrite.

                                            marks[str] = {
                                                ...marks[str],
                                                selected: true,
                                                color: '#81D4FA',
                                                textColor: 'white',
                                                startingDay: isStart,
                                                endingDay: isEnd
                                            };

                                            current.setDate(current.getDate() + 1);
                                        }
                                    }
                                    return marks;
                                })()}
                                theme={{
                                    arrowColor: '#81D4FA',
                                    todayTextColor: '#81D4FA',
                                    textDayFontWeight: '600',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: 'normal',
                                }}
                            />
                            <TouchableOpacity style={{ alignItems: 'center', padding: 10 }} onPress={() => setShowPicker(null)}>
                                <Text style={{ color: '#81D4FA', fontWeight: '600' }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.singleDateRow}
                        onPress={() => setIsSingleDate(!isSingleDate)}
                    >
                        <View style={[styles.checkbox, isSingleDate && styles.checkboxChecked]}>
                            {isSingleDate && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Single Date</Text>
                    </TouchableOpacity>
                </View>

                {/* Select Metrics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Metrics to Export</Text>
                    <View style={styles.metricsRow}>
                        <MetricCard
                            icon="heart.fill"
                            color="#e57373"
                            label="Heart Rate"
                            checked={selectedMetrics.heartRate}
                            onPress={() => toggleMetric('heartRate')}
                        />
                        <MetricCard
                            icon="drop.fill"
                            color="#64b5f6"
                            label="SpO2 Level"
                            checked={selectedMetrics.spo2}
                            onPress={() => toggleMetric('spo2')}
                        />
                        <MetricCard
                            icon="thermometer"
                            color="#ffb74d"
                            label="Temperature"
                            checked={selectedMetrics.temperature}
                            onPress={() => toggleMetric('temperature')}
                        />
                    </View>
                </View>

                {/* Export Format */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Export Format</Text>
                    <View style={styles.formatToggleContainer}>
                        <NeumorphicCard style={styles.formatToggleCard} contentContainerStyle={styles.formatToggleContent}>
                            <TouchableOpacity
                                style={[styles.formatOption, exportFormat === 'CSV' && styles.formatOptionActive]}
                                onPress={() => setExportFormat('CSV')}
                            >
                                <Text style={[styles.formatText, exportFormat === 'CSV' && styles.formatTextActive]}>CSV</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.formatOption, exportFormat === 'PDF' && styles.formatOptionActive]}
                                onPress={() => setExportFormat('PDF')}
                            >
                                <Text style={[styles.formatText, exportFormat === 'PDF' && styles.formatTextActive]}>PDF</Text>
                            </TouchableOpacity>
                        </NeumorphicCard>
                    </View>
                </View>

                {/* Activity Report */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity Report</Text>
                    <TouchableOpacity
                        style={styles.singleDateRow}
                        onPress={() => setIncludeActivity(!includeActivity)}
                    >
                        <View style={[styles.checkbox, includeActivity && styles.themeCheckboxChecked]}>
                            {includeActivity && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                        </View>
                        <Text style={[styles.checkboxLabel, { fontWeight: '600' }]}>Include Activity Report</Text>
                    </TouchableOpacity>
                </View>

                {/* Action Button */}
                <View style={styles.footer}>
                    <NeumorphicButton
                        onPress={handleAction}
                        label={isExporting ? (reportData ? "Exporting..." : "Generating...") : (reportData ? "Export" : "Generate")}
                        style={styles.exportButton}
                        contentStyle={{ backgroundColor: reportData ? '#4CAF50' : '#81D4FA', borderRadius: 25, height: 56, justifyContent: 'center' }}
                        textStyle={styles.exportButtonText}
                        icon={isExporting ? <ActivityIndicator color="#FFF" /> : (reportData ? <IconSymbol name="square.and.arrow.up" size={20} color="#FFF" /> : null)}
                    />
                    <Text style={styles.footerText}>
                        {reportData ? `Ready to export as ${exportFormat}` : `Click Generate to fetch report data`}
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// Reusable Metric Card (Internal)
function MetricCard({ icon, color, label, checked, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.metricCardWrapper}>
            <NeumorphicCard style={styles.metricCard} contentContainerStyle={styles.metricCardContent}>
                <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
                    <IconSymbol name={icon} size={24} color={color} />
                </View>
                <Text style={styles.metricLabel}>{label}</Text>
                <View style={[styles.checkbox, checked && styles.themeCheckboxChecked]}>
                    {checked && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                </View>
            </NeumorphicCard>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f3f7',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#888',
        marginBottom: 12,
    },
    dropdownButton: {
        width: 150,
        backgroundColor: '#A0E4EB', // Light Teal from Image
        borderRadius: 20,
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    dateButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        flex: 1,
    },
    dateButtonText: {
        fontSize: 14,
        color: '#555',
    },
    singleDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#ddd', // Unchecked gray
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#A0E4EB', // Teal from image
    },
    themeCheckboxChecked: {
        backgroundColor: '#81D4FA', // Brighter blue/teal
    },
    checkboxLabel: {
        fontSize: 15,
        color: '#666',
    },

    // Metrics
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    metricCardWrapper: {
        flex: 1,
    },
    metricCard: {
        width: '100%',
        aspectRatio: 0.8,
    },
    metricCardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-evenly',
        padding: 10,
        backgroundColor: '#FFFFFF',
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
    },

    // Format Toggle
    formatToggleContainer: {
        width: 200,
    },
    formatToggleCard: {
        borderRadius: 25,
    },
    formatToggleContent: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
    },
    formatOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 20,
    },
    formatOptionActive: {
        backgroundColor: '#81D4FA', // Active Blue/Teal
    },
    formatText: {
        fontWeight: '600',
        color: '#666',
    },
    formatTextActive: {
        color: '#FFFFFF',
    },

    // Footer
    footer: {
        marginTop: 10,
        alignItems: 'center',
        gap: 12,
    },
    exportButton: {
        width: '100%',
        backgroundColor: '#81D4FA',
        borderRadius: 25,
        height: 56,
    },
    exportButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    footerText: {
        fontSize: 13,
        color: '#999',
    },
});
