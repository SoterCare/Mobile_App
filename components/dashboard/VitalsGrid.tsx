import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { VitalCard } from './VitalCard';
import sampleData from '../../sampledata.json';
import { syncService } from '../../services/syncService';

export const VitalsGrid = () => {
    const [heartRate, setHeartRate] = useState(sampleData.payload.values[0][0]);
    const [spo2, setSpo2] = useState(sampleData.payload.values[0][1]);
    const [temperature, setTemperature] = useState(sampleData.payload.values[0][2]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            // Calculate new values first based on CURRENT state (well, mostly sample data)
            // Ideally we shouldn't rely on 'prevIndex' for the logic if we can help it, 
            // but since we need to cycle, we can use the callback pattern just for the index
            // and do the logging outside.

            setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % sampleData.payload.values.length;
                const [newBpm, newSpo2, newTemp] = sampleData.payload.values[nextIndex];

                // Batch updates
                setHeartRate(newBpm);
                setSpo2(newSpo2);
                setTemperature(newTemp);

                // Log to offline DB (Fire and forget, but outside the return)
                // We do this here to access the calculated values for THIS tick.
                // Note: calling async function here is non-blocking.
                syncService.logVitals({
                    heartRate: newBpm,
                    spo2: newSpo2,
                    temperature: newTemp,
                    timestamp: Date.now()
                });

                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <View style={styles.gridContainer}>
            {/* Row 1 */}
            <View style={styles.gridRow}>
                <VitalCard
                    icon="heart"
                    iconColor="#FF5252"
                    backgroundColor="#FFEBEE"
                    value={String(heartRate)}
                    unit="BPM"
                    label="Heart Rate"
                />
                <VitalCard
                    icon="water"
                    iconColor="#03A9F4"
                    backgroundColor="#E1F5FE"
                    value={String(spo2)}
                    unit="%"
                    label="SpO2 Level"
                    valueColor="#03A9F4"
                />
            </View>

            {/* Row 2 */}
            <View style={styles.gridRow}>
                <VitalCard
                    icon="thermometer"
                    iconColor="#FFC107"
                    backgroundColor="#FFF8E1"
                    value={String(temperature)}
                    unit="°C"
                    label="Temperature"
                    valueColor="#FFC107"
                />
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
        marginBottom: 16,
    },
});