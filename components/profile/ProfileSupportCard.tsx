import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NeumorphicCard } from '../ui/NeumorphicCard';

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    showBorder?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, showBorder = true }) => (
    <TouchableOpacity style={[styles.menuItem, showBorder && styles.menuItemBorder]} onPress={onPress}>
        <View style={styles.menuItemLeft}>
            <Ionicons name={icon} size={22} color="#555" style={styles.icon} />
            <Text style={styles.menuLabel}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#A0A0A0" />
    </TouchableOpacity>
);

interface ProfileSupportCardProps {
    onLogout: () => void;
}

export const ProfileSupportCard: React.FC<ProfileSupportCardProps> = ({ onLogout }) => {
    const router = useRouter();

    return (
        <NeumorphicCard style={styles.cardContainer}>
            <View style={styles.cardContent}>
                <MenuItem
                    icon="information-circle-outline"
                    label="About"
                    onPress={() => router.push('/settings/about' as any)}
                />
                <MenuItem
                    icon="help-circle-outline"
                    label="Help and Support"
                    onPress={() => router.push('/settings/help' as any)}
                />
                <MenuItem
                    icon="log-out-outline"
                    label="Log Out"
                    onPress={onLogout}
                    showBorder={false}
                />
            </View>
        </NeumorphicCard>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 30,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        width: '102%',
        marginLeft: -4,
    },
    cardContent: {
        paddingVertical: 5,
        paddingHorizontal: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#e2e2e2',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 15,
        width: 24,
    },
    menuLabel: {
        fontSize: 16,
        color: '#4A4A4A',
        fontWeight: '600',
    },
});
