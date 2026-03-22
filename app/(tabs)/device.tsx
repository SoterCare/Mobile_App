import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';

export default function DeviceScreen() {
    const {
        devices,
        selectedDeviceId,
        setSelectedDeviceId,
        claimDevice,
        latestVitals,
        liveLogs,
        connectionState,
        scanAndConnect,
        refreshDevices,
        lastError,
    } = useRaspberryPi();

    const [claimInput, setClaimInput] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);

    const connectionLabel = useMemo(() => {
        if (connectionState === 'connected') return 'Backend Sync Connected';
        if (connectionState === 'reconnecting' || connectionState === 'connecting') return 'Backend Sync Connecting';
        return 'Backend Sync Disconnected';
    }, [connectionState]);

    const handleClaim = async () => {
        const deviceId = claimInput.trim();
        if (!deviceId) {
            Alert.alert('Missing Device ID', 'Enter the scanned QR device_id to claim.');
            return;
        }

        try {
            setIsClaiming(true);
            await claimDevice(deviceId);
            setClaimInput('');
            Alert.alert('Device Claimed', `Device ${deviceId} has been claimed.`);
        } catch (error: any) {
            Alert.alert('Claim Failed', error?.message || 'Unable to claim device.');
        } finally {
            setIsClaiming(false);
        }
    };

    const renderDevice = ({ item }: { item: any }) => {
        const isSelected = selectedDeviceId === item.id;

        return (
            <TouchableOpacity
                style={[styles.deviceCard, isSelected && styles.connectedCard]}
                onPress={() => setSelectedDeviceId(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.deviceInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: isSelected ? '#ffffff' : '#E3F2FD' }]}>
                        <Ionicons
                            name="bluetooth"
                            size={28}
                            color={isSelected ? '#91D7E4' : '#91D7E4'}
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
                                    { backgroundColor: item.status === 'online' ? '#91D7E4' : '#FF5722' },
                                ]}
                            />
                            <Text style={styles.deviceRssi}>
                                Status: {item.status || 'unknown'}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.statusBadge, isSelected && styles.connectedBadge]}>
                    <Text style={[styles.statusText, isSelected && styles.connectedText]}>
                        {isSelected ? 'Selected' : 'Select'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Devices</Text>
                <View style={styles.headerRow}>
                    <Text style={styles.headerSubtitle}>{connectionLabel}</Text>
                    <View style={[
                        styles.bluetoothStatus,
                        { backgroundColor: connectionState === 'connected' ? '#91D7E4' : '#F44336' }
                    ]}>
                        <Text style={styles.bluetoothStatusText}>
                            {connectionState === 'connected' ? 'LIVE' : 'DOWN'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.claimContainer}>
                <Text style={styles.sectionTitle}>Claim Device (QR device_id)</Text>
                <View style={styles.claimRow}>
                    <TextInput
                        value={claimInput}
                        onChangeText={setClaimInput}
                        placeholder="Paste scanned device_id"
                        autoCapitalize="none"
                        style={styles.claimInput}
                    />
                    <TouchableOpacity
                        style={styles.claimButton}
                        onPress={handleClaim}
                        disabled={isClaiming}
                    >
                        {isClaiming ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.claimButtonText}>Claim</Text>}
                    </TouchableOpacity>
                </View>
                {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}
            </View>

            <TouchableOpacity
                style={styles.scanButton}
                onPress={async () => {
                    await scanAndConnect();
                    await refreshDevices();
                }}
                activeOpacity={0.8}
            >
                <Ionicons name="refresh" size={24} color="#fff" style={styles.scanIcon} />
                <Text style={styles.scanButtonText}>Refresh Devices</Text>
            </TouchableOpacity>

            {devices.length > 0 && (
                <View style={styles.countContainer}>
                    <Text style={styles.countText}>
                        Found {devices.length} device{devices.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            )}

            {devices.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="bluetooth-outline" size={64} color="#ccc" />
                    </View>
                    <Text style={styles.emptyText}>No claimed devices</Text>
                    <Text style={styles.emptySubtext}>
                        Claim a device using its QR device_id
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={devices}
                    renderItem={renderDevice}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        <View style={styles.liveSection}>
                            <Text style={styles.sectionTitle}>Latest Vitals</Text>
                            <Text style={styles.vitalsText}>
                                {latestVitals
                                    ? `Temp ${latestVitals.temperature ?? '--'}°C · Moisture ${latestVitals.moisture ?? '--'} · ${latestVitals.timestamp}`
                                    : 'No latest vitals available'}
                            </Text>

                            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Latest Synced Logs</Text>
                            {liveLogs.length === 0 ? (
                                <Text style={styles.emptySubtext}>No recent synced logs.</Text>
                            ) : (
                                liveLogs.slice(0, 5).map((log, idx) => (
                                    <View key={`${log.id || idx}-${log.timestamp}`} style={styles.liveLogRow}>
                                        <Text style={styles.liveLogTitle}>{log.title || log.type || 'Log'}</Text>
                                        <Text style={styles.liveLogTime}>{log.timestamp}</Text>
                                    </View>
                                ))
                            )}
                        </View>
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#201d1d',
        marginBottom: 20,
        marginTop: 8,
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
    claimContainer: {
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    claimRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    claimInput: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d3d7de',
        paddingHorizontal: 12,
        color: '#1f2937',
    },
    claimButton: {
        backgroundColor: '#91D7E4',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    claimButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    errorText: {
        marginTop: 8,
        color: '#dc2626',
        fontSize: 12,
        fontWeight: '500',
    },
    scanButton: {
        flexDirection: 'row',
        backgroundColor: '#91D7E4',
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
        marginTop: 10,
    },
    scanningButton: {
        backgroundColor: '#91D7E4',
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
        paddingBottom: 28,
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
        backgroundColor: '#E3F2FD',
        borderWidth: 2,
        borderColor: '#91D7E4',
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
        backgroundColor: '#91D7E4',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E3F2FD',
    },
    connectedText: {
        color: '#fbfeff',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
        marginTop: -150,
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
    liveSection: {
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#344054',
        marginBottom: 8,
    },
    vitalsText: {
        fontSize: 13,
        color: '#4b5563',
    },
    liveLogRow: {
        borderTopWidth: 1,
        borderTopColor: '#edf2f7',
        paddingTop: 8,
        marginTop: 8,
    },
    liveLogTitle: {
        fontSize: 13,
        color: '#1f2937',
        fontWeight: '600',
    },
    liveLogTime: {
        marginTop: 2,
        fontSize: 12,
        color: '#6b7280',
    },
});