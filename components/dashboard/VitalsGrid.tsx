import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VitalCard } from './VitalCard';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';

// Gait Analysis card — blue-tinted circle with pulse/activity icon, grey N/A text
const GaitAnalysisCard = ({ value = 'N/A' }: { value?: string }) => (
    <View style={styles.gaitCard}>
        <View style={styles.gaitIconCircle}>
            <Ionicons name="pulse-outline" size={24} color="#6BA8C4" />
        </View>
        <View>
            <Text style={styles.gaitValue}>{value}</Text>
            <Text style={styles.gaitLabel}>Gait Analysis</Text>
        </View>
    </View>
);

export const VitalsGrid = () => {
    const { latestVitals } = useRaspberryPi();

    const skinTemp = typeof latestVitals?.temperature === 'number' ? latestVitals.temperature : 30.4;
    const moisture = typeof latestVitals?.moisture === 'number' ? latestVitals.moisture : 0;
    const roomTemp =
        typeof latestVitals?.roomTemperature === 'number'
            ? latestVitals.roomTemperature.toFixed(1)
            : (skinTemp - 0.5).toFixed(1);

    const gaitValue = latestVitals?.gaitAnalysis || 'N/A';

    return (
        <View style={styles.gridContainer}>
            {/* Row 1: Skin Temp + Moisture */}
            <View style={styles.gridRow}>
                {/* Thermometer icon to match Image 2 */}
                <VitalCard
                    icon="thermometer-outline"
                    iconColor="#f8a831"
                    backgroundColor="#FFF3E0"
                    value={skinTemp.toFixed(1)}
                    unit="°C"
                    label="Patient Skin"
                    sublabel={`Room : ${roomTemp} °C`}
                    valueColor="#fbcb3c"
                />
                {/* Water drop icon, teal */}
                <VitalCard
                    icon="water"
                    iconColor="#5bcfde"
                    backgroundColor="#daf9fb"
                    value={String(moisture)}
                    unit="%"
                    label="Moisture · Dry"
                    valueColor="#5bcfde"
                />
            </View>

            {/* Row 2: Gait Analysis */}
            <View style={styles.gridRow}>
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
        width: 54,
        height: 54,
        borderRadius: 27,
        // Soft blue-grey background matching Image 2
        backgroundColor: '#d9ecf6',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    gaitValue: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#b3aeae',
        lineHeight: 32,
    },
    gaitLabel: {
        fontSize: 13,
        fontWeight: '400',
        color: '#858282',
    },
});