import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TimelineColors } from '@/theme/colors';
import { Shadows } from '@/theme/shadows';
import SegmentedControl from '@/components/timeline/SegmentedControl';

type BillingPeriod = 'monthly' | 'yearly';

const BILLING_OPTIONS = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
];

const PLAN_FEATURES = [
    'Basic',
    'Basic',
    'Basic',
    'Basic',
    'Basic',
    'Basic',
];

export default function OurPlansScreen() {
    const router = useRouter();
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

    const handleSubscribe = () => {
        const periodLabel = billingPeriod === 'monthly' ? 'Monthly' : 'Yearly';
        Alert.alert(
            'Subscription',
            `Subscribed to Free (${periodLabel})`,
            [{ text: 'OK' }]
        );
    };

    const getPriceLabel = () => {
        return billingPeriod === 'monthly' ? '/ month' : '/ yearly';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Our Plans',
                    headerTitleAlign: 'left',
                    headerShadowVisible: false,
                    headerStyle: {
                        backgroundColor: TimelineColors.background,
                    },
                    headerTitleStyle: {
                        fontSize: 20,
                        fontWeight: '600',
                        color: TimelineColors.textDark,
                    },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={26}
                                color={TimelineColors.textDark}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Billing Period Toggle */}
                <View style={styles.toggleContainer}>
                    <SegmentedControl
                        options={BILLING_OPTIONS}
                        activeKey={billingPeriod}
                        onChange={(key) => setBillingPeriod(key as BillingPeriod)}
                        variant="capsuleTabs"
                        style={styles.segmentedControl}
                    />
                </View>

                {/* Plan Card */}
                <View style={[styles.planCard, Shadows.card]}>
                    {/* Plan Name */}
                    <Text style={styles.planName}>Free</Text>

                    {/* Price */}
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceAmount}>$0</Text>
                        <Text style={styles.pricePeriod}>{getPriceLabel()}</Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.planDescription}>Free plan basic features</Text>

                    {/* Features List */}
                    <View style={styles.featuresList}>
                        {PLAN_FEATURES.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <Ionicons
                                    name="checkmark"
                                    size={18}
                                    color={TimelineColors.textMedium}
                                    style={styles.checkIcon}
                                />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Subscribe Button */}
                    <TouchableOpacity
                        style={styles.subscribeButton}
                        onPress={handleSubscribe}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.subscribeButtonText}>Subscribe</Text>
                    </TouchableOpacity>

                    {/* Helper Text */}
                    <Text style={styles.helperText}>Auto-renews. Cancel anytime</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: TimelineColors.background,
    },
    backButton: {
        marginLeft: Platform.OS === 'ios' ? 0 : -8,
        padding: 4,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    toggleContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    segmentedControl: {
        width: '100%',
        maxWidth: 280,
    },
    planCard: {
        backgroundColor: TimelineColors.cardBackground,
        borderRadius: 20,
        paddingVertical: 28,
        paddingHorizontal: 24,
    },
    planName: {
        fontSize: 24,
        fontWeight: '700',
        color: TimelineColors.textDark,
        marginBottom: 12,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    priceAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: TimelineColors.textDark,
    },
    pricePeriod: {
        fontSize: 16,
        color: TimelineColors.textMedium,
        marginLeft: 4,
    },
    planDescription: {
        fontSize: 14,
        color: TimelineColors.textMedium,
        marginBottom: 20,
    },
    featuresList: {
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    checkIcon: {
        marginRight: 12,
    },
    featureText: {
        fontSize: 15,
        color: TimelineColors.textDark,
    },
    subscribeButton: {
        backgroundColor: TimelineColors.primaryCyan,
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    subscribeButtonText: {
        color: TimelineColors.textWhite,
        fontSize: 16,
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        color: TimelineColors.textLight,
        textAlign: 'center',
    },
});
