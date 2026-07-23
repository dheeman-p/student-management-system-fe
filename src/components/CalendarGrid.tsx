import { CSSProperties, ReactNode } from 'react';
import { PERIODS, WEEKDAYS, WEEKDAY_LABELS, Weekday } from '../shared/periods';

/**
 * Minimal shape a calendar entry must satisfy to be placed on the grid.
 * Feature pages can pass richer objects (e.g. api ScheduleEntry) as long as
 * they include these fields.
 */
export interface CalendarGridEntry {
  id: string;
  day: Weekday;
  period: number;
  subject: string;
  room: string;
  teacherName?: string;
}

export interface CalendarGridProps {
  entries: CalendarGridEntry[];
  /** Optional custom cell renderer. Falls back to a default entry card. */
  renderCell?: (entry: CalendarGridEntry | undefined, day: Weekday, period: number) => ReactNode;
}

const cellStyle: CSSProperties = {
  border: '1px solid #ddd',
  padding: 8,
  textAlign: 'left',
  verticalAlign: 'top',
  minWidth: 120,
};

const timeStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 'normal',
  color: '#666',
};

/**
 * Reusable weekly calendar grid: rows are the fixed Period 1-8 slots, columns
 * are Mon-Fri (see src/shared/periods.ts). Renders one entry per (day,
 * period) cell, or a placeholder when the slot is empty.
 */
export default function CalendarGrid({ entries, renderCell }: CalendarGridProps) {
  const byCell = new Map<string, CalendarGridEntry>();
  for (const entry of entries) {
    byCell.set(`${entry.day}-${entry.period}`, entry);
  }

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={cellStyle}>Period</th>
          {WEEKDAYS.map((day) => (
            <th key={day} style={cellStyle}>
              {WEEKDAY_LABELS[day]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {PERIODS.map(({ period, startTime, endTime }) => (
          <tr key={period}>
            <th style={cellStyle}>
              Period {period}
              <div style={timeStyle}>
                {startTime}–{endTime}
              </div>
            </th>
            {WEEKDAYS.map((day) => {
              const entry = byCell.get(`${day}-${period}`);
              return (
                <td key={day} style={cellStyle} data-testid={`schedule-cell-${day}-${period}`}>
                  {renderCell ? (
                    renderCell(entry, day, period)
                  ) : entry ? (
                    <div>
                      <strong>{entry.subject}</strong>
                      <div style={{ fontSize: 12 }}>{entry.room}</div>
                      {entry.teacherName && <div style={{ fontSize: 12, color: '#666' }}>{entry.teacherName}</div>}
                    </div>
                  ) : (
                    <span style={{ color: '#ccc' }}>—</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
