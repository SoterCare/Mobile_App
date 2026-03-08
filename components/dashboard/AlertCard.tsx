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
        iconColor: '#4DD0C4',
        bgColor: '#E0F7F5',
    },
    fall: {
        icon: 'warning',
        iconColor: '#FF5252',
        bgColor: '#FFEBEE',
    },
    urine: {
        icon: 'water',
        iconColor: '#FFA726',
        bgColor: '#FFF3E0',
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
            <View style={styles.alertTopRow}>
                {/* Icon */}
                <View style={[styles.alertIconCircle, { backgroundColor: config.bgColor }]}>
                    <Ionicons name={config.icon} size={22} color={config.iconColor} />
                </View>

                {/* Title */}
                <Text style={styles.alertText}>{title}</Text>

                {/* Timestamp + chevron */}
                <View style={styles.rightSection}>
                    <Text style={styles.alertTime}>{timestamp}</Text>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#ccc"
                        style={styles.chevron}
                    />
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
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    alertCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    alertTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    alertIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    alertText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#2C2C2C',
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    alertTime: {
        fontSize: 11,
        color: '#bbb',
    },
    chevron: {
        marginTop: 4,
    },
    alertActions: {
        flexDirection: 'row',
        marginTop: 12,
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    actionBtnPrimary: {
        backgroundColor: '#4DD0C4',
    },
    actionBtnSecondary: {
        backgroundColor: '#ECECEC',
    },
    actionBtnTextPrimary: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    actionBtnTextSecondary: {
        color: '#666',
        fontWeight: '600',
        fontSize: 13,
    },
});