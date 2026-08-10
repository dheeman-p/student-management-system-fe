// FILE: frontend/src/api/client.ts
import { getToken, clearToken } from '../auth/session';
import { CreateStudentInput, Student, UpdateStudentInput } from '../types/student';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface UserProfile {
  id: string;
  authId: string;
  email: string;
  name: string;
  role: Role;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Thin fetch wrapper that injects the bearer token and normalizes errors.
 * This is the single API entry point used by all later tasks.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token rejected — drop it so the app falls back to the login flow.
    clearToken();
  }

  const body = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const message = (body && (body as { message?: string }).message) || res.statusText;
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export const api = {
  login(email: string, password: string): Promise<{ token: string }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  me(): Promise<UserProfile> {
    return request('/auth/me');
  },
  listStudents(): Promise<Student[]> {
    return request('/students');
  },
  getStudent(id: string): Promise<Student> {
    return request(`/students/${id}`);
  },
  createStudent(input: CreateStudentInput): Promise<Student> {
    return request('/students', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  updateStudent(id: string, input: UpdateStudentInput): Promise<Student> {
    return request(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  deleteStudent(id: string): Promise<void> {
    return request(`/students/${id}`, { method: 'DELETE' });
  },
};
