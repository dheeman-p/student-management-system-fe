// FILE: frontend/src/__tests__/pages/Login.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../../pages/Login';
import { useAuthStore } from '../../store/authStore';

function resetStore(overrides: Partial<ReturnType<typeof useAuthStore.getState>> = {}) {
  useAuthStore.setState({
    token: null,
    profile: null,
    status: 'idle',
    error: null,
    isAuthenticated: () => false,
    login: vi.fn(),
    logout: vi.fn(),
    fetchProfile: vi.fn(async () => {}),
    ...overrides,
  });
}

describe('Login page', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders email and password fields', () => {
    render(<Login />, { wrapper: MemoryRouter });
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('calls the auth store login action with entered credentials on submit', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    resetStore({ login });
    render(<Login />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('a@b.com', 'secret'));
  });

  it('shows an error message when login fails', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Invalid email or password'));
    resetStore({ login });
    render(<Login />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password'),
    );
  });
});
