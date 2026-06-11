import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/theme/tokens';
import { BackButton } from '@/components/ui/BackButton';

type Language = { code: string; name: string; nativeName: string; flag: string };

const LANGUAGES: Language[] = [
    { code: 'en', name: 'English',    nativeName: 'English',   flag: '🇺🇸' },
    { code: 'es', name: 'Spanish',    nativeName: 'Español',   flag: '🇪🇸' },
    { code: 'fr', name: 'French',     nativeName: 'Français',  flag: '🇫🇷' },
    { code: 'de', name: 'German',     nativeName: 'Deutsch',   flag: '🇩🇪' },
    { code: 'zh', name: 'Chinese',    nativeName: '中文',       flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese',   nativeName: '日本語',     flag: '🇯🇵' },
    { code: 'ar', name: 'Arabic',     nativeName: 'العربية',   flag: '🇸🇦' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    { code: 'si', name: 'Sinhala',    nativeName: 'සිංහල',     flag: '🇱🇰' },
    { code: 'ta', name: 'Tamil',      nativeName: 'தமிழ்',     flag: '🇱🇰' },
];

export default function LanguageScreen() {
    const router = useRouter();
    const { current } = useLocalSearchParams<{ current?: string }>();
    const [selected, setSelected] = useState(current ?? 'English');

    useEffect(() => {
        AsyncStorage.getItem('app_language').then((val) => {
            if (val) setSelected(val);
        });
    }, []);

    const selectedLang = LANGUAGES.find(l => l.name === selected) ?? LANGUAGES[0];

    const handleSelect = async (lang: Language) => {
        setSelected(lang.name);
        await AsyncStorage.setItem('app_language', lang.name);
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: '',
                    headerLeft: () => (
                        <BackButton onPress={() => {
                            router.back();
                            router.setParams({ language: selected });
                        }} />
                    ),
                    headerTitle: () => <Text style={styles.headerTitle}>Language</Text>,
                    headerTitleAlign: 'left',
                    headerRight: () => <View />,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8F9FA' },
                }}
            />

            {/* Instruction Text - Spacing matched to Temperature Screen */}
            <View style={styles.subtitleRow}>
                <Ionicons name="globe-outline" size={16} color="#6C757D" />
                <Text style={styles.subtitle}>Choose your preferred language</Text>
            </View>

            {/* Current banner */}
            <View style={styles.currentBanner}>
                <Text style={styles.currentFlag}>{selectedLang.flag}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.currentLabel}>Current language</Text>
                    <Text style={styles.currentName}>
                        {selectedLang.name}
                        <Text style={styles.currentNative}> · {selectedLang.nativeName}</Text>
                    </Text>
                </View>
                <Ionicons name="checkmark-circle" size={22} color={Colors.brand} />
            </View>

            {/* Language list */}
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>All Languages</Text>
                
                <View style={styles.listCard}>
                    {LANGUAGES.map((lang, index) => {
                        const isSelected = selected === lang.name;
                        const isLast = index === LANGUAGES.length - 1;
                        return (
                            <TouchableOpacity
                                key={lang.code}
                                style={[styles.langItem, !isLast && styles.langItemBorder]}
                                onPress={() => handleSelect(lang)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.flag}>{lang.flag}</Text>
                                <View style={styles.langNames}>
                                    <Text style={[styles.langName, isSelected && styles.langNameActive]}>
                                        {lang.name}
                                    </Text>
                                    <Text style={styles.nativeName}>{lang.nativeName}</Text>
                                </View>
                                <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },

    headerBackBtn: { marginLeft: 4, marginTop: 20 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginLeft: 12, marginTop: 20 },

    subtitleRow: {
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8,
        paddingHorizontal: 20, 
        paddingTop: 20, // Space between header and text like temperature code
        marginBottom: 14, // Consistent gap to the next element
    },
    subtitle: { 
        fontSize: 15, 
        color: '#6C757D', 
        fontWeight: '500' 
    },

    currentBanner: {
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12,
        marginHorizontal: 20, 
        marginBottom: 24,
        backgroundColor: 'rgba(143,217,229,0.08)', 
        borderRadius: 16, 
        padding: 16,
        borderWidth: 1.5, 
        borderColor: 'rgba(143,217,229,0.25)',
    },
    currentFlag: { fontSize: 28 },
    currentLabel: {
        fontSize: 11, 
        color: Colors.brand, 
        fontWeight: '700',
        marginBottom: 2, 
        textTransform: 'uppercase', 
        letterSpacing: 0.5,
    },
    currentName: { fontSize: 15, fontWeight: '700', color: '#333' },
    currentNative: { fontSize: 14, fontWeight: '500', color: '#ADB5BD' },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    
    sectionLabel: {
        fontSize: 15,
        color: '#6C757D',
        marginBottom: 14, // Matched gap
        fontWeight: '500',
    },

    listCard: {
        backgroundColor: '#FFFFFF', 
        borderRadius: 18,
        borderWidth: 1, 
        borderColor: '#F1F3F5', 
        overflow: 'hidden',
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, 
        shadowRadius: 8, 
        elevation: 3,
    },
    langItem: {
        flexDirection: 'row', 
        alignItems: 'center',
        paddingHorizontal: 18, 
        paddingVertical: 15, 
        gap: 14,
    },
    langItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
    flag: { fontSize: 24, width: 32, textAlign: 'center' },
    langNames: { flex: 1 },
    langName: { fontSize: 15, fontWeight: '600', color: '#495057', marginBottom: 1 },
    langNameActive: { color: '#222', fontWeight: '700' },
    nativeName: { fontSize: 12, color: '#ADB5BD', fontWeight: '400' },
    radioOuter: {
        width: 22, 
        height: 22, 
        borderRadius: 11, 
        borderWidth: 2,
        borderColor: '#CED4DA', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexShrink: 0,
    },
    radioOuterActive: { borderColor: Colors.brand },
    radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.brand },
});