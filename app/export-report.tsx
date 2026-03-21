import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import apiClient from '@/api/client';
import { API_CONFIG } from '@/api/config/api.config';
import { HealthLogItem, healthLogsService } from '@/services/healthLogsService';
import { cleanSummaryText } from '@/services/summaryService';

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
    const [dateError, setDateError] = useState<string | null>(null);
    const [logsByRange, setLogsByRange] = useState<HealthLogItem[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [logsError, setLogsError] = useState<string | null>(null);

    const getAuthStatus = (error: any): number | undefined => error?.response?.status;

    const toUtcStartOfDay = (date: Date): Date => {
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
    };

    const toUtcEndOfDay = (date: Date): Date => {
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999));
    };

    const effectiveRange = useMemo(() => {
        return {
            start: toUtcStartOfDay(startDate),
            end: isSingleDate ? toUtcEndOfDay(startDate) : toUtcEndOfDay(endDate),
        };
    }, [startDate, endDate, isSingleDate]);

    React.useEffect(() => {
        const fetchDates = async () => {
            try {
                setDateError(null);
                const dates = await healthLogsService.getAvailableDates();
                const sorted = [...dates].sort();
                setAvailableDates(sorted);
                if (sorted.length > 0) {
                    const latestDate = new Date(sorted[sorted.length - 1]);
                    setStartDate(latestDate);
                    setEndDate(latestDate);
                    setHasSelectedDate(true);
                }
            } catch (error) {
                console.error('Failed to fetch available dates:', error);
                const status = getAuthStatus(error);
                if (status === 401 || status === 403) {
                    setDateError('Session expired. Please sign in again.');
                } else {
                    setDateError('Unable to load available dates. Tap retry.');
                }
            } finally {
                setIsLoadingDates(false);
            }
        };
        fetchDates();
    }, []);

    const fetchLogsBySelectedRange = React.useCallback(async () => {
        if (!hasSelectedDate) return;

        try {
            setIsLoadingLogs(true);
            setLogsError(null);
            const logs = await healthLogsService.getLogsByRange(
                effectiveRange.start.toISOString(),
                effectiveRange.end.toISOString()
            );
            setLogsByRange(logs);
        } catch (error) {
            console.error('Failed to fetch logs by range:', error);
            const status = getAuthStatus(error);
            if (status === 401 || status === 403) {
                setLogsError('Session expired. Please sign in again.');
            } else {
                setLogsError('Unable to load logs for selected range. Tap retry.');
            }
            setLogsByRange([]);
        } finally {
            setIsLoadingLogs(false);
        }
    }, [hasSelectedDate, effectiveRange.start, effectiveRange.end]);

    React.useEffect(() => {
        fetchLogsBySelectedRange();
    }, [fetchLogsBySelectedRange]);

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

            const startStr = toLocalDateString(effectiveRange.start);
            const endStr = toLocalDateString(effectiveRange.end);

            if (availableDates.length > 0) {
                const hasData = availableDates.some(date => date >= startStr && date <= endStr);
                if (!hasData) {
                    Alert.alert('No Data', 'No logs found for the selected date range.');
                    return;
                }
            }

            const payload = {
                device: selectedDevice,
                startDate: effectiveRange.start.toISOString(),
                endDate: effectiveRange.end.toISOString(),
                isSingleDate: isSingleDate,
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
            const status = getAuthStatus(error);
            if (status === 401 || status === 403) {
                Alert.alert('Session Expired', 'Please sign in again to continue.', [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(auth)/sign-in'),
                    },
                ]);
            } else {
                Alert.alert('Export Failed', 'Failed to export report.');
            }
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

        const LegacyFS = FileSystem as any;
        const fileUri = LegacyFS.documentDirectory + `SoterCare_Report_${Date.now()}.csv`;
        await LegacyFS.writeAsStringAsync(fileUri, csvContent, { encoding: LegacyFS.EncodingType.UTF8 });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        } else {
            Alert.alert('Saved', 'CSV saved to documents.');
        }
    };

    const generateAndSharePDF = async (data: any) => {
        const isNewFormat = data.meta && data.report;
        const dataPoints = isNewFormat ? (data.logs || []) : data;

        const parseDate = (ts: any) => {
            if (!ts) return "N/A";
            if (typeof ts === 'object' && ts.low !== undefined && ts.high !== undefined) {
                return new Date(ts.high * 4294967296 + (ts.low >>> 0)).toLocaleString();
            }
            if (typeof ts === 'number') {
                return new Date(ts > 100000000000 ? ts : ts * 1000).toLocaleString();
            }
            return String(ts);
        };

        let headers = "<th>Time</th>";
        headers += "<th>Skin Temp (°C)</th>";
        headers += "<th>Room Temp (°C)</th>";
        headers += "<th>Moisture (%)</th>";
        headers += "<th>Activity</th>";
        headers += "<th>Alerts</th>";

        let rows = '';
        if (Array.isArray(dataPoints) && dataPoints.length > 0) {
            rows = dataPoints.map((row: any) => {
                const time = parseDate(row.timestamp || row.createdAt);
                const temp = row.temperature ?? row.temp ?? 'N/A';
                const ambient = row.ambient_temp ?? row.ambientTemp ?? 'N/A';
                const moist = row.moisture ?? 'N/A';
                const activity = row.gait_label ?? row.gaitLabel ?? row.activity ?? 'N/A';
                
                const alerts = [];
                if (row.fall_alert || row.fallAlert) alerts.push("FALL");
                if (row.sos) alerts.push("SOS");
                const alertStr = alerts.length > 0 ? alerts.join(", ") : "None";

                return `<tr>
                    <td>${time}</td>
                    <td>${temp !== 'N/A' ? Number(temp).toFixed(1) : 'N/A'}</td>
                    <td>${ambient !== 'N/A' ? Number(ambient).toFixed(1) : 'N/A'}</td>
                    <td>${moist !== 'N/A' ? Number(moist).toFixed(0) : 'N/A'}</td>
                    <td>${activity}</td>
                    <td style="color: ${alerts.length > 0 ? '#C53030' : '#4A5568'}; font-weight: ${alerts.length > 0 ? 'bold' : 'normal'}">${alertStr}</td>
                </tr>`;
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
                <div class="report-content">${convertMarkdownToHTML(cleanSummaryText(data.report))}</div>
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
                    <p><strong>Date Range:</strong> ${startDate.toLocaleDateString()} - ${(isSingleDate ? startDate : endDate).toLocaleDateString()}</p>
                    ${metaSummary}
                    ${rows ? `<table><tr>${headers}</tr>${rows}</table>` : ''}
                    ${aiReportHTML}
                </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

            {/* ── Hide the default Stack header ── */}
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Custom Header ── */}
            <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.customHeaderTitle}>Export Report</Text>
                {/* Spacer to keep title centered */}
                <View style={{ width: 38 }} />
            </View>

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
                                            <IconSymbol name="checkmark" size={14} color="#91D7E4" />
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

                    <View style={styles.statusRow}>
                        {isLoadingDates ? (
                            <Text style={styles.helperText}>Loading available dates...</Text>
                        ) : dateError ? (
                            <>
                                <Text style={styles.errorText}>{dateError}</Text>
                                <TouchableOpacity
                                    style={styles.retryChip}
                                    onPress={async () => {
                                        setIsLoadingDates(true);
                                        try {
                                            const dates = await healthLogsService.getAvailableDates();
                                            const sorted = [...dates].sort();
                                            setAvailableDates(sorted);
                                            setDateError(null);
                                            if (sorted.length > 0) {
                                                const latestDate = new Date(sorted[sorted.length - 1]);
                                                setStartDate(latestDate);
                                                setEndDate(latestDate);
                                                setHasSelectedDate(true);
                                            }
                                        } catch (error) {
                                            const status = getAuthStatus(error);
                                            if (status === 401 || status === 403) {
                                                setDateError('Session expired. Please sign in again.');
                                            } else {
                                                setDateError('Unable to load available dates. Tap retry.');
                                            }
                                        } finally {
                                            setIsLoadingDates(false);
                                        }
                                    }}
                                >
                                    <Text style={styles.retryChipText}>Retry</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <Text style={styles.helperText}>{availableDates.length} available date(s)</Text>
                        )}
                    </View>

                    {/* Start / End Date row */}
                    <View style={styles.dateRow}>
                        {/* Start Date */}
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

                        {/* End Date — disabled when isSingleDate */}
                        <TouchableOpacity
                            onPress={() => { if (!isSingleDate) setShowPicker('end'); }}
                            activeOpacity={isSingleDate ? 1 : 0.8}
                            style={styles.dateButton}
                        >
                            <View style={(isSingleDate ? styles.dateButtonContentDisabled : styles.dateButtonContent) as any}>
                                <Text style={
                                    !hasSelectedDate
                                        ? styles.dateButtonPlaceholder
                                        : isSingleDate
                                            ? styles.dateButtonDisabled
                                            : styles.dateButtonText
                                }>
                                    {hasSelectedDate
                                        ? (isSingleDate ? startDate : endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'End Date'}
                                </Text>
                                <IconSymbol
                                    name="chevron.right"
                                    size={18}
                                    color={isSingleDate ? '#ddd' : '#bbb'}
                                    style={styles.dateButtonChevron}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Single Date checkbox */}
                    <TouchableOpacity
                        style={styles.singleDateRow}
                        activeOpacity={0.8}
                        onPress={() => {
                            setIsSingleDate(prev => {
                                if (!prev) setEndDate(startDate);
                                return !prev;
                            });
                        }}
                    >
                        <View style={[styles.checkbox, isSingleDate && styles.checkboxChecked]}>
                            {isSingleDate && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Single Date</Text>
                    </TouchableOpacity>

                    {/* Calendar Picker */}
                    {showPicker && (
                        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 10, marginTop: 10 }}>
                            <Calendar
                                current={toLocalDateString(showPicker === 'start' ? startDate : endDate)}
                                minDate={
                                    showPicker === 'end'
                                        ? toLocalDateString(startDate)
                                        : (minDate ? toLocalDateString(minDate) : undefined)
                                }
                                maxDate={maxDate ? toLocalDateString(maxDate) : undefined}
                                onDayPress={(day: any) => {
                                    const date = new Date(day.dateString);
                                    if (availableDates.length > 0 && !availableDates.includes(day.dateString)) return;

                                    setHasSelectedDate(true);

                                    if (showPicker === 'start') {
                                        setStartDate(date);
                                        if (isSingleDate) {
                                            setEndDate(date);
                                        } else if (date > endDate) {
                                            setEndDate(date);
                                        }
                                    } else {
                                        if (date >= startDate) setEndDate(date);
                                    }

                                    setShowPicker(null);
                                }}
                                markingType={'period'}
                                markedDates={(() => {
                                    const marks: any = {};
                                    const rangeStart = toUtcStartOfDay(startDate);
                                    const rangeEnd = isSingleDate ? toUtcEndOfDay(startDate) : toUtcEndOfDay(endDate);
                                    const sStr = toLocalDateString(rangeStart);
                                    const eStr = toLocalDateString(rangeEnd);

                                    let curr = new Date(rangeStart);
                                    while (curr <= rangeEnd) {
                                        const str = toLocalDateString(curr);
                                        marks[str] = {
                                            selected: true,
                                            color: '#91D7E4',
                                            startingDay: str === sStr,
                                            endingDay: str === eStr,
                                        };
                                        curr.setDate(curr.getDate() + 1);
                                    }
                                    return marks;
                                })()}
                                theme={{ arrowColor: '#91D7E4', todayTextColor: '#81D4FA' }}
                            />
                        </View>
                    )}
                </View>

                {/* Logs Preview */}
                <View style={styles.section}>
                    <View style={styles.logsHeaderRow}>
                        <Text style={styles.sectionTitle}>Logs by Selected Range</Text>
                        <TouchableOpacity style={styles.retryChip} onPress={fetchLogsBySelectedRange}>
                            <Text style={styles.retryChipText}>Retry</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoadingLogs ? (
                        <View style={styles.logsStateBox}>
                            <ActivityIndicator color="#91D7E4" />
                            <Text style={styles.helperText}>Loading logs...</Text>
                        </View>
                    ) : logsError ? (
                        <View style={styles.logsStateBox}>
                            <Text style={styles.errorText}>{logsError}</Text>
                        </View>
                    ) : logsByRange.length === 0 ? (
                        <View style={styles.logsStateBox}>
                            <Text style={styles.helperText}>No logs available for this range.</Text>
                        </View>
                    ) : (
                        <View style={styles.logsList}>
                            {logsByRange.slice(0, 5).map((log, index) => {
                                const timestamp = String(log.timestamp || log.createdAt || 'Unknown time');
                                const content = typeof log.data === 'object'
                                    ? JSON.stringify(log.data)
                                    : JSON.stringify(log);

                                return (
                                    <View key={String(log.id ?? index)} style={styles.logRow}>
                                        <Text style={styles.logTime}>{timestamp}</Text>
                                        <Text style={styles.logText} numberOfLines={2}>{content}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Metrics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Metrics to Export</Text>
                    <View style={styles.metricsRow}>
                        <MetricCard
                            icon="thermometer"
                            color="#F9C45A"
                            bgColor="#FFF5E6"
                            label="Temperature"
                            checked={selectedMetrics.temperature}
                            onPress={() => toggleMetric('temperature')}
                            iconSize={32}
                        />
                        <MetricCard
                            icon="walk"
                            color="#78d6e7"
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

    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 1,
        backgroundColor: '#f2f3f7',
    },
    backButton: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -4,
    },
    customHeaderTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginLeft: 4,
    },

    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    helperText: {
        color: '#7A869A',
        fontSize: 13,
        fontWeight: '500',
    },
    errorText: {
        color: '#C53030',
        fontSize: 13,
        fontWeight: '500',
    },
    retryChip: {
        backgroundColor: '#E8F6FD',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    retryChipText: {
        color: '#2B6CB0',
        fontWeight: '600',
        fontSize: 12,
    },

    // Device Dropdown
    dropdownButtonBox: {
        backgroundColor: '#91D7E4',
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
        marginLeft: -4,
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
        marginLeft: -4,
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
        color: '#91D7E4',
        fontWeight: '600',
    },

    // Date
    dateRow: { flexDirection: 'row', gap: 26, marginBottom: 16 },
    dateButton: { flex: 1 },
    dateButtonContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingRight: 30,
        paddingVertical: 14,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        marginLeft: -4,
        marginRight: -4,
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
    dateButtonChevron: { position: 'absolute', right: 24 },
    dateButtonText: { fontSize: 15, color: '#333333', fontWeight: '500', textAlign: 'center' },
    dateButtonPlaceholder: { fontSize: 15, color: '#AAAAAA', fontWeight: '500', textAlign: 'center' },
    dateButtonDisabled: { fontSize: 15, color: '#C0C0C0', fontWeight: '500', textAlign: 'center' },

    // Single Date checkbox row
    singleDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
        marginBottom: 4,
        marginLeft: -4,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: '#D9D9D9',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    checkboxChecked: { backgroundColor: '#91D7E4' },
    metricCheckboxChecked: { backgroundColor: '#91D7E4' },
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
        marginLeft: -4,
        marginRight: -4,
    },
    formatOption: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 26 },
    formatOptionActive: { backgroundColor: '#91D7E4' },
    formatText: { fontSize: 16, fontWeight: '600', color: '#333333' },
    formatTextActive: { color: '#FFFFFF' },

    // Footer
    footer: { marginTop: 10, alignItems: 'center', gap: 12 },
    logsHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginLeft: -4,
        marginRight: -4,
    },
    logsStateBox: {
        minHeight: 72,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEF1F5',
        padding: 14,
        justifyContent: 'center',
        gap: 10,
        marginLeft: -4,
        marginRight: -4,
    },
    logsList: {
        gap: 10,
    },
    logRow: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EEF1F5',
        padding: 12,
        gap: 6,
    },
    logTime: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    logText: {
        fontSize: 13,
        color: '#334155',
    },
    exportButton: {
        width: '102%',
        backgroundColor: '#91D7E4',
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        marginTop: -20,
        marginRight: -4,
        marginLeft: -4,

    },
    exportButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
    footerText: { fontSize: 14, color: '#888888', fontWeight: '500' },
});