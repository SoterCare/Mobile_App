import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertCard } from './AlertCard';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';
import { useRealtimeVitals } from '@/hooks/useRealtimeVitals';
import { alertService } from '@/services/alertService';
import { Colors, Radius } from '@/theme/tokens';
import { Shadows } from '@/theme/shadows';

// Approximate height of one AlertCard (paddingVertical 30 + icon 52 + marginBottom 12)
const CARD_HEIGHT = 94;
const VISIBLE_CARDS = 3;
const POLL_INTERVAL_MS = 15_000;

export const RecentAlerts = () => {
    const { recentAlerts: contextAlerts, selectedDeviceId, refreshRecentAlerts, removeRecentAlert } = useRaspberryPi();
    const { recentAlerts: realtimeAlerts, removeAlert } = useRealtimeVitals(selectedDeviceId || undefined);
    const [attendingAll, setAttendingAll] = useState(false);

    useEffect(() => {
        refreshRecentAlerts();
        const interval = setInterval(refreshRecentAlerts, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [refreshRecentAlerts]);

    const handleAlertDismissed = (id: string) => {
        removeRecentAlert(id);
        removeAlert(id);
    };

    const allAlerts = [...realtimeAlerts, ...contextAlerts];
    const uniqueAlerts = Array.from(new Map(allAlerts.map(item => [item.id, item])).values());
    const sortedAlerts = uniqueAlerts.sort((a, b) => b.timestamp - a.timestamp);

    const alertsToRender = sortedAlerts.map((a, index) => ({
        id: a.id || `alert_${index}`,
        type: (a.type as 'movement' | 'fall' | 'urine' | 'sos' | 'help_call') || 'movement',
        title: a.title,
        timestamp: a.timestamp,
    }));

    const handleAttendAll = () => {
        if (alertsToRender.length === 0) return;
        Alert.alert(
            'Attend All?',
            `Mark all ${alertsToRender.length} alert${alertsToRender.length > 1 ? 's' : ''} as attended?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Attend All',
                    onPress: async () => {
                        setAttendingAll(true);
                        const ids = alertsToRender.map(a => a.id).filter(Boolean);
                        await Promise.allSettled(ids.map(id => alertService.attendAlert(id)));
                        ids.forEach(id => {
                            removeRecentAlert(id);
                            removeAlert(id);
                        });
                        setAttendingAll(false);
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.alertsContainer}>
            {/* Header */}
            <View style={styles.alertsHeader}>
                <Text style={styles.alertsTitle}>Recent Alerts</Text>
                <View style={styles.headerActions}>
                    {alertsToRender.length > 0 && (
                        <TouchableOpacity
                            style={styles.attendAllBtn}
                            onPress={handleAttendAll}
                            disabled={attendingAll}
                        >
                            {attendingAll
                                ? <ActivityIndicator size="small" color={Colors.success} />
                                : <Ionicons name="checkmark-done-circle-outline" size={22} color={Colors.success} />
                            }
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>View All</Text>
                        <Ionicons name="chevron-forward" size={15} color="#888" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Alert list — scrollable, shows ~3 cards at a time */}
            {alertsToRender.length === 0 ? (
                <Text style={styles.emptyText}>No recent alerts</Text>
            ) : (
                <ScrollView
                    style={{ maxHeight: CARD_HEIGHT * VISIBLE_CARDS }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                >
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
                </ScrollView>
            )}
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    attendAllBtn: {
        padding: 2,
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
