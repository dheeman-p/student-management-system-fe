// FILE: frontend/src/types/student.ts
/**
 * Shared domain types for the Student entity.
 * These are the contract used by the API client, the Zustand store, and
 * the Students page/tests — keep all three in sync with this file.
 */

/** Enrollment lifecycle status for a student record. */
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED';

/** A student record as returned by the API. */
export interface Student {
  /** Mongo ObjectId string. */
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Grade/class label, e.g. "10th Grade". */
  grade: string;
  status: StudentStatus;
  /** Foreign key to the enrolling user/account, if linked. */
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a student (server assigns id + timestamps). */
export type CreateStudentInput = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>;

/** Payload for updating a student — all fields optional. */
export type UpdateStudentInput = Partial<CreateStudentInput>;
