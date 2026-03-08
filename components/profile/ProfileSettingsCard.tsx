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
        // Disable the row press if it's a toggle item to prevent accidental navigation
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
                    trackColor={{ false: "#767577", true: "#8FD9E5" }}
                    thumbColor={"#f4f3f4"}
                />
            ) : (
                <>
                    {value && <Text style={styles.valueText}>{value}</Text>}
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
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
                {/* 1. App Notifications - Toggle only */}
                <MenuItem
                    icon="notifications-outline"
                    label="App Notifications"
                    hasToggle
                    isToggled={notificationsEnabled}
                    onToggle={setNotificationsEnabled}
                />
                
                {/* 2. Subscription - Points to app/subscription.tsx */}
                <MenuItem
                    icon="cash-outline"
                    label="Subscription"
                    onPress={() => router.push('/subscription')} 
                />
                
                {/* 3. Payment Method - Points to app/settings/payment.tsx */}
                <MenuItem
                    icon="card-outline"
                    label="Payment Method"
                    onPress={() => router.push('/settings/payment')} 
                />
                
                {/* 4. Temperature - Points to app/settings/temperature.tsx */}
                <MenuItem
                    icon="thermometer-outline"
                    label="Temperature"
                    value="°F"
                    onPress={() => router.push('/settings/temperature')} 
                />
                
                {/* 5. Language - Points to app/settings/language.tsx */}
                <MenuItem
                    icon="globe-outline"
                    label="Language"
                    value="English"
                    showBorder={false}
                    onPress={() => router.push('/settings/language')} 
                />
            </View>
        </NeumorphicCard>
    );
};

const styles = StyleSheet.create({
    cardContainer: { 
        marginBottom: 24 
    },
    cardContent: { 
        paddingVertical: 8, 
        paddingHorizontal: 16 
    },
    menuItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: 16 
    },
    menuItemBorder: { 
        borderBottomWidth: 1, 
        borderBottomColor: '#F0F0F0' 
    },
    menuItemLeft: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    icon: { 
        marginRight: 12, 
        width: 24 
    },
    menuLabel: { 
        fontSize: 16, 
        color: '#333', 
        fontWeight: '600' 
    },
    menuItemRight: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    valueText: { 
        fontSize: 14, 
        color: '#999', 
        marginRight: 8 
    },
});