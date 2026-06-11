import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { cardStore, CardVisual, SL_BANKS } from './payment';
import { Colors } from '@/theme/tokens';
import { BackButton } from '@/components/ui/BackButton';

export default function PaymentDetailScreen() {
    const router = useRouter();
    const { cardId } = useLocalSearchParams<{ cardId: string }>();
    const card = cardStore.find(c => c.id === cardId);

    if (!card) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{
                    title: '',
                    headerLeft: () => <BackButton />,
                    headerTitle: () => <Text style={styles.headerTitle}>Card Details</Text>,
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

    const rows = [
        { label: 'Card Number', value: `•••• •••• •••• ${card.last4}` },
        { label: 'Cardholder',  value: card.name },
        { label: 'Expiry Date', value: card.expiry },
        { label: 'Bank',        value: bank.name },
        { label: 'Network',     value: card.brand === 'visa' ? 'Visa' : 'Mastercard' },
        { label: 'Added On',    value: 'Jan 14, 2025' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Left-aligned title ── */}
            <Stack.Screen
                options={{
                    title: '',
                    headerLeft: () => <BackButton />,
                    headerTitle: () => <Text style={styles.headerTitle}>Card Details</Text>,
                    headerTitleAlign: 'left',
                    headerRight: () => (
                        <TouchableOpacity style={styles.editIconBtn}
                            onPress={() => router.push({ pathname: '/settings/payment-edit' as any, params: { cardId: card.id } })}>
                            <Ionicons name="create-outline" size={22} color={Colors.brand} />
                        </TouchableOpacity>
                    ),
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8F9FA' },
                }}
            />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.previewWrap}>
                    <CardVisual card={card} />
                </View>

                {/* Bank banner */}
                <View style={[styles.bankBanner, { backgroundColor: bank.bg + '18', borderColor: bank.accent + '55' }]}>
                    <View style={[styles.bankDot, { backgroundColor: bank.bg }]}>
                        <Text style={[styles.bankDotText, { color: bank.accent }]}>{bank.logoMark}</Text>
                    </View>
                    <Text style={[styles.bankBannerText, { color: bank.bg }]}>{bank.name}</Text>
                </View>

                {/* Info rows */}
                <View style={styles.infoCard}>
                    {rows.map((r, i) => (
                        <View key={i} style={[styles.infoRow, i < rows.length - 1 && styles.infoRowBorder]}>
                            <Text style={styles.infoLabel}>{r.label}</Text>
                            <Text style={styles.infoValue}>{r.value}</Text>
                        </View>
                    ))}
                </View>

                {card.isDefault && (
                    <View style={styles.defaultBanner}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.brand} />
                        <Text style={styles.defaultBannerText}>This is your default card</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.editButton} activeOpacity={0.85}
                    onPress={() => router.push({ pathname: '/settings/payment-edit' as any, params: { cardId: card.id } })}>
                    <Text style={styles.editButtonText}>Edit Card</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.removeButton} activeOpacity={0.85}
                    onPress={() => router.push({ pathname: '/settings/payment-delete' as any, params: { cardId: card.id } })}>
                    <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                    <Text style={styles.removeButtonText}>Remove Card</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    headerBackBtn: { marginLeft: 4, marginTop:20 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginLeft: 12, marginTop:20 },
    editIconBtn: { marginRight: 4 },
    content: { padding: 20, paddingBottom: 40 },
    previewWrap: { alignItems: 'center', marginBottom: 18, marginTop: 4 },
    bankBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14,
        borderWidth: 1, padding: 12, marginBottom: 16 },
    bankDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    bankDotText: { fontSize: 10, fontWeight: '900' },
    bankBannerText: { fontSize: 14, fontWeight: '700' },
    infoCard: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#F1F3F5', marginBottom: 14, overflow: 'hidden' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
    infoLabel: { fontSize: 12, color: '#ADB5BD', fontWeight: '600' },
    infoValue: { fontSize: 13, color: '#333', fontWeight: '700' },
    defaultBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
        backgroundColor: 'rgba(143,217,229,0.08)', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: 'rgba(143,217,229,0.2)' },
    defaultBannerText: { fontSize: 12, color: Colors.brand, fontWeight: '700' },
    editButton: { backgroundColor: Colors.brand, borderRadius: 16, height: 52,
        alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    editButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    removeButton: { borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.25)',
        backgroundColor: 'rgba(255,107,107,0.05)', flexDirection: 'row', gap: 8 },
    removeButtonText: { color: '#FF6B6B', fontSize: 15, fontWeight: '700' },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { color: '#ADB5BD', fontSize: 15 },
});