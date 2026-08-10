// FILE: frontend/src/__tests__/pages/Students.test.tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Students from '../../pages/Students';
import { useStudentStore } from '../../store/studentStore';
import { Student } from '../../types/student';

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

function resetStore(overrides: Partial<ReturnType<typeof useStudentStore.getState>> = {}) {
  useStudentStore.setState({
    students: [],
    status: 'idle',
    error: null,
    fetchStudents: vi.fn(async () => {}),
    addStudent: vi.fn(),
    updateStudent: vi.fn(),
    removeStudent: vi.fn(),
    ...overrides,
  });
}

describe('Students page', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the page heading', () => {
    render(<Students />);
    expect(screen.getByRole('heading', { name: 'Students' })).toBeInTheDocument();
  });

  it('shows a loading state while fetching', () => {
    resetStore({ status: 'loading' });
    render(<Students />);
    expect(screen.getByText('Loading students…')).toBeInTheDocument();
  });

  it('shows an empty state when there are no students', () => {
    resetStore({ status: 'ready', students: [] });
    render(<Students />);
    expect(screen.getByText('No students found.')).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', () => {
    resetStore({ status: 'error', error: 'Unable to load students.' });
    render(<Students />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load students.');
  });

  it('renders each student row when data is loaded', () => {
    resetStore({ status: 'ready', students: [sampleStudent] });
    render(<Students />);
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('10th Grade')).toBeInTheDocument();
  });
});
