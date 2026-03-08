import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertType = 'movement' | 'fall' | 'urine';

interface AlertCardProps {
    type: AlertType;
    title: string;
    timestamp: string;
    showActions?: boolean;
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

export const AlertCard: React.FC<AlertCardProps> = ({
    type,
    title,
    timestamp,
    showActions = false,
}) => {
    const config = ALERT_CONFIG[type];

    return (
        <View style={styles.alertCard}>
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
                    {!showActions && (
                        <Ionicons name="chevron-down" size={18} color="#ccc" style={styles.chevron} />
                    )}
                </View>
            </View>

            {/* Action buttons */}
            {showActions && (
                <View style={styles.alertActions}>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]}>
                        <Text style={styles.actionBtnTextPrimary}>Attended</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]}>
                        <Text style={styles.actionBtnTextSecondary}>False</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    alertCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 12,
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
        width: 38,
        height: 38,
        borderRadius: 19,
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
        paddingVertical: 7,
        paddingHorizontal: 22,
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