'use client';

import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  todoCount: number;
  onDragStart: () => void;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function ProjectCard({
  project,
  todoCount,
  onDragStart,
  onClick,
  onDelete,
  onEdit,
}: ProjectCardProps) {
  const languageColors: Record<string, string> = {
    python: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    go: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    lua: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    c: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    godot: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  };

  const langKey = project.language?.toLowerCase().split(',')[0]?.trim() || '';
  const langClass = languageColors[langKey] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onClick={onClick}
      className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        p-3 cursor-grab active:cursor-grabbing
        hover:border-blue-400 dark:hover:border-blue-500
        hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20
        hover:-translate-y-0.5
        transition-all duration-150 select-none"
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-snug
          group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {project.name}
        </h3>

        {/* Actions - visible on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
          {project.description}
        </p>
      )}

      {/* Footer tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {project.language && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${langClass}`}>
            {project.language}
          </span>
        )}

        {project.priority > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
            P{project.priority}
          </span>
        )}

        {todoCount > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
            {todoCount} todo{todoCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
