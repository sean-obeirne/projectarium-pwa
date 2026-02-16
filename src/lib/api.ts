import {
  Project,
  Task,
  CreateProjectInput,
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      response.status,
      errorText || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

// Project API functions
export async function getProjects(): Promise<Project[]> {
  return fetchApi<Project[]>('/projects');
}

export async function getProject(id: string): Promise<Project> {
  return fetchApi<Project>(`/projects/${id}`);
}

export async function createProject(
  data: CreateProjectInput
): Promise<Project> {
  return fetchApi<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(
  id: string,
  data: UpdateProjectInput
): Promise<Project> {
  return fetchApi<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  return fetchApi<void>(`/projects/${id}`, {
    method: 'DELETE',
  });
}

// Task API functions
export async function getTasks(projectId?: string): Promise<Task[]> {
  const endpoint = projectId
    ? `/tasks?projectId=${projectId}`
    : '/tasks';
  return fetchApi<Task[]>(endpoint);
}

export async function getTask(id: string): Promise<Task> {
  return fetchApi<Task>(`/tasks/${id}`);
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  return fetchApi<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(
  id: string,
  data: UpdateTaskInput
): Promise<Task> {
  return fetchApi<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string): Promise<void> {
  return fetchApi<void>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}
