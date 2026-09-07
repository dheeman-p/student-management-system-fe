// Centralized theme state. All preference reads/writes go through this module
// so the whole app shares one convention — mirrors src/auth/session.ts.

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

// Mirrors the 'sms.auth.token' convention used by the auth session module.
const THEME_KEY = 'sms.theme';

const SYSTEM_QUERY = '(prefers-color-scheme: dark)';

const PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

function storedPreference(): ThemePreference | null {
  const raw = localStorage.getItem(THEME_KEY);
  return PREFERENCES.includes(raw as ThemePreference) ? (raw as ThemePreference) : null;
}

/** Stored preference, defaulting to 'system' when nothing (valid) is stored. */
export function readThemePreference(): ThemePreference {
  return storedPreference() ?? 'system';
}

/** Resolve a preference into the concrete theme that should be applied now. */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  return window.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light';
}

/**
 * Apply a preference to the document by setting html[data-theme], and return
 * the resolved theme so callers can react to what is actually active.
 */
export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  return resolved;
}

/** Persist a preference and apply it immediately. */
export function setThemePreference(preference: ThemePreference): void {
  localStorage.setItem(THEME_KEY, preference);
  applyTheme(preference);
}

/**
 * Bootstrap the theme and keep it in sync: applies the stored preference at
 * startup and re-applies whenever the OS theme changes while 'system' is the
 * active preference. Returns a cleanup function for tests.
 */
export function initTheme(): () => void {
  applyTheme(readThemePreference());

  const query = window.matchMedia(SYSTEM_QUERY);
  const onChange = () => {
    // Only track the OS while the user has asked us to.
    if (readThemePreference() === 'system') applyTheme('system');
  };
  query.addEventListener('change', onChange);

  return () => query.removeEventListener('change', onChange);
}
