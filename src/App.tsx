// FILE: frontend/src/App.tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import { useAuthStore } from './store/authStore';

function Dashboard() {
  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  return (
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
          logout();
          window.location.assign('/login');
        }}
      >
        Sign out
      </button>
    </main>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
