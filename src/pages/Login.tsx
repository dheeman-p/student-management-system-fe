import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { setToken, clearToken } from '../auth/session';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot-password flow (step 1: email -> reset token)
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1) Authenticate against the backend (which proxies the external auth).
      const { token } = await api.login(email, password);
      setToken(token);

      // 2) Resolve the application profile. A 404 here means the credentials
      //    are valid but no profile is provisioned — block access.
      try {
        await api.me();
        navigate('/');
      } catch (profileErr) {
        clearToken();
        if (profileErr instanceof ApiError && profileErr.status === 404) {
          setError('No profile found, contact admin');
        } else {
          setError('Unable to load your profile. Please try again.');
        }
      }
    } catch (loginErr) {
      const message =
        loginErr instanceof ApiError && loginErr.status === 401
          ? 'Invalid email or password'
          : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function openForgot() {
    setError(null);
    setForgotToken(null);
    setForgotError(null);
    setForgotMode(true);
  }

  function backToLogin() {
    setForgotMode(false);
    setForgotToken(null);
    setForgotError(null);
  }

  async function handleForgotSubmit(e: FormEvent) {
    e.preventDefault();
    setForgotError(null);
    setForgotToken(null);
    setForgotLoading(true);
    try {
      const result = await api.forgotPassword(forgotEmail);
      setForgotToken(result.token);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 404
          ? 'No account found for that email address.'
          : 'Unable to generate a reset token. Please try again.';
      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  }

  if (forgotMode) {
    return (
      <main style={{ maxWidth: 360, margin: '4rem auto', fontFamily: 'sans-serif' }}>
        <h1>Reset your password</h1>
        <p>Step 1 of 2 — enter your email to receive a password reset token.</p>
        <form onSubmit={handleForgotSubmit}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Email
            <input
              type="email"
              value={forgotEmail}
              required
              onChange={(e) => setForgotEmail(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </label>
          {forgotError && (
            <p role="alert" style={{ color: '#b00020' }}>
              {forgotError}
            </p>
          )}
          {forgotToken && (
            <div style={{ marginTop: 12, padding: 12, background: '#e8f5e9', borderRadius: 4 }}>
              <p style={{ margin: 0, marginBottom: 4 }}>Your password reset token:</p>
              <code data-testid="forgot-token" style={{ wordBreak: 'break-all' }}>
                {forgotToken}
              </code>
            </div>
          )}
          <button type="submit" disabled={forgotLoading} style={{ width: '100%', padding: 10 }}>
            {forgotLoading ? 'Generating…' : 'Get reset token'}
          </button>
        </form>
        <p style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={backToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#0066cc',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Back to sign in
          </button>
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 360, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Email
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Password
          <input
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        {error && (
          <p role="alert" style={{ color: '#b00020' }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={openForgot}
          style={{
            background: 'none',
            border: 'none',
            color: '#0066cc',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Forgot password?
        </button>
      </p>
    </main>
  );
}
