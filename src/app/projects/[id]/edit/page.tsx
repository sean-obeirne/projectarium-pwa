'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProject, updateProject } from '@/lib/api';
import { Project, CreateProjectInput, UpdateProjectInput } from '@/types';
import ProjectForm from '@/components/ProjectForm';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const data = await getProject(projectId);
      setProject(data);
    } catch (err) {
      alert('Failed to load project');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreateProjectInput | UpdateProjectInput) => {
    try {
      await updateProject(projectId, data as UpdateProjectInput);
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      alert('Failed to update project: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleCancel = () => {
    router.push(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400">Project not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Edit Project
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <ProjectForm
          project={project}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
