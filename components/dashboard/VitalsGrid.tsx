import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VitalCard } from './VitalCard';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';
import { Colors, Radius, circle } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';

const OFFLINE_COLOR = '#BBBBBB';

const GaitAnalysisCard = ({ value = 'N/A', offline = false }: { value?: string; offline?: boolean }) => (
    <View style={styles.gaitCard}>
        <View style={styles.gaitIconCircle}>
            <Ionicons name="pulse-outline" size={24} color={offline ? OFFLINE_COLOR : '#6BA8C4'} />
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
                <GaitAnalysisCard value={gaitValue ?? 'N/A'} offline={offline} />
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
    gaitIconCircle: {
        width: 46,
        height: 46,
        borderRadius: circle(46),
        backgroundColor: Colors.brandTint,
        alignItems: 'center',
        justifyContent: 'center',
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