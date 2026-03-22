import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';

export const DeviceStatusHeader = () => {
    const { devices, selectedDeviceId } = useRaspberryPi();
    const { isConnected: isRealtimeConnected } = useRealtimeVitals(selectedDeviceId || undefined);

    const selectedDevice = useMemo(
        () => devices.find((d) => d.id === selectedDeviceId) || devices[0],
        [devices, selectedDeviceId]
    );

    const isConnected = isRealtimeConnected;
    const connectionState = isConnected ? 'online' : 'offline';

    return (
        <View style={styles.wrapper}>
            <View style={styles.headerCard}>
                <Text style={styles.statusLabel}>
                    Gateway:{' '}
                    <Text style={isConnected ? styles.statusOnline : styles.statusOffline}>
                        {connectionState}
                    </Text>
                </Text>
                <View style={styles.devicePill}>
                    <Text style={styles.devicePillText}>
                        {selectedDevice?.name || 'No Device'}
                    </Text>
                </View>
            </View>
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
        paddingVertical: 20,
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
        color: '#91D7E4',
        fontWeight: '600',
    },
    statusOffline: {
        color: '#ff2121',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    devicePill: {
        backgroundColor: '#91D7E4',
        paddingVertical: 5,
        paddingHorizontal: 17,
        borderRadius: 20,
    },
    devicePillText: {
        fontSize: 13,
        color: '#ffffff',
        fontWeight: '600',
    },
});