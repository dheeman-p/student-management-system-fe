import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Header from './components/Header';
import { isAuthenticated, clearToken } from './auth/session';
import { api, UserProfile } from './api/client';

function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    api.me().then(setProfile).catch(() => clearToken());
  }, []);

  return (
    <>
      <Header />
      <main style={{ maxWidth: 640, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>
      {profile ? (
        <p>
          Welcome, {profile.name} ({profile.role})
        </p>
      ) : (
        <p>Loading…</p>
      )}
      <button
        onClick={() => {
          clearToken();
          window.location.assign('/login');
        }}
      >
        Sign out
      </button>
      </main>
    </>
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
