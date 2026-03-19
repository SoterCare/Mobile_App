import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';

export const DeviceStatusHeader = () => {
    const {
        devices,
        selectedDeviceId,
        setSelectedDeviceId,
        connectionState,
        scanAndConnect,
    } = useRaspberryPi();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const selectedDevice = useMemo(
        () => devices.find((d) => d.id === selectedDeviceId) || devices[0],
        [devices, selectedDeviceId]
    );

    const isConnected = connectionState === 'connected';
    const isReconnecting = connectionState === 'reconnecting' || connectionState === 'connecting';

    const handleSelect = (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        setDropdownOpen(false);
    };

    return (
        <View style={styles.wrapper}>
            <View style={styles.headerCard}>
                <View>
                    <Text style={styles.statusLabel}>
                        Realtime: <Text style={isConnected ? styles.statusOnline : styles.statusOffline}>{connectionState}</Text>
                    </Text>
                </View>
                <View style={styles.deviceControl}>
                    <View style={styles.connectionStatus}>
                        <View style={[styles.onlineDot, !isConnected && styles.offlineDot]} />
                        <Text style={styles.connectionText}>{isConnected ? 'Connected' : isReconnecting ? 'Reconnecting' : 'Disconnected'}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.deviceDropdown, dropdownOpen && styles.deviceDropdownActive]}
                        onPress={() => setDropdownOpen(!dropdownOpen)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.deviceDropdownText}>{selectedDevice?.name || 'No Device'}</Text>
                        <Ionicons
                            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color="#333"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Dropdown menu */}
            {dropdownOpen && (
                <>
                    {!isConnected && (
                        <TouchableOpacity style={styles.retryButton} onPress={scanAndConnect} activeOpacity={0.8}>
                            <Text style={styles.retryButtonText}>{isReconnecting ? 'Reconnecting...' : 'Reconnect Realtime'}</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.dropdownMenu}>
                        {devices.map((device) => (
                            <TouchableOpacity
                                key={device.id}
                                style={[
                                    styles.dropdownItem,
                                    selectedDevice?.id === device.id && styles.dropdownItemActive,
                                ]}
                                onPress={() => handleSelect(device.id)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.dropdownItemText,
                                        selectedDevice?.id === device.id && styles.dropdownItemTextActive,
                                    ]}
                                >
                                    {device.name}
                                </Text>
                                {selectedDevice?.id === device.id && (
                                    <Ionicons name="checkmark" size={14} color="#4DD0C4" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 20,
        zIndex: 100,
    },
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        color: '#48FF00',
        fontWeight: '600',
    },
    statusOffline: {
        color: '#ff2121',
        fontWeight: '600',
        textTransform: 'capitalize',
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
        backgroundColor: '#48FF00',
        marginRight: 5,
    },
    offlineDot: {
        backgroundColor: '#ff2121',
    },
    connectionText: {
        fontSize: 11,
        color: '#999',
    },
    deviceDropdown: {
        backgroundColor: '#91D7E4',
        paddingVertical: 5,
        paddingHorizontal: 17,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    deviceDropdownActive: {
        backgroundColor: '#91D7E4',
    },
    deviceDropdownText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '600',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 98,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 6,
        minWidth: 130,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 200,
    },
    retryButton: {
        marginTop: 10,
        alignSelf: 'flex-end',
        backgroundColor: '#91D7E4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    retryButtonText: {
        fontSize: 12,
        color: '#124b57',
        fontWeight: '700',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    dropdownItemActive: {
        backgroundColor: '#F0FAFA',
    },
    dropdownItemText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '500',
    },
    dropdownItemTextActive: {
        color: '#4DD0C4',
        fontWeight: '700',
    },
});