import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { isValidEmail, isValidName } from "../../utils/validation";
import * as WebBrowser from 'expo-web-browser';
import { useGoogleAuth, processGoogleAuthResponse, useFacebookAuth, processFacebookAuthResponse, appleSignIn } from '@/services/socialAuthService';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Radius, circle } from '@/theme/tokens';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSocialLoading, setIsSocialLoading] = useState(false);

    // Google & Facebook OAuth hooks (unchanged)
    const { request: googleRequest, response: googleResponse, promptAsync: googlePromptAsync } = useGoogleAuth();
    const { request: facebookRequest, response: facebookResponse, promptAsync: facebookPromptAsync } = useFacebookAuth();

    useEffect(() => {
        if (googleResponse) handleGoogleResponse();
    }, [googleResponse]);

    useEffect(() => {
        if (facebookResponse) handleFacebookResponse();
    }, [facebookResponse]);

    // Social Auth Handlers (Logic remains the same as your original)
    const handleGoogleResponse = async () => { /* ... original logic ... */ };
    const handleFacebookResponse = async () => { /* ... original logic ... */ };
    const handleGoogleSignIn = async () => { /* ... original logic ... */ };
    const handleFacebookSignIn = async () => { /* ... original logic ... */ };
    const handleAppleSignIn = async () => { /* ... original logic ... */ };

    const handleSignUp = async () => {
        const cleanName = name.trim();
        const cleanEmail = email.trim();

        if (!cleanName || !cleanEmail) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (!isValidName(cleanName)) {
            Alert.alert('Error', 'Please enter a valid name (at least 4 characters, letters only)');
            return;
        }
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
            await authService.sendSignupCode(cleanName, cleanEmail);
            router.push({
                pathname: '/(auth)/otp-verification',
                params: { email: cleanEmail, mode: 'signup' }
            });
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Updated Header with Back Button */}
                <View style={styles.header}>
                    <BackButton />
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

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or sign up with</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialContainer}>
                        <TouchableOpacity style={styles.socialButton} onPress={handleFacebookSignIn} disabled={isSocialLoading}>
                            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn} disabled={isSocialLoading}>
                            <Ionicons name="logo-google" size={24} color="#DB4437" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn} disabled={isSocialLoading}>
                            <Ionicons name="logo-apple" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

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
        paddingTop: 20, // Adjusted for back button alignment
    },
    header: {
        flexDirection: 'row', // Align button and title horizontally
        alignItems: 'center',
        marginBottom: 60,
        marginTop: 10,
    },
    backButton: {
        marginRight: 5,
        padding: 5,
    },
    title: {
        fontSize: 25,
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
        backgroundColor: Colors.brand,
        borderRadius: Radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#eee',
    },
    dividerText: {
        marginHorizontal: 15,
        color: '#999',
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    socialButton: {
        width: 60,
        height: 60,
        borderRadius: circle(60),
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 3,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
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
    },
    checkboxChecked: {
        backgroundColor: Colors.brand,
        borderColor: Colors.brand,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 12,
        color: '#666',
    },
    link: {
        color: Colors.brand,
        fontWeight: '600',
    },
    signInLink: {
        textAlign: 'center',
        fontSize: 14,
        color: '#888',
        marginTop: 20,
    },
    signInLinkHighlight: {
        color: Colors.brand,
        fontWeight: '600',
    },
});