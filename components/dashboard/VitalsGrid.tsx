import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VitalCard } from './VitalCard';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';

const GaitAnalysisCard = ({ value = 'N/A' }: { value?: string }) => (
    <View style={styles.gaitCard}>
        <View style={styles.gaitIconCircle}>
            <Ionicons name="pulse-outline" size={24} color="#6BA8C4" />
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={styles.gaitValue} numberOfLines={2}>{value}</Text>
            <Text style={styles.gaitLabel}>Gait Analysis</Text>
        </View>
    </View>
);

export const VitalsGrid = () => {
    const { latestVitals: contextVitals, selectedDeviceId } = useRaspberryPi();
    const { vitals: realtimeVitals } = useRealtimeVitals(selectedDeviceId || undefined);

    const skinTempVal = realtimeVitals?.temperature ?? contextVitals?.temperature;
    const skinTemp = typeof skinTempVal === 'number' ? skinTempVal : 30.4;

    const moistureVal = realtimeVitals?.moisture ?? contextVitals?.moisture;
    const moisture = typeof moistureVal === 'number' ? moistureVal : 0;

    const roomTempVal = realtimeVitals?.roomTemperature ?? contextVitals?.roomTemperature;
    const roomTemp =
        typeof roomTempVal === 'number'
            ? roomTempVal.toFixed(1)
            : (skinTemp - 0.5).toFixed(1);

    const gaitRaw = realtimeVitals?.gaitAnalysis ?? contextVitals?.gaitAnalysis ?? 'N/A';
    const gaitValue = typeof gaitRaw === 'string'
        ? gaitRaw
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('\n')
        : String(gaitRaw);

    return (
        <View style={styles.gridContainer}>
            {/* Row 1: Skin Temp + Room Temp */}
            <View style={styles.gridRow}>
                <VitalCard
                    icon="thermometer-outline"
                    iconColor="#f9c45a"
                    backgroundColor="#FFF1D9"
                    value={skinTemp.toFixed(1)}
                    unit="°C"
                    label="Body Temp"
                    valueColor="#f9c45a"
                />
                <VitalCard
                    icon="home"
                    iconColor="#FFAB66"
                    backgroundColor="#FFF1E0"
                    value={roomTemp}
                    unit="°C"
                    label="Room Temp"
                    valueColor="#FFAB66"
                />
            </View>

            {/* Row 2: Moisture + Gait Analysis */}
            <View style={styles.gridRow}>
                <VitalCard
                    icon="water"
                    iconColor="#91D7E4"
                    backgroundColor="#e0f2fb"
                    value={String(moisture)}
                    unit="%"
                    label="Moisture · Dry"
                    valueColor="#91D7E4"
                />
                <GaitAnalysisCard value={gaitValue} />
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
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 16,
        paddingHorizontal: 14,
        flexDirection: 'row',
        width: '48%',
        alignItems: 'center',
        minHeight: 110,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        gap: 12,
    },
    gaitIconCircle: {
        width: 46,
        height: 46,
        borderRadius: 27,
        backgroundColor: '#dff1fd',
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
    gaitLabel: {
        fontSize: 13,
        fontWeight: '400',
        color: '#858282',
        marginTop: 3,
    },
});