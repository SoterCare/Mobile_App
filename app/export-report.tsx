import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

    const [selectedDevice, setSelectedDevice] = useState('Device 01');
    const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
    const devices = ['Device 01', 'Device 02'];

    const [isSingleDate, setIsSingleDate] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [hasSelectedDate, setHasSelectedDate] = useState(false);
    const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

    const [selectedMetrics, setSelectedMetrics] = useState({
        temperature: false,
        activity: false,
    });

    const [exportFormat, setExportFormat] = useState<'CSV' | 'PDF'>('CSV');
    const [isExporting, setIsExporting] = useState(false);

    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [isLoadingDates, setIsLoadingDates] = useState(true);

    React.useEffect(() => {
        const fetchDates = async () => {
            try {
                const response = await apiClient.get(API_CONFIG.ENDPOINTS.LOGS.DATES);
                if (response.data && Array.isArray(response.data.dates)) {
                    const sorted = response.data.dates.sort();
                    setAvailableDates(sorted);
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

    const toLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);

            if (!selectedMetrics.temperature && !selectedMetrics.activity) {
                Alert.alert('Selection Error', 'Please select at least one metric to export.');
                return;
            }

            const startStr = toLocalDateString(startDate);
            const endStr = toLocalDateString(endDate);

            if (isSingleDate) {
                if (availableDates.length > 0 && !availableDates.includes(startStr)) {
                    Alert.alert('No Data', `No logs found for ${startStr}.`);
                    return;
                }
            } else {
                if (availableDates.length > 0) {
                    const hasData = availableDates.some(date => date >= startStr && date <= endStr);
                    if (!hasData) {
                        Alert.alert('No Data', 'No logs found for the selected date range.');
                        return;
                    }
                }
            }

            const payload = {
                device: selectedDevice,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                isSingleDate,
                metrics: {
                    heartRate: false,
                    spo2: false,
                    temperature: selectedMetrics.temperature,
                },
                format: exportFormat,
                includeActivity: selectedMetrics.activity,
            };

            const response = await apiClient.post(API_CONFIG.ENDPOINTS.REPORTS.EXPORT, payload);
            const isNewFormat = response.data.meta && response.data.report;

            if (isNewFormat) {
                await generateAndSharePDF(response.data);
            } else {
                const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
                if (!data || data.length === 0) {
                    Alert.alert('No Data', 'No records found for the selected criteria.');
                    return;
                }
                if (exportFormat === 'CSV') {
                    await generateAndShareCSV(data);
                } else {
                    await generateAndSharePDF(data);
                }
            }
        } catch (error) {
            console.error('Export Error:', error);
            Alert.alert('Export Failed', 'Failed to export report.');
        } finally {
            setIsExporting(false);
        }
    };

    const sortedDates = [...availableDates].sort();
    const minDate = sortedDates.length > 0 ? new Date(sortedDates[0]) : undefined;
    const maxDate = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1]) : new Date();

    const generateAndShareCSV = async (data: any[]) => {
        let csvContent = "Timestamp";
        if (selectedMetrics.temperature) csvContent += ",Temperature (°C)";
        if (selectedMetrics.activity) csvContent += ",Activity";
        csvContent += "\n";

        data.forEach(row => {
            let rowStr = `"${row.timestamp}"`;
            if (selectedMetrics.temperature) rowStr += `,${row.temperature}`;
            if (selectedMetrics.activity) rowStr += `,${row.activity}`;
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

    const generateAndSharePDF = async (data: any) => {
        const isNewFormat = data.meta && data.report;
        const dataPoints = isNewFormat ? [] : data;

        let headers = "<th>Timestamp</th>";
        if (selectedMetrics.temperature) headers += "<th>Temperature (°C)</th>";
        if (selectedMetrics.activity) headers += "<th>Activity</th>";

        let rows = '';
        if (!isNewFormat && Array.isArray(dataPoints)) {
            rows = dataPoints.map((row: any) => {
                let r = `<tr><td>${row.timestamp}</td>`;
                if (selectedMetrics.temperature) r += `<td>${row.temperature}</td>`;
                if (selectedMetrics.activity) r += `<td>${row.activity}</td>`;
                r += "</tr>";
                return r;
            }).join('');
        }

        const convertMarkdownToHTML = (markdown: string) => {
            return markdown
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/^- (.+)$/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
        };

        const aiReportHTML = isNewFormat && data.report
            ? `<div class="ai-report">
                <h2 style="color: #2c5282; border-bottom: 2px solid #2c5282; padding-bottom: 10px; margin-top: 30px;">AI Clinical Analysis</h2>
                <div class="report-content">${convertMarkdownToHTML(data.report)}</div>
               </div>`
            : '';

        const metaSummary = isNewFormat && data.meta
            ? `<div class="meta-summary">
                <p><strong>Data Points Analyzed:</strong> ${data.meta.dataPointsAnalyzed}</p>
                <p><strong>Generated At:</strong> ${new Date(data.meta.generatedAt).toLocaleString()}</p>
               </div>`
            : '';

        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; line-height: 1.6; }
                        h1 { color: #1a365d; border-bottom: 3px solid #4299e1; padding-bottom: 10px; }
                        h2 { color: #2c5282; margin-top: 20px; border-bottom: 1px solid #cbd5e0; padding-bottom: 5px; }
                        h3 { color: #2d3748; margin-top: 15px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background-color: #4299e1; color: white; font-weight: 600; }
                        tr:nth-child(even) { background-color: #f7fafc; }
                        .meta-summary { background-color: #edf2f7; padding: 15px; border-radius: 8px; margin: 20px 0; }
                        .ai-report { margin-top: 30px; padding: 20px; background-color: #f8fafe; border-left: 4px solid #4299e1; }
                    </style>
                </head>
                <body>
                    <h1>SoterCare Medical Report</h1>
                    <p><strong>Device:</strong> ${selectedDevice}</p>
                    <p><strong>Date Range:</strong> ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
                    ${metaSummary}
                    ${!isNewFormat ? `<table><tr>${headers}</tr>${rows}</table>` : ''}
                    ${aiReportHTML}
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

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >

                {/* Select Device */}
                <View style={[styles.section, { zIndex: 10 }]}>
                    <Text style={styles.sectionTitle}>Select Device</Text>
                    <View>
                        <TouchableOpacity
                            style={styles.dropdownButtonBox}
                            activeOpacity={0.8}
                            onPress={() => setShowDeviceDropdown(prev => !prev)}
                        >
                            <Text style={styles.dropdownButtonText}>{selectedDevice}</Text>
                            <IconSymbol
                                name={showDeviceDropdown ? 'chevron.up' : 'chevron.down'}
                                size={20}
                                color="#333"
                            />
                        </TouchableOpacity>

                        {showDeviceDropdown && (
                            <View style={styles.dropdownMenu}>
                                {devices.map((device, index) => (
                                    <TouchableOpacity
                                        key={device}
                                        style={[
                                            styles.dropdownItem,
                                            selectedDevice === device && styles.dropdownItemActive,
                                            index < devices.length - 1 && styles.dropdownItemBorder,
                                        ]}
                                        onPress={() => {
                                            setSelectedDevice(device);
                                            setShowDeviceDropdown(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.dropdownItemText,
                                            selectedDevice === device && styles.dropdownItemTextActive,
                                        ]}>
                                            {device}
                                        </Text>
                                        {selectedDevice === device && (
                                            <IconSymbol name="checkmark" size={14} color="#8FD9E5" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Select Date */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Date</Text>
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            onPress={() => setShowPicker('start')}
                            activeOpacity={0.8}
                            style={styles.dateButton}
                        >
                            <View style={styles.dateButtonContent as any}>
                                <Text style={!hasSelectedDate ? styles.dateButtonPlaceholder : styles.dateButtonText}>
                                    {hasSelectedDate
                                        ? startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'Start Date'}
                                </Text>
                                <IconSymbol name="chevron.right" size={18} color="#bbb" style={styles.dateButtonChevron} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => !isSingleDate && setShowPicker('end')}
                            activeOpacity={isSingleDate ? 1 : 0.8}
                            style={styles.dateButton}
                        >
                            <View style={(isSingleDate ? styles.dateButtonContentDisabled : styles.dateButtonContent) as any}>
                                <Text style={isSingleDate ? styles.dateButtonDisabled : (!hasSelectedDate ? styles.dateButtonPlaceholder : styles.dateButtonText)}>
                                    {hasSelectedDate && !isSingleDate
                                        ? endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'End Date'}
                                </Text>
                                <IconSymbol name="chevron.right" size={18} color={isSingleDate ? '#ddd' : '#bbb'} style={styles.dateButtonChevron} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {showPicker && (
                        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 10, marginTop: 10 }}>
                            <Calendar
                                current={toLocalDateString(showPicker === 'start' ? startDate : endDate)}
                                minDate={minDate ? toLocalDateString(minDate) : undefined}
                                maxDate={maxDate ? toLocalDateString(maxDate) : undefined}
                                onDayPress={(day: any) => {
                                    const date = new Date(day.dateString);
                                    if (availableDates.length > 0 && !availableDates.includes(day.dateString)) return;

                                    setHasSelectedDate(true);

                                    if (showPicker === 'start') {
                                        setStartDate(date);
                                        if (isSingleDate || date > endDate) setEndDate(date);
                                    } else {
                                        setEndDate(date);
                                        if (date < startDate) setStartDate(date);
                                    }
                                    setShowPicker(null);
                                }}
                                markingType={'period'}
                                markedDates={(() => {
                                    const marks: any = {};
                                    const sStr = toLocalDateString(startDate);
                                    const eStr = toLocalDateString(endDate);

                                    if (isSingleDate) {
                                        marks[sStr] = { selected: true, color: '#81D4FA', textColor: 'white' };
                                    } else {
                                        let curr = new Date(startDate);
                                        while (curr <= endDate) {
                                            const str = toLocalDateString(curr);
                                            marks[str] = {
                                                selected: true,
                                                color: '#81D4FA',
                                                startingDay: str === sStr,
                                                endingDay: str === eStr
                                            };
                                            curr.setDate(curr.getDate() + 1);
                                        }
                                    }
                                    return marks;
                                })()}
                                theme={{ arrowColor: '#81D4FA', todayTextColor: '#81D4FA' }}
                            />
                        </View>
                    )}

                    <TouchableOpacity style={styles.singleDateRow} onPress={() => setIsSingleDate(!isSingleDate)}>
                        <View style={[styles.checkbox, isSingleDate && styles.checkboxChecked]}>
                            {isSingleDate && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Single Date</Text>
                    </TouchableOpacity>
                </View>

                {/* Metrics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Metrics to Export</Text>
                    <View style={styles.metricsRow}>
                        <MetricCard
                            icon="thermometer"
                            color="#FFB966"
                            bgColor="#FFF5E6"
                            label="Temperature"
                            checked={selectedMetrics.temperature}
                            onPress={() => toggleMetric('temperature')}
                            iconSize={32}
                        />
                        <MetricCard
                            icon="walk"
                            color="#4DB6E8"
                            bgColor="#E8F6FD"
                            label="Activity"
                            checked={selectedMetrics.activity}
                            onPress={() => toggleMetric('activity')}
                            iconSize={32}
                            useMatIcon
                        />
                    </View>
                </View>

                {/* Export Format */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Export Format</Text>
                    <View style={styles.formatToggleContainer}>
                        <View style={styles.formatToggleContent}>
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
                        </View>
                    </View>
                </View>

                {/* Export Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.exportButton, isExporting && { opacity: 0.7 }]}
                        activeOpacity={0.8}
                        onPress={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.exportButtonText}>Export</Text>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.footerText}>{`Exporting as a ${exportFormat} document`}</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// ── MetricCard ──────────────────────────────────────────────────────────────
function MetricCard({ icon, color, bgColor, label, checked, onPress, iconSize = 40, useMatIcon = false }: any) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.metricCardWrapper}>
            <View style={styles.metricCardContent}>
                <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
                    {useMatIcon
                        ? <MaterialCommunityIcons name={icon} size={iconSize} color={color} />
                        : <IconSymbol name={icon} size={iconSize} color={color} />
                    }
                </View>
                <Text style={styles.metricLabel}>{label}</Text>
                <View style={[styles.checkbox, checked && styles.metricCheckboxChecked, { borderRadius: 6, width: 22, height: 22 }]}>
                    {checked && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f3f7' },
    scrollContent: { padding: 30, paddingBottom: 40 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#B0B0B0', marginBottom: 16 },

    // Device Dropdown
    dropdownButtonBox: {
        backgroundColor: '#A0E4EB',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 170,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    dropdownButtonText: { fontSize: 16, color: '#333333', fontWeight: '500' },
    dropdownMenu: {
        position: 'absolute',
        top: 58,
        left: 0,
        zIndex: 999,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: 170,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 13,
    },
    dropdownItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dropdownItemActive: {
        backgroundColor: '#F0FAFB',
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#333333',
        fontWeight: '500',
    },
    dropdownItemTextActive: {
        color: '#8FD9E5',
        fontWeight: '600',
    },

    // Date
    dateRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    dateButton: { flex: 1 },
    dateButtonContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    dateButtonContentDisabled: {
        backgroundColor: '#FCFCFC',
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    dateButtonChevron: { position: 'absolute', right: 16 },
    dateButtonText: { fontSize: 15, color: '#333333', fontWeight: '500' },
    dateButtonPlaceholder: { fontSize: 15, color: '#333333', fontWeight: '500' },
    dateButtonDisabled: { fontSize: 15, color: '#C0C0C0', fontWeight: '500' },
    singleDateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkbox: { width: 22, height: 22, borderRadius: 6, backgroundColor: '#D9D9D9', justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#8FD9E5' },
    metricCheckboxChecked: { backgroundColor: '#8FD9E5' },
    checkboxLabel: { fontSize: 15, color: '#888888', fontWeight: '500' },

    // Metrics
    metricsRow: { flexDirection: 'row', gap: 20, justifyContent: 'center' },
    metricCardWrapper: { width: 140 },
    metricCardContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        paddingHorizontal: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        height: 150,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    metricLabel: { fontSize: 13, color: '#888888', textAlign: 'center', fontWeight: '500', marginBottom: 10 },

    // Format Toggle
    formatToggleContainer: { width: '100%', marginBottom: 10 },
    formatToggleContent: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    formatOption: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 26 },
    formatOptionActive: { backgroundColor: '#8FD9E5' },
    formatText: { fontSize: 16, fontWeight: '600', color: '#333333' },
    formatTextActive: { color: '#FFFFFF' },

    activityReportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    activityReportText: { fontSize: 16, fontWeight: '600', color: '#555555' },

    // Footer
    footer: { marginTop: 10, alignItems: 'center', gap: 12 },
    exportButton: {
        width: '100%',
        backgroundColor: '#8FD9E5',
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    exportButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
    footerText: { fontSize: 14, color: '#888888', fontWeight: '500' },
});