import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertCard } from './AlertCard';
import { useRaspberryPi } from '@/contexts/RaspberryPiContext';

// Height of one expanded alert card is slightly more, so just set a standard max height
const SCROLL_HEIGHT = 280;

export const RecentAlerts = () => {
    const { recentAlerts } = useRaspberryPi();

    const alertsToRender = recentAlerts.map((a, index) => ({
        id: a.id || `alert_${index}`,
        type: (a.type as 'movement' | 'fall' | 'urine') || 'movement',
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

            {/* Scrollable list — only ~2 cards tall */}
            <ScrollView
                style={{ maxHeight: SCROLL_HEIGHT }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                {alertsToRender.map((alert) => (
                    <AlertCard
                        key={alert.id}
                        type={alert.type}
                        title={alert.title}
                        timestamp={alert.timestamp}
                    />
                ))}
                {alertsToRender.length === 0 && (
                    <Text style={styles.emptyText}>No recent alerts</Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    alertsContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        padding: 20,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
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