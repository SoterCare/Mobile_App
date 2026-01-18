import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    isDestructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, isDestructive }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, isDestructive && styles.destructiveIcon]}>
                <Ionicons name={icon} size={20} color={isDestructive ? '#FF3B30' : '#555'} />
            </View>
            <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
    </TouchableOpacity>
);

interface ProfileMenuProps {
    onLogout: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ onLogout }) => {
    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <MenuItem icon="person-outline" label="Personal Details" onPress={() => { }} />
                <MenuItem icon="notifications-outline" label="Notifications" onPress={() => { }} />
                <MenuItem icon="shield-checkmark-outline" label="Privacy & Security" onPress={() => { }} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <MenuItem icon="help-circle-outline" label="Help Center" onPress={() => { }} />
                <MenuItem icon="document-text-outline" label="Terms & Conditions" onPress={() => { }} />
            </View>

            <View style={styles.section}>
                <MenuItem icon="log-out-outline" label="Log Out" onPress={onLogout} isDestructive />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
        marginBottom: 10,
        marginLeft: 10,
        textTransform: 'uppercase',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 10,
        borderRadius: 12,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    destructiveIcon: {
        backgroundColor: '#FFEBEE',
    },
    menuLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    destructiveLabel: {
        color: '#FF3B30',
    },
});
