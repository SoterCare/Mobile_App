import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Ensure auth session completes properly when returning to app
WebBrowser.maybeCompleteAuthSession();

// Types
export interface SocialUser {
    name: string;
    email: string;
    picture: string | null;
    provider: 'google' | 'facebook' | 'apple';
    providerToken: string;
    idToken?: string;
}

export interface SocialAuthResult {
    success: boolean;
    user?: SocialUser;
    error?: string;
    cancelled?: boolean;
}

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Build redirect URI based on environment
export const getRedirectUri = () => {
    return AuthSession.makeRedirectUri({
        scheme: 'sotercare',
        path: 'auth',
        // Use proxy for Expo Go, native redirect for standalone builds
        ...(isExpoGo && { useProxy: true }),
    });
};

// ============================================
// GOOGLE OAUTH
// ============================================

const googleConfig = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
};

/**
 * Custom hook for Google Sign In
 * Must be called at the top level of a component
 */
export const useGoogleAuth = () => {
    const redirectUri = getRedirectUri();
    
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: googleConfig.webClientId,
        androidClientId: googleConfig.androidClientId,
        iosClientId: googleConfig.iosClientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
    });

    return { request, response, promptAsync };
};

/**
 * Fetch Google user profile using access token
 */
export const fetchGoogleUserProfile = async (accessToken: string): Promise<SocialUser> => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Google user profile');
    }

    const data = await response.json();
    
    return {
        name: data.name || '',
        email: data.email || '',
        picture: data.picture || null,
        provider: 'google',
        providerToken: accessToken,
    };
};

/**
 * Process Google auth response
 */
export const processGoogleAuthResponse = async (
    response: AuthSession.AuthSessionResult | null
): Promise<SocialAuthResult> => {
    if (!response) {
        return { success: false, error: 'No response from Google' };
    }

    if (response.type === 'cancel') {
        return { success: false, cancelled: true };
    }

    if (response.type === 'error') {
        return { success: false, error: response.error?.message || 'Google sign-in error' };
    }

    if (response.type === 'success') {
        const { authentication } = response;
        
        if (!authentication?.accessToken) {
            return { success: false, error: 'No access token received' };
        }

        try {
            const user = await fetchGoogleUserProfile(authentication.accessToken);
            if (authentication.idToken) {
                user.idToken = authentication.idToken;
            }
            return { success: true, user };
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to get user profile' };
        }
    }

    // For any other response type (dismiss, locked, etc.), treat as cancelled
    return { success: false, cancelled: true };
};

// ============================================
// FACEBOOK OAUTH
// ============================================

const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';

/**
 * Custom hook for Facebook Sign In
 * Must be called at the top level of a component
 */
export const useFacebookAuth = () => {
    const redirectUri = getRedirectUri();
    
    // Build Facebook OAuth discovery document
    const discovery = {
        authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
        tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
    };
    
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: facebookAppId,
            scopes: ['email', 'public_profile'],
            redirectUri,
            responseType: AuthSession.ResponseType.Token,
        },
        discovery
    );

    return { request, response, promptAsync };
};

/**
 * Process Facebook auth response
 */
export const processFacebookAuthResponse = async (
    response: AuthSession.AuthSessionResult | null
): Promise<SocialAuthResult> => {
    if (!response) {
        return { success: false, error: 'No response from Facebook' };
    }

    if (response.type === 'cancel') {
        return { success: false, cancelled: true };
    }

    if (response.type === 'error') {
        return { success: false, error: response.error?.message || 'Facebook sign-in error' };
    }

    if (response.type === 'success') {
        // Extract access token from params
        const accessToken = response.params?.access_token;
        
        if (!accessToken) {
            return { success: false, error: 'No access token received from Facebook' };
        }

        try {
            // Fetch user profile from Facebook Graph API
            const userResponse = await fetch(
                `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
            );

            if (!userResponse.ok) {
                throw new Error('Failed to fetch Facebook user profile');
            }

            const userData = await userResponse.json();

            const user: SocialUser = {
                name: userData.name || '',
                email: userData.email || '',
                picture: userData.picture?.data?.url || null,
                provider: 'facebook',
                providerToken: accessToken,
            };

            return { success: true, user };
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to get Facebook user profile' };
        }
    }

    // For any other response type (dismiss, locked, etc.), treat as cancelled
    return { success: false, cancelled: true };
};

/**
 * Legacy function for backward compatibility
 * Shows error message directing to use hook-based approach
 */
export const facebookSignIn = async (): Promise<SocialAuthResult> => {
    if (!facebookAppId) {
        return {
            success: false,
            error: 'Facebook App ID not configured. Please add EXPO_PUBLIC_FACEBOOK_APP_ID to your .env file.',
        };
    }
    
    // This function exists for backward compatibility
    // The actual implementation uses hooks (useFacebookAuth)
    return {
        success: false,
        error: 'Please use useFacebookAuth hook for Facebook sign-in.',
    };
};

// ============================================
// APPLE SIGN IN
// ============================================

/**
 * Apple Sign In - iOS only
 * Uses expo-apple-authentication for native Apple Sign In
 */
export const appleSignIn = async (): Promise<SocialAuthResult> => {
    // Apple Sign In only works on iOS
    if (Platform.OS !== 'ios') {
        return {
            success: false,
            error: 'Apple Sign-In is only available on iOS devices.',
        };
    }

    try {
        // Check if Apple Authentication is available
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        
        if (!isAvailable) {
            return {
                success: false,
                error: 'Apple Sign-In is not available on this device.',
            };
        }

        // Request Apple Sign In
        const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
        });

        // Get identity token (JWT)
        const identityToken = credential.identityToken;
        
        if (!identityToken) {
            return {
                success: false,
                error: 'No identity token received from Apple',
            };
        }

        // Build user object
        // Note: Apple only returns name/email on first sign-in
        const user: SocialUser = {
            name: credential.fullName 
                ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
                : '',
            email: credential.email || '',
            picture: null, // Apple doesn't provide profile picture
            provider: 'apple',
            providerToken: identityToken,
        };

        return { success: true, user };
    } catch (error: any) {
        // Handle specific Apple auth errors
        if (error.code === 'ERR_REQUEST_CANCELED') {
            return { success: false, cancelled: true };
        }
        
        return { success: false, error: error.message || 'Apple sign-in failed' };
    }
};

// ============================================
// EXPORTS
// ============================================

export const socialAuthService = {
    // Google
    useGoogleAuth,
    fetchGoogleUserProfile,
    processGoogleAuthResponse,
    // Facebook
    useFacebookAuth,
    processFacebookAuthResponse,
    facebookSignIn,
    // Apple
    appleSignIn,
    // Utils
    getRedirectUri,
};

export default socialAuthService;
