import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
    ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { cardStore, setCardStore, CardVisual, Card, SL_BANKS, SLBank } from './payment';
import { Colors } from '@/theme/tokens';
import { BackButton } from '@/components/ui/BackButton';

const formatCardNumber = (v: string) =>
    v.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);

const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length >= 3) return d.slice(0, 2) + '/' + d.slice(2, 4);
    return d;
};

export default function PaymentAddScreen() {
    const router = useRouter();

    const [cardNum, setCardNum]           = useState('');
    const [cardName, setCardName]         = useState('');
    const [expiry, setExpiry]             = useState('');
    const [cvv, setCvv]                   = useState('');
    const [showCvv, setShowCvv]           = useState(false);
    const [selectedBank, setSelectedBank] = useState<SLBank>('sampath');
    const [brand, setBrand]               = useState<'visa' | 'mastercard'>('visa');
    const [bankModalOpen, setBankModalOpen] = useState(false);
    const [errors, setErrors]             = useState<Record<string, string>>({});

    const last4 = cardNum.replace(/\s/g, '').slice(-4) || '····';
    const previewCard: Card = {
        id: 'preview', brand, bank: selectedBank,
        last4, expiry: expiry || 'MM/YY',
        name: cardName || 'YOUR NAME', isDefault: false,
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (cardNum.replace(/\s/g, '').length < 16) e.cardNum = 'Enter a valid 16-digit number';
        if (!cardName.trim()) e.cardName = 'Name is required';
        if (expiry.length < 5) e.expiry = 'Enter valid expiry MM/YY';
        if (cvv.length < 3) e.cvv = 'Enter valid CVV';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleAdd = () => {
        if (!validate()) return;
        const newCard: Card = {
            id: Date.now().toString(), brand, bank: selectedBank,
            last4: cardNum.replace(/\s/g, '').slice(-4),
            expiry, name: cardName,
            isDefault: cardStore.length === 0,
        };
        setCardStore([...cardStore, newCard]);
        router.push({ pathname: '/settings/payment-success' as any, params: { type: 'added', cardId: newCard.id } });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Left-aligned title, no route path ── */}
            <Stack.Screen
                options={{
                    title: '',
                    headerLeft: () => <BackButton />,
                    headerTitle: () => (
                        <Text style={styles.headerTitle}>Add New Card</Text>
                    ),
                    headerTitleAlign: 'left',
                    headerRight: () => <View />,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8F9FA' },
                }}
            />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Live card preview */}
                    <View style={styles.previewWrap}>
                        <CardVisual card={previewCard} />
                    </View>

                    {/* Bank selector */}
                    <Text style={styles.fieldLabel}>Bank</Text>
                    <TouchableOpacity style={styles.selectorBtn} onPress={() => setBankModalOpen(true)} activeOpacity={0.8}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={[styles.bankDot, { backgroundColor: SL_BANKS[selectedBank].bg }]}>
                                <Text style={[styles.bankDotText, { color: SL_BANKS[selectedBank].accent }]}>
                                    {SL_BANKS[selectedBank].logoMark}
                                </Text>
                            </View>
                            <Text style={styles.selectorText}>{SL_BANKS[selectedBank].name}</Text>
                        </View>
                        <Ionicons name="chevron-down" size={18} color="#ADB5BD" />
                    </TouchableOpacity>

                    {/* Brand selector */}
                    <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Card Network</Text>
                    <View style={styles.brandRow}>
                        {(['visa', 'mastercard'] as const).map((b) => (
                            <TouchableOpacity key={b} onPress={() => setBrand(b)}
                                style={[styles.brandBtn, brand === b && styles.brandBtnActive]} activeOpacity={0.8}>
                                <Text style={[styles.brandBtnText, brand === b && styles.brandBtnTextActive]}>
                                    {b === 'visa' ? 'VISA' : 'Mastercard'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Card Number */}
                    <View style={[styles.fieldWrap, { marginTop: 14 }]}>
                        <Text style={styles.fieldLabel}>Card Number</Text>
                        <View style={[styles.inputBox, errors.cardNum ? styles.inputError : null]}>
                            <TextInput value={cardNum} onChangeText={v => setCardNum(formatCardNumber(v))}
                                placeholder="0000 0000 0000 0000" placeholderTextColor="#ADB5BD"
                                keyboardType="numeric" maxLength={19}
                                style={[styles.input, { letterSpacing: 2, fontWeight: '600' }]} />
                        </View>
                        {errors.cardNum ? <Text style={styles.errorText}>{errors.cardNum}</Text> : null}
                    </View>

                    {/* Name */}
                    <View style={styles.fieldWrap}>
                        <Text style={styles.fieldLabel}>Cardholder Name</Text>
                        <View style={[styles.inputBox, errors.cardName ? styles.inputError : null]}>
                            <TextInput value={cardName} onChangeText={setCardName}
                                placeholder="Alex Johnson" placeholderTextColor="#ADB5BD"
                                autoCapitalize="words" style={styles.input} />
                        </View>
                        {errors.cardName ? <Text style={styles.errorText}>{errors.cardName}</Text> : null}
                    </View>

                    {/* Expiry + CVV */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={[styles.fieldWrap, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>Expiry Date</Text>
                            <View style={[styles.inputBox, errors.expiry ? styles.inputError : null]}>
                                <TextInput value={expiry} onChangeText={v => setExpiry(formatExpiry(v))}
                                    placeholder="MM/YY" placeholderTextColor="#ADB5BD"
                                    keyboardType="numeric" maxLength={5}
                                    style={[styles.input, { letterSpacing: 1, fontWeight: '600' }]} />
                            </View>
                            {errors.expiry ? <Text style={styles.errorText}>{errors.expiry}</Text> : null}
                        </View>
                        <View style={[styles.fieldWrap, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>CVV</Text>
                            <View style={[styles.inputBox, errors.cvv ? styles.inputError : null]}>
                                <TextInput value={cvv} onChangeText={v => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                                    placeholder="•••" placeholderTextColor="#ADB5BD"
                                    secureTextEntry={!showCvv} keyboardType="numeric" maxLength={4}
                                    style={[styles.input, { flex: 1 }]} />
                                <TouchableOpacity onPress={() => setShowCvv(s => !s)} style={{ padding: 2 }}>
                                    <Ionicons name={showCvv ? 'eye-outline' : 'eye-off-outline'} size={18} color="#ADB5BD" />
                                </TouchableOpacity>
                            </View>
                            {errors.cvv ? <Text style={styles.errorText}>{errors.cvv}</Text> : null}
                        </View>
                    </View>

                    <View style={styles.secureBox}>
                        <Ionicons name="shield-checkmark-outline" size={14} color="#51CF66" />
                        <Text style={styles.secureText}>Your card details are encrypted</Text>
                    </View>

                    <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.85}>
                        <Text style={styles.addButtonText}>Add Card</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bank picker modal */}
            <Modal visible={bankModalOpen} transparent animationType="slide" onRequestClose={() => setBankModalOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setBankModalOpen(false)}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Select Your Bank</Text>
                        {(Object.entries(SL_BANKS) as [SLBank, typeof SL_BANKS[SLBank]][]).map(([key, b]) => (
                            <TouchableOpacity key={key}
                                style={[styles.bankOption, selectedBank === key && styles.bankOptionActive]}
                                onPress={() => { setSelectedBank(key); setBankModalOpen(false); }}
                                activeOpacity={0.8}>
                                <View style={[styles.bankDot, { backgroundColor: b.bg }]}>
                                    <Text style={[styles.bankDotText, { color: b.accent }]}>{b.logoMark}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.bankOptionName}>{b.name}</Text>
                                    <Text style={styles.bankOptionShort}>{b.shortName}</Text>
                                </View>
                                {selectedBank === key && <Ionicons name="checkmark-circle" size={22} color={Colors.brand} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    headerBackBtn: { marginTop: 20, padding: 6 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginLeft: 4, marginTop: 20, },
    content: { padding: 20, paddingBottom: 40 },
    previewWrap: { alignItems: 'center', marginBottom: 24, marginTop: 4 },
    fieldWrap: { marginBottom: 14 },
    fieldLabel: { fontSize: 10, fontWeight: '700', color: '#ADB5BD', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
    selectorBtn: { backgroundColor: '#FFF', borderRadius: 13, borderWidth: 1.5, borderColor: '#F1F3F5',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, height: 50 },
    selectorText: { fontSize: 14, color: '#333', fontWeight: '600' },
    bankDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    bankDotText: { fontSize: 9, fontWeight: '900' },
    brandRow: { flexDirection: 'row', gap: 10 },
    brandBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: '#F1F3F5',
        backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
    brandBtnActive: { borderColor: Colors.brand, backgroundColor: 'rgba(143,217,229,0.07)' },
    brandBtnText: { fontSize: 13, fontWeight: '700', color: '#ADB5BD' },
    brandBtnTextActive: { color: Colors.brand },
    inputBox: { backgroundColor: '#FFF', borderRadius: 13, borderWidth: 1.5, borderColor: '#F1F3F5',
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 48 },
    inputError: { borderColor: '#FF6B6B' },
    input: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
    errorText: { fontSize: 10, color: '#FF6B6B', marginTop: 4, fontWeight: '600' },
    secureBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(81,207,102,0.06)',
        borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(81,207,102,0.15)', marginBottom: 16 },
    secureText: { fontSize: 11, color: '#51CF66', fontWeight: '600' },
    addButton: { backgroundColor: Colors.brand, borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 16 },
    bankOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
        paddingHorizontal: 14, borderRadius: 14, marginBottom: 6 },
    bankOptionActive: { backgroundColor: 'rgba(143,217,229,0.08)', borderWidth: 1.5, borderColor: 'rgba(143,217,229,0.3)' },
    bankOptionName: { fontSize: 14, fontWeight: '700', color: '#333' },
    bankOptionShort: { fontSize: 11, color: '#ADB5BD', marginTop: 1 },
});