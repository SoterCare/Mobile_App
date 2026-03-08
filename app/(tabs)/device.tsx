import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BleManager, Device, State } from 'react-native-ble-plx';

import { useBLE, BluetoothDevice } from '../hooks/useBLE';

export default function DeviceScreen() {
    const {
        isScanning,
        devices,
        connectedDevice,
        isConnecting,
        bluetoothState,
        startScan,
        connectToDevice,
        disconnectDevice,
    } = useBLE();

    const renderDevice = ({ item }: { item: BluetoothDevice }) => {
        const isConnected = connectedDevice === item.id;
        const isConnectingToThis = isConnecting === item.id;

        const getSignalColor = (rssi: number) => {
            if (rssi > -60) return '#4CAF50';
            if (rssi > -70) return '#8BC34A';
            if (rssi > -80) return '#FFC107';
            return '#FF5722';
        };

        return (
            <TouchableOpacity
                style={[styles.deviceCard, isConnected && styles.connectedCard]}
                onPress={() => {
                    if (isConnected) {
                        disconnectDevice(item.id, item.name);
                    } else if (!isConnectingToThis && !isConnecting) {
                        connectToDevice(item.id, item.name);
                    }
                }}
                disabled={isConnectingToThis || (isConnecting !== null && !isConnected)}
                activeOpacity={0.7}
            >
                <View style={styles.deviceInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: isConnected ? '#E8F5E9' : '#E3F2FD' }]}>
                        <Ionicons
                            name="bluetooth"
                            size={28}
                            color={isConnected ? '#4CAF50' : '#03A9F4'}
                        />
                    </View>
                    <View style={styles.deviceDetails}>
                        <Text style={styles.deviceName} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={styles.deviceId} numberOfLines={1}>
                            {item.id}
                        </Text>
                        <View style={styles.signalContainer}>
                            <View
                                style={[
                                    styles.signalDot,
                                    { backgroundColor: getSignalColor(item.rssi) },
                                ]}
                            />
                            <Text style={styles.deviceRssi}>
                                Signal: {item.rssi} dBm
                            </Text>
                        </View>
                    </View>
                </View>

                {isConnectingToThis ? (
                    <ActivityIndicator size="small" color="#03A9F4" />
                ) : (
                    <View
                        style={[
                            styles.statusBadge,
                            isConnected && styles.connectedBadge,
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                isConnected && styles.connectedText,
                            ]}
                        >
                            {isConnected ? 'Connected' : 'Connect'}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bluetooth Devices</Text>
                <View style={styles.headerRow}>
                    <Text style={styles.headerSubtitle}>
                        {connectedDevice
                            ? '✓ Device Connected'
                            : isScanning
                                ? 'Scanning for devices...'
                                : 'Tap below to scan for nearby devices'}
                    </Text>
                    <View style={[
                        styles.bluetoothStatus,
                        { backgroundColor: bluetoothState === State.PoweredOn ? '#4CAF50' : '#F44336' }
                    ]}>
                        <Text style={styles.bluetoothStatusText}>
                            {bluetoothState === State.PoweredOn ? 'BT ON' : 'BT OFF'}
                        </Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.scanButton, isScanning && styles.scanningButton]}
                onPress={startScan}
                disabled={isScanning}
                activeOpacity={0.8}
            >
                {isScanning ? (
                    <>
                        <ActivityIndicator size="small" color="#fff" style={styles.scanIcon} />
                        <Text style={styles.scanButtonText}>Scanning...</Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="scan" size={24} color="#fff" style={styles.scanIcon} />
                        <Text style={styles.scanButtonText}>
                            {devices.length > 0 ? 'Scan Again' : 'Start Scan'}
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            {devices.length > 0 && (
                <View style={styles.countContainer}>
                    <Text style={styles.countText}>
                        Found {devices.length} device{devices.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            )}

            {devices.length === 0 && !isScanning ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="bluetooth-outline" size={64} color="#ccc" />
                    </View>
                    <Text style={styles.emptyText}>No devices found</Text>
                    <Text style={styles.emptySubtext}>
                        Make sure Bluetooth is enabled and devices are nearby
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={devices}
                    renderItem={renderDevice}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        isScanning ? (
                            <View style={styles.scanningState}>
                                <ActivityIndicator size="large" color="#03A9F4" />
                                <Text style={styles.scanningText}>
                                    Looking for devices...
                                </Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f3f7',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#201d1d',
        marginBottom: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    bluetoothStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 8,
    },
    bluetoothStatusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    scanButton: {
        flexDirection: 'row',
        backgroundColor: '#03A9F4',
        marginHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        marginBottom: 12,
    },
    scanningButton: {
        backgroundColor: '#0288D1',
    },
    scanIcon: {
        marginRight: 8,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    countContainer: {
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    countText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    listContent: {
        padding: 20,
        paddingTop: 8,
    },
    deviceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    connectedCard: {
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deviceDetails: {
        marginLeft: 12,
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#201d1d',
        marginBottom: 3,
    },
    deviceId: {
        fontSize: 11,
        color: '#999',
        marginBottom: 4,
    },
    signalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    signalDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    deviceRssi: {
        fontSize: 12,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#E3F2FD',
    },
    connectedBadge: {
        backgroundColor: '#C8E6C9',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#03A9F4',
    },
    connectedText: {
        color: '#4CAF50',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
    scanningState: {
        paddingTop: 60,
        alignItems: 'center',
    },
    scanningText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
});