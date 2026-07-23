import { CSSProperties, FormEvent, useCallback, useEffect, useState } from 'react';
import CalendarGrid, { CalendarGridEntry } from '../../components/CalendarGrid';
import AffectedCountDialog, { AffectedCountAction } from '../../components/AffectedCountDialog';
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

/** A pending edit/delete action awaiting Admin confirmation via the affected-count dialog. */
interface PendingAction {
  action: AffectedCountAction;
  entryId: string;
  affectedCount: number;
  entryLabel: string;
  /** Populated only for edit — the validated form payload to save on confirm. */
  input?: CreateScheduleEntryInput;
}

/**
 * Admin · Schedule page: renders the weekly timetable via the reusable
 * CalendarGrid component, supports filtering entries by subject, and lets an
 * admin create, edit, and delete entries through a validated form. Before
 * saving an edit or deleting an entry, the number of enrolled students is
 * fetched and — if non-zero — the Admin is warned via AffectedCountDialog
 * and must explicitly proceed (proceed-anyway pattern). Deleting an entry
 * cascades the delete to its linked enrollment records on the backend.
 * Conflict/double-booking detection is intentionally not implemented yet.
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const [rowError, setRowError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);

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

  function entryLabelFor(entry: Pick<ScheduleEntry, 'subject' | 'day' | 'period'>): string {
    return `${entry.subject} — ${WEEKDAY_LABELS[entry.day]}, Period ${entry.period}`;
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
    setSubmitError(null);
  }

  function handleEditClick(entry: ScheduleEntry) {
    setEditingId(entry.id);
    setForm({
      day: entry.day,
      period: entry.period,
      teacherId: entry.teacherId,
      room: entry.room,
      subject: entry.subject,
    });
    setFieldErrors({});
    setSubmitError(null);
    setRowError(null);
  }

  async function performCreate(input: CreateScheduleEntryInput) {
    await scheduleApi.create(input);
    resetForm();
    await loadEntries(subjectFilter);
  }

  async function performUpdate(id: string, input: CreateScheduleEntryInput) {
    await scheduleApi.update(id, input);
    resetForm();
    await loadEntries(subjectFilter);
  }

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const input: CreateScheduleEntryInput = { ...form, period: Number(form.period) };
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingId) {
        // Editing: check how many students would be affected before saving.
        const { affectedCount } = await scheduleApi.getAffectedCount(editingId);
        if (affectedCount > 0) {
          const current = entries.find((e2) => e2.id === editingId);
          setPendingAction({
            action: 'edit',
            entryId: editingId,
            affectedCount,
            entryLabel: current ? entryLabelFor(current) : editingId,
            input,
          });
        } else {
          await performUpdate(editingId, input);
        }
      } else {
        await performCreate(input);
      }
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setFieldErrors(err.errors as FieldErrors);
      } else if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError(editingId ? 'Failed to update schedule entry' : 'Failed to create schedule entry');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function performDelete(id: string) {
    await scheduleApi.remove(id);
    if (editingId === id) resetForm();
    await loadEntries(subjectFilter);
  }

  async function handleDeleteClick(entry: ScheduleEntry) {
    setRowError(null);
    setCheckingId(entry.id);
    try {
      const { affectedCount } = await scheduleApi.getAffectedCount(entry.id);
      if (affectedCount > 0) {
        setPendingAction({
          action: 'delete',
          entryId: entry.id,
          affectedCount,
          entryLabel: entryLabelFor(entry),
        });
      } else {
        await performDelete(entry.id);
      }
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Failed to check affected students');
    } finally {
      setCheckingId(null);
    }
  }

  async function handleDialogConfirm() {
    if (!pendingAction) return;
    setDialogBusy(true);
    try {
      if (pendingAction.action === 'delete') {
        await performDelete(pendingAction.entryId);
      } else if (pendingAction.input) {
        await performUpdate(pendingAction.entryId, pendingAction.input);
      }
      setPendingAction(null);
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Action failed');
      setPendingAction(null);
    } finally {
      setDialogBusy(false);
    }
  }

  function handleDialogCancel() {
    setPendingAction(null);
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
      {rowError && (
        <p role="alert" style={errorStyle}>
          {rowError}
        </p>
      )}
      {!loading && !loadError && (
        <CalendarGrid
          entries={gridEntries}
          renderCell={(entry) => {
            if (!entry) return <span style={{ color: '#ccc' }}>—</span>;
            const fullEntry = entries.find((e) => e.id === entry.id);
            const isChecking = checkingId === entry.id;
            return (
              <div>
                <strong>{entry.subject}</strong>
                <div style={{ fontSize: 12 }}>{entry.room}</div>
                {entry.teacherName && <div style={{ fontSize: 12, color: '#666' }}>{entry.teacherName}</div>}
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    disabled={isChecking}
                    onClick={() => fullEntry && handleEditClick(fullEntry)}
                    style={{ fontSize: 11, padding: '2px 6px' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isChecking}
                    onClick={() => fullEntry && handleDeleteClick(fullEntry)}
                    style={{ fontSize: 11, padding: '2px 6px' }}
                  >
                    {isChecking ? 'Checking…' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          }}
        />
      )}

      <h2 style={{ marginTop: 32 }}>{editingId ? 'Edit schedule entry' : 'Add schedule entry'}</h2>
      <form onSubmit={handleFormSubmit} noValidate>
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

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" disabled={submitting} style={{ padding: 8 }}>
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add entry'}
          </button>
          {editingId && (
            <button type="button" disabled={submitting} onClick={resetForm} style={{ padding: 8 }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <AffectedCountDialog
        open={pendingAction !== null}
        action={pendingAction?.action ?? 'edit'}
        affectedCount={pendingAction?.affectedCount ?? 0}
        entryLabel={pendingAction?.entryLabel}
        busy={dialogBusy}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
      />
    </main>
  );
}

const fieldWrapStyle: CSSProperties = { marginBottom: 12 };
const inputStyle: CSSProperties = { display: 'block', width: '100%', padding: 8, marginTop: 4 };
const errorStyle: CSSProperties = { color: '#b00020', fontSize: 12, margin: '4px 0 0' };
