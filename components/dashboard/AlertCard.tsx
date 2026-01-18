import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AlertCardProps {
    type: 'movement' | 'fall';
    title: string;
    timestamp: string;
    showActions?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({ type, title, timestamp, showActions = false }) => {
    const isFall = type === 'fall';
    const iconName = isFall ? 'warning' : 'walk';
    const iconColor = isFall ? '#FF5252' : '#00BCD4'; // Cyan for movement
    const bgColor = isFall ? '#FFEBEE' : '#E0F7FA';

    // Using simple View instead of NeumorphicCard to match white design
    return (
        <View style={styles.alertCard}>
            <View style={styles.alertTopRow}>
                <View style={[styles.alertIconCircle, { backgroundColor: bgColor }]}>
                    <Ionicons name={iconName} size={24} color={iconColor} />
                </View>
                <View style={styles.alertContent}>
                    <Text style={styles.alertText}>{title}</Text>
                </View>
                {showActions ? (
                    <Text style={styles.alertTime}>{timestamp}</Text>
                ) : (
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.alertTime}>{timestamp}</Text>
                        <Ionicons name="chevron-down" size={20} color="#999" />
                    </View>
                )}
            </View>

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
        padding: 16,
        marginBottom: 16,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0', // Subtle border
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
    },
    alertContent: {
        flex: 1,
    },
    alertText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    alertTime: {
        fontSize: 12,
        color: '#999',
    },
    alertActions: {
        flexDirection: 'row',
        marginTop: 16,
        justifyContent: 'flex-end',
        gap: 10,
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    actionBtnPrimary: {
        backgroundColor: '#4DD0E1', // Cyan
    },
    actionBtnSecondary: {
        backgroundColor: '#E0E0E0',
    },
    actionBtnTextPrimary: {
        color: '#fff',
        fontWeight: '600',
    },
    actionBtnTextSecondary: {
        color: '#666',
        fontWeight: '600',
    },
});
