// FILE: frontend/src/store/index.ts
/**
 * Barrel export for all Zustand stores. Import from `../store` rather than
 * deep-importing individual store files, so every new domain store is
 * discoverable from one place and follows the same convention as
 * `authStore.ts` / `studentStore.ts`.
 */
export { useAuthStore } from './authStore';
export type { AuthState, AuthStatus } from './authStore';

export { useStudentStore } from './studentStore';
export type { StudentState, StudentStoreStatus } from './studentStore';
