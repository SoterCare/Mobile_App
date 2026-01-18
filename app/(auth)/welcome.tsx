import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.content}>
                <Image
                    source={require('@/assets/images/SoterCare-Primary-logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>Welcome to SoterCare</Text>
                <Text style={styles.subtitle}>Your Trusted Healthcare Companion</Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={() => router.push('/(auth)/sign-up')}
                    >
                        <Text style={styles.primaryButtonText}>Sign Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={() => router.push('/(auth)/sign-in')}
                    >
                        <Text style={styles.secondaryButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    logo: {
        width: 240,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 60,
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        gap: 20,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 28, // Pill shape
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.15,
        shadowRadius: 4.65,
        elevation: 6,
    },
    primaryButton: {
        backgroundColor: '#8FD9E5', // Cyan
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#8FD9E5',
        shadowColor: 'transparent',
        elevation: 0,
    },
    secondaryButtonText: {
        color: '#8FD9E5',
        fontSize: 18,
        fontWeight: '700',
    },
});
