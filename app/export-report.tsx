import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DottedBackground } from '@/components/ui/DottedBackground';
import { Calendar } from 'react-native-calendars';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { HealthLogItem, healthLogsService } from '@/services/healthLogsService';
import { Colors, Radius } from '@/theme/tokens';

// ── Time interval options ─────────────────────────────────────────────────────
const TIME_INTERVALS = [
    { label: '5 min',  value: 5  },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hr',   value: 60 },
] as const;

// ── Per-slot aggregate type ───────────────────────────────────────────────────
type NumericAggregate = { avg: number; min: number; max: number };
type TimeSlot = {
    label: string;
    slotStartMs: number;
    count: number;
    isOff: boolean;
    temp: NumericAggregate | null;
    ambient: NumericAggregate | null;
    moisture: NumericAggregate | null;
    activity: string | null;
    alerts: string[];
};

export default function ExportReportScreen() {
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
        ambientTemp: false,
        moisture: false,
        activity: false,
    });

    const [selectedInterval, setSelectedInterval] = useState<number>(15);
    const [exportFormat, setExportFormat] = useState<'CSV' | 'PDF'>('CSV');
    const [isExporting, setIsExporting] = useState(false);

    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [isLoadingDates, setIsLoadingDates] = useState(true);
    const [dateError, setDateError] = useState<string | null>(null);
    const [logsByRange, setLogsByRange] = useState<HealthLogItem[]>([]);

    const getAuthStatus = (error: any): number | undefined => error?.response?.status;

    const toUtcStartOfDay = (date: Date): Date =>
        new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));

    const toUtcEndOfDay = (date: Date): Date =>
        new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999));

    const effectiveRange = useMemo(() => ({
        start: toUtcStartOfDay(startDate),
        end: isSingleDate ? toUtcEndOfDay(startDate) : toUtcEndOfDay(endDate),
    }), [startDate, endDate, isSingleDate]);

    React.useEffect(() => {
        const fetchDates = async () => {
            try {
                setDateError(null);
                const dates = await healthLogsService.getAvailableDates();
                const sorted = [...dates].sort();
                setAvailableDates(sorted);
                if (sorted.length > 0) {
                    const latestDate = parseDateStr(sorted[sorted.length - 1]);
                    setStartDate(latestDate);
                    setEndDate(latestDate);
                    setHasSelectedDate(true);
                }
            } catch (error) {
                console.error('Failed to fetch available dates:', error);
                const status = getAuthStatus(error);
                setDateError(status === 401 || status === 403
                    ? 'Session expired. Please sign in again.'
                    : 'Unable to load available dates. Tap retry.');
            } finally {
                setIsLoadingDates(false);
            }
        };
        fetchDates();
    }, []);

    const fetchLogsBySelectedRange = React.useCallback(async () => {
        if (!hasSelectedDate) return;
        try {
            const logs = await healthLogsService.getLogsByRange(
                effectiveRange.start.toISOString(),
                effectiveRange.end.toISOString()
            );
            setLogsByRange(logs);
        } catch (error) {
            console.error('Failed to fetch logs by range:', error);
            setLogsByRange([]);
        }
    }, [hasSelectedDate, effectiveRange.start, effectiveRange.end]);

    React.useEffect(() => { fetchLogsBySelectedRange(); }, [fetchLogsBySelectedRange]);

    const toggleMetric = (metric: keyof typeof selectedMetrics) =>
        setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));

    const toLocalDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Parse "YYYY-MM-DD" as local midnight — avoids the UTC-midnight off-by-one day bug
    const parseDateStr = (str: string): Date => {
        const [y, mo, d] = str.split('-').map(Number);
        return new Date(y, mo - 1, d);
    };

    // ── Timestamp normaliser → Unix ms ────────────────────────────────────────
    const tsToMs = (ts: unknown): number | null => {
        if (ts == null) return null;
        if (typeof ts === 'object' && ts !== null && 'low' in ts && 'high' in ts) {
            const o = ts as any;
            return o.high * 4294967296 + (o.low >>> 0);
        }
        if (typeof ts === 'number') return ts > 100_000_000_000 ? ts : ts * 1000;
        if (typeof ts === 'string') {
            const d = new Date(ts);
            return isNaN(d.getTime()) ? null : d.getTime();
        }
        return null;
    };

    const fmtTime = (ms: number) =>
        new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

    const fmtDateTime = (ms: number) =>
        new Date(ms).toLocaleString(undefined, {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
        });

    // ── Aggregate logs into fixed-width time slots ────────────────────────────
    const bucketLogs = (logs: HealthLogItem[], intervalMinutes: number): TimeSlot[] => {
        if (!logs.length) return [];

        const intervalMs = intervalMinutes * 60 * 1000;
        const toNum = (v: unknown) => (v != null && !isNaN(Number(v)) ? Number(v) : null);

        // Resolve ms timestamp for each log, drop logs without a parseable ts
        const withMs = (logs as any[])
            .map(r => ({ r, ms: tsToMs(r.timestamp ?? r.ts ?? r.createdAt) }))
            .filter((x): x is { r: any; ms: number } => x.ms !== null)
            .sort((a, b) => a.ms - b.ms);

        if (!withMs.length) return [];

        const firstSlotKey = Math.floor(withMs[0].ms / intervalMs) * intervalMs;
        const lastSlotKey  = Math.floor(withMs[withMs.length - 1].ms / intervalMs) * intervalMs;

        // Map slot-key → readings
        const slotMap = new Map<number, any[]>();
        for (const { r, ms } of withMs) {
            const key = Math.floor(ms / intervalMs) * intervalMs;
            if (!slotMap.has(key)) slotMap.set(key, []);
            slotMap.get(key)!.push(r);
        }

        const aggregate = (vals: (number | null)[]): NumericAggregate | null => {
            const nums = vals.filter((n): n is number => n !== null);
            if (!nums.length) return null;
            const sum = nums.reduce((a, b) => a + b, 0);
            return { avg: sum / nums.length, min: Math.min(...nums), max: Math.max(...nums) };
        };

        const slots: TimeSlot[] = [];
        let prevFilledKey: number | null = null;

        for (let key = firstSlotKey; key <= lastSlotKey; key += intervalMs) {
            const readings = slotMap.get(key) ?? [];

            // Gap detection: if prev filled slot exists and this slot is empty → device off
            if (readings.length === 0) {
                if (prevFilledKey !== null) {
                    const endLabel = fmtTime(key + intervalMs);
                    slots.push({
                        label: `${fmtTime(key)} – ${endLabel}`,
                        slotStartMs: key,
                        count: 0,
                        isOff: true,
                        temp: null, ambient: null, moisture: null,
                        activity: null,
                        alerts: [],
                    });
                }
                continue;
            }

            // Numeric aggregates
            const temp    = aggregate(readings.map((r: any) => toNum(r.temperature ?? r.temp)));
            const ambient = aggregate(readings.map((r: any) => toNum(r.ambient_temp ?? r.ambientTemp)));
            const moisture = aggregate(readings.map((r: any) => toNum(r.moisture)));

            // Most-frequent activity
            const actCounts: Record<string, number> = {};
            for (const r of readings) {
                const a = r.gait_label ?? r.gaitLabel ?? r.activity;
                if (a) actCounts[String(a)] = (actCounts[String(a)] || 0) + 1;
            }
            const topAct = Object.entries(actCounts).sort((a, b) => b[1] - a[1])[0];

            // Alerts
            const alerts: string[] = [];
            if (readings.some((r: any) => r.fall_alert || r.fallAlert)) alerts.push('FALL');
            if (readings.some((r: any) => r.sos)) alerts.push('SOS');

            slots.push({
                label: `${fmtTime(key)} – ${fmtTime(key + intervalMs)}`,
                slotStartMs: key,
                count: readings.length,
                isOff: false,
                temp, ambient, moisture,
                activity: topAct ? topAct[0] : null,
                alerts,
            });

            prevFilledKey = key;
        }

        return slots;
    };

    // ── Export handlers ───────────────────────────────────────────────────────
    const handleExport = async () => {
        try {
            setIsExporting(true);

            if (!selectedMetrics.temperature && !selectedMetrics.ambientTemp &&
                !selectedMetrics.moisture && !selectedMetrics.activity) {
                Alert.alert('Selection Error', 'Please select at least one metric to export.');
                return;
            }
            if (logsByRange.length === 0) {
                Alert.alert('No Data', 'No logs found for the selected date range.');
                return;
            }

            const slots = bucketLogs(logsByRange, selectedInterval);

            if (exportFormat === 'CSV') {
                await generateAndShareCSV(slots);
            } else {
                await generateAndSharePDF(slots);
            }
        } catch (error) {
            console.error('Export Error:', error);
            Alert.alert('Export Failed', 'Failed to generate report. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const sortedDates = [...availableDates].sort();
    const minDateStr = sortedDates.length > 0 ? sortedDates[0] : undefined;
    const maxDateStr = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : toLocalDateString(new Date());

    // ── CSV generator ─────────────────────────────────────────────────────────
    const generateAndShareCSV = async (slots: TimeSlot[]) => {
        const f1 = (n: number) => n.toFixed(1);
        const f0 = (n: number) => n.toFixed(0);

        let header = 'Time Slot,Status,Records';
        if (selectedMetrics.temperature) header += ',Skin Temp Avg (°C),Skin Temp Min (°C),Skin Temp Max (°C)';
        if (selectedMetrics.ambientTemp)  header += ',Room Temp Avg (°C),Room Temp Min (°C),Room Temp Max (°C)';
        if (selectedMetrics.moisture)     header += ',Moisture Avg (%),Moisture Min (%),Moisture Max (%)';
        if (selectedMetrics.activity)     header += ',Activity';
        header += ',Alerts\n';

        let csv = header;
        for (const slot of slots) {
            const status = slot.isOff ? 'Device Turned Off' : 'Active';
            let line = `"${slot.label}","${status}",${slot.isOff ? 0 : slot.count}`;

            if (selectedMetrics.temperature) {
                const s = slot.temp;
                line += s && !slot.isOff ? `,${f1(s.avg)},${f1(s.min)},${f1(s.max)}` : ',,,';
            }
            if (selectedMetrics.ambientTemp) {
                const s = slot.ambient;
                line += s && !slot.isOff ? `,${f1(s.avg)},${f1(s.min)},${f1(s.max)}` : ',,,';
            }
            if (selectedMetrics.moisture) {
                const s = slot.moisture;
                line += s && !slot.isOff ? `,${f0(s.avg)},${f0(s.min)},${f0(s.max)}` : ',,,';
            }
            if (selectedMetrics.activity) {
                line += slot.isOff || !slot.activity ? ',' : `,"${slot.activity}"`;
            }
            line += `,"${slot.isOff ? '—' : (slot.alerts.length ? slot.alerts.join('; ') : 'None')}"`;
            csv += line + '\n';
        }

        const LegacyFS = FileSystem as any;
        const fileUri = LegacyFS.documentDirectory + `SoterCare_Report_${Date.now()}.csv`;
        await LegacyFS.writeAsStringAsync(fileUri, csv, { encoding: LegacyFS.EncodingType.UTF8 });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        } else {
            Alert.alert('Saved', 'CSV saved to documents.');
        }
    };

    // ── PDF generator ─────────────────────────────────────────────────────────
    const generateAndSharePDF = async (slots: TimeSlot[]) => {
        const f1 = (n: number) => n.toFixed(1);
        const f0 = (n: number) => n.toFixed(0);

        // Overall summary stats (across all non-off slots)
        const activeSlots = slots.filter(s => !s.isOff);
        const offSlots    = slots.filter(s => s.isOff);

        const overallStat = (key: 'temp' | 'ambient' | 'moisture', dec: 0 | 1): { avg: string; min: string; max: string } | null => {
            const all = activeSlots.map(s => s[key]).filter((a): a is NumericAggregate => a !== null);
            if (!all.length) return null;
            const allAvgs = all.map(a => a.avg);
            const allMins = all.map(a => a.min);
            const allMaxs = all.map(a => a.max);
            const fmt = dec === 1 ? f1 : f0;
            return {
                avg: fmt(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length),
                min: fmt(Math.min(...allMins)),
                max: fmt(Math.max(...allMaxs)),
            };
        };

        const tempStat    = selectedMetrics.temperature ? overallStat('temp',    1) : null;
        const ambientStat = selectedMetrics.ambientTemp  ? overallStat('ambient', 1) : null;
        const moistStat   = selectedMetrics.moisture     ? overallStat('moisture', 0) : null;

        // Activity summary
        let topActivityCard = '';
        if (selectedMetrics.activity) {
            const actCounts: Record<string, number> = {};
            for (const s of activeSlots) {
                if (s.activity) actCounts[s.activity] = (actCounts[s.activity] || 0) + 1;
            }
            const top = Object.entries(actCounts).sort((a, b) => b[1] - a[1])[0];
            if (top) {
                topActivityCard = `
                <div class="stat-card">
                    <div class="stat-label">Top Activity</div>
                    <div class="stat-big" style="font-size:13px">${top[0]}</div>
                    <div class="stat-sub">${top[1]} slot${top[1] !== 1 ? 's' : ''} &nbsp;&middot;&nbsp; ${Object.keys(actCounts).length} states</div>
                </div>`;
            }
        }

        const statCard = (label: string, s: { avg: string; min: string; max: string } | null, unit: string) =>
            s ? `<div class="stat-card">
                <div class="stat-label">${label}</div>
                <div class="stat-big">${s.avg}<span class="stat-unit"> ${unit}</span></div>
                <div class="stat-sub">Min ${s.min} &nbsp;&middot;&nbsp; Max ${s.max} ${unit}</div>
            </div>` : '';

        const statsSection = [
            statCard('Skin Temp',  tempStat,    '°C'),
            statCard('Room Temp',  ambientStat, '°C'),
            statCard('Moisture',   moistStat,   '%'),
            topActivityCard,
        ].filter(Boolean).join('');

        // Alert events
        const alertEvents = activeSlots.filter(s => s.alerts.length > 0);
        const alertsSection = alertEvents.length > 0 ? `
        <div class="section">
            <div class="section-title">Alert Events (${alertEvents.length} slot${alertEvents.length !== 1 ? 's' : ''})</div>
            <table>
                <thead><tr><th>Time Slot</th><th>Records</th><th>Alert Type</th></tr></thead>
                <tbody>
                    ${alertEvents.map(s => `
                    <tr class="alert-row">
                        <td>${s.label}</td>
                        <td>${s.count}</td>
                        <td class="alert-type">${s.alerts.join(', ')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>` : '';

        // Interval table columns
        let thCells = '<th>Time Slot</th><th>Records</th>';
        if (selectedMetrics.temperature) thCells += '<th>Skin Temp Avg</th><th>Min</th><th>Max</th>';
        if (selectedMetrics.ambientTemp)  thCells += '<th>Room Temp Avg</th><th>Min</th><th>Max</th>';
        if (selectedMetrics.moisture)     thCells += '<th>Moisture Avg</th><th>Min</th><th>Max</th>';
        if (selectedMetrics.activity)     thCells += '<th>Activity</th>';
        thCells += '<th>Alerts</th>';

        const tableRows = slots.map((slot, idx) => {
            if (slot.isOff) {
                const colSpan = 1 /* records */
                    + (selectedMetrics.temperature ? 3 : 0)
                    + (selectedMetrics.ambientTemp  ? 3 : 0)
                    + (selectedMetrics.moisture     ? 3 : 0)
                    + (selectedMetrics.activity     ? 1 : 0)
                    + 1; /* alerts */
                return `<tr class="off-row">
                    <td>${slot.label}</td>
                    <td colspan="${colSpan}" class="off-cell">Device Turned Off</td>
                </tr>`;
            }

            let cells = `<td class="time-cell">${slot.label}</td><td class="count-cell">${slot.count}</td>`;
            if (selectedMetrics.temperature) {
                const s = slot.temp;
                cells += s
                    ? `<td class="val-avg">${f1(s.avg)}</td><td class="val-muted">${f1(s.min)}</td><td class="val-muted">${f1(s.max)}</td>`
                    : '<td>—</td><td>—</td><td>—</td>';
            }
            if (selectedMetrics.ambientTemp) {
                const s = slot.ambient;
                cells += s
                    ? `<td class="val-avg">${f1(s.avg)}</td><td class="val-muted">${f1(s.min)}</td><td class="val-muted">${f1(s.max)}</td>`
                    : '<td>—</td><td>—</td><td>—</td>';
            }
            if (selectedMetrics.moisture) {
                const s = slot.moisture;
                cells += s
                    ? `<td class="val-avg">${f0(s.avg)}</td><td class="val-muted">${f0(s.min)}</td><td class="val-muted">${f0(s.max)}</td>`
                    : '<td>—</td><td>—</td><td>—</td>';
            }
            if (selectedMetrics.activity) {
                cells += `<td>${slot.activity ?? '—'}</td>`;
            }
            const hasAlert = slot.alerts.length > 0;
            cells += `<td class="${hasAlert ? 'alert-type' : 'no-alert'}">${hasAlert ? slot.alerts.join(', ') : 'None'}</td>`;

            return `<tr class="${idx % 2 === 0 ? '' : 'even'}">${cells}</tr>`;
        }).join('');

        const dateRangeStr = isSingleDate
            ? startDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
            : `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

        const intervalLabel = TIME_INTERVALS.find(t => t.value === selectedInterval)?.label ?? `${selectedInterval} min`;

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2D3748; background: #fff; font-size: 11px; line-height: 1.5; }

  /* Header */
  .header { background: linear-gradient(135deg, #91D7E4 0%, #5bbdd0 100%); padding: 22px 28px 18px; }
  .brand-row { display: flex; align-items: center; gap: 10px; }
  .brand-name { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #fff; }
  .report-subtitle { font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 500; margin-top: 2px; }
  .header-meta { display: flex; gap: 0; margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.3); }
  .meta-item { flex: 1; padding-right: 10px; }
  .meta-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.65); margin-bottom: 3px; }
  .meta-value { font-size: 11px; font-weight: 700; color: #fff; }

  /* Content */
  .content { padding: 20px 28px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4A5568; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #91D7E4; }

  /* Summary stat cards */
  .stats-grid { display: flex; gap: 10px; }
  .stat-card { flex: 1; background: #F0FBFC; border: 1px solid #C5EFF5; border-radius: 8px; padding: 12px 8px; text-align: center; }
  .stat-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; margin-bottom: 5px; font-weight: 700; }
  .stat-big { font-size: 20px; font-weight: 800; color: #2D3748; }
  .stat-unit { font-size: 10px; font-weight: 500; color: #718096; }
  .stat-sub { font-size: 9px; color: #A0AEC0; margin-top: 4px; }

  /* Off/Device summary bar */
  .off-summary { background: #FFF5F5; border: 1px solid #FED7D7; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
  .off-summary-dot { width: 10px; height: 10px; border-radius: 50%; background: #C53030; flex-shrink: 0; }
  .off-summary-text { font-size: 10px; color: #C53030; font-weight: 600; }
  .off-summary-sub { font-size: 9px; color: #E57373; margin-top: 1px; }

  /* Interval table */
  table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  thead tr { background: #91D7E4; }
  th { color: #fff; padding: 7px 8px; text-align: left; font-weight: 700; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap; }
  td { padding: 6px 8px; border-bottom: 1px solid #EEF1F5; color: #4A5568; white-space: nowrap; }
  tr.even td { background: #F8FFFE; }

  .time-cell { font-weight: 600; color: #2D3748; }
  .count-cell { text-align: center; color: #718096; }
  .val-avg { font-weight: 700; color: #2D3748; text-align: right; }
  .val-muted { color: #A0AEC0; text-align: right; }

  /* Alert rows */
  .alert-row td { background: #FFF5F5 !important; }
  .alert-type { font-weight: 700; color: #C53030; }
  .no-alert { color: #48BB78; }

  /* Device-off rows */
  .off-row td { background: #F7FAFC !important; }
  .off-cell { color: #718096; font-style: italic; font-weight: 600; font-size: 9px; }

  /* Footer */
  .footer { background: #F7FAFC; border-top: 2px solid #EEF1F5; padding: 10px 28px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #A0AEC0; margin-top: 20px; }
  .footer-brand { font-weight: 700; color: #4A5568; font-size: 10px; }
</style>
</head>
<body>

<div class="header">
  <div class="brand-row">
    <div>
      <div class="brand-name">SoterCare</div>
      <div class="report-subtitle">Health Monitoring Report · ${intervalLabel} Interval Summary</div>
    </div>
  </div>
  <div class="header-meta">
    <div class="meta-item"><div class="meta-label">Device</div><div class="meta-value">${selectedDevice}</div></div>
    <div class="meta-item"><div class="meta-label">Period</div><div class="meta-value">${dateRangeStr}</div></div>
    <div class="meta-item"><div class="meta-label">Interval</div><div class="meta-value">${intervalLabel}</div></div>
    <div class="meta-item"><div class="meta-label">Active Slots</div><div class="meta-value">${activeSlots.length}</div></div>
    <div class="meta-item"><div class="meta-label">Off Periods</div><div class="meta-value">${offSlots.length}</div></div>
    <div class="meta-item"><div class="meta-label">Alerts</div><div class="meta-value">${alertEvents.length}</div></div>
    <div class="meta-item"><div class="meta-label">Generated</div><div class="meta-value">${new Date().toLocaleString()}</div></div>
  </div>
</div>

<div class="content">

  ${statsSection ? `
  <div class="section">
    <div class="section-title">Overall Summary</div>
    <div class="stats-grid">${statsSection}</div>
  </div>` : ''}

  ${offSlots.length > 0 ? `
  <div class="off-summary">
    <div class="off-summary-dot"></div>
    <div>
      <div class="off-summary-text">Device turned off during ${offSlots.length} interval${offSlots.length !== 1 ? 's' : ''}</div>
      <div class="off-summary-sub">These gaps are shown inline in the table below</div>
    </div>
  </div>` : ''}

  ${alertsSection}

  <div class="section">
    <div class="section-title">Readings by ${intervalLabel} Interval</div>
    <table>
      <thead><tr>${thCells}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

</div>

<div class="footer">
  <span class="footer-brand">SoterCare Health Analytics</span>
  <span style="font-style:italic">Generated automatically for monitoring purposes only. Not a substitute for medical advice.</span>
  <span>© ${new Date().getFullYear()} SoterCare</span>
</div>

</body>
</html>`;

        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <DottedBackground />
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.customHeader}>
                <BackButton />
                <Text style={styles.customHeaderTitle}>Export Report</Text>
                <View style={{ width: 32 }} />
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
                                            <IconSymbol name="checkmark" size={14} color={Colors.brand} />
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
                                                const latestDate = parseDateStr(sorted[sorted.length - 1]);
                                                setStartDate(latestDate);
                                                setEndDate(latestDate);
                                                setHasSelectedDate(true);
                                            }
                                        } catch (error) {
                                            const status = getAuthStatus(error);
                                            setDateError(status === 401 || status === 403
                                                ? 'Session expired. Please sign in again.'
                                                : 'Unable to load available dates. Tap retry.');
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
                            onPress={() => { if (!isSingleDate) setShowPicker('end'); }}
                            activeOpacity={isSingleDate ? 1 : 0.8}
                            style={styles.dateButton}
                        >
                            <View style={(isSingleDate ? styles.dateButtonContentDisabled : styles.dateButtonContent) as any}>
                                <Text style={
                                    !hasSelectedDate ? styles.dateButtonPlaceholder
                                        : isSingleDate ? styles.dateButtonDisabled
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

                    {showPicker && (
                        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 10, marginTop: 10 }}>
                            <Calendar
                                current={toLocalDateString(showPicker === 'start' ? startDate : endDate)}
                                minDate={showPicker === 'end' ? toLocalDateString(startDate) : minDateStr}
                                maxDate={maxDateStr}
                                onDayPress={(day: any) => {
                                    if (availableDates.length > 0 && !availableDates.includes(day.dateString)) return;
                                    const date = parseDateStr(day.dateString);
                                    const dateStr = day.dateString;
                                    setHasSelectedDate(true);
                                    if (showPicker === 'start') {
                                        setStartDate(date);
                                        if (isSingleDate) {
                                            setEndDate(date);
                                        } else if (dateStr > toLocalDateString(endDate)) {
                                            setEndDate(date);
                                        }
                                    } else {
                                        if (dateStr >= toLocalDateString(startDate)) setEndDate(date);
                                    }
                                    setShowPicker(null);
                                }}
                                markingType={'period'}
                                markedDates={(() => {
                                    const marks: any = {};
                                    const sStr = toLocalDateString(startDate);
                                    const eStr = toLocalDateString(isSingleDate ? startDate : endDate);
                                    // Walk day-by-day in local time — no UTC conversions
                                    let curr = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                                    while (toLocalDateString(curr) <= eStr) {
                                        const str = toLocalDateString(curr);
                                        marks[str] = {
                                            selected: true,
                                            color: Colors.brand,
                                            startingDay: str === sStr,
                                            endingDay: str === eStr,
                                        };
                                        curr.setDate(curr.getDate() + 1);
                                    }
                                    return marks;
                                })()}
                                theme={{ arrowColor: Colors.brand, todayTextColor: '#81D4FA' }}
                            />
                        </View>
                    )}
                </View>

                {/* Report Interval */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Report Interval</Text>
                    <Text style={styles.intervalHint}>
                        Summarise readings into time slots — shows highest, lowest and average per slot
                    </Text>
                    <View style={styles.intervalRow}>
                        {TIME_INTERVALS.map(opt => {
                            const active = selectedInterval === opt.value;
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.intervalPill, active && styles.intervalPillActive]}
                                    activeOpacity={0.75}
                                    onPress={() => setSelectedInterval(opt.value)}
                                >
                                    <Text style={[styles.intervalPillText, active && styles.intervalPillTextActive]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Metrics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Metrics to Export</Text>
                    <View style={styles.metricsRow}>
                        <MetricCard
                            icon="thermometer"
                            color="#f9c45a"
                            bgColor="#FFF1D9"
                            label="Skin Temp"
                            checked={selectedMetrics.temperature}
                            onPress={() => toggleMetric('temperature')}
                            iconSize={32}
                            useMatIcon
                        />
                        <MetricCard
                            icon="thermometer-lines"
                            color="#FFAB66"
                            bgColor="#FFF1E0"
                            label="Room Temp"
                            checked={selectedMetrics.ambientTemp}
                            onPress={() => toggleMetric('ambientTemp')}
                            iconSize={32}
                            useMatIcon
                        />
                        <MetricCard
                            icon="water"
                            color={Colors.brand}
                            bgColor="#e0f2fb"
                            label="Moisture"
                            checked={selectedMetrics.moisture}
                            onPress={() => toggleMetric('moisture')}
                            iconSize={32}
                            useMatIcon
                        />
                        <MetricCard
                            icon="walk"
                            color="#42dfdf"
                            bgColor="#E0FBFB"
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
                    <Text style={styles.footerText}>
                        {`${exportFormat} · ${TIME_INTERVALS.find(t => t.value === selectedInterval)?.label ?? selectedInterval + 'min'} intervals`}
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// ── MetricCard ────────────────────────────────────────────────────────────────
function MetricCard({ icon, color, bgColor, label, checked, onPress, iconSize = 34, useMatIcon = false }: any) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.metricCardWrapper}>
            <View style={[styles.metricCardContent, checked && styles.metricCardActive]}>
                <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
                    {useMatIcon
                        ? <MaterialCommunityIcons name={icon} size={iconSize} color={color} />
                        : <IconSymbol name={icon} size={iconSize} color={color} />
                    }
                </View>
                <Text style={styles.metricLabel} numberOfLines={1}>{label}</Text>
                <View style={[styles.checkbox, checked && styles.metricCheckboxChecked]}>
                    {checked && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { padding: 30, paddingBottom: 40 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#B0B0B0', marginBottom: 16 },

    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 1,
        backgroundColor: 'transparent',
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
    helperText: { color: '#7A869A', fontSize: 13, fontWeight: '500' },
    errorText:  { color: '#C53030', fontSize: 13, fontWeight: '500' },
    retryChip: {
        backgroundColor: '#E8F6FD',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    retryChipText: { color: '#2B6CB0', fontWeight: '600', fontSize: 12 },

    // Device dropdown
    dropdownButtonBox: {
        backgroundColor: Colors.brand,
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
        top: 58, left: 0,
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
    dropdownItemBorder:  { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    dropdownItemActive:  { backgroundColor: '#F0FAFB' },
    dropdownItemText:    { fontSize: 15, color: '#333333', fontWeight: '500' },
    dropdownItemTextActive: { color: Colors.brand, fontWeight: '600' },

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
    dateButtonChevron:      { position: 'absolute', right: 24 },
    dateButtonText:         { fontSize: 15, color: '#333333', fontWeight: '500', textAlign: 'center' },
    dateButtonPlaceholder:  { fontSize: 15, color: '#AAAAAA', fontWeight: '500', textAlign: 'center' },
    dateButtonDisabled:     { fontSize: 15, color: '#C0C0C0', fontWeight: '500', textAlign: 'center' },

    singleDateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 4 },
    checkbox: {
        width: 22, height: 22,
        borderRadius: 6,
        backgroundColor: '#D9D9D9',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    checkboxChecked:      { backgroundColor: Colors.brand },
    metricCheckboxChecked: { backgroundColor: Colors.brand },
    checkboxLabel: { fontSize: 15, color: '#888888', fontWeight: '500' },

    // Interval pills
    intervalHint: {
        fontSize: 12,
        color: '#A0AEC0',
        marginBottom: 12,
        marginTop: -8,
    },
    intervalRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'nowrap',
    },
    intervalPill: {
        flex: 1,
        paddingVertical: 11,
        alignItems: 'center',
        borderRadius: Radius.pill,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#EEF1F5',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    intervalPillActive: {
        backgroundColor: Colors.brand,
        borderColor: Colors.brand,
        elevation: 4,
        shadowColor: Colors.brand,
        shadowOpacity: 0.3,
    },
    intervalPillText:       { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
    intervalPillTextActive: { color: '#FFFFFF' },

    // Metrics
    metricsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
    metricCardWrapper: { width: '48%' },
    metricCardContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 22,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        minHeight: 145,
        borderWidth: 1.5,
        borderColor: '#F0F3F6',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    metricCardActive: { borderColor: Colors.brand, backgroundColor: '#FCFFFF' },
    iconCircle: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    metricLabel: { fontSize: 14, color: '#2D3748', textAlign: 'center', fontWeight: '600', marginBottom: 12 },
    metricLabelActive: { color: '#2D3748', fontWeight: '600' },

    // Format toggle
    formatToggleContainer: { width: '100%', marginBottom: 10, paddingHorizontal: 2 },
    formatToggleContent: {
        flexDirection: 'row',
        padding: 6,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    formatOption:       { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 24 },
    formatOptionActive: { backgroundColor: Colors.brand, elevation: 2, shadowColor: Colors.brand, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
    formatText:         { fontSize: 16, fontWeight: '600', color: '#94A3B8' },
    formatTextActive:   { color: '#FFFFFF' },

    // Footer
    footer:     { marginTop: 20, alignItems: 'center', gap: 16 },
    footerText: { fontSize: 14, color: '#A0AEC0', fontWeight: '500' },
    exportButton: {
        width: '100%',
        backgroundColor: Colors.brand,
        borderRadius: Radius.pill,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: Colors.brand,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    exportButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18, letterSpacing: 0.5 },

    // Unused but kept to avoid any downstream reference errors
    backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
});
