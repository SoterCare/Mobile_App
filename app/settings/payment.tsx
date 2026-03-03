import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PaymentMethodScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Method</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Ionicons name="card" size={32} color="#8FD9E5" />
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardLabel}>Visa ending in 4242</Text>
                            <Text style={styles.expiry}>Expires 12/26</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={24} color="#8FD9E5" />
                    </View>
                </View>

                <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
                    <Ionicons name="add" size={24} color="#FFF" />
                    <Text style={styles.addButtonText}>Add New Method</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
    content: { padding: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F1F3F5', marginBottom: 20 },
    row: { flexDirection: 'row', alignItems: 'center' },
    cardInfo: { flex: 1, marginLeft: 15 },
    cardLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
    expiry: { fontSize: 14, color: '#ADB5BD', marginTop: 2 },
    addButton: { backgroundColor: '#8FD9E5', flexDirection: 'row', padding: 18, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    addButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700', marginLeft: 8 }
});