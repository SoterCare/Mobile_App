import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertType = 'movement' | 'fall' | 'urine';

interface AlertCardProps {
    type: AlertType;
    title: string;
    timestamp: string;
}

const ALERT_CONFIG: Record<AlertType, { icon: keyof typeof Ionicons.glyphMap; iconColor: string; bgColor: string }> = {
    movement: {
        icon: 'walk',
        iconColor: '#ffffff',
        bgColor: '#42dfdf',
    },
    fall: {
        icon: 'warning',
        iconColor: '#ffffff',
        bgColor: '#FF9D93',
    },
    urine: {
        icon: 'water',
        iconColor: '#ffffff',
        bgColor: '#91D7E4',
    },
};

const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

export const AlertCard: React.FC<AlertCardProps> = ({ type, title, timestamp }) => {
    const [expanded, setExpanded] = useState(false);
    const [, forceUpdate] = useState(0);
    const config = ALERT_CONFIG[type];

    useEffect(() => {
        const interval = setInterval(() => forceUpdate(n => n + 1), 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <TouchableOpacity
            style={styles.alertCard}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.85}
        >
            <View style={[styles.cardContent, !expanded && { alignItems: 'center' }]}>
                {/* Icon */}
                <View style={[styles.alertIconCircle, { backgroundColor: config.bgColor }]}>
                    <Ionicons name={config.icon} size={26} color={config.iconColor} />
                </View>

                {/* Right Area */}
                <View style={styles.rightArea}>
                    {/* Top Row: Title + Timestamp */}
                    <View style={styles.titleRow}>
                        <Text style={styles.alertText}>{title}</Text>
                        <View style={styles.timeAndChevron}>
                            <Text style={styles.alertTime}>{getRelativeTime(timestamp)}</Text>
                            {!expanded && (
                                <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color="#888"
                                    style={styles.chevron}
                                />
                            )}
                        </View>
                    </View>

                    {/* Expandable action buttons */}
                    {expanded && (
                        <View style={styles.alertActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnPrimary]}
                                onPress={(e) => { e.stopPropagation?.(); }}
                            >
                                <Text style={styles.actionBtnTextPrimary}>Attended</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnSecondary]}
                                onPress={(e) => { e.stopPropagation?.(); }}
                            >
                                <Text style={styles.actionBtnTextSecondary}>False</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    alertCard: {
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        width: '98%',
        marginLeft: '0.9%',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    alertIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        flexShrink: 0,
    },
    rightArea: {
        flex: 1,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    alertText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#4A4A4A',
        marginTop: 5,
    },
    timeAndChevron: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginTop: -10,
        gap: 4,
    },
    alertTime: {
        fontSize: 12,
        color: '#8A8A8A',
        fontWeight: '500',
    },
    chevron: {
        marginTop: 6,
    },
    alertActions: {
        flexDirection: 'row',
        marginTop: 14,
        justifyContent: 'flex-end',
        gap: 12,
    },
    actionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 24,
    },
    actionBtnPrimary: {
        backgroundColor: '#91D7E4',
    },
    actionBtnSecondary: {
        backgroundColor: '#E0E0E0',
    },
    actionBtnTextPrimary: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    actionBtnTextSecondary: {
        color: '#555555',
        fontWeight: '600',
        fontSize: 14,
    },
});