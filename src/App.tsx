import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import ThemeToggle from './components/ThemeToggle';
import { isAuthenticated, clearToken } from './auth/session';
import { api, UserProfile } from './api/client';

function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    api.me().then(setProfile).catch(() => clearToken());
  }, []);

  return (
    <main className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <ThemeToggle />
      </div>
      {profile ? (
        <p>
          Welcome, {profile.name} ({profile.role})
        </p>
      ) : (
        <p>Loading…</p>
      )}
      <button
        className="btn btn--secondary"
        onClick={() => {
          clearToken();
          window.location.assign('/login');
        }}
      >
        Sign out
      </button>
    </main>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
