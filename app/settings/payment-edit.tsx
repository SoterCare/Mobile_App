import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
    ScrollView, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { cardStore, setCardStore, CardVisual, Card } from './payment';

const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length >= 3) return d.slice(0, 2) + '/' + d.slice(2, 4);
    return d;
};

export default function PaymentEditScreen() {
    const router = useRouter();
    const { cardId } = useLocalSearchParams<{ cardId: string }>();
    const card = cardStore.find(c => c.id === cardId);

    const [editName, setEditName] = useState(card?.name ?? '');
    const [editExpiry, setEditExpiry] = useState(card?.expiry ?? '');
    const [setAsDefault, setSetAsDefault] = useState(card?.isDefault ?? false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!card) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Card</Text>
                    <View style={{ width: 34 }} />
                </View>
                <View style={styles.notFound}><Text style={styles.notFoundText}>Card not found.</Text></View>
            </SafeAreaView>
        );
    }

    const previewCard: Card = { ...card, name: editName || card.name, expiry: editExpiry || card.expiry };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!editName.trim()) e.editName = 'Name is required';
        if (editExpiry.length < 5) e.editExpiry = 'Enter valid expiry MM/YY';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        const updated = cardStore.map(c => {
            if (c.id === card.id) return { ...c, name: editName, expiry: editExpiry, isDefault: setAsDefault };
            if (setAsDefault) return { ...c, isDefault: false };
            return c;
        });
        setCardStore(updated);
        router.push({ pathname: '/settings/payment-success' as any, params: { type: 'updated', cardId: card.id } });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Card</Text>
                    <View style={{ width: 34 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Live card preview */}
                    <View style={styles.previewWrap}>
                        <View style={[styles.cardBg, { backgroundColor: previewCard.gradient[0] }]}>
                            <CardVisual card={previewCard} />
                        </View>
                    </View>

                    {/* Info banner */}
                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle-outline" size={14} color="#8FD9E5" />
                        <Text style={styles.infoBannerText}>Card number cannot be changed for security reasons</Text>
                    </View>

                    {/* Name */}
                    <View style={styles.fieldWrap}>
                        <Text style={styles.fieldLabel}>Cardholder Name</Text>
                        <View style={[styles.inputBox, errors.editName ? styles.inputError : null]}>
                            <TextInput
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Alex Johnson"
                                placeholderTextColor="#ADB5BD"
                                autoCapitalize="words"
                                style={styles.input}
                            />
                        </View>
                        {errors.editName ? <Text style={styles.errorText}>{errors.editName}</Text> : null}
                    </View>

                    {/* Expiry */}
                    <View style={styles.fieldWrap}>
                        <Text style={styles.fieldLabel}>Expiry Date</Text>
                        <View style={[styles.inputBox, errors.editExpiry ? styles.inputError : null]}>
                            <TextInput
                                value={editExpiry}
                                onChangeText={(v) => setEditExpiry(formatExpiry(v))}
                                placeholder="MM/YY"
                                placeholderTextColor="#ADB5BD"
                                keyboardType="numeric"
                                maxLength={5}
                                style={[styles.input, { letterSpacing: 1, fontWeight: '600' }]}
                            />
                        </View>
                        {errors.editExpiry ? <Text style={styles.errorText}>{errors.editExpiry}</Text> : null}
                    </View>

                    {/* Set as default toggle */}
                    <TouchableOpacity
                        style={[styles.defaultToggle, setAsDefault && styles.defaultToggleActive]}
                        onPress={() => setSetAsDefault(s => !s)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.checkbox, setAsDefault && styles.checkboxActive]}>
                            {setAsDefault && <Ionicons name="checkmark" size={13} color="#fff" />}
                        </View>
                        <Text style={styles.defaultToggleText}>Set as default payment method</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
    headerBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    content: { padding: 20, paddingBottom: 40 },
    previewWrap: { alignItems: 'center', marginBottom: 20, marginTop: 4 },
    cardBg: { borderRadius: 20 },
    infoBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
        backgroundColor: 'rgba(143,217,229,0.06)', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: 'rgba(143,217,229,0.18)',
    },
    infoBannerText: { fontSize: 11, color: '#8FD9E5', fontWeight: '600', flex: 1 },
    fieldWrap: { marginBottom: 14 },
    fieldLabel: { fontSize: 10, fontWeight: '700', color: '#ADB5BD', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
    inputBox: { backgroundColor: '#FFF', borderRadius: 13, borderWidth: 1.5, borderColor: '#F1F3F5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 48 },
    inputError: { borderColor: '#FF6B6B' },
    input: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
    errorText: { fontSize: 10, color: '#FF6B6B', marginTop: 4, fontWeight: '600' },
    defaultToggle: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
        padding: 14, borderRadius: 13, borderWidth: 1.5, borderColor: '#F1F3F5',
        backgroundColor: '#FFF',
    },
    defaultToggleActive: { borderColor: '#8FD9E5', backgroundColor: 'rgba(143,217,229,0.05)' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#F1F3F5', alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: '#8FD9E5', borderColor: '#8FD9E5' },
    defaultToggleText: { fontSize: 13, color: '#333', fontWeight: '600', flex: 1 },
    saveButton: { backgroundColor: '#8FD9E5', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' },
    saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { color: '#ADB5BD', fontSize: 15 },
});