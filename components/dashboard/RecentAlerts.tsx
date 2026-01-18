import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertCard } from './AlertCard';

export const RecentAlerts = () => {
    return (
        <View style={styles.alertsContainer}>
            <View style={styles.alertsHeader}>
                <Text style={styles.alertsTitle}>Recent Alerts</Text>
                <TouchableOpacity style={styles.viewAllBtn}>
                    <Text style={styles.viewAllText}>View All</Text>
                    <Ionicons name="chevron-forward" size={16} color="#333" />
                </TouchableOpacity>
            </View>

            <AlertCard
                type="movement"
                title="Movement Detected"
                timestamp="now"
                showActions={true}
            />

            <AlertCard
                type="fall"
                title="Fall Detected"
                timestamp="1m ago"
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    alertsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    alertsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 14,
        color: '#333',
        marginRight: 4,
        fontWeight: '600',
    },
});
