import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { User } from '@/types/auth.types';
import { Ionicons } from '@expo/vector-icons';

interface ProfileUserCardProps {
    user: User | null;
}

export const ProfileUserCard: React.FC<ProfileUserCardProps> = ({ user }) => {
    const router = useRouter();

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const initials = user?.name ? getInitials(user.name) : 'K';

    const handlePress = () => {
        router.push('/user/update');
    };

    return (
        <View style={styles.containerWrapper}>
            <View style={styles.cardContainer}>
                <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.contentRow}>
                    <View style={styles.infoContainer}>
                        <Text style={styles.userName}>{user?.name || 'Komudi'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'komudidhara@gmail.com'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#BBB" style={styles.chevron} />
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
        marginBottom: 20,
        marginTop: 30, // More space at the top to accommodate the higher avatar
        position: 'relative',
        paddingHorizontal: 1, // Fixes slight shadow clipping
    },
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 25,
        paddingBottom: 25,
        paddingTop: 45, // Pushes content down so it's not under the avatar
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    avatarContainer: {
        position: 'absolute',
        top: -32, // Moved further up from -24
        left: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#91D7E4',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        zIndex: 1, // Ensures avatar stays on top
    },
    avatarText: {
        fontSize: 26,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#5a5858',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#777777',
        fontWeight: '500',
    },
    chevron: {
        marginLeft: 16,
    }
});