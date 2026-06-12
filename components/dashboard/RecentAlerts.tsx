import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertCard } from './AlertCard';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';
import { Colors, Radius } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';

// Number of alerts shown in the dashboard preview ("View All" reveals the rest)
const PREVIEW_COUNT = 5;
const POLL_INTERVAL_MS = 15_000; // Refresh backend alerts every 15 seconds

export const RecentAlerts = () => {
    const { recentAlerts: contextAlerts, selectedDeviceId, refreshRecentAlerts, removeRecentAlert } = useRaspberryPi();
    const { recentAlerts: realtimeAlerts, removeAlert } = useRealtimeVitals(selectedDeviceId || undefined);

    // Poll backend for fresh alerts every 15 seconds
    useEffect(() => {
        refreshRecentAlerts(); // immediate fetch on mount
        const interval = setInterval(() => {
            refreshRecentAlerts();
        }, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [refreshRecentAlerts]);

    const handleAlertDismissed = (id: string) => {
        removeRecentAlert(id); // immediate — REST-polled list
        removeAlert(id);        // immediate — socket list
        // Background sync handled by 15-second poll and socket events
    };

    const allAlerts = [...realtimeAlerts, ...contextAlerts];
    const uniqueAlerts = Array.from(new Map(allAlerts.map(item => [item.id, item])).values());
    const sortedAlerts = uniqueAlerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, PREVIEW_COUNT);

    const alertsToRender = sortedAlerts.map((a, index) => ({
        id: a.id || `alert_${index}`,
        type: (a.type as 'movement' | 'fall' | 'urine' | 'sos' | 'help_call') || 'movement',
        title: a.title,
        timestamp: a.timestamp,
    }));

    return (
        <View style={styles.alertsContainer}>
            {/* Header */}
            <View style={styles.alertsHeader}>
                <Text style={styles.alertsTitle}>Recent Alerts</Text>
                <TouchableOpacity style={styles.viewAllBtn}>
                    <Text style={styles.viewAllText}>View All</Text>
                    <Ionicons name="chevron-forward" size={15} color="#888" />
                </TouchableOpacity>
            </View>

            {/* Preview list — the parent screen handles scrolling */}
            <View>
                {alertsToRender.map((alert) => (
                    <AlertCard
                        key={alert.id}
                        id={alert.id}
                        type={alert.type}
                        title={alert.title}
                        timestamp={alert.timestamp}
                        onDismiss={handleAlertDismissed}
                    />
                ))}
                {alertsToRender.length === 0 && (
                    <Text style={styles.emptyText}>No recent alerts</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    alertsContainer: {
        backgroundColor: Colors.cardBg,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 20,
        paddingBottom: 16,
        ...Shadows.card,
    },
    alertsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    alertsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4A4A4A',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
        paddingVertical: 16,
        fontSize: 13,
    },
});