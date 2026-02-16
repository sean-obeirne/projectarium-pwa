'use client';

import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
}

export default function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  const priorityColors = {
    low: 'text-gray-600 dark:text-gray-400',
    medium: 'text-orange-600 dark:text-orange-400',
    high: 'text-red-600 dark:text-red-400',
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No tasks found. Create your first task to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {task.title}
            </h3>
            <div className="flex gap-2 items-center">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  statusColors[task.status]
                }`}
              >
                {task.status}
              </span>
              <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                {task.priority.toUpperCase()}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            {task.description}
          </p>
          
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="flex gap-4">
              {task.dueDate && (
                <span>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              <span>
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(task)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-red-600 dark:text-red-400 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
