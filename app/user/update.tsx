import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';

// Helper for initials
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

export default function EditProfileScreen() {
    const router = useRouter();
    const { user } = useAuth(); // Assuming this context provides user data

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isLoading, setIsLoading] = useState(false);

    // OTP Modal State
    const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
    const [otp, setOtp] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');

    const handleSave = async () => {
        if (!name || !email) {
            Alert.alert('Error', 'Name and Email are required.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Check if Email changed
            if (email !== user?.email) {
                // Initiate Email Update Flow
                await userService.initiateEmailUpdate(user?.userId || '', email);
                setPendingEmail(email);
                setIsOtpModalVisible(true);
                setIsLoading(false); // Stop loading to let user enter OTP
                return; // Stop here, wait for OTP
            }

            // 2. If valid or no email change, update profile (Name, Phone)
            await updateProfileData();

        } catch (error: any) {
            console.error('Update error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update user');
        } finally {
            if (!isOtpModalVisible) {
                setIsLoading(false);
            }
        }
    };

    const updateProfileData = async () => {
        try {
            await userService.updateProfile({
                userId: user?.userId,
                name,
                email: user?.email, // Send OLD email for profile update to avoid "verification required" error if applicable
                phone
            });
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            throw error;
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) { // Assuming OTP is at least 4 digits
            Alert.alert('Error', 'Please enter a valid OTP');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Verify Email
            await userService.verifyEmailUpdate(user?.userId || '', pendingEmail, otp);

            // 2. After verified, update other profile details too
            await updateProfileData();

            setIsOtpModalVisible(false);
        } catch (error: any) {
            console.error('OTP Verify error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
            setIsLoading(false);
        }
    };

    const initials = name ? getInitials(name) : 'U';

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Edit Profile',
                    headerTitleStyle: {
                        fontSize: 20,
                        fontWeight: '600',
                        color: '#333',
                    },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -8 }}>
                            <Ionicons name="chevron-back" size={28} color="#333" />
                        </TouchableOpacity>
                    ),
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F9FAFB' }, // Light gray background to match screen
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{initials}</Text>
                            <TouchableOpacity style={styles.cameraButton}>
                                <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Data not found"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email address</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Data not found"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+94 xx xxx xxxx"
                                keyboardType="phone-pad"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* OTP Modal */}
            <Modal
                transparent={true}
                visible={isOtpModalVisible}
                animationType="fade"
                onRequestClose={() => setIsOtpModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Verify Email</Text>
                        <Text style={styles.modalDescription}>
                            We sent a verification code to {pendingEmail}. Please enter it below.
                        </Text>

                        <TextInput
                            style={styles.otpInput}
                            value={otp}
                            onChangeText={setOtp}
                            placeholder="Enter OTP"
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsOtpModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.verifyButton]}
                                onPress={handleVerifyOtp}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.verifyButtonText}>Verify</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    avatarSection: {
        marginTop: 20,
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#8FD9E5',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatarText: {
        fontSize: 40,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#C4C4C4',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#F9FAFB',
    },
    formContainer: {
        width: '100%',
        marginBottom: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#888',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    saveButton: {
        backgroundColor: '#8FD9E5',
        borderRadius: 25,
        width: '100%',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    modalDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    otpInput: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 4,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
    },
    verifyButton: {
        backgroundColor: '#8FD9E5',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    verifyButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
});
