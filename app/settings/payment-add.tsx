import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
    ScrollView, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { cardStore, setCardStore, CardVisual, Card } from './payment';

const formatCardNumber = (v: string) =>
    v.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);

const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length >= 3) return d.slice(0, 2) + '/' + d.slice(2, 4);
    return d;
};

export default function PaymentAddScreen() {
    const router = useRouter();

    const [cardNum, setCardNum] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [showCvv, setShowCvv] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const last4 = cardNum.replace(/\s/g, '').slice(-4) || '····';

    const previewCard: Card = {
        id: 'preview',
        brand: 'visa',
        last4,
        expiry: expiry || 'MM/YY',
        name: cardName || 'YOUR NAME',
        gradient: ['#8FD9E5', '#5BBFCE'],
        isDefault: false,
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (cardNum.replace(/\s/g, '').length < 16) e.cardNum = 'Enter a valid 16-digit card number';
        if (!cardName.trim()) e.cardName = 'Name is required';
        if (expiry.length < 5) e.expiry = 'Enter valid expiry MM/YY';
        if (cvv.length < 3) e.cvv = 'Enter valid CVV';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleAdd = () => {
        if (!validate()) return;
        const newCard: Card = {
            id: Date.now().toString(),
            brand: 'visa',
            last4: cardNum.replace(/\s/g, '').slice(-4),
            expiry,
            name: cardName,
            gradient: ['#8FD9E5', '#5BBFCE'],
            isDefault: cardStore.length === 0,
        };
        setCardStore([...cardStore, newCard]);
        router.push({
            pathname: '/settings/payment-success' as any,
            params: { type: 'added', cardId: newCard.id },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add New Card</Text>
                    <View style={{ width: 34 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Live Card Preview */}
                    <View style={styles.previewWrap}>
                        <View style={[styles.cardBg, { backgroundColor: previewCard.gradient[0] }]}>
                            <CardVisual card={previewCard} />
                        </View>
                    </View>

                    {/* Card Number */}
                    <Field
                        label="Card Number"
                        value={cardNum}
                        onChangeText={(v) => setCardNum(formatCardNumber(v))}
                        placeholder="0000 0000 0000 0000"
                        keyboardType="numeric"
                        maxLength={19}
                        error={errors.cardNum}
                        style={{ letterSpacing: 2, fontWeight: '600' }}
                    />

                    {/* Name */}
                    <Field
                        label="Cardholder Name"
                        value={cardName}
                        onChangeText={setCardName}
                        placeholder="Alex Johnson"
                        autoCapitalize="words"
                        error={errors.cardName}
                    />

                    {/* Expiry + CVV */}
                    <View style={styles.row2}>
                        <View style={{ flex: 1 }}>
                            <Field
                                label="Expiry Date"
                                value={expiry}
                                onChangeText={(v) => setExpiry(formatExpiry(v))}
                                placeholder="MM/YY"
                                keyboardType="numeric"
                                maxLength={5}
                                error={errors.expiry}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.fieldWrap}>
                                <Text style={styles.fieldLabel}>CVV</Text>
                                <View style={[styles.inputBox, errors.cvv ? styles.inputError : null]}>
                                    <TextInput
                                        value={cvv}
                                        onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="•••"
                                        placeholderTextColor="#ADB5BD"
                                        secureTextEntry={!showCvv}
                                        keyboardType="numeric"
                                        maxLength={4}
                                        style={[styles.input, { flex: 1 }]}
                                    />
                                    <TouchableOpacity onPress={() => setShowCvv(s => !s)} style={{ padding: 2 }}>
                                        <Ionicons name={showCvv ? 'eye-outline' : 'eye-off-outline'} size={18} color="#ADB5BD" />
                                    </TouchableOpacity>
                                </View>
                                {errors.cvv ? <Text style={styles.errorText}>{errors.cvv}</Text> : null}
                            </View>
                        </View>
                    </View>

                    {/* Secure note */}
                    <View style={styles.secureBox}>
                        <Ionicons name="shield-checkmark-outline" size={14} color="#51CF66" />
                        <Text style={styles.secureText}>Your card details are encrypted</Text>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.85}>
                        <Text style={styles.addButtonText}>Add Card</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

/* ── Reusable Field ── */
interface FieldProps {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: any;
    maxLength?: number;
    autoCapitalize?: any;
    error?: string;
    style?: object;
}
const Field: React.FC<FieldProps> = ({ label, value, onChangeText, placeholder, keyboardType, maxLength, autoCapitalize, error, style }) => (
    <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[styles.inputBox, error ? styles.inputError : null]}>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#ADB5BD"
                keyboardType={keyboardType}
                maxLength={maxLength}
                autoCapitalize={autoCapitalize}
                style={[styles.input, style]}
            />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
    headerBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    content: { padding: 20, paddingBottom: 40 },
    previewWrap: { alignItems: 'center', marginBottom: 24, marginTop: 4 },
    cardBg: { borderRadius: 20 },
    row2: { flexDirection: 'row', gap: 12 },
    fieldWrap: { marginBottom: 14 },
    fieldLabel: { fontSize: 10, fontWeight: '700', color: '#ADB5BD', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
    inputBox: { backgroundColor: '#FFF', borderRadius: 13, borderWidth: 1.5, borderColor: '#F1F3F5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 48 },
    inputError: { borderColor: '#FF6B6B' },
    input: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
    errorText: { fontSize: 10, color: '#FF6B6B', marginTop: 4, fontWeight: '600' },
    secureBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(81,207,102,0.06)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(81,207,102,0.15)', marginBottom: 16 },
    secureText: { fontSize: 11, color: '#51CF66', fontWeight: '600' },
    addButton: { backgroundColor: '#8FD9E5', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});