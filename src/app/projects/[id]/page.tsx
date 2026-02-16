'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Project, Task } from '@/types';
import { getProject, getTasks, deleteProject } from '@/lib/api';
import TaskList from '@/components/TaskList';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectData, tasksData] = await Promise.all([
        getProject(projectId),
        getTasks(projectId),
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project and all its tasks?')) return;

    try {
      await deleteProject(projectId);
      router.push('/');
      router.refresh();
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">
          {error || 'Project not found'}
        </div>
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Projects
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {project.name}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusColors[project.status]
              }`}
            >
              {project.status}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/projects/${projectId}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {project.description}
        </p>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
          <p>Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tasks ({tasks.length})
        </h2>
        <Link
          href={`/tasks/new?projectId=${projectId}`}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          New Task
        </Link>
      </div>

      <TaskList
        tasks={tasks}
        onEdit={(task) => router.push(`/tasks/${task.id}/edit`)}
        onDelete={async (taskId) => {
          // Refresh the page to reload tasks
          router.refresh();
        }}
      />
    </div>
  );
}
