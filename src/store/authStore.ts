// FILE: frontend/src/store/authStore.ts
// Zustand store for authentication/session state. This is the single React
// entry point for auth: components read `token`/`profile`/`status` reactively
// instead of wiring up their own useState/useEffect pairs. Persistence to
// localStorage is delegated to `auth/session.ts` so `api/client.ts` (a plain
// module, outside React) keeps reading the token from one place.
import { create } from 'zustand';
import { api, ApiError, UserProfile } from '../api/client';
import { clearToken, getToken, setToken } from '../auth/session';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  status: AuthStatus;
  error: string | null;
  isAuthenticated: () => boolean;
  /** Authenticates and loads the profile. Throws a user-facing Error on failure. */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Re-fetches the profile for an existing token (e.g. on app load/refresh). */
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getToken(),
  profile: null,
  status: 'idle',
  error: null,

  isAuthenticated: () => get().token !== null,

  async login(email, password) {
    set({ status: 'loading', error: null });

    let token: string;
    try {
      const res = await api.login(email, password);
      token = res.token;
    } catch (loginErr) {
      const message =
        loginErr instanceof ApiError && loginErr.status === 401
          ? 'Invalid email or password'
          : 'Login failed. Please try again.';
      set({ status: 'error', error: message });
      throw new Error(message);
    }

    setToken(token);
    set({ token });

    try {
      const profile = await api.me();
      set({ profile, status: 'authenticated', error: null });
    } catch (profileErr) {
      clearToken();
      const message =
        profileErr instanceof ApiError && profileErr.status === 404
          ? 'No profile found, contact admin'
          : 'Unable to load your profile. Please try again.';
      set({ token: null, profile: null, status: 'error', error: message });
      throw new Error(message);
    }
  },

  logout() {
    clearToken();
    set({ token: null, profile: null, status: 'idle', error: null });
  },

  async fetchProfile() {
    try {
      const profile = await api.me();
      set({ profile, status: 'authenticated', error: null });
    } catch {
      clearToken();
      set({ token: null, profile: null, status: 'idle' });
    }
  },
}));
