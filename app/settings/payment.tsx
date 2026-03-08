import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

// ─── Sri Lankan Bank Definitions ──────────────────────────────────────────
export type SLBank = 'sampath' | 'commercial' | 'hnb' | 'boc' | 'ndb' | 'seylan';

export const SL_BANKS: Record<SLBank, {
    name: string;
    shortName: string;
    bg: string;
    bgDeep: string;
    accent: string;
    logoMark: string;
}> = {
    sampath:    { name: 'Sampath Bank',        shortName: 'SAMPATH',  bg: '#1A3A6B', bgDeep: '#0D2247', accent: '#E8A020', logoMark: 'S'  },
    commercial: { name: 'Commercial Bank',      shortName: 'COM.BANK', bg: '#B71C1C', bgDeep: '#7B0000', accent: '#FFD600', logoMark: 'CB' },
    hnb:        { name: 'Hatton National Bank', shortName: 'HNB',      bg: '#1B5E20', bgDeep: '#0A3D0A', accent: '#FFC107', logoMark: 'H'  },
    boc:        { name: 'Bank of Ceylon',       shortName: 'BOC',      bg: '#1565C0', bgDeep: '#0D3B8C', accent: '#FF6F00', logoMark: 'B'  },
    ndb:        { name: 'NDB Bank',             shortName: 'NDB',      bg: '#4A0080', bgDeep: '#2D0050', accent: '#CE93D8', logoMark: 'N'  },
    seylan:     { name: 'Seylan Bank',          shortName: 'SEYLAN',   bg: '#00695C', bgDeep: '#004D40', accent: '#80CBC4', logoMark: 'SB' },
};

// ─── Card Type ────────────────────────────────────────────────────────────
export type Card = {
    id: string;
    brand: 'visa' | 'mastercard';
    bank: SLBank;
    last4: string;
    expiry: string;
    name: string;
    isDefault: boolean;
};

// ─── Card Store ───────────────────────────────────────────────────────────
export let cardStore: Card[] = [
    { id: '1', brand: 'visa',       bank: 'sampath',    last4: '4242', expiry: '12/26', name: 'Alex Johnson', isDefault: true  },
    { id: '2', brand: 'mastercard', bank: 'commercial', last4: '8888', expiry: '09/27', name: 'Alex Johnson', isDefault: false },
];
export const setCardStore = (cards: Card[]) => { cardStore = cards; };

// ─── Sri Lankan Bank Card Visual ──────────────────────────────────────────
export const CardVisual: React.FC<{ card: Card; small?: boolean }> = ({ card, small }) => {
    const b = SL_BANKS[card.bank];
    const w = small ? 188 : 258;
    const h = small ? 114 : 154;
    const p = small ? 11 : 17;

    return (
        <View style={{ width: w, height: h, borderRadius: small ? 14 : 20, overflow: 'hidden', padding: p,
            backgroundColor: b.bg, shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.22, shadowRadius: 16, elevation: 8 }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: b.bgDeep, opacity: 0.45 }} />
            <View style={{ position: 'absolute', width: w * 0.85, height: w * 0.85, borderRadius: w * 0.43,
                backgroundColor: 'rgba(255,255,255,0.045)', top: -(w * 0.44), right: -(w * 0.20) }} />
            <View style={{ position: 'absolute', width: w * 0.5, height: w * 0.5, borderRadius: w * 0.25,
                backgroundColor: 'rgba(255,255,255,0.05)', top: -(w * 0.10), right: -(w * 0.04) }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: small ? 4 : 6,
                backgroundColor: b.accent, opacity: 0.9 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: small ? 5 : 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8,
                    paddingHorizontal: small ? 6 : 8, paddingVertical: small ? 3 : 4 }}>
                    <View style={{ width: small ? 15 : 20, height: small ? 15 : 20, borderRadius: small ? 8 : 10,
                        backgroundColor: b.accent, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: small ? 6 : 8, fontWeight: '900', color: b.bg }}>{b.logoMark}</Text>
                    </View>
                    <Text style={{ fontSize: small ? 7 : 9, color: '#fff', fontWeight: '800', letterSpacing: 0.4 }}>{b.shortName}</Text>
                </View>
                <View style={{ width: small ? 22 : 30, height: small ? 16 : 22, borderRadius: 4,
                    backgroundColor: 'rgba(255,213,0,0.78)', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <View style={{ width: '62%', height: 1, backgroundColor: 'rgba(140,100,0,0.7)' }} />
                    <View style={{ width: '62%', height: 1, backgroundColor: 'rgba(140,100,0,0.7)' }} />
                </View>
            </View>
            <Text style={{ fontSize: small ? 10 : 13, letterSpacing: small ? 2 : 3,
                color: '#fff', fontWeight: '600', marginBottom: small ? 5 : 9, opacity: 0.93 }}>
                •••• •••• •••• {card.last4}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View style={{ flex: 1, flexDirection: 'row', gap: small ? 10 : 16, alignItems: 'flex-end' }}>
                    <View>
                        <Text style={{ fontSize: small ? 6 : 7, color: 'rgba(255,255,255,0.55)', marginBottom: 1 }}>CARD HOLDER</Text>
                        <Text style={{ fontSize: small ? 8 : 10, color: '#fff', fontWeight: '700', letterSpacing: 0.3 }} numberOfLines={1}>{card.name}</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: small ? 6 : 7, color: 'rgba(255,255,255,0.55)', marginBottom: 1 }}>EXPIRES</Text>
                        <Text style={{ fontSize: small ? 8 : 10, color: '#fff', fontWeight: '700' }}>{card.expiry}</Text>
                    </View>
                </View>
                {card.brand === 'visa' ? (
                    <Text style={{ fontSize: small ? 13 : 18, fontWeight: '900', color: 'rgba(255,255,255,0.95)', fontStyle: 'italic', letterSpacing: -0.5 }}>VISA</Text>
                ) : (
                    <View style={{ width: small ? 30 : 40, height: small ? 18 : 24 }}>
                        <View style={{ position: 'absolute', left: 0, width: small ? 18 : 24, height: small ? 18 : 24, borderRadius: small ? 9 : 12, backgroundColor: 'rgba(235,0,27,0.88)' }} />
                        <View style={{ position: 'absolute', right: 0, width: small ? 18 : 24, height: small ? 18 : 24, borderRadius: small ? 9 : 12, backgroundColor: 'rgba(255,163,0,0.82)' }} />
                    </View>
                )}
            </View>
        </View>
    );
};

