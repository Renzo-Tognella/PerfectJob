import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface UserPayload {
  email: string;
  fullName: string;
  role: string;
}

export interface DecodedJwt {
  exp: number;
  sub: string;
  role?: string;
  fullName?: string;
}

interface AuthState {
  token: string | null;
  user: UserPayload | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserPayload) => void;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('binary');
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const parsed = JSON.parse(json);
    if (typeof parsed.exp !== 'number' || typeof parsed.sub !== 'string') {
      return null;
    }
    return {
      exp: parsed.exp,
      sub: parsed.sub,
      role: typeof parsed.role === 'string' ? parsed.role : undefined,
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : undefined,
    };
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token, user) => {
    if (isTokenExpired(token)) {
      SecureStore.deleteItemAsync(TOKEN_KEY);
      SecureStore.deleteItemAsync(USER_KEY);
      set({ token: null, user: null, isAuthenticated: false });
      return;
    }
    SecureStore.setItemAsync(TOKEN_KEY, token);
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadToken: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      set({ token: null, user: null, isAuthenticated: false });
      return;
    }
    if (isTokenExpired(token)) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      set({ token: null, user: null, isAuthenticated: false });
      return;
    }
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    let user: UserPayload | null = null;
    if (userJson) {
      try {
        user = JSON.parse(userJson) as UserPayload;
      } catch {
        user = null;
      }
    }
    set({ token, user, isAuthenticated: true });
  },
}));
