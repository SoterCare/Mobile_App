import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { User } from '@/types/auth.types';
import { Ionicons } from '@expo/vector-icons';

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
        <View style={styles.containerWrapper}>
            <View style={styles.cardContainer}>
                <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.contentRow}>
                    <View style={styles.infoContainer}>
                        <Text style={styles.userName}>{user?.name || 'John Doe'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'johndoe@gmail.com'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" style={styles.chevron} />
                </TouchableOpacity>
            </View>
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    containerWrapper: {
        marginBottom: 30,
        marginTop: 15, // Space for the overlapping avatar
        position: 'relative',
    },
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 25,
        paddingTop: 35, // Push content down to avoid avatar collision
        paddingBottom: 25,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    avatarContainer: {
        position: 'absolute',
        top: -24,
        left: 16,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#8FD9E5',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    avatarText: {
        fontSize: 26,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
        marginLeft: 8,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 6,
    },
    userEmail: {
        fontSize: 15,
        color: '#555555',
        fontWeight: '500',
    },
    chevron: {
        marginLeft: 16,
    }
});
