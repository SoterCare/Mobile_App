import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { cardStore, CardVisual } from './payment';

type SuccessType = 'added' | 'updated' | 'removed';

const CONFIG: Record<SuccessType, { icon: string; color: string; bgColor: string; ringColor: string; title: string; body: (last4?: string) => string }> = {
    added: {
        icon: 'checkmark',
        color: '#8FD9E5',
        bgColor: 'rgba(143,217,229,0.1)',
        ringColor: '#8FD9E5',
        title: 'Card Added!',
        body: (last4) => `Your card ending in ${last4 ?? '····'} has been successfully added to your account.`,
    },
    updated: {
        icon: 'checkmark',
        color: '#8FD9E5',
        bgColor: 'rgba(143,217,229,0.1)',
        ringColor: '#8FD9E5',
        title: 'Card Updated!',
        body: () => 'Your card details have been updated successfully.',
    },
    removed: {
        icon: 'trash-outline',
        color: '#FF6B6B',
        bgColor: 'rgba(255,107,107,0.08)',
        ringColor: '#FF6B6B',
        title: 'Card Removed!',
        body: () => 'Your card has been permanently removed from your account.',
    },
};

export default function PaymentSuccessScreen() {
    const router = useRouter();
    const { type, cardId } = useLocalSearchParams<{ type: SuccessType; cardId?: string }>();

    const successType: SuccessType = (type as SuccessType) ?? 'added';
    const cfg = CONFIG[successType];
    const card = cardId ? cardStore.find(c => c.id === cardId) : undefined;

    const goHome = () => {
        // Pop back to payment list, clearing the stack
        router.dismissAll();
        router.push('/settings/payment' as any);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Minimal header — just a back chevron */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goHome} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={{ width: 34 }} />
            </View>

            <View style={styles.content}>
                {/* Icon ring */}
                <View style={[styles.ring, { backgroundColor: cfg.bgColor, borderColor: cfg.ringColor, shadowColor: cfg.ringColor }]}>
                    <View style={[styles.ringOuter, { borderColor: cfg.ringColor, opacity: 0.2 }]} />
                    <Ionicons name={cfg.icon as any} size={48} color={cfg.color} />
                </View>

                <Text style={styles.title}>{cfg.title}</Text>
                <Text style={styles.body}>{cfg.body(card?.last4)}</Text>

                {/* Card summary (not shown for removed) */}
                {successType !== 'removed' && card && (
                    <View style={styles.cardSummary}>
                        <View style={[styles.cardBg, { backgroundColor: card.gradient[0] }]}>
                            <CardVisual card={card} small />
                        </View>
                        <View style={styles.cardSummaryInfo}>
                            <Text style={styles.cardSummaryBrand}>{card.brand.toUpperCase()} •••• {card.last4}</Text>
                            <Text style={styles.cardSummaryExpiry}>Exp {card.expiry}</Text>
                            {card.isDefault && (
                                <View style={styles.defaultBadge}>
                                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.primaryButton} onPress={goHome} activeOpacity={0.85}>
                        <Text style={styles.primaryButtonText}>
                            {successType === 'removed' ? 'Add New Card' : 'Done'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={goHome} activeOpacity={0.7}>
                        <Text style={styles.secondaryButtonText}>View All Cards</Text>
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
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
    ring: {
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 3, alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, position: 'relative',
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 6,
    },
    ringOuter: {
        position: 'absolute', width: 124, height: 124, borderRadius: 62,
        borderWidth: 2, top: -14, left: -14,
    },
    title: { fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 10, textAlign: 'center' },
    body: { fontSize: 13, color: '#ADB5BD', textAlign: 'center', lineHeight: 20, marginBottom: 28, maxWidth: 240 },
    cardSummary: {
        width: '100%', backgroundColor: '#FFF', borderRadius: 18,
        borderWidth: 1, borderColor: '#F1F3F5', padding: 14,
        flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28,
    },
    cardBg: { borderRadius: 14 },
    cardSummaryInfo: { flex: 1 },
    cardSummaryBrand: { fontSize: 13, fontWeight: '700', color: '#333', textTransform: 'capitalize' },
    cardSummaryExpiry: { fontSize: 11, color: '#ADB5BD', marginTop: 2 },
    defaultBadge: { backgroundColor: '#8FD9E5', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 6 },
    defaultBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
    actions: { width: '100%', gap: 10 },
    primaryButton: { backgroundColor: '#8FD9E5', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' },
    primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    secondaryButton: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' },
    secondaryButtonText: { color: '#ADB5BD', fontSize: 15, fontWeight: '600' },
});