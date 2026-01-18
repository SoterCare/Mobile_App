import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';

export const DeviceStatusHeader = () => {
    return (
        <NeumorphicCard style={styles.headerCard}>
            <View>
                <Text style={styles.statusLabel}>
                    Thigh Band: <Text style={styles.statusOnline}>Online</Text>
                </Text>
                <Text style={styles.statusLabel}>
                    Wrist Band: <Text style={styles.statusOnline}>Online</Text>
                </Text>
            </View>
            <View style={styles.deviceControl}>
                <View style={styles.connectionStatus}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.connectionText}>Connected</Text>
                </View>
                <TouchableOpacity style={styles.deviceDropdown}>
                    <Text style={styles.deviceDropdownText}>Device 01</Text>
                    <Ionicons name="chevron-down" size={16} color="#333" />
                </TouchableOpacity>
            </View>
        </NeumorphicCard>
    );
};

const styles = StyleSheet.create({
    headerCard: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        // Removed manual shadows/elevation as NeumorphicCard handles it
    },
    statusLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        marginBottom: 4,
    },
    statusOnline: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    deviceControl: {
        alignItems: 'flex-end',
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    connectionText: {
        fontSize: 12,
        color: '#666',
    },
    deviceDropdown: {
        backgroundColor: '#8FD9E5',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    deviceDropdownText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginRight: 4,
    },
});
