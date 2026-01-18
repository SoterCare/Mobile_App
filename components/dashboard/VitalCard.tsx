import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';

interface VitalCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    backgroundColor: string;
    value: string;
    unit: string;
    label: string;
    valueColor?: string;
}

export const VitalCard: React.FC<VitalCardProps> = ({ icon, iconColor, backgroundColor, value, unit, label, valueColor }) => {
    return (
        <NeumorphicCard style={styles.vitalCard}>
            <View style={[styles.vitalIconCircle, { backgroundColor }]}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <View style={styles.vitalInfo}>
                <Text style={[styles.vitalValue, valueColor ? { color: valueColor } : {}]}>
                    {value}<Text style={[styles.vitalUnit, valueColor ? { color: valueColor } : {}]}>{unit}</Text>
                </Text>
                <Text style={styles.vitalLabel}>{label}</Text>
            </View>
        </NeumorphicCard>
    );
};

const styles = StyleSheet.create({
    vitalCard: {
        padding: 16,
        flexDirection: 'row',
        width: '47%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: 100,
        marginBottom: 16,
    },
    vitalIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    vitalInfo: {
        alignItems: 'flex-start',
    },
    vitalValue: {
        fontSize: 24, // Slightly scale down if too big
        fontWeight: 'bold',
        color: '#FF5252',
    },
    vitalUnit: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#999',
        marginLeft: 2,
    },
    vitalLabel: {
        fontSize: 13,
        color: '#666',
    },
});
