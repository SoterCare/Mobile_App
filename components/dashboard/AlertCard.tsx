import React, { useState } from 'react';
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
        bgColor: '#40DFDF', // Cyan
    },
    fall: {
        icon: 'warning',
        iconColor: '#ffffff',
        bgColor: '#FF9789', // Light Red Pastel
    },
    urine: {
        icon: 'water',
        iconColor: '#ffffff',
        bgColor: '#64d8e8',
    },
};

export const AlertCard: React.FC<AlertCardProps> = ({ type, title, timestamp }) => {
    const [expanded, setExpanded] = useState(false);
    const config = ALERT_CONFIG[type];

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
                            <Text style={styles.alertTime}>{timestamp}</Text>
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
                                <Text style={styles.actionBtnTextPrimary}>Attented</Text>
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
        borderRadius: 24,
        paddingVertical: 18,
        paddingHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0', // Slight border to match the clean look
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
        marginTop: 2, // Slight adjustment for the larger text
    },
    timeAndChevron: {
        alignItems: 'flex-end',
        justifyContent: 'center',
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
        backgroundColor: '#40DFDF',
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