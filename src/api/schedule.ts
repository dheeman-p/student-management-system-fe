import { request } from './client';
import { Weekday } from '../shared/periods';

export interface ScheduleEntryTeacher {
  id: string;
  name: string;
  email: string;
}

export interface ScheduleEntry {
  id: string;
  day: Weekday;
  period: number;
  teacherId: string;
  teacher?: ScheduleEntryTeacher;
  room: string;
  subject: string;
}

export interface CreateScheduleEntryInput {
  day: Weekday;
  period: number;
  teacherId: string;
  room: string;
  subject: string;
}

/** Response shape for the pre-edit/delete "affected students" check. */
export interface AffectedCountResult {
  scheduleEntryId: string;
  affectedCount: number;
}

/** Response shape for a successful delete (includes cascade-delete count). */
export interface DeleteScheduleEntryResult {
  message: string;
  cascadedEnrollments: number;
}

/**
 * API client for the /schedule endpoints (list, create, edit, delete, and
 * the affected-count pre-check). See src/pages/admin/Schedule.tsx for the
 * Admin UI that consumes this module.
 */
export const scheduleApi = {
  list(subject?: string): Promise<ScheduleEntry[]> {
    const query = subject && subject.trim() ? `?subject=${encodeURIComponent(subject.trim())}` : '';
    return request(`/schedule${query}`);
  },
  create(input: CreateScheduleEntryInput): Promise<ScheduleEntry> {
    return request('/schedule', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  /**
   * Returns how many students are enrolled in the given schedule entry.
   * Call this before update()/remove() so the UI can warn the Admin
   * (proceed-anyway pattern) ahead of a potentially disruptive change.
   */
  getAffectedCount(id: string): Promise<AffectedCountResult> {
    return request(`/schedule/${encodeURIComponent(id)}/affected-count`);
  },
  update(id: string, input: CreateScheduleEntryInput): Promise<ScheduleEntry> {
    return request(`/schedule/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },
  /** Deletes the schedule entry; the backend cascade-deletes linked enrollments. */
  remove(id: string): Promise<DeleteScheduleEntryResult> {
    return request(`/schedule/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
