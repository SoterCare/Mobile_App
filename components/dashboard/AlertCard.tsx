import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { alertService } from '@/services/alertService';
import { recycleBinService } from '@/services/recycleBinService';

type AlertType = 'movement' | 'fall' | 'urine' | 'sos' | 'help_call';

interface AlertCardProps {
    id: string;
    type: AlertType;
    title: string;
    timestamp: string;
    onDismiss?: (id: string) => void;
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
    sos: {
        icon: 'alert-circle',
        iconColor: '#ffffff',
        bgColor: '#FF6B6B',
    },
    help_call: {
        icon: 'call',
        iconColor: '#ffffff',
        bgColor: '#FFA94D',
    },
};

const DEFAULT_ALERT_CONFIG = ALERT_CONFIG.movement;

const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = Math.max(0, now.getTime() - alertTime.getTime());
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

export const AlertCard: React.FC<AlertCardProps> = ({ id, type, title, timestamp, onDismiss }) => {
    const [expanded, setExpanded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [, forceUpdate] = useState(0);
    const config = ALERT_CONFIG[type] ?? DEFAULT_ALERT_CONFIG;

    useEffect(() => {
        const interval = setInterval(() => forceUpdate((n: number) => n + 1), 1000); // refresh every 1s
        return () => clearInterval(interval);
    }, []);

    const handleAttend = async () => {
        try {
            setIsProcessing(true);
            // All alerts (both persistent and real-time) should be registered on the backend
            if (id) {
                await Promise.all([
                    alertService.attendAlert(id),
                    recycleBinService.dismiss({ id })
                ]);
            }
            onDismiss?.(id);
        } catch (error) {
            console.error('Failed to attend alert:', error);
            setIsProcessing(false);
        }
    };

    const handleFalseAlarm = async () => {
        try {
            setIsProcessing(true);
            // All alerts (both persistent and real-time) should be registered on the backend
            if (id) {
                await Promise.all([
                    alertService.falseAlarmAlert(id),
                    recycleBinService.dismiss({ id })
                ]);
            }
            onDismiss?.(id);
        } catch (error) {
            console.error('Failed to mark false alarm:', error);
            setIsProcessing(false);
        }
    };

    return (
        <TouchableOpacity
            style={styles.alertCard}
            onPress={() => !isProcessing && setExpanded(!expanded)}
            activeOpacity={0.85}
            disabled={isProcessing}
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
                            {!expanded && !isProcessing && (
                                <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color="#888"
                                    style={styles.chevron}
                                />
                            )}
                            {isProcessing && (
                                <ActivityIndicator size="small" color="#91D7E4" style={styles.chevron} />
                            )}
                        </View>
                    </View>

                    {/* Expandable action buttons */}
                    {expanded && !isProcessing && (
                        <View style={styles.alertActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnPrimary]}
                                onPress={(e) => { e.stopPropagation?.(); handleAttend(); }}
                            >
                                <Text style={styles.actionBtnTextPrimary}>Attended</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnSecondary]}
                                onPress={(e) => { e.stopPropagation?.(); handleFalseAlarm(); }}
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