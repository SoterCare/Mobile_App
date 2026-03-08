import React from 'react';
import { StyleSheet, ScrollView, Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';

// Components
import { ProfileUserCard } from '@/components/profile/ProfileUserCard';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { ProfileSupportCard } from '@/components/profile/ProfileSupportCard';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            console.error('Logout failed:', error);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <Text style={styles.screenTitle}>Profile</Text>

                <ProfileUserCard user={user} />

                <ProfileSettingsCard />

                <ProfileSupportCard onLogout={handleLogout} />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f3f7', // Neumorphic Base
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        marginTop: 10,
    },
});   

