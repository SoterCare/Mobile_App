import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LanguageScreen() {
    const [selected, setSelected] = useState('English');
    const router = useRouter();
    const languages = ['English', 'Spanish', 'French', 'German', 'Chinese'];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Language</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.list}>
                {languages.map((lang) => (
                    <TouchableOpacity 
                        key={lang} 
                        style={styles.item}
                        onPress={() => setSelected(lang)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.itemText, selected === lang && styles.activeText]}>{lang}</Text>
                        {selected === lang && <Ionicons name="checkmark" size={24} color="#8FD9E5" />}
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
    list: { padding: 20 },
    item: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#FFF', 
        padding: 20, 
        borderRadius: 18, 
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F3F5'
    },
    itemText: { fontSize: 16, fontWeight: '600', color: '#495057' },
    activeText: { color: '#333' }
});