import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { User } from '@/types/auth.types';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
    user: User | null;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.avatarContainer}>
                {/* Placeholder Avatar */}
                <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#fff" />
                </View>
                {/* <Image source={{ uri: user?.avatar }} style={styles.avatar} /> */}
            </View>
            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <View style={styles.idBadge}>
                <Text style={styles.idText}>ID: {user?.userId?.substring(0, 8) || 'Unknown'}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#91D7E4', // Cyan Theme
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    idBadge: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    idText: {
        fontSize: 12,
        color: '#888',
        fontFamily: 'monospace',
    },
});
