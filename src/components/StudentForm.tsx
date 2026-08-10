// FILE: frontend/src/components/StudentForm.tsx
import { FormEvent, useEffect, useState } from 'react';
import { useStudentStore } from '../store';
import { Student, StudentStatus } from '../types/student';

export interface StudentFormProps {
  /** Student being edited, or null/undefined to create a new one. */
  editingStudent?: Student | null;
  /** Called after a successful create/update (or Cancel) so the caller can clear edit state. */
  onDone: () => void;
}

const STATUS_OPTIONS: StudentStatus[] = ['ACTIVE', 'INACTIVE', 'GRADUATED'];

interface FormFields {
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  status: StudentStatus;
}

const emptyForm: FormFields = {
  firstName: '',
  lastName: '',
  email: '',
  grade: '',
  status: 'ACTIVE',
};

/**
 * Create/edit form for a Student record. Wired directly to `useStudentStore`
 * (Zustand) — calls `addStudent`/`updateStudent` and never manages server
 * state itself, only the local, uncommitted form fields.
 */
export default function StudentForm({ editingStudent, onDone }: StudentFormProps) {
  const addStudent = useStudentStore((s) => s.addStudent);
  const updateStudent = useStudentStore((s) => s.updateStudent);
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingStudent) {
      setForm({
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        email: editingStudent.email,
        grade: editingStudent.grade,
        status: editingStudent.status,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [editingStudent]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, form);
      } else {
        await addStudent(form);
      }
      setForm(emptyForm);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student.');
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = Boolean(editingStudent);

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={isEditing ? 'Edit student' : 'Add student'}
      style={{ marginBottom: '1.5rem', display: 'grid', gap: 8, maxWidth: 420 }}
    >
      <h2>{isEditing ? 'Edit student' : 'Add student'}</h2>
      <label>
        First name
        <input
          value={form.firstName}
          required
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
        />
      </label>
      <label>
        Last name
        <input
          value={form.lastName}
          required
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={form.email}
          required
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </label>
      <label>
        Grade
        <input
          value={form.grade}
          required
          onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
        />
      </label>
      <label>
        Status
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StudentStatus }))}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" style={{ color: '#b00020' }}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add student'}
        </button>
        {isEditing && (
          <button type="button" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
