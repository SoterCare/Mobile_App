import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

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

                <View style={styles.introContainer}>
                    <Text style={styles.introHeading}>How can we help you?</Text>
                    <Text style={styles.introText}>Browse through our frequently asked questions or get in touch with our team for more help.</Text>
                </View>

                <View style={styles.card}>
                    <TouchableOpacity style={styles.menuItemBorder} activeOpacity={0.7} onPress={() => Linking.openURL('https://example.com/faq')}>
                        <View style={styles.menuItemLeft}>
                            <View style={styles.iconBox}>
                                <Ionicons name="chatbubbles-outline" size={22} color="#8FD9E5" />
                            </View>
                            <Text style={styles.menuLabel}>FAQs</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#A0A0A0" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItemBorder} activeOpacity={0.7} onPress={() => Linking.openURL('mailto:support@example.com')}>
                        <View style={styles.menuItemLeft}>
                            <View style={styles.iconBox}>
                                <Ionicons name="mail-outline" size={22} color="#8FD9E5" />
                            </View>
                            <Text style={styles.menuLabel}>Contact Support</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#A0A0A0" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => Linking.openURL('https://example.com/feedback')}>
                        <View style={styles.menuItemLeft}>
                            <View style={styles.iconBox}>
                                <Ionicons name="star-outline" size={22} color="#8FD9E5" />
                            </View>
                            <Text style={styles.menuLabel}>Send Feedback</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#A0A0A0" />
                    </TouchableOpacity>
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
        padding: 24,
        paddingBottom: 40,
    },
    introContainer: {
        marginBottom: 30,
        paddingHorizontal: 8,
    },
    introHeading: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 10,
    },
    introText: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        marginBottom: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
    },
    menuItemBorder: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F9FB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuLabel: {
        fontSize: 16,
        color: '#4A4A4A',
        fontWeight: '600',
    },
});
