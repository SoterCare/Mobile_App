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

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

// API layer credential types (used by api/services/auth.api.ts)
export type LoginCredentials = { email: string; password: string };
export type SignupCredentials = { name: string; email: string; password: string };
