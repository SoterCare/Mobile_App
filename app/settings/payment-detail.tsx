import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { cardStore, CardVisual, Card } from './payment';

export default function PaymentDetailScreen() {
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
                    <Text style={styles.headerTitle}>Card Details</Text>
                    <View style={{ width: 34 }} />
                </View>
                <View style={styles.notFound}>
                    <Text style={styles.notFoundText}>Card not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const rows = [
        { label: 'Card Number', value: `•••• •••• •••• ${card.last4}` },
        { label: 'Cardholder', value: card.name },
        { label: 'Expiry Date', value: card.expiry },
        { label: 'Card Type', value: card.brand === 'visa' ? 'Visa Debit' : 'Mastercard' },
        { label: 'Added On', value: 'Jan 14, 2025' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Card Details</Text>
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => router.push({ pathname: '/settings/payment-edit' as any, params: { cardId: card.id } })}
                >
                    <Ionicons name="create-outline" size={22} color="#8FD9E5" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Card preview */}
                <View style={styles.previewWrap}>
                    <View style={[styles.cardBg, { backgroundColor: card.gradient[0] }]}>
                        <CardVisual card={card} />
                    </View>
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

                {/* Default badge */}
                {card.isDefault && (
                    <View style={styles.defaultBanner}>
                        <Ionicons name="checkmark-circle" size={16} color="#8FD9E5" />
                        <Text style={styles.defaultBannerText}>This is your default card</Text>
                    </View>
                )}

                {/* Actions */}
                <TouchableOpacity
                    style={styles.editButton}
                    activeOpacity={0.85}
                    onPress={() => router.push({ pathname: '/settings/payment-edit' as any, params: { cardId: card.id } })}
                >
                    <Text style={styles.editButtonText}>Edit Card</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.removeButton}
                    activeOpacity={0.85}
                    onPress={() => router.push({ pathname: '/settings/payment-delete' as any, params: { cardId: card.id } })}
                >
                    <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                    <Text style={styles.removeButtonText}>Remove Card</Text>
                </TouchableOpacity>
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
    previewWrap: { alignItems: 'center', marginBottom: 24, marginTop: 4 },
    cardBg: { borderRadius: 20 },
    infoCard: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#F1F3F5', marginBottom: 14, overflow: 'hidden' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
    infoLabel: { fontSize: 12, color: '#ADB5BD', fontWeight: '600' },
    infoValue: { fontSize: 13, color: '#333', fontWeight: '700' },
    defaultBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
        backgroundColor: 'rgba(143,217,229,0.08)', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: 'rgba(143,217,229,0.2)',
    },
    defaultBannerText: { fontSize: 12, color: '#8FD9E5', fontWeight: '700' },
    editButton: {
        backgroundColor: '#8FD9E5', borderRadius: 16, height: 52,
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    editButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    removeButton: {
        borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.25)',
        backgroundColor: 'rgba(255,107,107,0.05)', flexDirection: 'row', gap: 8,
    },
    removeButtonText: { color: '#FF6B6B', fontSize: 15, fontWeight: '700' },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { color: '#ADB5BD', fontSize: 15 },
});