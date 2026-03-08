import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function AboutScreen() {
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
                    headerTitle: () => <Text style={styles.headerTitle}>About</Text>,
                    headerTitleAlign: 'left',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F7F7F7' },
                }}
            />
            <StatusBar style="dark" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.logoContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="fitness-outline" size={48} color="#8FD9E5" />
                    </View>
                    <Text style={styles.appName}>Sotercare</Text>
                    <Text style={styles.appVersion}>Version 1.0.0</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <Text style={styles.paragraph}>
                        Sotercare is a comprehensive health and fitness tracking application designed to help you monitor your lifestyle, track vital metrics, and generate AI-powered insights to improve your overall well-being.
                    </Text>

                    <Text style={styles.sectionTitle}>Features</Text>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#8FD9E5" />
                        <Text style={styles.featureText}>Real-time Vitals Tracking</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#8FD9E5" />
                        <Text style={styles.featureText}>AI Health Summaries</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#8FD9E5" />
                        <Text style={styles.featureText}>Detailed Report Exports</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#8FD9E5" />
                        <Text style={styles.featureText}>Custom Layouts & Subscriptions</Text>
                    </View>
                </View>

                <View style={styles.linkCard}>
                    <TouchableOpacity style={styles.linkItemBorder} activeOpacity={0.7} onPress={() => Linking.openURL('https://example.com/terms')}>
                        <Text style={styles.linkText}>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={18} color="#A0A0A0" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkItem} activeOpacity={0.7} onPress={() => Linking.openURL('https://example.com/privacy')}>
                        <Text style={styles.linkText}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={18} color="#A0A0A0" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerNote}>© 2026 Sanjula Herath. All rights reserved.</Text>
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
        padding: 24,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginVertical: 32,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 4,
    },
    appVersion: {
        fontSize: 15,
        color: '#888888',
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 12,
        marginTop: 8,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 24,
        color: '#555555',
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    featureText: {
        fontSize: 16,
        color: '#444444',
        fontWeight: '500',
    },
    linkCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        marginBottom: 32,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
    },
    linkItemBorder: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    linkText: {
        fontSize: 16,
        color: '#4A4A4A',
        fontWeight: '600',
    },
    footerNote: {
        textAlign: 'center',
        color: '#BBBBBB',
        fontSize: 13,
        marginBottom: 20,
    },
});
