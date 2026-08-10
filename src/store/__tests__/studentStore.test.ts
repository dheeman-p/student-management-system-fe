// FILE: frontend/src/store/__tests__/studentStore.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  }
  return {
    api: {
      listStudents: vi.fn(),
      createStudent: vi.fn(),
      updateStudent: vi.fn(),
      deleteStudent: vi.fn(),
    },
    ApiError,
  };
});

import { api, ApiError } from '../../api/client';
import { useStudentStore } from '../studentStore';
import { Student } from '../../types/student';

const mockedApi = api as unknown as {
  listStudents: ReturnType<typeof vi.fn>;
  createStudent: ReturnType<typeof vi.fn>;
  updateStudent: ReturnType<typeof vi.fn>;
  deleteStudent: ReturnType<typeof vi.fn>;
};

const sampleStudent: Student = {
  id: '1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  grade: '10th Grade',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function resetStore() {
  useStudentStore.setState({ students: [], status: 'idle', error: null, searchTerm: '' });
}

describe('useStudentStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('fetches students and moves to the ready state', async () => {
    mockedApi.listStudents.mockResolvedValue([sampleStudent]);

    await useStudentStore.getState().fetchStudents();

    const state = useStudentStore.getState();
    expect(state.status).toBe('ready');
    expect(state.students).toHaveLength(1);
    expect(state.students[0].email).toBe('ada@example.com');
  });

  it('surfaces an error and keeps the student list empty on fetch failure', async () => {
    mockedApi.listStudents.mockRejectedValue(new ApiError(500, 'Server error'));

    await useStudentStore.getState().fetchStudents();

    const state = useStudentStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBe('Server error');
    expect(state.students).toHaveLength(0);
  });

  it('adds a student to the list on success', async () => {
    mockedApi.createStudent.mockResolvedValue(sampleStudent);

    const created = await useStudentStore.getState().addStudent({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      grade: '10th Grade',
      status: 'ACTIVE',
    });

    expect(created).toEqual(sampleStudent);
    expect(useStudentStore.getState().students).toHaveLength(1);
  });

  it('rejects and records an error message when create fails', async () => {
    mockedApi.createStudent.mockRejectedValue(new ApiError(400, 'Email already in use'));

    await expect(
      useStudentStore.getState().addStudent({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        grade: '10th Grade',
        status: 'ACTIVE',
      }),
    ).rejects.toThrow('Email already in use');

    expect(useStudentStore.getState().error).toBe('Email already in use');
  });

  it('updates an existing student in place', async () => {
    useStudentStore.setState({ students: [sampleStudent], status: 'ready', error: null });
    const updated = { ...sampleStudent, grade: '11th Grade' };
    mockedApi.updateStudent.mockResolvedValue(updated);

    await useStudentStore.getState().updateStudent('1', { grade: '11th Grade' });

    expect(useStudentStore.getState().students[0].grade).toBe('11th Grade');
  });

  it('removes a student from the list on delete', async () => {
    useStudentStore.setState({ students: [sampleStudent], status: 'ready', error: null });
    mockedApi.deleteStudent.mockResolvedValue(undefined);

    await useStudentStore.getState().removeStudent('1');

    expect(useStudentStore.getState().students).toHaveLength(0);
  });

  it('clearError resets only the error field, leaving the student list untouched', () => {
    useStudentStore.setState({
      students: [sampleStudent],
      status: 'error',
      error: 'Unable to load students.',
    });

    useStudentStore.getState().clearError();

    const state = useStudentStore.getState();
    expect(state.error).toBeNull();
    expect(state.status).toBe('error');
    expect(state.students).toHaveLength(1);
  });

  describe('search filtering', () => {
    const grace: Student = {
      ...sampleStudent,
      id: '2',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
    };

    it('defaults to an empty searchTerm and returns every student', () => {
      useStudentStore.setState({ students: [sampleStudent, grace], status: 'ready', error: null });

      expect(useStudentStore.getState().searchTerm).toBe('');
      expect(useStudentStore.getState().filteredStudents()).toEqual([sampleStudent, grace]);
    });

    it('filters students by (partial, case-insensitive) name or email via setSearchTerm', () => {
      useStudentStore.setState({ students: [sampleStudent, grace], status: 'ready', error: null });

      useStudentStore.getState().setSearchTerm('GRACE');

      expect(useStudentStore.getState().filteredStudents()).toEqual([grace]);
    });

    it('returns an empty array when no student matches the search term', () => {
      useStudentStore.setState({ students: [sampleStudent], status: 'ready', error: null });

      useStudentStore.getState().setSearchTerm('zzz-no-match');

      expect(useStudentStore.getState().filteredStudents()).toHaveLength(0);
    });
  });
});
