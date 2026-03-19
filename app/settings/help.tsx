import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const FAQ_ITEMS = [
    { q: 'How do I pair my device?', a: 'Go to the Device tab, tap "Connect Device", and follow the on-screen Bluetooth pairing instructions.' },
    { q: 'How accurate are the vitals readings?', a: 'Sotercare uses clinical-grade sensors. Ensure the device fits snugly for best accuracy. Readings are for wellness monitoring, not medical diagnosis.' },
    { q: 'Can I export my health data?', a: 'Yes! Navigate to your Profile, tap "Export Report", and choose PDF or CSV format to share with your healthcare provider.' },
    { q: 'How do AI summaries work?', a: 'Our AI analyzes your vitals trends over time and generates plain-language insights highlighting patterns and areas that may need attention.' },
    { q: 'How do I update my profile?', a: 'Go to Profile → Edit Profile to change your name, photo, and personal details.' },
];

const SUPPORT_OPTIONS = [
    { icon: 'mail-outline' as const, label: 'Email Support', desc: 'Get help via email', action: () => Alert.alert('Email Support', 'Contact us at support@sotercare.com') },
    { icon: 'chatbubbles-outline' as const, label: 'Live Chat', desc: 'Chat with our team', action: () => Alert.alert('Live Chat', 'Live chat will be available soon.') },
    { icon: 'bug-outline' as const, label: 'Report a Problem', desc: 'Let us know about issues', action: () => Alert.alert('Report a Problem', 'Bug reporting will be available soon.') },
];

function FAQItem({ item, isLast }: { item: typeof FAQ_ITEMS[number]; isLast: boolean }) {
    const [open, setOpen] = useState(false);
    const toggle = useCallback(() => setOpen((v) => !v), []);

    return (
        <View style={!isLast ? faqStyles.itemBorder : undefined}>
            <TouchableOpacity style={faqStyles.questionRow} activeOpacity={0.6} onPress={toggle}>
                <Text style={faqStyles.questionText}>{item.q}</Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#A0A0A0" />
            </TouchableOpacity>
            {open && <Text style={faqStyles.answerText}>{item.a}</Text>}
        </View>
    );
}

const faqStyles = StyleSheet.create({
    itemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F3F3',
    },
    questionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
    },
    questionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#3D3D3D',
        marginRight: 12,
    },
    answerText: {
        fontSize: 13.5,
        lineHeight: 20,
        color: '#777',
        paddingBottom: 14,
    },
});

export default function HelpSupportScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn} activeOpacity={0.7}>
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                    ),
                    headerTitle: () => <Text style={styles.headerTitle}>Help & Support</Text>,
                    headerTitleAlign: 'left',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F7F7F7' },
                }}
            />
            <StatusBar style="dark" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Intro */}
                <View style={styles.introContainer}>
                    <View style={styles.introIconCircle}>
                        <Ionicons name="help-buoy-outline" size={36} color="#91D7E4" />
                    </View>
                    <Text style={styles.introHeading}>How can we help?</Text>
                    <Text style={styles.introText}>
                        Find answers to common questions or reach out to our support team for personalized assistance.
                    </Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconBox}>
                            <Ionicons name="flash-outline" size={18} color="#91D7E4" />
                        </View>
                        <Text style={styles.sectionTitle}>Quick Help</Text>
                    </View>
                    <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.quickActionBtn} activeOpacity={0.6} onPress={() => Alert.alert('Getting Started', 'Getting started guide will be available soon.')}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="rocket-outline" size={22} color="#91D7E4" />
                            </View>
                            <Text style={styles.quickActionLabel}>Getting{'\n'}Started</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionBtn} activeOpacity={0.6} onPress={() => Alert.alert('Device Setup', 'Device setup guide will be available soon.')}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="watch-outline" size={22} color="#91D7E4" />
                            </View>
                            <Text style={styles.quickActionLabel}>Device{'\n'}Setup</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionBtn} activeOpacity={0.6} onPress={() => Alert.alert('App Guide', 'App guide will be available soon.')}>
                            <View style={styles.quickActionIcon}>
                                <Ionicons name="phone-portrait-outline" size={22} color="#91D7E4" />
                            </View>
                            <Text style={styles.quickActionLabel}>App{'\n'}Guide</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAQs */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconBox}>
                            <Ionicons name="help-circle-outline" size={18} color="#91D7E4" />
                        </View>
                        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    </View>
                    {FAQ_ITEMS.map((item, idx) => (
                        <FAQItem key={idx} item={item} isLast={idx === FAQ_ITEMS.length - 1} />
                    ))}
                </View>

                {/* Contact Support */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconBox}>
                            <Ionicons name="headset-outline" size={18} color="#91D7E4" />
                        </View>
                        <Text style={styles.sectionTitle}>Contact Us</Text>
                    </View>
                    {SUPPORT_OPTIONS.map((opt, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.contactRow, idx < SUPPORT_OPTIONS.length - 1 && styles.contactRowBorder]}
                            activeOpacity={0.6}
                            onPress={opt.action}
                        >
                            <View style={styles.contactIconBox}>
                                <Ionicons name={opt.icon} size={22} color="#91D7E4" />
                            </View>
                            <View style={styles.contactContent}>
                                <Text style={styles.contactLabel}>{opt.label}</Text>
                                <Text style={styles.contactDesc}>{opt.desc}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#C0C0C0" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Medical Disclaimer */}
                <View style={styles.disclaimerCard}>
                    <View style={styles.disclaimerHeader}>
                        <Ionicons name="warning-outline" size={18} color="#E8836B" />
                        <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
                    </View>
                    <Text style={styles.disclaimerText}>
                        Sotercare is designed for wellness monitoring only and is not a substitute for professional medical advice, diagnosis, or treatment. In case of a medical emergency, please call your local emergency services immediately.
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footerRow}>
                    <Ionicons name="time-outline" size={14} color="#B0B0B0" />
                    <Text style={styles.footerText}>Support hours: Mon – Fri, 9 AM – 6 PM (GMT+5:30)</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    headerBackBtn: { marginLeft: 4 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginLeft: 12 },
    scrollContent: {
        padding: 20,
        paddingBottom: 48,
    },
    /* Intro */
    introContainer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    introIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#91D7E4',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        borderWidth: 2,
        borderColor: '#E8F7FA',
    },
    introHeading: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 8,
        textAlign: 'center',
    },
    introText: {
        fontSize: 14.5,
        color: '#777',
        lineHeight: 21,
        textAlign: 'center',
    },
    /* Shared Card */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F0F9FB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2D3436',
    },
    /* Quick Actions */
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickActionBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    quickActionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#F0F9FB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickActionLabel: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
        lineHeight: 17,
    },
    /* Contact */
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    contactRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F3F3',
    },
    contactIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#F0F9FB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    contactContent: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3D3D3D',
        marginBottom: 2,
    },
    contactDesc: {
        fontSize: 13,
        color: '#999',
    },
    /* Disclaimer */
    disclaimerCard: {
        backgroundColor: '#FFF8F6',
        borderRadius: 14,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FDEAE5',
    },
    disclaimerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    disclaimerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#C0583E',
    },
    disclaimerText: {
        fontSize: 13,
        lineHeight: 19,
        color: '#8B6B60',
    },
    /* Footer */
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        marginBottom: 8,
    },
    footerText: {
        fontSize: 12,
        color: '#B0B0B0',
    },
});
