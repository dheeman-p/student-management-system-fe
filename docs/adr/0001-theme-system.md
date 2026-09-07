# ADR 0001 — Theme system via CSS custom properties + `html[data-theme]`

Status: Accepted

## Context

The front-end had zero CSS: every page used hardcoded inline styles and hex
colors, so nothing could respond to a light/dark preference. We needed a
minimal, token-based layer that every present and future page can build on,
plus plumbing that matches the repo's existing conventions (e.g.
`src/auth/session.ts` centralizes `localStorage` access under an `sms.*` key).

## Decision

- Semantic color tokens are defined once in `src/styles/theme.css`:
  `--color-bg`, `--color-surface`, `--color-text`, `--color-muted`,
  `--color-primary`, `--color-error`, `--color-border`. Light values live on
  `:root`; dark values override them under `html[data-theme='dark']`.
  `color-scheme` is set per theme so native form controls and scrollbars match.
- The active theme is applied by setting `document.documentElement.dataset
  .theme` (an `html[data-theme]` attribute). Components never hardcode colors;
  they use small CSS classes that reference the tokens.
- Theme preference state is centralized in `src/theme/theme.ts`, mirroring
  `src/auth/session.ts`: a `ThemePreference = 'light' | 'dark' | 'system'`
  persisted under the `localStorage` key `sms.theme` (same `sms.*` namespace
  as `sms.auth.token`). `'system'` resolves via
  `matchMedia('(prefers-color-scheme: dark)')` and re-applies when the OS
  scheme changes while `'system'` is the active preference.
- `index.html` carries a small inline script in `<head>` that reads the stored
  preference (default `'system'`) and sets `data-theme` before first paint to
  avoid flashing the wrong theme on reload.
- Default preference when nothing is stored: `system`.

## Consequences

- Adding a new page means writing it against the tokens/classes, and it
  follows the theme automatically; no per-page theme logic.
- There is one source of truth for theme state (`src/theme/theme.ts`) and one
  place where palettes live (`src/styles/theme.css`).
- The theme preference is stored client-side per browser; it is not part of
  the user profile on the backend.
