import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import Login from './Login';
import { api, ApiError } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    login: vi.fn(),
    me: vi.fn(),
    forgotPassword: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  },
}));

const mockedApi = api as unknown as {
  login: ReturnType<typeof vi.fn>;
  me: ReturnType<typeof vi.fn>;
  forgotPassword: ReturnType<typeof vi.fn>;
};

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe('Login forgot password flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows a "Forgot password?" link on the sign-in form', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /forgot password\?/i })).toBeInTheDocument();
  });

  it('opens the step-1 email form when "Forgot password?" is clicked', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /forgot password\?/i }));
    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get reset token/i })).toBeInTheDocument();
  });

  it('submits the email and displays the returned reset token', async () => {
    const user = userEvent.setup();
    mockedApi.forgotPassword.mockResolvedValue({ status: 'success', token: 'token-123' });

    renderLogin();
    await user.click(screen.getByRole('button', { name: /forgot password\?/i }));
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /get reset token/i }));

    expect(mockedApi.forgotPassword).toHaveBeenCalledWith('john@example.com');
    expect(await screen.findByTestId('forgot-token')).toHaveTextContent('token-123');
  });

  it('shows an error message when the email has no account', async () => {
    const user = userEvent.setup();
    mockedApi.forgotPassword.mockRejectedValue(
      new ApiError(404, 'There is no user with that email address'),
    );

    renderLogin();
    await user.click(screen.getByRole('button', { name: /forgot password\?/i }));
    await user.type(screen.getByLabelText(/email/i), 'nobody@example.com');
    await user.click(screen.getByRole('button', { name: /get reset token/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no account found/i);
  });

  it('returns to the sign-in form via "Back to sign in"', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /forgot password\?/i }));
    await user.click(screen.getByRole('button', { name: /back to sign in/i }));
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });
});
