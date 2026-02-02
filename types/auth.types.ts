export interface User {
  userId: string;
  email: string;
  name?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// 1. Added this interface for better type safety
export interface SignupArgs {
  name: string;
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  // 2. Added signup to the context type
  signup: (args: SignupArgs) => Promise<void>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}