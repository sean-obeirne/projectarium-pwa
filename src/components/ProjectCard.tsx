import Link from 'next/link';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <Link href={`/projects/${project.id}`}>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
            {project.name}
          </h3>
        </Link>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            statusColors[project.status]
          }`}
        >
          {project.status}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
        {project.description}
      </p>
      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <span>
          Updated: {new Date(project.updatedAt).toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          <Link
            href={`/projects/${project.id}/edit`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Edit
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(project.id)}
              className="text-red-600 dark:text-red-400 hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
