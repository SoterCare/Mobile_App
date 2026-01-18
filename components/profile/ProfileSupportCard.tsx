import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
);

interface ProfileSupportCardProps {
    onLogout: () => void;
}

export const ProfileSupportCard: React.FC<ProfileSupportCardProps> = ({ onLogout }) => {
    return (
        <NeumorphicCard style={styles.cardContainer}>
            <View style={styles.cardContent}>
                <MenuItem
                    icon="information-circle-outline"
                    label="About"
                    onPress={() => { }}
                />
                <MenuItem
                    icon="help-circle-outline"
                    label="Help and Support"
                    onPress={() => { }}
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
        marginBottom: 24,
    },
    cardContent: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 12,
        width: 24,
    },
    menuLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
});
