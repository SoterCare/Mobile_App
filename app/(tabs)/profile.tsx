import React from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DottedBackground } from '@/components/ui/DottedBackground';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';

// Components
import { ProfileUserCard } from '@/components/profile/ProfileUserCard';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { ProfileSupportCard } from '@/components/profile/ProfileSupportCard';
import { ScreenTitle } from '@/components/ui/ScreenTitle';
import { Colors } from '@/theme/tokens';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';

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

    const swipeHandlers = useSwipeTabs();

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']} {...(swipeHandlers as any)}>
            <DottedBackground />
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <ScreenTitle>Profile</ScreenTitle>

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
        backgroundColor: 'transparent',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
});

