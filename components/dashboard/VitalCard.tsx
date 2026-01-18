import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        <View style={styles.vitalCard}>
            <View style={[styles.vitalIconCircle, { backgroundColor }]}>
                <Ionicons name={icon} size={28} color={iconColor} />
            </View>
            <View style={styles.vitalInfo}>
                <View style={styles.valueContainer}>
                    <Text style={[styles.vitalValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
                    <Text style={[styles.vitalUnit, valueColor ? { color: valueColor } : {}]}>{unit}</Text>
                </View>
                <Text style={styles.vitalLabel}>{label}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    vitalCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        paddingHorizontal: 20,
        flexDirection: 'row', // Horizontal layout
        width: '47%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 120, // Reduced height for horizontal look like mockup
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    vitalIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    vitalInfo: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    vitalValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF5252',
        lineHeight: 34,
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
        textAlign: 'left',
    },
});
