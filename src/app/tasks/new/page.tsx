'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createTask } from '@/lib/api';
import { CreateTaskInput, UpdateTaskInput } from '@/types';
import TaskForm from '@/components/TaskForm';

function NewTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId') || undefined;

  const handleSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    try {
      await createTask(data as CreateTaskInput);
      if (projectId) {
        router.push(`/projects/${projectId}`);
      } else {
        router.push('/tasks');
      }
      router.refresh();
    } catch (err) {
      alert('Failed to create task: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleCancel = () => {
    if (projectId) {
      router.push(`/projects/${projectId}`);
    } else {
      router.push('/tasks');
    }
  };

  return (
    <TaskForm
      projectId={projectId}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}

export default function NewTaskPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Create New Task
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <Suspense fallback={<div>Loading...</div>}>
          <NewTaskForm />
        </Suspense>
      </div>
    </div>
  );
}
