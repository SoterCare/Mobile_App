import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { cardStore, CardVisual, SL_BANKS } from './payment';

type SuccessType = 'added' | 'updated' | 'removed';

const SCREEN_TITLES: Record<SuccessType, string> = {
    added:   'Card Added',
    updated: 'Card Updated',
    removed: 'Card Removed',
};

const CONFIG: Record<SuccessType, {
    icon: string; color: string; bgColor: string;
    title: string; body: (bankName?: string, last4?: string) => string;
}> = {
    added:   { icon: 'checkmark', color: '#91D7E4', bgColor: 'rgba(143,217,229,0.1)',
               title: 'Card Added!',
               body: (bankName, last4) => `Your ${bankName ?? 'card'} ending in ${last4 ?? '····'} has been successfully added.` },
    updated: { icon: 'checkmark', color: '#91D7E4', bgColor: 'rgba(143,217,229,0.1)',
               title: 'Card Updated!',
               body: () => 'Your card details have been updated successfully.' },
    removed: { icon: 'trash-outline', color: '#FF6B6B', bgColor: 'rgba(255,107,107,0.08)',
               title: 'Card Removed!',
               body: () => 'Your card has been permanently removed from your account.' },
};

export default function PaymentSuccessScreen() {
    const router = useRouter();
    const { type, cardId } = useLocalSearchParams<{ type: SuccessType; cardId?: string }>();

    const successType: SuccessType = (type as SuccessType) ?? 'added';
    const cfg = CONFIG[successType];
    const card = cardId ? cardStore.find(c => c.id === cardId) : undefined;
    const bank = card ? SL_BANKS[card.bank] : undefined;

    const goHome = () => {
        router.dismissAll();
        router.push('/settings/payment' as any);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Left-aligned title ── */}
            <Stack.Screen
                options={{
                    title: '',
                    headerLeft: () => (
                        <TouchableOpacity onPress={goHome} style={styles.headerBackBtn}>
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                    ),
                    headerTitle: () => (
                        <Text style={styles.headerTitle}>{SCREEN_TITLES[successType]}</Text>
                    ),
                    headerTitleAlign: 'left',
                    headerRight: () => <View />,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8F9FA' },
                }}
            />

            <View style={styles.content}>
                {/* Ring icon */}
                <View style={[styles.ringOuter, { borderColor: cfg.color + '30' }]}>
                    <View style={[styles.ring, { backgroundColor: cfg.bgColor, borderColor: cfg.color, shadowColor: cfg.color }]}>
                        <Ionicons name={cfg.icon as any} size={48} color={cfg.color} />
                    </View>
                </View>

                <Text style={styles.title}>{cfg.title}</Text>
                <Text style={styles.body}>{cfg.body(bank?.name, card?.last4)}</Text>

                {/* Card summary (not shown for removed) */}
                {successType !== 'removed' && card && bank && (
                    <View style={styles.cardSummary}>
                        <CardVisual card={card} small />
                        <View style={styles.summaryInfo}>
                            <View style={[styles.bankMiniPill, { backgroundColor: bank.bg + '14', borderColor: bank.accent + '44' }]}>
                                <View style={[styles.bankMiniDot, { backgroundColor: bank.bg }]}>
                                    <Text style={[styles.bankMiniDotText, { color: bank.accent }]}>{bank.logoMark}</Text>
                                </View>
                                <Text style={[styles.bankMiniName, { color: bank.bg }]}>{bank.shortName}</Text>
                            </View>
                            <Text style={styles.summaryLast4}>{card.brand.toUpperCase()} •••• {card.last4}</Text>
                            <Text style={styles.summaryExpiry}>Exp {card.expiry}</Text>
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
    headerBackBtn: { marginLeft: 4 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginLeft: 12 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
    ringOuter: { width: 124, height: 124, borderRadius: 62, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    ring: { width: 96, height: 96, borderRadius: 48, borderWidth: 3,
        alignItems: 'center', justifyContent: 'center',
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.22, shadowRadius: 20, elevation: 6 },
    title: { fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 10, textAlign: 'center' },
    body: { fontSize: 13, color: '#ADB5BD', textAlign: 'center', lineHeight: 20, marginBottom: 28, maxWidth: 240 },
    cardSummary: { width: '100%', backgroundColor: '#FFF', borderRadius: 18,
        borderWidth: 1, borderColor: '#F1F3F5', padding: 14,
        flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
    summaryInfo: { flex: 1 },
    bankMiniPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8,
        borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 6 },
    bankMiniDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    bankMiniDotText: { fontSize: 7, fontWeight: '900' },
    bankMiniName: { fontSize: 11, fontWeight: '800' },
    summaryLast4: { fontSize: 13, fontWeight: '700', color: '#333' },
    summaryExpiry: { fontSize: 11, color: '#ADB5BD', marginTop: 2 },
    defaultBadge: { backgroundColor: '#91D7E4', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
        alignSelf: 'flex-start', marginTop: 6 },
    defaultBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
    actions: { width: '100%', gap: 10 },
    primaryButton: { backgroundColor: '#91D7E4', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' },
    primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    secondaryButton: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' },
    secondaryButtonText: { color: '#ADB5BD', fontSize: 15, fontWeight: '600' },
});