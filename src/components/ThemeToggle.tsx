import { useState } from 'react';
import {
  readThemePreference,
  setThemePreference,
  type ThemePreference,
} from '../theme/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * Light / Dark / System segmented control. Highlights the active preference
 * and persists the choice on click via src/theme/theme.ts.
 */
export default function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(readThemePreference);

  function select(next: ThemePreference) {
    setPreference(next);
    setThemePreference(next);
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={
            value === preference
              ? 'theme-toggle__option theme-toggle__option--active'
              : 'theme-toggle__option'
          }
          aria-pressed={value === preference}
          onClick={() => select(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
