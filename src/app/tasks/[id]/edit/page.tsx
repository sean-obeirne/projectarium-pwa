'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTask, updateTask } from '@/lib/api';
import { Task, CreateTaskInput, UpdateTaskInput } from '@/types';
import TaskForm from '@/components/TaskForm';

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTask = useCallback(async () => {
    try {
      const data = await getTask(taskId);
      setTask(data);
    } catch (err) {
      alert('Failed to load task');
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  }, [taskId, router]);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId, loadTask]);

  const handleSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    try {
      await updateTask(taskId, data as UpdateTaskInput);
      router.push(`/projects/${task?.projectId}`);
      router.refresh();
    } catch (err) {
      alert('Failed to update task: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleCancel = () => {
    if (task?.projectId) {
      router.push(`/projects/${task.projectId}`);
    } else {
      router.push('/tasks');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400">Task not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Edit Task
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <TaskForm
          task={task}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
