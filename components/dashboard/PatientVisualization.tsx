import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PatientVisualization = () => {
    return (
        <View style={styles.visualizationContainer}>
            <View style={styles.visualizationPlaceholder}>
                <Ionicons name="person" size={150} color="#E0E0E0" />
                <Text style={{ color: '#aaa', marginTop: 10 }}>Patient Visualization 3D</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    visualizationContainer: {
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    visualizationPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
});
