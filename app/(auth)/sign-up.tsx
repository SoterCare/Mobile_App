import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { isValidEmail } from "../../utils/validation";


export default function SignUpScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

const handleSignUp = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
    }

    // ✅ EMAIL FORMAT VALIDATION 
    if (!isValidEmail(cleanEmail)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
    }

    if (!agreed) {
        Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy');
        return;
    }

    try {
        setIsLoading(true);

        // ✅ use cleaned values
        await authService.sendSignupCode(cleanName, cleanEmail);

        router.push({
            pathname: '/(auth)/otp-verification',
            params: { email: cleanEmail, mode: 'signup' }
        });
    } catch (error: any) {
        Alert.alert(
            'Error',
            error.response?.data?.message || 'Failed to send verification code'
        );
    } finally {
        setIsLoading(false);
    }
};


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Sign Up</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            placeholderTextColor="#aaa"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#aaa"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleSignUp}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>{isLoading ? 'Registering...' : 'Register'}</Text>
                    </TouchableOpacity>

                    <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                            style={[styles.checkbox, agreed && styles.checkboxChecked]}
                            onPress={() => setAgreed(!agreed)}
                        >
                            {agreed && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </TouchableOpacity>
                        <Text style={styles.checkboxLabel}>
                            By signing up you accept the <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>
                        </Text>
                    </View>

                    <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                        <Text style={styles.signInLink}>
                            Already have an account? <Text style={styles.signInLinkHighlight}>Sign In</Text>
                        </Text>
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
        paddingHorizontal: 30,
        justifyContent: 'flex-start',
        paddingTop: 60,
    },
    header: {
        marginBottom: 50,
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    form: {
        gap: 25,
    },
    inputContainer: {
        marginBottom: 5,
    },
    input: {
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        fontSize: 16,
        color: '#333',
        paddingVertical: 10,
    },
    button: {
        height: 50,
        backgroundColor: '#8FD9E5', // Cyan/Light Blue
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ccc',
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
    },
    checkboxChecked: {
        backgroundColor: '#8FD9E5',
        borderColor: '#8FD9E5',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
    link: {
        color: '#8FD9E5',
        fontWeight: '600',
    },
    signInLink: {
        textAlign: 'center',
        fontSize: 14,
        color: '#888',
        marginTop: 30,
    },
    signInLinkHighlight: {
        color: '#8FD9E5',
        fontWeight: '600',
    },
});
