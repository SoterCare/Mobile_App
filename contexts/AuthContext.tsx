import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  AuthContextType,
  AuthState,
  LoginCredentials,
  SignupCredentials,
} from '@/types/auth.types';
import {
  loginUser,
  signupUser,
  logoutUser,
  getAuthData,
} from '@/services/auth.service';

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

  /**
   * Initialize authentication state from AsyncStorage
   */
  const initializeAuth = async () => {
    try {
      const { token, user } = await getAuthData();
      
      if (token && user) {
        setAuthState({
          user,
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

  /**
   * Login function
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      
      const { token, user } = await loginUser(credentials);
      
      setAuthState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  /**
   * Signup function
   */
  const signup = async (credentials: SignupCredentials): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      
      const { token, user } = await signupUser(credentials);
      
      setAuthState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  /**
   * Logout function
   */
  const logout = async (): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      
      await logoutUser();
      
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    user: authState.user,
    token: authState.token,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    login,
    signup,
    logout,
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
