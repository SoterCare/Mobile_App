import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const DeviceStatusHeader = () => {
    return (
        <View style={styles.headerCard}>
            <View>
                <Text style={styles.statusLabel}>
                    Thigh Band: <Text style={styles.statusOnline}>Online</Text>
                </Text>
            </View>
            <View style={styles.deviceControl}>
                <View style={styles.connectionStatus}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.connectionText}>Connected</Text>
                </View>
                <TouchableOpacity style={styles.deviceDropdown}>
                    <Text style={styles.deviceDropdownText}>Device 01</Text>
                    <Ionicons name="chevron-down" size={14} color="#333" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statusLabel: {
        fontSize: 15,
        color: '#888',
        fontWeight: '500',
    },
    statusOnline: {
        color: '#4DD0C4',
        fontWeight: '600',
    },
    deviceControl: {
        alignItems: 'flex-end',
        gap: 6,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4DD0C4',
        marginRight: 5,
    },
    connectionText: {
        fontSize: 11,
        color: '#999',
    },
    deviceDropdown: {
        backgroundColor: '#8FD9E5',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    deviceDropdownText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '600',
    },
});