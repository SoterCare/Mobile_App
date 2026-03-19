import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
    ScrollView, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { cardStore, setCardStore, CardVisual, Card, SL_BANKS } from './payment';

const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length >= 3) return d.slice(0, 2) + '/' + d.slice(2, 4);
    return d;
};

export default function PaymentEditScreen() {
    const router = useRouter();
    const { cardId } = useLocalSearchParams<{ cardId: string }>();
    const card = cardStore.find(c => c.id === cardId);

    const [editName, setEditName]           = useState(card?.name ?? '');
    const [editExpiry, setEditExpiry]       = useState(card?.expiry ?? '');
    const [setAsDefault, setSetAsDefault]   = useState(card?.isDefault ?? false);
    const [errors, setErrors]               = useState<Record<string, string>>({});

    if (!card) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{
                    title: '',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                    ),
                    headerTitle: () => <Text style={styles.headerTitle}>Edit Card</Text>,
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
            {/* ── Left-aligned title ── */}
            <Stack.Screen
                options={{
                    title: '',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                    ),
                    headerTitle: () => <Text style={styles.headerTitle}>Edit Card</Text>,
                    headerTitleAlign: 'left',
                    headerRight: () => <View />,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8F9FA' },
                }}
            />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.previewWrap}>
                        <CardVisual card={previewCard} />
                    </View>

                    <View style={[styles.infoBanner, { backgroundColor: bank.bg + '14', borderColor: bank.accent + '44' }]}>
                        <View style={[styles.bankDot, { backgroundColor: bank.bg }]}>
                            <Text style={[styles.bankDotText, { color: bank.accent }]}>{bank.logoMark}</Text>
                        </View>
                        <View>
                            <Text style={[styles.infoBankName, { color: bank.bg }]}>{bank.name}</Text>
                            <Text style={styles.infoNote}>Card number cannot be changed for security reasons</Text>
                        </View>
                    </View>

                    {/* Name */}
                    <View style={styles.fieldWrap}>
                        <Text style={styles.fieldLabel}>Cardholder Name</Text>
                        <View style={[styles.inputBox, errors.editName ? styles.inputError : null]}>
                            <TextInput value={editName} onChangeText={setEditName}
                                placeholder="Alex Johnson" placeholderTextColor="#ADB5BD"
                                autoCapitalize="words" style={styles.input} />
                        </View>
                        {errors.editName ? <Text style={styles.errorText}>{errors.editName}</Text> : null}
                    </View>

                    {/* Expiry */}
                    <View style={styles.fieldWrap}>
                        <Text style={styles.fieldLabel}>Expiry Date</Text>
                        <View style={[styles.inputBox, errors.editExpiry ? styles.inputError : null]}>
                            <TextInput value={editExpiry} onChangeText={v => setEditExpiry(formatExpiry(v))}
                                placeholder="MM/YY" placeholderTextColor="#ADB5BD"
                                keyboardType="numeric" maxLength={5}
                                style={[styles.input, { letterSpacing: 1, fontWeight: '600' }]} />
                        </View>
                        {errors.editExpiry ? <Text style={styles.errorText}>{errors.editExpiry}</Text> : null}
                    </View>

                    {/* Default toggle */}
                    <TouchableOpacity
                        style={[styles.defaultToggle, setAsDefault && styles.defaultToggleActive]}
                        onPress={() => setSetAsDefault(s => !s)} activeOpacity={0.8}>
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
    headerBackBtn: { marginLeft: 4 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginLeft: 12 },
    content: { padding: 20, paddingBottom: 40 },
    previewWrap: { alignItems: 'center', marginBottom: 20, marginTop: 4 },
    infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 13,
        borderWidth: 1, padding: 12, marginBottom: 16 },
    bankDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    bankDotText: { fontSize: 10, fontWeight: '900' },
    infoBankName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    infoNote: { fontSize: 10, color: '#ADB5BD', fontWeight: '500' },
    fieldWrap: { marginBottom: 14 },
    fieldLabel: { fontSize: 10, fontWeight: '700', color: '#ADB5BD', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
    inputBox: { backgroundColor: '#FFF', borderRadius: 13, borderWidth: 1.5, borderColor: '#F1F3F5',
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 48 },
    inputError: { borderColor: '#FF6B6B' },
    input: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
    errorText: { fontSize: 10, color: '#FF6B6B', marginTop: 4, fontWeight: '600' },
    defaultToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
        padding: 14, borderRadius: 13, borderWidth: 1.5, borderColor: '#F1F3F5', backgroundColor: '#FFF' },
    defaultToggleActive: { borderColor: '#91D7E4', backgroundColor: 'rgba(143,217,229,0.05)' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#F1F3F5',
        alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: '#91D7E4', borderColor: '#91D7E4' },
    defaultToggleText: { fontSize: 13, color: '#333', fontWeight: '600', flex: 1 },
    saveButton: { backgroundColor: '#91D7E4', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' },
    saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { color: '#ADB5BD', fontSize: 15 },
});