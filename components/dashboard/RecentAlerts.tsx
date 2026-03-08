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

// Height of one collapsed alert card (paddingVertical 14*2 + icon 40 + marginBottom 10)
const CARD_HEIGHT = 78;
// Show exactly 2 cards before requiring scroll
const VISIBLE_CARDS = 2;
const SCROLL_HEIGHT = CARD_HEIGHT * VISIBLE_CARDS + 10;

const ALERTS = [
    { id: '1', type: 'movement' as const, title: 'Movement Detected', timestamp: 'now' },
    { id: '2', type: 'fall' as const,     title: 'Fall Detected',      timestamp: '1m ago' },
    { id: '3', type: 'urine' as const,    title: 'Urine Detected',     timestamp: '2m ago' },
    { id: '4', type: 'movement' as const, title: 'Movement Detected',  timestamp: '3m ago' },
];

export const RecentAlerts = () => {
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
                {ALERTS.map((alert) => (
                    <AlertCard
                        key={alert.id}
                        type={alert.type}
                        title={alert.title}
                        timestamp={alert.timestamp}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    alertsContainer: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 20,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 6,
    },
    alertsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    alertsTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#727070',
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
});