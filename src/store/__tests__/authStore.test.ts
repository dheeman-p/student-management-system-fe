// FILE: frontend/src/store/__tests__/authStore.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  }
  return {
    api: { login: vi.fn(), me: vi.fn() },
    ApiError,
  };
});

vi.mock('../../auth/session', () => {
  let token: string | null = null;
  return {
    getToken: vi.fn(() => token),
    setToken: vi.fn((t: string) => {
      token = t;
    }),
    clearToken: vi.fn(() => {
      token = null;
    }),
    isAuthenticated: vi.fn(() => token !== null),
  };
});

import { api, ApiError } from '../../api/client';
import { clearToken, setToken } from '../../auth/session';
import { useAuthStore } from '../authStore';

const mockedApi = api as unknown as {
  login: ReturnType<typeof vi.fn>;
  me: ReturnType<typeof vi.fn>;
};

function resetStore() {
  useAuthStore.setState({ token: null, profile: null, status: 'idle', error: null });
}

describe('useAuthStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('logs in successfully and stores the profile + token', async () => {
    mockedApi.login.mockResolvedValue({ token: 'abc123' });
    mockedApi.me.mockResolvedValue({
      id: '1',
      authId: 'a1',
      email: 'a@b.com',
      name: 'Ada',
      role: 'STUDENT',
    });

    await useAuthStore.getState().login('a@b.com', 'secret');

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.token).toBe('abc123');
    expect(state.profile?.name).toBe('Ada');
    expect(state.isAuthenticated()).toBe(true);
    expect(setToken).toHaveBeenCalledWith('abc123');
  });

  it('surfaces invalid-credential errors and keeps no token stored', async () => {
    mockedApi.login.mockRejectedValue(new ApiError(401, 'Unauthorized'));

    await expect(useAuthStore.getState().login('a@b.com', 'wrong')).rejects.toThrow(
      'Invalid email or password',
    );

    const state = useAuthStore.getState();
    expect(state.status).toBe('error');
    expect(state.token).toBeNull();
    expect(setToken).not.toHaveBeenCalled();
  });

  it('clears the token when the account has no provisioned profile (404)', async () => {
    mockedApi.login.mockResolvedValue({ token: 'abc123' });
    mockedApi.me.mockRejectedValue(new ApiError(404, 'Not found'));

    await expect(useAuthStore.getState().login('a@b.com', 'secret')).rejects.toThrow(
      'No profile found, contact admin',
    );

    const state = useAuthStore.getState();
    expect(state.status).toBe('error');
    expect(state.token).toBeNull();
    expect(state.profile).toBeNull();
    expect(clearToken).toHaveBeenCalled();
  });

  it('logs out and resets state to idle', () => {
    useAuthStore.setState({
      token: 't',
      profile: null,
      status: 'authenticated',
      error: null,
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.status).toBe('idle');
    expect(clearToken).toHaveBeenCalled();
  });

  it('clearError resets only the error field, leaving token/profile/status untouched', () => {
    useAuthStore.setState({
      token: 't',
      profile: null,
      status: 'error',
      error: 'Invalid email or password',
    });

    useAuthStore.getState().clearError();

    const state = useAuthStore.getState();
    expect(state.error).toBeNull();
    expect(state.status).toBe('error');
    expect(state.token).toBe('t');
  });
});
