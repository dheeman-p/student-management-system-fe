import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { setToken, clearToken } from '../auth/session';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="page page--compact">
      <div className="card">
        <div className="page-header">
          <h1>Sign in</h1>
          <ThemeToggle />
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field">
            Email
            <input
              className="input"
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            Password
            <input
              className="input"
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn btn--block">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
