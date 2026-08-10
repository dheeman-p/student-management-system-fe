// FILE: frontend/src/pages/Students.tsx
import { useEffect, useState } from 'react';
import { useStudentStore } from '../store';
import { Student } from '../types/student';
import StudentForm from '../components/StudentForm';

/**
 * Students list page. Reads/loads state exclusively via `useStudentStore`
 * (Zustand) — no local fetch/useState duplication of server state. Local
 * `editingStudent` state only tracks which row (if any) the create/edit
 * form should target; the actual student data (and the search filter) lives
 * in the store.
 */
export default function Students() {
  const students = useStudentStore((s) => s.students);
  const status = useStudentStore((s) => s.status);
  const error = useStudentStore((s) => s.error);
  const searchTerm = useStudentStore((s) => s.searchTerm);
  const setSearchTerm = useStudentStore((s) => s.setSearchTerm);
  const filteredStudents = useStudentStore((s) => s.filteredStudents());
  const fetchStudents = useStudentStore((s) => s.fetchStudents);
  const removeStudent = useStudentStore((s) => s.removeStudent);
  const clearError = useStudentStore((s) => s.clearError);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return (
    <main style={{ maxWidth: 720, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Students</h1>

      <StudentForm editingStudent={editingStudent} onDone={() => setEditingStudent(null)} />

      {status === 'loading' && <p>Loading students…</p>}

      {status === 'error' && (
        <p role="alert" style={{ color: '#b00020' }}>
          {error}{' '}
          <button type="button" onClick={clearError} style={{ marginLeft: 8 }}>
            Dismiss
          </button>
        </p>
      )}

      {status === 'ready' && students.length === 0 && <p>No students found.</p>}

      {status === 'ready' && students.length > 0 && (
        <input
          type="search"
          aria-label="Search students"
          placeholder="Search by name or email…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 12 }}
        />
      )}

      {status === 'ready' && students.length > 0 && filteredStudents.length === 0 && (
        <p>No students match your search.</p>
      )}

      {status === 'ready' && filteredStudents.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Name</th>
              <th style={{ textAlign: 'left' }}>Email</th>
              <th style={{ textAlign: 'left' }}>Grade</th>
              <th style={{ textAlign: 'left' }}>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td>
                  {student.firstName} {student.lastName}
                </td>
                <td>{student.email}</td>
                <td>{student.grade}</td>
                <td>{student.status}</td>
                <td>
                  <button onClick={() => setEditingStudent(student)}>Edit</button>{' '}
                  <button onClick={() => removeStudent(student.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
