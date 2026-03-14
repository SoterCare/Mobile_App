import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedCounter } from '../ui/AnimatedCounter';

interface VitalCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    backgroundColor: string;
    value: string;
    unit: string;
    label: string;
    sublabel?: string; // e.g. "Room : 30.9 °C" or "Moisture · Dry"
    valueColor?: string;
}

export const VitalCard: React.FC<VitalCardProps> = ({
    icon,
    iconColor,
    backgroundColor,
    value,
    unit,
    label,
    sublabel,
    valueColor,
}) => {
    const isNumeric = !isNaN(parseFloat(value)) && isFinite(Number(value));
    const hasDecimal = value.includes('.');
    const precision = hasDecimal ? 1 : 0;

    return (
        <View style={styles.vitalCard}>
            <View style={[styles.vitalIconCircle, { backgroundColor }]}>
                <Ionicons name={icon} size={26} color={iconColor} />
            </View>
            <View style={styles.vitalInfo}>
                <View style={styles.valueContainer}>
                    {isNumeric ? (
                        <AnimatedCounter
                            value={Number(value)}
                            precision={precision}
                            style={[styles.vitalValue, valueColor ? { color: valueColor } : {}]}
                        />
                    ) : (
                        <Text style={[styles.vitalValue, valueColor ? { color: valueColor } : {}]}>
                            {value}
                        </Text>
                    )}
                    <Text style={[styles.vitalUnit, valueColor ? { color: valueColor } : {}]}>
                        {unit}
                    </Text>
                </View>
                <Text style={styles.vitalLabel}>{label}</Text>
                {sublabel ? <Text style={styles.vitalSublabel}>{sublabel}</Text> : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    vitalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        width: '48%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: 110,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    vitalIconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        flexShrink: 0,
    },
    vitalInfo: {
        flex: 1,
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
        color: '#FFCF70',
        lineHeight: 32,
    },
    vitalUnit: {
        fontSize: 12,
        fontWeight: '500',
        color: '#858282',
        marginLeft: 2,
    },
    vitalLabel: {
        fontSize: 12,
        color: '#858282',
        textAlign: 'left',
    },
    vitalSublabel: {
        fontSize: 12,
        color: '#858282',
        textAlign: 'left',
        marginTop: 1,
    },
});