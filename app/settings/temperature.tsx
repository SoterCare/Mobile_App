import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function TemperatureScreen() {
    const [unit, setUnit] = useState('F');
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Temperature Unit</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.toggleContainer}>
                <View style={styles.toggleBg}>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, unit === 'C' && styles.activeTab]}
                        onPress={() => setUnit('C')}
                    >
                        <Text style={[styles.toggleText, unit === 'C' && styles.activeTabText]}>Celsius (°C)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, unit === 'F' && styles.activeTab]}
                        onPress={() => setUnit('F')}
                    >
                        <Text style={[styles.toggleText, unit === 'F' && styles.activeTabText]}>Fahrenheit (°F)</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
    toggleContainer: { alignItems: 'center', marginTop: 40 },
    toggleBg: { flexDirection: 'row', backgroundColor: '#E9ECEF', borderRadius: 25, padding: 4, width: width * 0.85 },
    toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 22 },
    activeTab: { backgroundColor: '#8FD9E5' },
    toggleText: { fontSize: 15, color: '#6C757D', fontWeight: '600' },
    activeTabText: { color: '#FFF' }
});