import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { LoginCredentials, SignupCredentials, User, JWTPayload } from '@/types/auth.types';
import { authApi } from '@/api';

// Storage Keys
const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';

/**
 * Decode JWT token and extract user information
 */
export const decodeToken = (token: string): User => {
  try {
    const decoded: JWTPayload = jwtDecode(token);
    
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    throw new Error('Invalid token');
  }
};

/**
 * Store authentication data in AsyncStorage
 */
export const storeAuthData = async (token: string, user: User): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);
  } catch (error) {
    console.error('Error storing auth data:', error);
    throw new Error('Failed to store authentication data');
  }
};

/**
 * Retrieve authentication data from AsyncStorage
 */
export const getAuthData = async (): Promise<{ token: string | null; user: User | null }> => {
  try {
    const [[, token]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
    
    if (!token) {
      return { token: null, user: null };
    }

    // Verify token is still valid
    try {
      const user = decodeToken(token);
      return { token, user };
    } catch {
      // Token is invalid or expired
      await clearAuthData();
      return { token: null, user: null };
    }
  } catch (error) {
    console.error('Error retrieving auth data:', error);
    return { token: null, user: null };
  }
};

/**
 * Clear authentication data from AsyncStorage
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw new Error('Failed to clear authentication data');
  }
};

/**
 * Login user
 */
export const loginUser = async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
  try {
    const response = await authApi.login(credentials);
    
    const { token } = response;
    
    if (!token) {
      throw new Error('No token received from server');
    }

    const user = decodeToken(token);
    await storeAuthData(token, user);

    return { token, user };
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
  }
};

/**
 * Signup user
 */
export const signupUser = async (credentials: SignupCredentials): Promise<{ token: string; user: User }> => {
  try {
    const response = await authApi.signup(credentials);
    
    const { token } = response;
    
    if (!token) {
      throw new Error('No token received from server');
    }

    const user = decodeToken(token);
    await storeAuthData(token, user);

    return { token, user };
  } catch (error: any) {
    console.error('Signup error:', error);
    throw new Error(error.response?.data?.message || 'Signup failed. Please try again.');
  }
};

/**
 * Logout user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Optional: Call backend logout endpoint
    await authApi.logout().catch(() => {
      // Ignore logout API errors, still clear local data
    });
    
    await clearAuthData();
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Logout failed. Please try again.');
  }
};

/**
 * Refresh token (if your API supports it)
 */
export const refreshToken = async (): Promise<{ token: string; user: User } | null> => {
  try {
    const response = await authApi.refreshToken();
    
    const { token } = response;
    
    if (!token) {
      return null;
    }

    const user = decodeToken(token);
    await storeAuthData(token, user);

    return { token, user };
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
};
