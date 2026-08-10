// FILE: frontend/src/__tests__/components/StudentForm.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StudentForm from '../../components/StudentForm';
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

describe('StudentForm', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the "Add student" heading and empty fields by default', () => {
    render(<StudentForm onDone={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Add student' })).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Add student' })).toBeInTheDocument();
  });

  it('calls addStudent with form values and onDone on successful create', async () => {
    const addStudent = vi.fn().mockResolvedValue(sampleStudent);
    const onDone = vi.fn();
    resetStore({ addStudent });

    render(<StudentForm onDone={onDone} />);
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Lovelace' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '10th Grade' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add student' }));

    await screen.findByRole('heading', { name: 'Add student' });
    expect(addStudent).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      grade: '10th Grade',
      status: 'ACTIVE',
    });
    expect(onDone).toHaveBeenCalled();
  });

  it('pre-fills fields and shows "Edit student" when given an editingStudent', () => {
    render(<StudentForm editingStudent={sampleStudent} onDone={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Edit student' })).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('Ada');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls updateStudent with the student id on edit submit', async () => {
    const updateStudent = vi.fn().mockResolvedValue(sampleStudent);
    const onDone = vi.fn();
    resetStore({ updateStudent });

    render(<StudentForm editingStudent={sampleStudent} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByRole('heading', { name: 'Edit student' });
    expect(updateStudent).toHaveBeenCalledWith('1', {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      grade: '10th Grade',
      status: 'ACTIVE',
    });
    expect(onDone).toHaveBeenCalled();
  });

  it('calls onDone without saving when Cancel is clicked', () => {
    const onDone = vi.fn();
    render(<StudentForm editingStudent={sampleStudent} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('shows an error message when the save fails', async () => {
    const addStudent = vi.fn().mockRejectedValue(new Error('Unable to create student.'));
    resetStore({ addStudent });

    render(<StudentForm onDone={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Lovelace' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '10th Grade' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add student' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to create student.');
  });
});
