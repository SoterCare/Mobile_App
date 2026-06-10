import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';
import { Colors, Radius } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';

export const DeviceStatusHeader = () => {
    const { devices, selectedDeviceId } = useRaspberryPi();
    const { isDeviceStreaming } = useRealtimeVitals(selectedDeviceId || undefined);

    const selectedDevice = useMemo(
        () => devices.find((d) => d.id === selectedDeviceId) || devices[0],
        [devices, selectedDeviceId]
    );

    const isConnected = isDeviceStreaming;
    const connectionState = isConnected ? 'Online' : 'Offline';

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
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.md,
        padding: 16,
        paddingVertical: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Shadows.card,
    },
    statusLabel: {
        fontSize: 15,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    statusOnline: {
        color: Colors.success,
        fontWeight: '600',
    },
    statusOffline: {
        color: Colors.danger,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    devicePill: {
        backgroundColor: Colors.brand,
        paddingVertical: 5,
        paddingHorizontal: 17,
        borderRadius: Radius.pill,
    },
    devicePillText: {
        fontSize: 13,
        color: '#ffffff',
        fontWeight: '600',
    },
});