// ─── Payment Method List Screen ───────────────────────────────────────────
export default function PaymentMethodScreen() {
    const router = useRouter();
    const [cards, setCards] = useState<Card[]>(cardStore);

    const handleCardPress = (card: Card) => {
        router.push({ pathname: '/settings/payment-detail' as any, params: { cardId: card.id } });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Replace route path with proper left-aligned title ── */}
            <Stack.Screen
                options={{
                    title: '',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                    ),
                    headerTitle: () => (
                        <Text style={styles.headerTitle}>Payment Method</Text>
                    ),
                    headerTitleAlign: 'left',
                    headerRight: () => <View />,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8F9FA' },
                }}
            />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {cards.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="card-outline" size={48} color="#ADB5BD" />
                        <Text style={styles.emptyText}>No cards added yet</Text>
                    </View>
                )}

                {cards.map((card) => {
                    const b = SL_BANKS[card.bank];
                    return (
                        <TouchableOpacity key={card.id}
                            style={[styles.cardRow, card.isDefault && styles.cardRowDefault]}
                            onPress={() => handleCardPress(card)} activeOpacity={0.8}>
                            <CardVisual card={card} small />
                            <View style={styles.cardMeta}>
                                <View style={styles.cardMetaTop}>
                                    <Text style={styles.cardBankName}>{b.shortName}</Text>
                                    {card.isDefault && (
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.cardNetwork}>{card.brand.toUpperCase()}</Text>
                                <Text style={styles.cardLast4}>•••• {card.last4}</Text>
                                <Text style={styles.cardExpiry}>Exp {card.expiry}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                        </TouchableOpacity>
                    );
                })}

                <TouchableOpacity style={styles.addButton} activeOpacity={0.85}
                    onPress={() => router.push('/settings/payment-add' as any)}>
                    <Ionicons name="add" size={22} color="#FFF" />
                    <Text style={styles.addButtonText}>Add New Method</Text>
                </TouchableOpacity>

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
    headerBackBtn: { marginLeft: 4 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginLeft: 12 },
    content: { padding: 20, paddingBottom: 40 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { marginTop: 12, fontSize: 14, color: '#ADB5BD', fontWeight: '600' },
    cardRow: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginBottom: 12,
        borderWidth: 1.5, borderColor: '#F1F3F5', flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardRowDefault: { borderColor: '#8FD9E5', shadowColor: '#8FD9E5',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    cardMeta: { flex: 1 },
    cardMetaTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    cardBankName: { fontSize: 12, fontWeight: '800', color: '#333' },
    cardNetwork: { fontSize: 10, color: '#ADB5BD', fontWeight: '600', marginBottom: 2 },
    defaultBadge: { backgroundColor: '#8FD9E5', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
    defaultBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
    cardLast4: { fontSize: 12, color: '#ADB5BD' },
    cardExpiry: { fontSize: 11, color: '#ADB5BD', marginTop: 2 },
    addButton: { backgroundColor: '#8FD9E5', flexDirection: 'row', padding: 16, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 },
    addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 16 },
    secureText: { fontSize: 11, color: '#51CF66', fontWeight: '600' },
});