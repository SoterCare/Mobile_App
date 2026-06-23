import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    SafeAreaView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Colors, Radius } from '@/theme/tokens';
import { BackButton } from '@/components/ui/BackButton';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_MARGIN = 16;

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        monthlyPrice: '0',
        yearlyPrice: '0',
        monthlyLabel: '/ month',
        yearlyLabel: '/ year',
        description: 'Get started with essential health monitoring',
        features: ['Basic vitals tracking', 'Daily summary', '7-day data retention', 'Single device', 'Community support', 'Standard alerts'],
    },
    {
        id: 'pro',
        name: 'Pro',
        monthlyPrice: '9.99',
        yearlyPrice: '99.99',
        monthlyLabel: '/ month',
        yearlyLabel: '/ year',
        description: 'Advanced insights for proactive health management',
        features: ['All Free features', 'AI-powered summaries', '90-day data retention', 'Up to 3 devices', 'Priority support', 'Export PDF reports'],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: '24.99',
        yearlyPrice: '249.99',
        monthlyLabel: '/ month',
        yearlyLabel: '/ year',
        description: 'Complete health intelligence for families & caregivers',
        features: ['All Pro features', 'Unlimited data retention', 'Unlimited devices', 'Family dashboard', 'Dedicated account manager', 'Custom alert rules'],
    },
];

export default function SubscriptionScreen() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <SafeAreaView style={styles.container}>
      <DottedBackground />
            <Stack.Screen
                options={{
                    headerLeft: () => <BackButton />,
                    headerTitle: () => <Text style={styles.headerTitle}>Our Plans</Text>,
                    headerTitleAlign: 'left',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8F9FA' },
                }}
            />

            {/* ── Monthly / Yearly toggle ── */}
            <View style={styles.toggleContainer}>
                <View style={styles.toggleBg}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, billingCycle === 'monthly' && styles.activeTab]}
                        onPress={() => setBillingCycle('monthly')}
                        activeOpacity={1}
                    >
                        <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.activeTabText]}>
                            Monthly
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, billingCycle === 'yearly' && styles.activeTab]}
                        onPress={() => setBillingCycle('yearly')}
                        activeOpacity={1}
                    >
                        <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.activeTabText]}>
                            Yearly
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Horizontal scrolling cards ── */}
            <ScrollView
                horizontal
                snapToInterval={CARD_WIDTH + CARD_MARGIN}
                snapToAlignment="start"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollArea}
            >
                {PLANS.map((plan) => {
                    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                    const periodLabel = billingCycle === 'monthly' ? plan.monthlyLabel : plan.yearlyLabel;

                    return (
                        <View key={plan.id} style={styles.card}>
                            <Text style={styles.planName}>{plan.name}</Text>

                            <View style={styles.priceRow}>
                                <Text style={styles.currency}>$</Text>
                                <Text style={styles.priceText}>{price}</Text>
                                <Text style={styles.cycleText}> {periodLabel}</Text>
                            </View>

                            <Text style={styles.planDescription}>{plan.description}</Text>

                            <View style={styles.featuresList}>
                                {plan.features.map((feature, i) => (
                                    <View key={i} style={styles.featureItem}>
                                        <Ionicons name="checkmark" size={18} color={Colors.brand} />
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={{ flex: 1 }} />

                            <TouchableOpacity
                                style={styles.subscribeButton}
                                activeOpacity={0.8}
                                onPress={() => Alert.alert('Subscribe', `You selected the ${plan.name} plan (${billingCycle}). This feature will be available soon!`)}
                            >
                                <Text style={styles.subscribeText}>
                                    {plan.id === 'free' ? 'Current Plan' : 'Subscribe'}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.footerNote}>Auto-renews. Cancel anytime</Text>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    headerBackBtn: {
        marginTop: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginLeft: 12,
        marginTop: 20,
    },
    toggleContainer: {
        alignItems: 'center',
        paddingVertical: 25,
    },
    toggleBg: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: Radius.pill,
        padding: 5,
        width: '75%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: { elevation: 5 },
        }),
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: Radius.pill,
    },
    activeTab: {
        backgroundColor: Colors.brand,
    },
    toggleText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FFF',
    },
    scrollArea: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 60,
    },
    card: {
        width: CARD_WIDTH,
        minHeight: 540,
        backgroundColor: '#FFF',
        borderRadius: Radius.xl,
        padding: 30,
        marginRight: CARD_MARGIN,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
            },
            android: { elevation: 8 },
        }),
    },
    planName: {
        fontSize: 34,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    currency: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
    },
    priceText: {
        fontSize: 56,
        fontWeight: '700',
        color: '#333',
    },
    cycleText: {
        fontSize: 16,
        color: '#999',
    },
    planDescription: {
        fontSize: 16,
        color: '#666',
        marginBottom: 35,
    },
    featuresList: {
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 18,
        color: '#444',
        fontWeight: '500',
    },
    subscribeButton: {
        backgroundColor: Colors.brand,
        paddingVertical: 18,
        borderRadius: Radius.xl,
        alignItems: 'center',
    },
    subscribeText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    footerNote: {
        textAlign: 'center',
        color: '#BBB',
        fontSize: 13,
        marginTop: 15,
    },
});