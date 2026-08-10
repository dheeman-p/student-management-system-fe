// FILE: frontend/src/store/studentStore.ts
// Zustand store for the Student domain. Mirrors the pattern established by
// `authStore.ts`: components read `students`/`status`/`error` reactively and
// call the CRUD actions instead of managing local useState/useEffect pairs.
import { create } from 'zustand';
import { api, ApiError } from '../api/client';
import { CreateStudentInput, Student, UpdateStudentInput } from '../types/student';

export type StudentStoreStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface StudentState {
  students: Student[];
  status: StudentStoreStatus;
  error: string | null;
  fetchStudents: () => Promise<void>;
  addStudent: (input: CreateStudentInput) => Promise<Student>;
  updateStudent: (id: string, input: UpdateStudentInput) => Promise<Student>;
  removeStudent: (id: string) => Promise<void>;
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  status: 'idle',
  error: null,

  async fetchStudents() {
    set({ status: 'loading', error: null });
    try {
      const students = await api.listStudents();
      set({ students, status: 'ready' });
    } catch (err) {
      set({ status: 'error', error: toMessage(err, 'Unable to load students.') });
    }
  },

  async addStudent(input) {
    try {
      const created = await api.createStudent(input);
      set({ students: [...get().students, created], error: null });
      return created;
    } catch (err) {
      const message = toMessage(err, 'Unable to create student.');
      set({ error: message });
      throw new Error(message);
    }
  },

  async updateStudent(id, input) {
    try {
      const updated = await api.updateStudent(id, input);
      set({
        students: get().students.map((s) => (s.id === id ? updated : s)),
        error: null,
      });
      return updated;
    } catch (err) {
      const message = toMessage(err, 'Unable to update student.');
      set({ error: message });
      throw new Error(message);
    }
  },

  async removeStudent(id) {
    try {
      await api.deleteStudent(id);
      set({ students: get().students.filter((s) => s.id !== id), error: null });
    } catch (err) {
      const message = toMessage(err, 'Unable to delete student.');
      set({ error: message });
      throw new Error(message);
    }
  },
}));
