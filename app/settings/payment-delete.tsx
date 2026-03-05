import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { cardStore, setCardStore, CardVisual } from './payment';

export default function PaymentDeleteScreen() {
    const router = useRouter();
    const { cardId } = useLocalSearchParams<{ cardId: string }>();
    const card = cardStore.find(c => c.id === cardId);

    if (!card) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Remove Card</Text>
                    <View style={{ width: 34 }} />
                </View>
                <View style={styles.notFound}><Text style={styles.notFoundText}>Card not found.</Text></View>
            </SafeAreaView>
        );
    }

    const handleDelete = () => {
        const remaining = cardStore.filter(c => c.id !== card.id);
        // If deleted card was default, assign default to first remaining card
        if (card.isDefault && remaining.length > 0) {
            remaining[0] = { ...remaining[0], isDefault: true };
        }
        setCardStore(remaining);
        router.push({ pathname: '/settings/payment-success' as any, params: { type: 'removed' } });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Remove Card</Text>
                <View style={{ width: 34 }} />
            </View>

            <View style={styles.content}>
                {/* Card with danger overlay */}
                <View style={styles.previewWrap}>
                    <View style={{ position: 'relative' }}>
                        <View style={[styles.cardBg, { backgroundColor: card.gradient[0] }]}>
                            <CardVisual card={card} />
                        </View>
                        {/* Red overlay */}
                        <View style={styles.dangerOverlay} />
                    </View>
                </View>

                {/* Warning box */}
                <View style={styles.warningBox}>
                    <View style={styles.warningIcon}>
                        <Ionicons name="warning-outline" size={26} color="#FF6B6B" />
                    </View>
                    <Text style={styles.warningTitle}>Remove this card?</Text>
                    <Text style={styles.warningBody}>
                        <Text style={{ fontWeight: '700' }}>
                            {card.brand === 'visa' ? 'Visa' : 'Mastercard'}
                        </Text>
                        {' '}ending in{' '}
                        <Text style={{ fontWeight: '700' }}>{card.last4}</Text>
                        {' '}will be permanently removed from your account. Any scheduled payments may be affected.
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.85}>
                        <Ionicons name="trash-outline" size={18} color="#FFF" />
                        <Text style={styles.deleteButtonText}>Yes, Remove Card</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.7}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
    headerBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    content: { flex: 1, padding: 20 },
    previewWrap: { alignItems: 'center', marginBottom: 24, marginTop: 4 },
    cardBg: { borderRadius: 20 },
    dangerOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 20, backgroundColor: 'rgba(255,107,107,0.13)',
        borderWidth: 2, borderColor: 'rgba(255,107,107,0.45)',
    },
    warningBox: {
        backgroundColor: 'rgba(255,107,107,0.05)', borderRadius: 18,
        borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.2)',
        padding: 22, alignItems: 'center', marginBottom: 28,
    },
    warningIcon: {
        width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,107,107,0.1)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    warningTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 10 },
    warningBody: { fontSize: 13, color: '#ADB5BD', textAlign: 'center', lineHeight: 20 },
    actions: { gap: 12 },
    deleteButton: {
        backgroundColor: '#FF6B6B', borderRadius: 16, height: 52,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    deleteButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    cancelButton: {
        backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 16, height: 52,
        alignItems: 'center', justifyContent: 'center',
    },
    cancelButtonText: { color: '#ADB5BD', fontSize: 15, fontWeight: '600' },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { color: '#ADB5BD', fontSize: 15 },
});