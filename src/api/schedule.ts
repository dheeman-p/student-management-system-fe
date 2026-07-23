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

/**
 * API client for the /schedule endpoints (list + create). See
 * src/pages/admin/Schedule.tsx for the Admin UI that consumes this module.
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
};
