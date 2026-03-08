import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VitalCard } from './VitalCard';
import sampleData from '../../sampledata.json';
import { syncService } from '../../services/syncService';

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
    const [skinTemp, setSkinTemp] = useState<number>(30.4);
    const [moisture, setMoisture] = useState<number>(0);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % sampleData.payload.values.length;
                const row = sampleData.payload.values[nextIndex];
                const newTemp = row[2] ?? 30.4;
                const newMoisture = row[3] ?? 0;

                setSkinTemp(newTemp);
                setMoisture(newMoisture);

                syncService.logVitals({
                    temperature: newTemp,
                    moisture: newMoisture,
                    timestamp: Date.now(),
                });

                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(intervalId);
    }, []);

    const roomTemp = (skinTemp - 0.5).toFixed(1);

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
                <GaitAnalysisCard value="N/A" />
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