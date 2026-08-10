// FILE: frontend/src/__tests__/pages/Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '../../pages/Dashboard';
import { useAuthStore } from '../../store/authStore';

function resetStore(overrides: Partial<ReturnType<typeof useAuthStore.getState>> = {}) {
  useAuthStore.setState({
    token: 't',
    profile: null,
    status: 'authenticated',
    error: null,
    isAuthenticated: () => true,
    login: vi.fn(),
    logout: vi.fn(),
    fetchProfile: vi.fn(async () => {}),
    ...overrides,
  });
}

describe('Dashboard page', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the page heading', () => {
    render(<Dashboard />, { wrapper: MemoryRouter });
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('shows a loading state while the profile has not loaded', () => {
    resetStore({ profile: null });
    render(<Dashboard />, { wrapper: MemoryRouter });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('greets the user once the profile is loaded', () => {
    resetStore({
      profile: { id: '1', authId: 'a1', email: 'a@b.com', name: 'Ada', role: 'STUDENT' },
    });
    render(<Dashboard />, { wrapper: MemoryRouter });
    expect(screen.getByText('Welcome, Ada (STUDENT)')).toBeInTheDocument();
  });

  it('links to the students page', () => {
    resetStore({
      profile: { id: '1', authId: 'a1', email: 'a@b.com', name: 'Ada', role: 'STUDENT' },
    });
    render(<Dashboard />, { wrapper: MemoryRouter });
    expect(screen.getByRole('link', { name: 'View students' })).toHaveAttribute(
      'href',
      '/students',
    );
  });
});
