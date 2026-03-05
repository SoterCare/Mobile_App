import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export type Card = {
    id: string;
    brand: 'visa' | 'mastercard';
    last4: string;
    expiry: string;
    name: string;
    gradient: [string, string];
    isDefault: boolean;
};

// Shared card store (simple module-level state for demo; replace with context/zustand in prod)
export let cardStore: Card[] = [
    {
        id: '1',
        brand: 'visa',
        last4: '4242',
        expiry: '12/26',
        name: 'Alex Johnson',
        gradient: ['#8FD9E5', '#5BBFCE'],
        isDefault: true,
    },
    {
        id: '2',
        brand: 'mastercard',
        last4: '8888',
        expiry: '09/27',
        name: 'Alex Johnson',
        gradient: ['#B5A4F5', '#8B76E8'],
        isDefault: false,
    },
];
export const setCardStore = (cards: Card[]) => { cardStore = cards; };

// Mini credit card visual component
export const CardVisual: React.FC<{ card: Card; small?: boolean }> = ({ card, small }) => {
    const w = small ? 190 : 260;
    const h = small ? 112 : 152;
    return (
        <View style={[cvStyles.card, { width: w, height: h, borderRadius: small ? 14 : 20 }]}>
            {/* background circles */}
            <View style={[cvStyles.circle1, small && { width: 70, height: 70, top: -16, right: -16 }]} />
            <View style={[cvStyles.circle2, small && { width: 42, height: 42, top: 16, right: 12 }]} />
            {/* chip + wifi row */}
            <View style={cvStyles.topRow}>
                <View style={cvStyles.chip}><Text style={cvStyles.chipText}>CHIP</Text></View>
            </View>
            {/* number */}
            <Text style={[cvStyles.number, small && { fontSize: 10, letterSpacing: 2, marginBottom: 8 }]}>
                •••• •••• •••• {card.last4}
            </Text>
            {/* bottom row */}
            <View style={cvStyles.bottomRow}>
                <View>
                    <Text style={cvStyles.miniLabel}>CARD HOLDER</Text>
                    <Text style={[cvStyles.cardText, small && { fontSize: 9 }]}>{card.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={cvStyles.miniLabel}>EXPIRES</Text>
                    <Text style={[cvStyles.cardText, small && { fontSize: 9 }]}>{card.expiry}</Text>
                </View>
            </View>
            {/* brand */}
            <Text style={[cvStyles.brand, small && { fontSize: 13, bottom: 8, right: 12 }]}>
                {card.brand === 'visa' ? 'VISA' : 'MC'}
            </Text>
        </View>
    );
};

const cvStyles = StyleSheet.create({
    card: {
        overflow: 'hidden',
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 8,
        backgroundColor: '#8FD9E5', // fallback; set via style prop
    },
    circle1: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', top: -20, right: -20 },
    circle2: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.07)', top: 18, right: 14 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    chip: { width: 30, height: 22, borderRadius: 3, backgroundColor: 'rgba(255,215,0,0.7)', alignItems: 'center', justifyContent: 'center' },
    chipText: { fontSize: 6, color: 'rgba(0,0,0,0.5)', fontWeight: '700' },
    number: { fontSize: 13, letterSpacing: 3, color: '#fff', fontWeight: '600', marginBottom: 12, opacity: 0.92 },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    miniLabel: { fontSize: 7, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
    cardText: { fontSize: 11, color: '#fff', fontWeight: '700', letterSpacing: 0.4 },
    brand: { position: 'absolute', bottom: 14, right: 18, fontSize: 17, fontWeight: '900', color: 'rgba(255,255,255,0.92)', fontStyle: 'italic' },
});

export default function PaymentMethodScreen() {
    const router = useRouter();
    const [cards, setCards] = useState<Card[]>(cardStore);

    // Refresh on focus (simple approach)
    const refreshCards = () => setCards([...cardStore]);

    const handleCardPress = (card: Card) => {
        router.push({ pathname: '/settings/payment-detail' as any, params: { cardId: card.id } });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Method</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {cards.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="card-outline" size={48} color="#ADB5BD" />
                        <Text style={styles.emptyText}>No cards added yet</Text>
                    </View>
                )}

                {cards.map((card) => (
                    <TouchableOpacity
                        key={card.id}
                        style={[styles.cardRow, card.isDefault && styles.cardRowDefault]}
                        onPress={() => handleCardPress(card)}
                        activeOpacity={0.8}
                    >
                        <CardVisual card={card} small />
                        <View style={styles.cardMeta}>
                            <View style={styles.cardMetaTop}>
                                <Text style={styles.cardBrand}>{card.brand.toUpperCase()}</Text>
                                {card.isDefault && (
                                    <View style={styles.defaultBadge}>
                                        <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.cardLast4}>•••• {card.last4}</Text>
                            <Text style={styles.cardExpiry}>Exp {card.expiry}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                    </TouchableOpacity>
                ))}

                {/* Add Button */}
                <TouchableOpacity
                    style={styles.addButton}
                    activeOpacity={0.85}
                    onPress={() => router.push('/settings/payment-add' as any)}
                >
                    <Ionicons name="add" size={22} color="#FFF" />
                    <Text style={styles.addButtonText}>Add New Method</Text>
                </TouchableOpacity>

                {/* Security note */}
                <View style={styles.secureRow}>
                    <Ionicons name="shield-checkmark-outline" size={14} color="#51CF66" />
                    <Text style={styles.secureText}>256-bit encrypted &amp; secure</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
    headerBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    content: { padding: 20, paddingBottom: 40 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { marginTop: 12, fontSize: 14, color: '#ADB5BD', fontWeight: '600' },
    cardRow: {
        backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginBottom: 12,
        borderWidth: 1.5, borderColor: '#F1F3F5',
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    cardRowDefault: { borderColor: '#8FD9E5', shadowColor: '#8FD9E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    cardMeta: { flex: 1 },
    cardMetaTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    cardBrand: { fontSize: 12, fontWeight: '700', color: '#333' },
    defaultBadge: { backgroundColor: '#8FD9E5', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
    defaultBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
    cardLast4: { fontSize: 12, color: '#ADB5BD' },
    cardExpiry: { fontSize: 11, color: '#ADB5BD', marginTop: 2 },
    addButton: {
        backgroundColor: '#8FD9E5', flexDirection: 'row', padding: 16, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4,
    },
    addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 16 },
    secureText: { fontSize: 11, color: '#51CF66', fontWeight: '600' },
});
