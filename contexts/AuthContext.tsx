import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthContextType,
  AuthState,
  User,
  SignupArgs, // Import the new type
} from '@/types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userJson = await AsyncStorage.getItem('user');

      if (token && userJson) {
        setAuthState({
          user: JSON.parse(userJson),
          token,
          isLoading: false,
          isAuthenticated: true,
        });
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

  const signIn = async (token: string, user: User): Promise<void> => {
    try {
      await AsyncStorage.setItem('accessToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('SignIn error:', error);
      throw error;
    }
  };

  // 3. Implemented the signup function
  const signup = async ({ name, email, password }: SignupArgs): Promise<void> => {
    try {
      // Logic: Here you would typically call your backend API
      // Example: const response = await api.post('/auth/signup', { name, email, password });
      // const { token, user } = response.data;
      
      // For now, we simulate a successful signup and log them in
      // This is a placeholder; replace with your actual API call logic
      console.log('Signing up user:', name);
      
      // Example of auto-signing in after registration:
      // await signIn(fakeToken, fakeUser);
      
    } catch (error) {
      console.error('Signup error:', error);
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
    signup, // 4. Added signup to the provider value
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};