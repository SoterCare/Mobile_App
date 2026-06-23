import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { VitalCard } from './VitalCard';
import { PatientAvatar, AvatarActivity } from '@/components/PatientAvatar';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';
import { Colors, Radius } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';

const OFFLINE_COLOR = '#BBBBBB';

// Map the device's gait/activity reading to an avatar animation.
function gaitToActivity(gaitRaw?: string | null, offline?: boolean): AvatarActivity {
    if (offline) return 'idle';
    const g = (gaitRaw ?? '').toLowerCase();
    if (g.includes('walk')) return 'walking';
    if (g.includes('sit') || g.includes('lying') || g.includes('down')) return 'standingDown';
    if (g.includes('up')) return 'standingUp';
    return 'idle';
}

const GaitAnalysisCard = ({
    value = 'N/A',
    offline = false,
    activity,
}: {
    value?: string;
    offline?: boolean;
    activity: AvatarActivity;
}) => (
    <View style={styles.gaitCard}>
        <View style={styles.gaitAvatar}>
            <PatientAvatar activity={activity} backgroundColor="#ffffff" />
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={[styles.gaitValue, offline && styles.gaitValueOffline]} numberOfLines={2}>
                {offline ? '-' : value}
            </Text>
            <Text style={styles.gaitLabel}>Gait Analysis</Text>
        </View>
    </View>
);

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
        ? gaitRaw
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('\n')
        : null;

    const offline = !isDeviceStreaming;
    const gaitActivity = gaitToActivity(typeof gaitRaw === 'string' ? gaitRaw : null, offline);

    return (
        <View style={styles.gridContainer}>
            {/* Row 1: Skin Temp + Room Temp */}
            <View style={styles.gridRow}>
                <VitalCard
                    icon="thermometer-outline"
                    iconColor={offline ? OFFLINE_COLOR : '#f9c45a'}
                    backgroundColor={offline ? '#F5F5F5' : '#FFF1D9'}
                    value={offline || skinTemp === null ? '-' : skinTemp.toFixed(1)}
                    unit={offline ? '' : '°C'}
                    label="Body Temp"
                    valueColor={offline ? OFFLINE_COLOR : '#f9c45a'}
                />
                <VitalCard
                    icon="home"
                    iconColor={offline ? OFFLINE_COLOR : '#FFAB66'}
                    backgroundColor={offline ? '#F5F5F5' : '#FFF1E0'}
                    value={offline || roomTemp === null ? '-' : roomTemp.toFixed(1)}
                    unit={offline ? '' : '°C'}
                    label="Room Temp"
                    valueColor={offline ? OFFLINE_COLOR : '#FFAB66'}
                />
            </View>

            {/* Row 2: Moisture + Gait Analysis */}
            <View style={styles.gridRow}>
                <VitalCard
                    icon="water"
                    iconColor={offline ? OFFLINE_COLOR : Colors.brand}
                    backgroundColor={offline ? '#F5F5F5' : Colors.brandTint}
                    value={offline || moisture === null ? '-' : String(moisture)}
                    unit={offline ? '' : '%'}
                    label="Moisture · Dry"
                    valueColor={offline ? OFFLINE_COLOR : Colors.brand}
                />
                <GaitAnalysisCard value={gaitValue ?? 'N/A'} offline={offline} activity={gaitActivity} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    gridContainer: {
        marginBottom: 20,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    gaitCard: {
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.lg,
        padding: 16,
        paddingHorizontal: 14,
        flexDirection: 'row',
        width: '48%',
        alignItems: 'center',
        minHeight: 110,
        ...Shadows.card,
        gap: 12,
    },
    gaitAvatar: {
        width: 54,
        alignSelf: 'stretch',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        flexShrink: 0,
    },
    gaitValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#b3aeae',
        lineHeight: 24,
        flexShrink: 1,
        flexWrap: 'wrap',
        width: '100%',
        marginTop: 3,
    },
    gaitValueOffline: {
        color: OFFLINE_COLOR,
        fontSize: 24,
    },
    gaitLabel: {
        fontSize: 13,
        fontWeight: '400',
        color: '#858282',
        marginTop: 3,
    },
});