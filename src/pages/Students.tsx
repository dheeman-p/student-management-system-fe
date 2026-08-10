// FILE: frontend/src/pages/Students.tsx
import { useEffect, useState } from 'react';
import { useStudentStore } from '../store';
import { Student } from '../types/student';
import StudentForm from '../components/StudentForm';

/**
 * Students list page. Reads/loads state exclusively via `useStudentStore`
 * (Zustand) — no local fetch/useState duplication of server state. Local
 * `editingStudent` state only tracks which row (if any) the create/edit
 * form should target; the actual student data lives in the store.
 */
export default function Students() {
  const students = useStudentStore((s) => s.students);
  const status = useStudentStore((s) => s.status);
  const error = useStudentStore((s) => s.error);
  const fetchStudents = useStudentStore((s) => s.fetchStudents);
  const removeStudent = useStudentStore((s) => s.removeStudent);
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
          {error}
        </p>
      )}

      {status === 'ready' && students.length === 0 && <p>No students found.</p>}

      {status === 'ready' && students.length > 0 && (
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
            {students.map((student) => (
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
