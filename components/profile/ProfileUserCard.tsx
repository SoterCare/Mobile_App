import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { User } from '@/types/auth.types';
import { Ionicons } from '@expo/vector-icons';
import { NeumorphicCard } from '../ui/NeumorphicCard';

interface ProfileUserCardProps {
    user: User | null;
}

export const ProfileUserCard: React.FC<ProfileUserCardProps> = ({ user }) => {
    const router = useRouter();

    // Get Initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const initials = user?.name ? getInitials(user.name) : 'U';

    const handlePress = () => {
        router.push('/user/update');
    };

    return (
        <NeumorphicCard style={styles.cardContainer}>
            <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
                <View style={styles.contentRow}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
                </View>
            </TouchableOpacity>
        </NeumorphicCard>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 24,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#8FD9E5', // Cyan/Teal from image
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
});
