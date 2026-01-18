import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { VitalCard } from './VitalCard';

export const VitalsGrid = () => {
    return (
        <View style={styles.gridContainer}>
            {/* Row 1 */}
            <View style={styles.gridRow}>
                <VitalCard
                    icon="heart"
                    iconColor="#FF5252"
                    backgroundColor="#FFEBEE"
                    value="72"
                    unit="BPM"
                    label="Heart Rate"
                />
                <VitalCard
                    icon="water"
                    iconColor="#03A9F4"
                    backgroundColor="#E1F5FE"
                    value="98"
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
                    value="98.6"
                    unit="°F"
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