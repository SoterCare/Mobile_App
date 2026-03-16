import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NeumorphicCard } from '../ui/NeumorphicCard';

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    hasToggle?: boolean;
    isToggled?: boolean;
    onToggle?: (val: boolean) => void;
    onPress?: () => void;
    showBorder?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    value,
    hasToggle,
    isToggled,
    onToggle,
    onPress,
    showBorder = true
}) => (
    <TouchableOpacity
        style={[styles.menuItem, showBorder && styles.menuItemBorder]}
        onPress={onPress}
        disabled={hasToggle}
        activeOpacity={0.7}
    >
        <View style={styles.menuItemLeft}>
            <Ionicons name={icon} size={22} color="#555" style={styles.icon} />
            <Text style={styles.menuLabel}>{label}</Text>
        </View>

        <View style={styles.menuItemRight}>
            {hasToggle ? (
                <Switch
                    value={isToggled}
                    onValueChange={onToggle}
                    trackColor={{ false: "#D1D1D1", true: "#91D7E4" }}
                    thumbColor={"#FFFFFF"}
                />
            ) : (
                <>
                    {value && <Text style={styles.valueText}>{value}</Text>}
                    <Ionicons name="chevron-forward" size={18} color="#BBB" />
                </>
            )}
        </View>
    </TouchableOpacity>
);

export const ProfileSettingsCard: React.FC = () => {
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    return (
        <NeumorphicCard style={styles.cardContainer}>
            <View style={styles.cardContent}>
                <MenuItem
                    icon="notifications-outline"
                    label="App Notifications"
                    hasToggle
                    isToggled={notificationsEnabled}
                    onToggle={setNotificationsEnabled}
                    showBorder={true}
                />
                <MenuItem
                    icon="cash-outline"
                    label="Subscription"
                    onPress={() => router.push('/subscription' as any)}
                    showBorder={true}
                />
                <MenuItem
                    icon="card-outline"
                    label="Payment Method"
                    onPress={() => router.push('/settings/payment' as any)}
                    showBorder={true}
                />
                <MenuItem
                    icon="thermometer-outline"
                    label="Temperature"
                    value="°F"
                    onPress={() => router.push('/settings/temperature' as any)}
                    showBorder={true}
                />
                <MenuItem
                    icon="globe-outline"
                    label="Language"
                    value="English"
                    showBorder={false} // No border for the last item
                    onPress={() => router.push('/settings/language' as any)}
                />
            </View>
        </NeumorphicCard>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardContent: {
        paddingHorizontal: 20,
        paddingVertical: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
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
        color: '#444',
        fontWeight: '600',
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    valueText: {
        fontSize: 15,
        color: '#AAA',
        marginRight: 8,
        fontWeight: '500',
    },
});