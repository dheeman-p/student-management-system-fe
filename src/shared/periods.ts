// Hardcoded period configuration shared conceptually by the frontend and the
// backend (student-management-system). The two projects live in separate
// repositories, so this file is intentionally duplicated in both codebases —
// keep them in sync if the schedule ever changes.
//
// Fixed Mon-Fri timetable: 8 periods/day, 45 minutes each, with a 30-minute
// lunch break after period 4.

export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

export interface PeriodDefinition {
  period: number; // 1-8
  startTime: string; // 24h "HH:mm"
  endTime: string; // 24h "HH:mm"
}

export const WEEKDAYS: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
};

export const PERIODS: PeriodDefinition[] = [
  { period: 1, startTime: '08:00', endTime: '08:45' },
  { period: 2, startTime: '08:45', endTime: '09:30' },
  { period: 3, startTime: '09:30', endTime: '10:15' },
  { period: 4, startTime: '10:15', endTime: '11:00' },
  { period: 5, startTime: '11:30', endTime: '12:15' },
  { period: 6, startTime: '12:15', endTime: '13:00' },
  { period: 7, startTime: '13:00', endTime: '13:45' },
  { period: 8, startTime: '13:45', endTime: '14:30' },
];

export const PERIOD_NUMBERS: number[] = PERIODS.map((p) => p.period);

export function isValidWeekday(value: unknown): value is Weekday {
  return typeof value === 'string' && (WEEKDAYS as string[]).includes(value);
}

export function isValidPeriod(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && PERIOD_NUMBERS.includes(value);
}
