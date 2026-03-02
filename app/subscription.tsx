import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const SubscriptionScreen = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const router = useRouter();

    const plans = [
        { 
            name: 'Free', 
            price: '0', 
            features: ['Basic', 'Basic', 'Basic', 'Basic', 'Basic', 'Basic'] 
        },
        { 
            name: 'Pro', 
            price: billingCycle === 'monthly' ? '00' : '00',
            features: ['Advanced', 'Advanced', 'Advanced', 'Advanced', 'Advanced', 'Advanced'] 
        },
        { 
            name: 'Enterprise', 
            price: '000', 
            features: ['Premium', 'Premium', 'Premium', 'Premium', 'Premium', 'Premium'] 
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Our Plans</Text>
                <View style={{ width: 28 }} /> 
            </View>

            {/* Toggle */}
            <View style={styles.toggleContainer}>
                <View style={styles.toggleBg}>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, billingCycle === 'monthly' && styles.activeTab]}
                        onPress={() => setBillingCycle('monthly')}
                    >
                        <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.activeTabText]}>
                            Monthly
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.toggleBtn, billingCycle === 'yearly' && styles.activeTab]}
                        onPress={() => setBillingCycle('yearly')}
                    >
                        <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.activeTabText]}>
                            Yearly
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Plans */}
            <ScrollView 
                horizontal 
                pagingEnabled={false}
                snapToInterval={width * 0.85}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollArea}
            >
                {plans.map((plan, index) => (
                    <View key={index} style={styles.card}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        
                        <View style={styles.priceRow}>
                            <Text style={styles.currency}>$</Text>
                            <Text style={styles.priceText}>{plan.price}</Text>
                            <Text style={styles.cycleText}> / {billingCycle}</Text>
                        </View>

                        <Text style={styles.featureHeader}>
                            {plan.name} plan {index === 0 ? 'basic' : index === 1 ? 'advanced' : 'premium'} features
                        </Text>

                        <View style={styles.featuresList}>
                            {plan.features.map((feature, i) => (
                                <View key={i} style={styles.featureItem}>
                                    <Ionicons name="checkmark" size={20} color="#8FD9E5" />
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.subscribeButton}>
                            <Text style={styles.subscribeText}>Subscribe</Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.footerNote}>Auto-renews. Cancel anytime</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },

    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingTop: 10 
    },

    headerTitle: { 
        fontSize: 22, 
        fontWeight: '700', 
        color: '#333' 
    },

    toggleContainer: { 
        alignItems: 'center', 
        marginVertical: 30 
    },

    toggleBg: { 
        flexDirection: 'row', 
        backgroundColor: '#F2F2F2', 
        borderRadius: 30, 
        padding: 4, 
        width: '65%' 
    },

    toggleBtn: { 
        flex: 1, 
        paddingVertical: 12, 
        alignItems: 'center', 
        borderRadius: 26 
    },

    /* ✅ UPDATED ACTIVE TAB */
    activeTab: { 
        backgroundColor: '#A2E3ED', 
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4 
    },

    toggleText: { 
        fontSize: 16, 
        color: '#888', 
        fontWeight: '600' 
    },

    /* ✅ UPDATED ACTIVE TAB TEXT */
    activeTabText: { 
        color: '#FFF',
        fontWeight: '600'
    },

    scrollArea: { 
        paddingLeft: 20, 
        paddingRight: 40, 
        paddingBottom: 50 
    },

    card: { 
        width: width * 0.8, 
        backgroundColor: '#FFF', 
        borderRadius: 30, 
        padding: 25, 
        marginRight: 20,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },

    planName: { 
        fontSize: 32, 
        fontWeight: 'bold', 
        color: '#333' 
    },

    priceRow: { 
        flexDirection: 'row', 
        alignItems: 'baseline', 
        marginTop: 10, 
        marginBottom: 5 
    },

    currency: { 
        fontSize: 24, 
        fontWeight: '600', 
        color: '#333' 
    },

    priceText: { 
        fontSize: 48, 
        fontWeight: 'bold', 
        color: '#333' 
    },

    cycleText: { 
        fontSize: 16, 
        color: '#AAA' 
    },

    featureHeader: { 
        color: '#AAA', 
        fontSize: 16, 
        marginBottom: 20 
    },

    featuresList: { 
        flex: 1 
    },

    featureItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 15 
    },

    featureText: { 
        fontSize: 18, 
        color: '#444', 
        marginLeft: 10 
    },

    subscribeButton: { 
        backgroundColor: '#A2E3ED', 
        paddingVertical: 18, 
        borderRadius: 20, 
        alignItems: 'center', 
        marginTop: 20 
    },

    subscribeText: { 
        color: '#FFF', 
        fontSize: 20, 
        fontWeight: 'bold' 
    },

    footerNote: { 
        textAlign: 'center', 
        color: '#CCC', 
        fontSize: 12, 
        marginTop: 12 
    }
});

export default SubscriptionScreen;