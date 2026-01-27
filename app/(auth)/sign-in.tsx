import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useGoogleAuth, processGoogleAuthResponse, useFacebookAuth, processFacebookAuthResponse, appleSignIn } from '@/services/socialAuthService';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSocialLoading, setIsSocialLoading] = useState(false);
    
    // Google OAuth hook
    const { request: googleRequest, response: googleResponse, promptAsync: googlePromptAsync } = useGoogleAuth();
    
    // Facebook OAuth hook
    const { request: facebookRequest, response: facebookResponse, promptAsync: facebookPromptAsync } = useFacebookAuth();

    // Handle Google auth response
    useEffect(() => {
        if (googleResponse) {
            handleGoogleResponse();
        }
    }, [googleResponse]);
    
    // Handle Facebook auth response
    useEffect(() => {
        if (facebookResponse) {
            handleFacebookResponse();
        }
    }, [facebookResponse]);

    const handleGoogleResponse = async () => {
        try {
            setIsSocialLoading(true);
            const result = await processGoogleAuthResponse(googleResponse);
            
            if (result.cancelled) {
                return;
            }
            
            if (!result.success || !result.user) {
                Alert.alert('Error', result.error || 'Google sign-in failed');
                return;
            }
            
            // Success - show user info for now
            Alert.alert('Success', `Signed in as ${result.user.email}`);
            // TODO: Send provider token to backend -> receive session token + user -> authContext.signIn(token, user); router.replace("/(tabs)")
        } catch (error: any) {
            Alert.alert('Error', 'Google sign-in failed');
        } finally {
            setIsSocialLoading(false);
        }
    };
    
    const handleFacebookResponse = async () => {
        try {
            setIsSocialLoading(true);
            const result = await processFacebookAuthResponse(facebookResponse);
            
            if (result.cancelled) {
                return;
            }
            
            if (!result.success || !result.user) {
                Alert.alert('Error', result.error || 'Facebook sign-in failed');
                return;
            }
            
            // Success - show user info for now
            Alert.alert('Success', `Signed in with Facebook as ${result.user.email || result.user.name || 'user'}`);
            // TODO: Send provider token to backend -> receive session token + user -> authContext.signIn(token, user); router.replace("/(tabs)")
        } catch (error: any) {
            Alert.alert('Error', 'Facebook sign-in failed');
        } finally {
            setIsSocialLoading(false);
        }
    };

    const handleSignIn = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        try {
            setIsLoading(true);
            await authService.sendLoginCode(email);
            router.push({
                pathname: '/(auth)/otp-verification',
                params: { email, mode: 'signin' }
            });
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to send login code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (isSocialLoading || !googleRequest) return;
        try {
            setIsSocialLoading(true);
            await googlePromptAsync();
            // Response is handled in useEffect above
        } catch (error: any) {
            Alert.alert('Error', 'Failed to start Google sign-in');
            setIsSocialLoading(false);
        }
    };

    const handleFacebookSignIn = async () => {
        if (isSocialLoading || !facebookRequest) return;
        try {
            setIsSocialLoading(true);
            await facebookPromptAsync();
            // Response is handled in useEffect above
        } catch (error: any) {
            Alert.alert('Error', 'Failed to start Facebook sign-in');
            setIsSocialLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        if (isSocialLoading) return;
        try {
            setIsSocialLoading(true);
            const result = await appleSignIn();
            
            if (result.cancelled) {
                return;
            }
            
            if (!result.success || !result.user) {
                Alert.alert('Error', result.error || 'Apple sign-in failed');
                return;
            }
            
            // Success - show user info for now
            Alert.alert('Success', `Signed in with Apple as ${result.user.email || result.user.name || 'user'}`);
            // TODO: Send provider token to backend -> receive session token + user -> authContext.signIn(token, user); router.replace("/(tabs)")
        } catch (error: any) {
            Alert.alert('Error', 'Apple sign-in failed');
        } finally {
            setIsSocialLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Sign In</Text>
                </View>

                <View style={styles.form}>
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
                        onPress={handleSignIn}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Continue'}</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or sign in with</Text>
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
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 60,
    },
    backButton: {
        marginRight: 20,
        padding: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    form: {
        gap: 30,
    },
    inputContainer: {
        marginBottom: 10,
    },
    input: {
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        fontSize: 16,
        color: '#333',
        paddingVertical: 10,
    },
    button: {
        height: 50,
        backgroundColor: '#8FD9E5', // Cyan/Light Blue matching the design
        borderRadius: 25,
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
        marginTop: 10,
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
        marginTop: 20,
        marginBottom: 20,
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
        borderRadius: 30, // Pill/Circle shape
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
});
