import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/tokens';

const FEATURES = [
    { icon: 'pulse-outline' as const, title: 'Real-time Vitals Tracking', desc: 'Monitor temperature, moisture, gait analysis, and more in real time.' },
    { icon: 'sparkles-outline' as const, title: 'AI Health Summaries(Future Implementation)', desc: 'Get intelligent insights powered by machine learning.' },
    { icon: 'document-text-outline' as const, title: 'Detailed Report Exports', desc: 'Export comprehensive PDF reports for your doctor.' },
    { icon: 'notifications-outline' as const, title: 'Smart Alerts', desc: 'Receive timely notifications when vitals need attention.' },
];

export default function AboutScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    headerLeft: () => <BackButton />,
                    headerTitle: () => <Text style={styles.headerTitle}>About</Text>,
                    headerTitleAlign: 'left',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F7F7F7' },
                }}
            />
            <StatusBar style="dark" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Logo & Identity */}
                <View style={styles.logoContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="fitness-outline" size={44} color={Colors.brand} />
                    </View>
                    <Text style={styles.appName}>Sotercare</Text>
                    <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>v1.0.0</Text>
                    </View>
                </View>

                {/* Mission */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconBox}>
                            <Ionicons name="heart-outline" size={18} color={Colors.brand} />
                        </View>
                        <Text style={styles.sectionTitle}>Our Mission</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        Sotercare empowers individuals to take charge of their health through continuous monitoring and intelligent insights — giving peace of mind to users and their loved ones.
                    </Text>
                </View>

                {/* Overview */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconBox}>
                            <Ionicons name="information-circle-outline" size={18} color={Colors.brand} />
                        </View>
                        <Text style={styles.sectionTitle}>What is Sotercare?</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        A comprehensive health and wellness companion designed to help you monitor vital metrics, track daily activity, and generate AI-powered summaries — all from the convenience of your mobile device.
                    </Text>
                </View>

                {/* Key Features */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconBox}>
                            <Ionicons name="grid-outline" size={18} color={Colors.brand} />
                        </View>
                        <Text style={styles.sectionTitle}>Key Features</Text>
                    </View>
                    {FEATURES.map((feat, idx) => (
                        <View key={idx} style={[styles.featureRow, idx < FEATURES.length - 1 && styles.featureRowBorder]}>
                            <View style={styles.featureIconBox}>
                                <Ionicons name={feat.icon} size={22} color={Colors.brand} />
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feat.title}</Text>
                                <Text style={styles.featureDesc}>{feat.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Legal Links */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconBox}>
                            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.brand} />
                        </View>
                        <Text style={styles.sectionTitle}>Legal</Text>
                    </View>
                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.6} onPress={() => Alert.alert('Terms of Service', 'Terms of Service will be available soon.')}>
                        <View style={styles.linkLeft}>
                            <Ionicons name="document-outline" size={20} color="#777" />
                            <Text style={styles.linkText}>Terms of Service</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#C0C0C0" />
                    </TouchableOpacity>
                    <View style={styles.linkDivider} />
                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.6} onPress={() => Alert.alert('Privacy Policy', 'Privacy Policy will be available soon.')}>
                        <View style={styles.linkLeft}>
                            <Ionicons name="lock-closed-outline" size={20} color="#777" />
                            <Text style={styles.linkText}>Privacy Policy</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#C0C0C0" />
                    </TouchableOpacity>
                </View>

                {/* Support Note */}
                <View style={styles.supportNote}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#999" />
                    <Text style={styles.supportNoteText}>
                        Need help? Visit the Help & Support section from your profile.
                    </Text>
                </View>

                {/* Footer */}
                <Text style={styles.footerNote}>© 2026 Sanjula Herath. All rights reserved.</Text>
                <Text style={styles.footerSubNote}>Made with care for better health.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    headerBackBtn: { 
        marginLeft: 4,
        marginTop: 20,
        },  

    headerTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: '#333', 
        marginLeft: 12, 
        marginTop: 20 },

    scrollContent: {
        padding: 20,
        paddingBottom: 48,
    },
    /* Logo */
    logoContainer: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 28,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        elevation: 6,
        shadowColor: Colors.brand,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        borderWidth: 2,
        borderColor: '#E8F7FA',
    },
    appName: {
        fontSize: 26,
        fontWeight: '700',
        color: '#2D3436',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    versionBadge: {
        backgroundColor: '#EAF7FA',
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 12,
    },
    versionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6BC4DB',
    },
    /* Cards */
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
    paragraph: {
        fontSize: 14.5,
        lineHeight: 22,
        color: '#636E72',
    },
    /* Features */
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
    },
    featureRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    featureIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F0F9FB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 3,
    },
    featureDesc: {
        fontSize: 13,
        color: '#888',
        lineHeight: 19,
    },
    /* Links */
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    linkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    linkDivider: {
        height: 1,
        backgroundColor: '#F5F5F5',
    },
    linkText: {
        fontSize: 15,
        color: '#4A4A4A',
        fontWeight: '500',
    },
    /* Support Note */
    supportNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        marginBottom: 8,
    },
    supportNoteText: {
        fontSize: 13,
        color: '#999',
    },
    /* Footer */
    footerNote: {
        textAlign: 'center',
        color: '#BFBFBF',
        fontSize: 12,
        marginBottom: 2,
    },
    footerSubNote: {
        textAlign: 'center',
        color: '#D0D0D0',
        fontSize: 11,
        marginBottom: 16,
    },
});
