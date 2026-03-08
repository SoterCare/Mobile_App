import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertCard } from './AlertCard';

export const RecentAlerts = () => {
    return (
        <View style={styles.alertsContainer}>
            {/* Header */}
            <View style={styles.alertsHeader}>
                <Text style={styles.alertsTitle}>Recent Alerts</Text>
                <TouchableOpacity style={styles.viewAllBtn}>
                    <Text style={styles.viewAllText}>View All</Text>
                    <Ionicons name="chevron-forward" size={15} color="#888" />
                </TouchableOpacity>
            </View>

            {/* Movement - with action buttons */}
            <AlertCard
                type="movement"
                title="Movement Detected"
                timestamp="now"
                showActions={true}
            />

            {/* Fall - collapsed */}
            <AlertCard
                type="fall"
                title="Fall Detected"
                timestamp="1m ago"
                showActions={false}
            />

            {/* Urine - collapsed (visible in Frame 39) */}
            <AlertCard
                type="urine"
                title="Urine Detected"
                timestamp="2m ago"
                showActions={false}
            />

            {/* Movement - collapsed */}
            <AlertCard
                type="movement"
                title="Movement Detected"
                timestamp="3m ago"
                showActions={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    alertsContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        paddingBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 5,
    },
    alertsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    alertsTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1C1C1C',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
});