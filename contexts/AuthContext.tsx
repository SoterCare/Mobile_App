import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthContextType,
  AuthState,
  User,
  JWTPayload,
} from '@/types/auth.types';
import { jwtDecode } from "jwt-decode";

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Manages authentication state and provides auth methods to the entire app
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state on app startup
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');

      if (token) {
        try {
          // Decode token and check expiration
          const decoded = jwtDecode<JWTPayload>(token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp && decoded.exp < currentTime) {
            // Token expired
            console.log('Token expired, signing out');
            await signOut();
            return;
          }

          // Construct user from valid token
          const user: User = {
            userId: decoded.userId,
            email: decoded.email,
            name: decoded.name,
          };

          setAuthState({
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Invalid token format:', error);
          await signOut();
        }
      } else {
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const signIn = async (token: string, user?: User): Promise<void> => {
    try {
      await AsyncStorage.setItem('accessToken', token);

      let userToSet: User | null = user || null;

      // If user is not provided, try to extract from token
      if (!userToSet) {
        try {
          const decoded = jwtDecode<JWTPayload>(token);
          userToSet = {
            userId: decoded.userId,
            email: decoded.email,
            name: decoded.name,
          };
        } catch (error) {
          console.warn('Failed to decode token during sign-in:', error);
        }
      }

      if (userToSet) {
        await AsyncStorage.setItem('user', JSON.stringify(userToSet));
      }

      setAuthState({
        user: userToSet,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('SignIn error:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');

      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('SignOut error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user: authState.user,
    token: authState.token,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
