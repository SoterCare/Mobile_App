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
        const isOnline = item.status === 'online';

        return (
            <TouchableOpacity
                style={[styles.deviceCard, isSelected && styles.connectedCard]}
                onPress={() => setSelectedDeviceId(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.deviceInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: isSelected ? '#ffffff' : '#F8FAFC' }]}>
                        <Ionicons
                            name="bluetooth"
                            size={28}
                            color={isSelected ? '#91D7E4' : '#CBD5E1'}
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
                                    { backgroundColor: isOnline ? '#2ee134' : '#EF4444' },
                                ]}
                            />
                            <Text style={styles.deviceRssi}>
                                Status: <Text style={{ 
                                    color: isOnline ? '#2ee134' : '#EF4444', 
                                    fontWeight: '700' 
                                }}>
                                    {item.status || 'unknown'}
                                </Text>
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
                        { backgroundColor: connectionState === 'connected' ? '#2ee134' : '#EF4444' }
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

                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 16,
        marginTop: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
        flex: 1,
    },
    bluetoothStatus: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginLeft: 8,
    },
    bluetoothStatusText: {
        fontSize: 10,
        fontWeight: '800',
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
        borderColor: '#f1f5f9',
    },
    claimRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    claimInput: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        color: '#1e293b',
        backgroundColor: '#fdfdfd',
    },
    claimButton: {
        backgroundColor: '#91D7E4',
        borderRadius: 12,
        paddingHorizontal: 16,
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
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '600',
    },
    scanButton: {
        flexDirection: 'row',
        backgroundColor: '#91D7E4',
        marginHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#91D7E4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginBottom: 16,
        marginTop: 10,
    },
    scanIcon: {
        marginRight: 8,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    countContainer: {
        paddingHorizontal: 22,
        paddingBottom: 8,
    },
    countText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
        paddingTop: 8,
        paddingBottom: 40,
    },
    deviceCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    connectedCard: {
        backgroundColor: '#f0f9ff',
        borderColor: '#91D7E4',
        borderWidth: 1.5,
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deviceDetails: {
        marginLeft: 12,
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    deviceId: {
        fontSize: 11,
        color: '#94a3b8',
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
        color: '#64748b',
    },
    statusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    connectedBadge: {
        backgroundColor: '#91D7E4',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
    },
    connectedText: {
        color: '#fff',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: 60,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#334155',
        marginBottom: 10,
    },
});