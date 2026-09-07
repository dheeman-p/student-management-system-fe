// Centralized theme state. All preference reads/writes go through this module
// so the whole app shares one convention — mirrors src/auth/session.ts.

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

// Mirrors the 'sms.auth.token' convention used by the auth session module.
const THEME_KEY = 'sms.theme';

const SYSTEM_QUERY = '(prefers-color-scheme: dark)';

const PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

/**
 * Last preference chosen in this session. localStorage can be unavailable
 * (cookies/site-data blocked, sandboxed contexts without allow-same-origin),
 * where every access throws; this mirror keeps the module functional in that
 * case and is what readThemePreference() falls back to.
 */
let inMemoryPreference: ThemePreference | null = null;

/** Read the stored preference, treating storage failures as "nothing stored". */
function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

/** Persist the preference, keeping it in memory when storage is unavailable. */
function writeStored(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, preference);
  } catch {
    // Storage unavailable — the in-memory mirror still applies this session.
  }
}

function storedPreference(): ThemePreference | null {
  // Prefer the in-session choice so a storage failure mid-session never
  // silently reverts the toggle to the OS-following default.
  if (inMemoryPreference !== null) return inMemoryPreference;
  const raw = readStored();
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
  inMemoryPreference = preference;
  writeStored(preference);
  applyTheme(preference);
}

/**
 * Bootstrap the theme and keep it in sync: applies the stored preference at
 * startup and re-applies whenever the OS theme changes while 'system' is the
 * active preference. Safe to call when localStorage is unavailable — boot
 * gracefully falls back to the system theme instead of throwing.
 * Returns a cleanup function for tests.
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
