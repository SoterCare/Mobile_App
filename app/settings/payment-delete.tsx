import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { cardStore, setCardStore, CardVisual, SL_BANKS } from './payment';

export default function PaymentDeleteScreen() {
    const router = useRouter();
    const { cardId } = useLocalSearchParams<{ cardId: string }>();
    const card = cardStore.find(c => c.id === cardId);

    if (!card) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{
                    title: '',
                    headerLeft: () => <BackButton />,
                    headerTitle: () => <Text style={styles.headerTitle}>Remove Card</Text>,
                    headerTitleAlign: 'left',
                    headerRight: () => <View />,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8F9FA' },
                }} />
                <View style={styles.notFound}><Text style={styles.notFoundText}>Card not found.</Text></View>
            </SafeAreaView>
        );
    }

    const bank = SL_BANKS[card.bank];

    const handleDelete = () => {
        const remaining = cardStore.filter(c => c.id !== card.id);
        if (card.isDefault && remaining.length > 0) {
            remaining[0] = { ...remaining[0], isDefault: true };
        }
        setCardStore(remaining);
        router.push({ pathname: '/settings/payment-success' as any, params: { type: 'removed' } });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Left-aligned title ── */}
            <Stack.Screen
                options={{
                    title: '',
                    headerLeft: () => <BackButton />,
                    headerTitle: () => <Text style={styles.headerTitle}>Remove Card</Text>,
                    headerTitleAlign: 'left',
                    headerRight: () => <View />,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8F9FA' },
                }}
            />

            <View style={styles.content}>
                <View style={styles.previewWrap}>
                    <View>
                        <CardVisual card={card} />
                        <View style={styles.dangerOverlay} />
                    </View>
                </View>

                <View style={styles.warningBox}>
                    <View style={styles.warningIconWrap}>
                        <Ionicons name="warning-outline" size={26} color="#FF6B6B" />
                    </View>
                    <Text style={styles.warningTitle}>Remove this card?</Text>

                    <View style={[styles.bankPill, { backgroundColor: bank.bg + '18', borderColor: bank.accent + '55' }]}>
                        <View style={[styles.bankDot, { backgroundColor: bank.bg }]}>
                            <Text style={[styles.bankDotText, { color: bank.accent }]}>{bank.logoMark}</Text>
                        </View>
                        <Text style={[styles.bankPillText, { color: bank.bg }]}>
                            {bank.name} · {card.brand === 'visa' ? 'Visa' : 'Mastercard'} •••• {card.last4}
                        </Text>
                    </View>

                    <Text style={styles.warningBody}>
                        This card will be permanently removed from your account. Any scheduled payments may be affected.
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
    headerBackBtn: { marginLeft: 4, marginTop: 20 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginLeft: 12, marginTop: 20 },
    content: { flex: 1, padding: 20 },
    previewWrap: { alignItems: 'center', marginBottom: 24, marginTop: 4 },
    dangerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 20, backgroundColor: 'rgba(255,107,107,0.13)',
        borderWidth: 2, borderColor: 'rgba(255,107,107,0.45)' },
    warningBox: { backgroundColor: 'rgba(255,107,107,0.05)', borderRadius: 18,
        borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.2)', padding: 20, alignItems: 'center', marginBottom: 24 },
    warningIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,107,107,0.1)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    warningTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 12 },
    bankPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12,
        borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
    bankDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    bankDotText: { fontSize: 8, fontWeight: '900' },
    bankPillText: { fontSize: 12, fontWeight: '700' },
    warningBody: { fontSize: 12, color: '#ADB5BD', textAlign: 'center', lineHeight: 20 },
    actions: { gap: 12 },
    deleteButton: { backgroundColor: '#FF6B6B', borderRadius: 16, height: 52,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    deleteButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    cancelButton: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 16, height: 52,
        alignItems: 'center', justifyContent: 'center' },
    cancelButtonText: { color: '#ADB5BD', fontSize: 15, fontWeight: '600' },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { color: '#ADB5BD', fontSize: 15 },
});