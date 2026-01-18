import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VitalCard } from './VitalCard';

export const VitalsGrid = () => {
    return (
        <View style={styles.vitalsGrid}>
            {/* Heart Rate */}
            <VitalCard
                icon="heart"
                iconColor="#FF5252"
                backgroundColor="#FFEBEE"
                value="72"
                unit="BPM"
                label="Heart Rate"
            />

            {/* SpO2 */}
            <VitalCard
                icon="water"
                iconColor="#03A9F4"
                backgroundColor="#E1F5FE"
                value="98"
                unit="%"
                label="SpO2 Level"
                valueColor="#03A9F4"
            />

            {/* Temperature */}
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
    );
};

const styles = StyleSheet.create({
    vitalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
        justifyContent: 'space-between',
    },
});
