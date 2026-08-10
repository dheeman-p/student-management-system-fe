// FILE: frontend/src/store/authStore.ts
// Zustand store for authentication/session state. This is the single React
// entry point for auth: components read `token`/`profile`/`status` reactively
// instead of wiring up their own useState/useEffect pairs. Persistence to
// localStorage is delegated to `auth/session.ts` so `api/client.ts` (a plain
// module, outside React) keeps reading the token from one place.
// Wrapped with the `devtools` middleware so store transitions are inspectable
// in the Redux DevTools browser extension during development; it is a no-op
// when the extension isn't installed, so this is safe in production too.
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
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
  /** Clears a previously surfaced error message without touching token/profile/status. */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      token: getToken(),
      profile: null,
      status: 'idle',
      error: null,

      isAuthenticated: () => get().token !== null,

      async login(email, password) {
        set({ status: 'loading', error: null }, false, 'auth/login/start');

        let token: string;
        try {
          const res = await api.login(email, password);
          token = res.token;
        } catch (loginErr) {
          const message =
            loginErr instanceof ApiError && loginErr.status === 401
              ? 'Invalid email or password'
              : 'Login failed. Please try again.';
          set({ status: 'error', error: message }, false, 'auth/login/error');
          throw new Error(message);
        }

        setToken(token);
        set({ token }, false, 'auth/login/tokenReceived');

        try {
          const profile = await api.me();
          set({ profile, status: 'authenticated', error: null }, false, 'auth/login/success');
        } catch (profileErr) {
          clearToken();
          const message =
            profileErr instanceof ApiError && profileErr.status === 404
              ? 'No profile found, contact admin'
              : 'Unable to load your profile. Please try again.';
          set(
            { token: null, profile: null, status: 'error', error: message },
            false,
            'auth/login/profileError',
          );
          throw new Error(message);
        }
      },

      logout() {
        clearToken();
        set({ token: null, profile: null, status: 'idle', error: null }, false, 'auth/logout');
      },

      async fetchProfile() {
        try {
          const profile = await api.me();
          set({ profile, status: 'authenticated', error: null }, false, 'auth/fetchProfile/success');
        } catch {
          clearToken();
          set({ token: null, profile: null, status: 'idle' }, false, 'auth/fetchProfile/error');
        }
      },

      clearError() {
        set({ error: null }, false, 'auth/clearError');
      },
    }),
    { name: 'auth-store' },
  ),
);
