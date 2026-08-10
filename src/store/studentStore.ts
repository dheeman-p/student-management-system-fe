// FILE: frontend/src/store/studentStore.ts
// Zustand store for the Student domain. Mirrors the pattern established by
// `authStore.ts`: components read `students`/`status`/`error` reactively and
// call the CRUD actions instead of managing local useState/useEffect pairs.
// `searchTerm` + `filteredStudents()` extend this store as the single source
// of truth for the Students page's client-side search, instead of the page
// keeping its own local filter state. Wrapped with the `devtools` middleware
// (no-op without the browser extension) so CRUD transitions are inspectable.
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api, ApiError } from '../api/client';
import { CreateStudentInput, Student, UpdateStudentInput } from '../types/student';

export type StudentStoreStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface StudentState {
  students: Student[];
  status: StudentStoreStatus;
  error: string | null;
  /** Current text typed into the Students page search box. */
  searchTerm: string;
  fetchStudents: () => Promise<void>;
  addStudent: (input: CreateStudentInput) => Promise<Student>;
  updateStudent: (id: string, input: UpdateStudentInput) => Promise<Student>;
  removeStudent: (id: string) => Promise<void>;
  setSearchTerm: (term: string) => void;
  /** Students whose name or email match `searchTerm` (case-insensitive). Returns all students when empty. */
  filteredStudents: () => Student[];
  /** Clears a previously surfaced error message without touching the student list. */
  clearError: () => void;
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export const useStudentStore = create<StudentState>()(
  devtools(
    (set, get) => ({
      students: [],
      status: 'idle',
      error: null,
      searchTerm: '',

      async fetchStudents() {
        set({ status: 'loading', error: null }, false, 'students/fetch/start');
        try {
          const students = await api.listStudents();
          set({ students, status: 'ready' }, false, 'students/fetch/success');
        } catch (err) {
          set(
            { status: 'error', error: toMessage(err, 'Unable to load students.') },
            false,
            'students/fetch/error',
          );
        }
      },

      async addStudent(input) {
        try {
          const created = await api.createStudent(input);
          set({ students: [...get().students, created], error: null }, false, 'students/add/success');
          return created;
        } catch (err) {
          const message = toMessage(err, 'Unable to create student.');
          set({ error: message }, false, 'students/add/error');
          throw new Error(message);
        }
      },

      async updateStudent(id, input) {
        try {
          const updated = await api.updateStudent(id, input);
          set(
            {
              students: get().students.map((s) => (s.id === id ? updated : s)),
              error: null,
            },
            false,
            'students/update/success',
          );
          return updated;
        } catch (err) {
          const message = toMessage(err, 'Unable to update student.');
          set({ error: message }, false, 'students/update/error');
          throw new Error(message);
        }
      },

      async removeStudent(id) {
        try {
          await api.deleteStudent(id);
          set(
            { students: get().students.filter((s) => s.id !== id), error: null },
            false,
            'students/remove/success',
          );
        } catch (err) {
          const message = toMessage(err, 'Unable to delete student.');
          set({ error: message }, false, 'students/remove/error');
          throw new Error(message);
        }
      },

      setSearchTerm(term) {
        set({ searchTerm: term }, false, 'students/setSearchTerm');
      },

      filteredStudents() {
        const { students, searchTerm } = get();
        const term = searchTerm.trim().toLowerCase();
        if (!term) return students;
        return students.filter((s) =>
          `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(term),
        );
      },

      clearError() {
        set({ error: null }, false, 'students/clearError');
      },
    }),
    { name: 'student-store' },
  ),
);
