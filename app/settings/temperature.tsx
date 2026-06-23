import React, { useState, useEffect } from 'react';
import { DottedBackground } from "@/components/ui/DottedBackground";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/theme/tokens';

type Unit = 'F' | 'C';

// Fahrenheit on top, Celsius below
const UNITS: { key: Unit; label: string; symbol: string }[] = [
    { key: 'C', label: 'Celsius',     symbol: '°C' },
    { key: 'F', label: 'Fahrenheit',  symbol: '°F' },
];

export default function TemperatureScreen() {
    const [unit, setUnit] = useState<Unit>('C');

    useEffect(() => {
    AsyncStorage.getItem('temp_unit').then((val) => {
        if (val === 'F' || val === 'C') setUnit(val);
        else setUnit('C');
    });
}, []);

    const handleUnitChange = async (u: Unit) => {
        setUnit(u);
        await AsyncStorage.setItem('temp_unit', u);
    };

    const selectedLabel = unit === 'C' ? 'Celsius (°C)' : 'Fahrenheit (°F)';

    return (
        <SafeAreaView style={styles.container}>
      <DottedBackground />
            <Stack.Screen
                options={{
                    title: '',
                    headerLeft: () => <BackButton />,
                    headerTitle: () => <Text style={styles.headerTitle}>Temperature</Text>,
                    headerTitleAlign: 'left',
                    headerRight: () => <View />,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: 'transparent' },
                }}
            />

            <View style={styles.content}>
                {/* Instruction Text */}
                <Text style={styles.instructionText}>Choose your preferred temperature</Text>

                {/* ── Unit cards ── */}
                {UNITS.map((u) => {
                    const isActive = unit === u.key;
                    return (
                        <TouchableOpacity
                            key={u.key}
                            style={[styles.unitCard, isActive && styles.unitCardActive]}
                            onPress={() => handleUnitChange(u.key)}
                            activeOpacity={0.8}
                        >
                            {/* Symbol circle */}
                            <View style={[styles.symbolCircle, isActive && styles.symbolCircleActive]}>
                                <Text style={[styles.symbolText, isActive && styles.symbolTextActive]}>
                                    {u.symbol}
                                </Text>
                            </View>

                            {/* Label */}
                            <Text style={[styles.unitLabel, isActive && styles.unitLabelActive]}>
                                {u.label}
                                <Text style={styles.unitSymbolInline}> ({u.symbol})</Text>
                            </Text>

                            {/* Radio */}
                            <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                                {isActive && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {/* ── Current setting banner ── */}
                <View style={styles.previewCard}>
                    <Text style={styles.previewText}>
                        Current setting: <Text style={styles.previewBold}>{selectedLabel}</Text>
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },

    headerBackBtn: { marginLeft: 4, marginTop: 20 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginLeft: 12, marginTop: 20 },

    content: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },

    instructionText: {
        fontSize: 15,
        color: '#6C757D',
        marginBottom: 4,
        fontWeight: '500',
    },

    // ── Unit card ──
    unitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1.5,
        borderColor: '#F1F3F5',
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    unitCardActive: {
        borderColor: Colors.brand,
        shadowColor: Colors.brand,
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 5,
    },

    // ── Symbol circle ──
    symbolCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F1F3F5',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    symbolCircleActive: { backgroundColor: Colors.brand },
    symbolText: { fontSize: 17, fontWeight: '800', color: '#ADB5BD', letterSpacing: -0.5 },
    symbolTextActive: { color: '#FFFFFF' },

    // ── Label ──
    unitLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#333' },
    unitLabelActive: { color: '#222' },
    unitSymbolInline: { fontSize: 14, fontWeight: '500', color: '#ADB5BD' },

    // ── Radio ──
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CED4DA',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    radioOuterActive: { borderColor: Colors.brand },
    radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.brand },

    // ── Current setting banner ──
    previewCard: {
        backgroundColor: 'rgba(143,217,229,0.08)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(143,217,229,0.22)',
        marginTop: 4,
    },
    previewText: { fontSize: 13, color: '#6C757D', fontWeight: '500' },
    previewBold: { color: '#333', fontWeight: '700' },
});