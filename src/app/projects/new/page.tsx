'use client';

import { useRouter } from 'next/navigation';
import { createProject } from '@/lib/api';
import { CreateProjectInput, UpdateProjectInput } from '@/types';
import ProjectForm from '@/components/ProjectForm';

export default function NewProjectPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateProjectInput | UpdateProjectInput) => {
    try {
      await createProject(data as CreateProjectInput);
      router.push('/');
      router.refresh();
    } catch (err) {
      alert('Failed to create project: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Create New Project
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <ProjectForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
