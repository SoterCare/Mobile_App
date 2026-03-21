import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';

export const DeviceStatusHeader = () => {
    const {
        devices,
        selectedDeviceId,
        setSelectedDeviceId,
        scanAndConnect,
    } = useRaspberryPi();
    
    const { isConnected: isRealtimeConnected, reconnect } = useRealtimeVitals(selectedDeviceId || undefined);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownLayout, setDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const dropdownButtonRef = React.useRef<View>(null);

    const selectedDevice = useMemo(
        () => devices.find((d) => d.id === selectedDeviceId) || devices[0],
        [devices, selectedDeviceId]
    );

    const isConnected = isRealtimeConnected;
    const connectionState = isConnected ? 'connected' : 'disconnected';
    const isReconnecting = false;

    const handleSelect = (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        setDropdownOpen(false);
    };

    const handleDropdownPress = () => {
        if (!dropdownOpen) {
            dropdownButtonRef.current?.measureInWindow((x, y, width, height) => {
                setDropdownLayout({ x, y, width, height });
                setDropdownOpen(true);
            });
        } else {
            setDropdownOpen(false);
        }
    };

    return (
        <View style={styles.wrapper}>
            <View style={styles.headerCard}>
                <View>
                    <Text style={styles.statusLabel}>
                        Gateway:{' '}
                        <Text style={isConnected ? styles.statusOnline : styles.statusOffline}>
                            {connectionState}
                        </Text>
                    </Text>
                </View>
                <View style={styles.deviceControl}>
                    <View style={styles.connectionStatus}>
                        <View style={[styles.onlineDot, !isConnected && styles.offlineDot]} />
                        <Text style={styles.connectionText}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        ref={dropdownButtonRef}
                        style={[styles.deviceDropdown, dropdownOpen && styles.deviceDropdownActive]}
                        onPress={handleDropdownPress}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.deviceDropdownText}>
                            {selectedDevice?.name || 'No Device'}
                        </Text>
                        <Ionicons
                            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color="#333"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Floating dropdown rendered in a Modal so it overlays everything */}
            <Modal
                visible={dropdownOpen}
                transparent
                animationType="none"
                onRequestClose={() => setDropdownOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
                    <View style={StyleSheet.absoluteFill}>
                        {dropdownLayout && (
                            <View
                                style={[
                                    styles.floatingContainer,
                                    {
                                        top: dropdownLayout.y + dropdownLayout.height + 8,
                                        right: 0, // align to screen right edge with padding
                                    },
                                ]}
                            >
                                {!isConnected && (
                                    <TouchableOpacity
                                        style={styles.retryButton}
                                        onPress={() => {
                                            setDropdownOpen(false);
                                            scanAndConnect();
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.retryButtonText}>
                                            Connect Raspberry Pi
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {devices.length > 0 && (
                                    <View style={styles.dropdownMenu}>
                                        {devices.map((device) => (
                                            <TouchableOpacity
                                                key={device.id}
                                                style={[
                                                    styles.dropdownItem,
                                                    selectedDevice?.id === device.id &&
                                                        styles.dropdownItemActive,
                                                ]}
                                                onPress={() => handleSelect(device.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    style={[
                                                        styles.dropdownItemText,
                                                        selectedDevice?.id === device.id &&
                                                            styles.dropdownItemTextActive,
                                                    ]}
                                                >
                                                    {device.name}
                                                </Text>
                                                {selectedDevice?.id === device.id && (
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={14}
                                                        color="#4DD0C4"
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 20,
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
    // Floating container positioned via Modal
    floatingContainer: {
        position: 'absolute',
        alignItems: 'flex-end',
        paddingRight: 16,
    },
    dropdownMenu: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 6,
        minWidth: 130,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    retryButton: {
        marginBottom: 8,
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