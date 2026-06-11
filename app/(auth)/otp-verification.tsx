import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, circle } from '@/theme/tokens';

export default function OTPVerificationScreen() {
    const router = useRouter();
    const { email, mode } = useLocalSearchParams() as { email: string; mode: 'signup' | 'signin' };
    // 6 digits state
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<Array<TextInput | null>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];

        // Handle paste event (length > 1)
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split('');
            for (let i = 0; i < 6; i++) {
                if (pastedCode[i]) {
                    newOtp[i] = pastedCode[i];
                }
            }
            setOtp(newOtp);

            // Focus the last filled input or the next empty one
            const lastIndex = Math.min(pastedCode.length - 1, 5);
            inputRefs.current[lastIndex]?.focus();
            return;
        }

        // Normal input
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleBackspace = (value: string, index: number) => {
        if (!value && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit code');
            return;
        }

        try {
            setIsLoading(true);
            let response;

            if (mode === 'signup') {
                response = await authService.verifyRegistration(email, otpValue);

                // 1. Check for token FIRST (Auto-login)
                if (response?.accessToken) {
                    const userData = response.user ? {
                        userId: String(response.user.id),
                        email: response.user.email,
                        name: response.user.name,
                    } : { email, userId: 'temp' };

                    await signIn(response.accessToken, userData);
                    // No need to alert, root layout handles redirect
                    return;
                }

                // 2. If no token, check success flag (Fallback)
                if (response?.success) {
                    Alert.alert(
                        'Success',
                        'Registration successful! Please sign in.',
                        [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
                    );
                    return;
                }
            } else {
                response = await authService.verifyLogin(email, otpValue);
            }

            if (response && response.accessToken) {
                const userData = response.user ? {
                    userId: String(response.user.id),
                    email: response.user.email,
                    name: response.user.name,
                } : { email, userId: 'temp' };
                await signIn(response.accessToken, userData);
            } else {
                throw new Error('Invalid response from server');
            }

        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verify Email</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="mail-open-outline" size={40} color={Colors.brand} />
                    </View>
                </View>

                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>
                    Please enter the code we sent to <Text style={styles.emailText}>{email}</Text>
                </Text>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={styles.otpInput}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={({ nativeEvent }) => {
                                if (nativeEvent.key === 'Backspace') {
                                    handleBackspace(digit, index);
                                }
                            }}
                            keyboardType="number-pad"
                            maxLength={index === 0 ? 6 : 1} // allow pasting 6 digits in the first box
                            textAlign="center"
                            selectTextOnFocus
                            textContentType="oneTimeCode" // Enable iOS AutoFill
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>{isLoading ? 'Verifying...' : 'Verify'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendContainer}>
                    <Text style={styles.resendText}>
                        Didn&apos;t receive the code? <Text style={styles.resendLink}>Click to resend</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 40,
    },
    backButton: {
        padding: 5,
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: circle(80),
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderColor: Colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    emailText: {
        fontWeight: '600',
        color: '#333',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 40,
        paddingHorizontal: 5,
    },
    otpInput: {
        width: 45, // Adjusted for 6 digits
        height: 50,
        borderWidth: 1.5,
        borderColor: '#ccc',
        borderRadius: Radius.xs,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#fff',
        color: '#333',
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: Colors.brand, // Cyan/Light Blue
        borderRadius: Radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        marginBottom: 30,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resendContainer: {
        marginTop: 0,
    },
    resendText: {
        color: '#888',
        fontSize: 14,
    },
    resendLink: {
        color: Colors.brand,
        fontWeight: 'bold',
    },
});
