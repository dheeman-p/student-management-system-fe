import { CSSProperties, FormEvent, useCallback, useEffect, useState } from 'react';
import CalendarGrid, { CalendarGridEntry } from '../../components/CalendarGrid';
import { ApiError } from '../../api/client';
import { CreateScheduleEntryInput, ScheduleEntry, scheduleApi } from '../../api/schedule';
import { PERIOD_NUMBERS, WEEKDAYS, WEEKDAY_LABELS, Weekday } from '../../shared/periods';

const emptyForm: CreateScheduleEntryInput = {
  day: WEEKDAYS[0],
  period: PERIOD_NUMBERS[0],
  teacherId: '',
  room: '',
  subject: '',
};

type FieldErrors = Partial<Record<keyof CreateScheduleEntryInput, string>>;

function validate(form: CreateScheduleEntryInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!WEEKDAYS.includes(form.day)) errors.day = 'Select a valid day';
  if (!PERIOD_NUMBERS.includes(Number(form.period))) errors.period = 'Select a valid period';
  if (!form.teacherId.trim()) errors.teacherId = 'Teacher ID is required';
  if (!form.room.trim()) errors.room = 'Room is required';
  if (!form.subject.trim()) errors.subject = 'Subject is required';
  return errors;
}

/**
 * Admin · Schedule page: renders the weekly timetable via the reusable
 * CalendarGrid component, supports filtering entries by subject, and lets an
 * admin create new entries through a validated form. Conflict/double-booking
 * detection is intentionally not implemented yet.
 */
export default function AdminSchedulePage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateScheduleEntryInput>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadEntries = useCallback(async (subject: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await scheduleApi.list(subject);
      setEntries(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries('');
  }, [loadEntries]);

  function handleFilterSubmit(e: FormEvent) {
    e.preventDefault();
    loadEntries(subjectFilter);
  }

  function handleFieldChange<K extends keyof CreateScheduleEntryInput>(
    field: K,
    value: CreateScheduleEntryInput[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await scheduleApi.create({ ...form, period: Number(form.period) });
      setForm(emptyForm);
      await loadEntries(subjectFilter);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setFieldErrors(err.errors as FieldErrors);
      } else if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to create schedule entry');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const gridEntries: CalendarGridEntry[] = entries.map((entry) => ({
    id: entry.id,
    day: entry.day,
    period: entry.period,
    room: entry.room,
    subject: entry.subject,
    teacherName: entry.teacher?.name,
  }));

  return (
    <main style={{ maxWidth: 960, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Admin · Schedule</h1>

      <form onSubmit={handleFilterSubmit} style={{ marginBottom: 24 }}>
        <label>
          Filter by subject
          <input
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            placeholder="e.g. Math"
            style={{ marginLeft: 8, padding: 6 }}
          />
        </label>
        <button type="submit" style={{ marginLeft: 8, padding: 6 }}>
          Apply filter
        </button>
      </form>

      {loading && <p>Loading…</p>}
      {loadError && (
        <p role="alert" style={errorStyle}>
          {loadError}
        </p>
      )}
      {!loading && !loadError && <CalendarGrid entries={gridEntries} />}

      <h2 style={{ marginTop: 32 }}>Add schedule entry</h2>
      <form onSubmit={handleCreateSubmit} noValidate>
        <div style={fieldWrapStyle}>
          <label>
            Day
            <select
              value={form.day}
              onChange={(e) => handleFieldChange('day', e.target.value as Weekday)}
              style={inputStyle}
            >
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {WEEKDAY_LABELS[day]}
                </option>
              ))}
            </select>
          </label>
          {fieldErrors.day && (
            <p role="alert" style={errorStyle}>
              {fieldErrors.day}
            </p>
          )}
        </div>

        <div style={fieldWrapStyle}>
          <label>
            Period
            <select
              value={form.period}
              onChange={(e) => handleFieldChange('period', Number(e.target.value))}
              style={inputStyle}
            >
              {PERIOD_NUMBERS.map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </label>
          {fieldErrors.period && (
            <p role="alert" style={errorStyle}>
              {fieldErrors.period}
            </p>
          )}
        </div>

        <div style={fieldWrapStyle}>
          <label>
            Teacher ID
            <input
              value={form.teacherId}
              onChange={(e) => handleFieldChange('teacherId', e.target.value)}
              style={inputStyle}
            />
          </label>
          {fieldErrors.teacherId && (
            <p role="alert" style={errorStyle}>
              {fieldErrors.teacherId}
            </p>
          )}
        </div>

        <div style={fieldWrapStyle}>
          <label>
            Room
            <input value={form.room} onChange={(e) => handleFieldChange('room', e.target.value)} style={inputStyle} />
          </label>
          {fieldErrors.room && (
            <p role="alert" style={errorStyle}>
              {fieldErrors.room}
            </p>
          )}
        </div>

        <div style={fieldWrapStyle}>
          <label>
            Subject
            <input
              value={form.subject}
              onChange={(e) => handleFieldChange('subject', e.target.value)}
              style={inputStyle}
            />
          </label>
          {fieldErrors.subject && (
            <p role="alert" style={errorStyle}>
              {fieldErrors.subject}
            </p>
          )}
        </div>

        {submitError && (
          <p role="alert" style={errorStyle}>
            {submitError}
          </p>
        )}

        <button type="submit" disabled={submitting} style={{ padding: 8, marginTop: 8 }}>
          {submitting ? 'Saving…' : 'Add entry'}
        </button>
      </form>
    </main>
  );
}

const fieldWrapStyle: CSSProperties = { marginBottom: 12 };
const inputStyle: CSSProperties = { display: 'block', width: '100%', padding: 8, marginTop: 4 };
const errorStyle: CSSProperties = { color: '#b00020', fontSize: 12, margin: '4px 0 0' };
