import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { PatientAvatar, AvatarActivity } from '@/components/PatientAvatar';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';
import { Colors, Radius, circle } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';

const OFFLINE_COLOR = '#BBBBBB';

function gaitToActivity(gaitRaw?: string | null, offline?: boolean): AvatarActivity {
    if (offline) return 'idle';
    const g = (gaitRaw ?? '').toLowerCase();
    if (g.includes('walk')) return 'walking';
    if (g.includes('sit') && g.includes('down')) return 'standingDown';
    if (g.includes('sit')) return 'sitting';
    if (g.includes('stand') && g.includes('up')) return 'standingUp';
    return 'idle';
}

interface MetricItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    value: string;
    unit: string;
    label: string;
    valueColor: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ icon, iconColor, iconBg, value, unit, label, valueColor }) => {
    const isNumeric = !isNaN(parseFloat(value)) && isFinite(Number(value));
    const precision = value.includes('.') ? 1 : 0;

    return (
        <View>
            <View style={vg.headerRow}>
                <View style={[vg.iconBubble, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon} size={15} color={iconColor} />
                </View>
                <Text style={vg.headerLabel}>{label}</Text>
            </View>
            <View style={vg.valueRow}>
                {isNumeric ? (
                    <AnimatedCounter
                        value={Number(value)}
                        precision={precision}
                        style={[vg.valueText, { color: valueColor }]}
                    />
                ) : (
                    <Text style={[vg.valueText, { color: valueColor }]}>{value}</Text>
                )}
                <Text style={[vg.unitText, { color: valueColor }]}>{unit}</Text>
            </View>
        </View>
    );
};

export const VitalsGrid = () => {
    const { latestVitals: contextVitals, selectedDeviceId } = useRaspberryPi();
    const { vitals: realtimeVitals, isDeviceStreaming } = useRealtimeVitals(selectedDeviceId || undefined);

    const skinTempVal = realtimeVitals?.temperature ?? contextVitals?.temperature;
    const skinTemp = typeof skinTempVal === 'number' ? skinTempVal : null;

    const moistureVal = realtimeVitals?.moisture ?? contextVitals?.moisture;
    const moisture = typeof moistureVal === 'number' ? moistureVal : null;

    const roomTempVal = realtimeVitals?.roomTemperature ?? contextVitals?.roomTemperature;
    const roomTemp = typeof roomTempVal === 'number' ? roomTempVal : null;

    const gaitRaw = realtimeVitals?.gaitAnalysis ?? contextVitals?.gaitAnalysis;
    const gaitValue = typeof gaitRaw === 'string' && gaitRaw.trim()
        ? gaitRaw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : null;

    const offline = !isDeviceStreaming;
    const gaitActivity = gaitToActivity(typeof gaitRaw === 'string' ? gaitRaw : null, offline);

    return (
        <View style={vg.card}>

            {/* ── LEFT: 3 metrics ── */}
            <View style={vg.metricsPanel}>
                <MetricItem
                    icon="thermometer-outline"
                    iconColor={offline ? OFFLINE_COLOR : '#f9c45a'}
                    iconBg={offline ? '#F5F5F5' : '#FFF1D9'}
                    value={offline || skinTemp === null ? '-' : skinTemp.toFixed(1)}
                    unit={offline ? '' : '°C'}
                    label="Body Temp"
                    valueColor={offline ? OFFLINE_COLOR : '#f9c45a'}
                />
                <MetricItem
                    icon="home"
                    iconColor={offline ? OFFLINE_COLOR : '#FFAB66'}
                    iconBg={offline ? '#F5F5F5' : '#FFF1E0'}
                    value={offline || roomTemp === null ? '-' : roomTemp.toFixed(1)}
                    unit={offline ? '' : '°C'}
                    label="Room Temp"
                    valueColor={offline ? OFFLINE_COLOR : '#FFAB66'}
                />
                <MetricItem
                    icon="water"
                    iconColor={offline ? OFFLINE_COLOR : Colors.brand}
                    iconBg={offline ? '#F5F5F5' : Colors.brandTint}
                    value={offline || moisture === null ? '-' : String(moisture)}
                    unit={offline ? '' : '%'}
                    label="Moisture"
                    valueColor={offline ? OFFLINE_COLOR : Colors.brand}
                />
            </View>

            {/* ── RIGHT: 3D model + gait label ── */}
            <View style={vg.modelPanel}>
                <View style={vg.avatarArea}>
                    <PatientAvatar activity={gaitActivity} backgroundColor="#ffffff" />
                </View>
                <View style={vg.gaitFooter}>
                    <Text
                        style={[vg.gaitValue, offline && { color: OFFLINE_COLOR }]}
                        numberOfLines={1}
                    >
                        {offline ? '-' : (gaitValue ?? 'N/A')}
                    </Text>
                    <Text style={vg.gaitLabel}>Gait Analysis</Text>
                </View>
            </View>

        </View>
    );
};

const vg = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.lg,
        flexDirection: 'row',
        height: 270,
        marginBottom: 20,
        overflow: 'hidden',
        ...Shadows.card,
    },

    /* ── left panel ── */
    metricsPanel: {
        flex: 3,
        paddingLeft: 24,
        paddingRight: 12,
        paddingTop: 20,
        paddingBottom: 20,
        justifyContent: 'center',
        gap: 16,
    },

    /* ── right panel ── */
    modelPanel: {
        flex: 5,
        flexDirection: 'column',
        paddingTop: 12,
        paddingRight: 14,
        paddingLeft: 4,
        paddingBottom: 0,
        overflow: 'hidden',
    },
    avatarArea: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gaitFooter: {
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 20,
    },

    /* ── metric item ── */
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    iconBubble: {
        width: 26,
        height: 26,
        borderRadius: circle(26),
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    headerLabel: {
        fontSize: 16,
        color: '#858282',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    valueText: {
        fontSize: 30,
        fontWeight: '700',
        lineHeight: 34,
    },
    unitText: {
        fontSize: 17,
        fontWeight: '600',
    },

    /* ── gait footer text ── */
    gaitValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#b3aeae',
        lineHeight: 24,
    },
    gaitLabel: {
        fontSize: 15,
        color: '#858282',
        marginTop: 2,
    },
});
