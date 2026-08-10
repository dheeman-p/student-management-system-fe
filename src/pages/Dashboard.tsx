// FILE: frontend/src/pages/Dashboard.tsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Dashboard/home page. Extracted out of App.tsx so every route renders a
 * dedicated page component (consistent with Login.tsx / Students.tsx) and
 * so it can be unit-tested in isolation. Reads/loads state exclusively via
 * `useAuthStore` (Zustand) — no local fetch/useState duplication.
 */
export default function Dashboard() {
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
      <p>
        <Link to="/students">View students</Link>
      </p>
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
