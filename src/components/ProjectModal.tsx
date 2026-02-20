'use client';

import { useState } from 'react';
import { Project, Todo } from '@/types';

interface ProjectModalProps {
    project: Project;
    todos: Todo[];
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddTodo: (description: string) => Promise<void>;
    onToggleTodo: (todo: Todo) => Promise<void>;
    onDeleteTodo: (todo: Todo) => Promise<void>;
}

export default function ProjectModal({
    project,
    todos,
    onClose,
    onEdit,
    onDelete,
    onAddTodo,
    onToggleTodo,
    onDeleteTodo,
}: ProjectModalProps) {
    const [newTodoText, setNewTodoText] = useState('');
    const [addingTodo, setAddingTodo] = useState(false);

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoText.trim()) return;
        setAddingTodo(true);
        try {
            await onAddTodo(newTodoText.trim());
            setNewTodoText('');
        } finally {
            setAddingTodo(false);
        }
    };

    const activeTodos = todos.filter((t) => !t.deleted);

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl
        border border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col">

                {/* Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                            {project.name}
                        </h2>
                        {project.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {project.description}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={onEdit}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-500 transition-colors"
                            title="Edit project"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-500 transition-colors"
                            title="Delete project"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Project Info */}
                <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
                    <div className="flex flex-wrap gap-2 text-xs">
                        {project.language && (
                            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                                {project.language}
                            </span>
                        )}
                        <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            Status: <span className="font-medium capitalize">{project.status}</span>
                        </span>
                        {project.priority > 0 && (
                            <span className="px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                                Priority: {project.priority}
                            </span>
                        )}
                        {project.path && (
                            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono truncate max-w-xs">
                                {project.path}
                            </span>
                        )}
                    </div>
                </div>

                {/* Todos Section */}
                <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                        Todos ({activeTodos.length})
                    </h3>

                    {/* Todo List */}
                    <div className="space-y-1.5">
                        {activeTodos.length === 0 && (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic py-4 text-center">
                                No todos yet. Add one below.
                            </p>
                        )}
                        {activeTodos.map((todo) => (
                            <div
                                key={todo.id}
                                className="flex items-start gap-2 group py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <button
                                    onClick={() => onDeleteTodo(todo)}
                                    className="mt-0.5 shrink-0 w-4 h-4 rounded border border-gray-300 dark:border-gray-600
                    hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/30
                    flex items-center justify-center transition-colors"
                                    title="Delete todo"
                                >
                                    <svg className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug flex-1">
                                    {todo.description}
                                </span>
                                {todo.priority > 0 && (
                                    <span className="text-[10px] font-medium text-orange-500 shrink-0">
                                        P{todo.priority}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Todo Form */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
                    <form onSubmit={handleAddTodo} className="flex gap-2">
                        <input
                            type="text"
                            value={newTodoText}
                            onChange={(e) => setNewTodoText(e.target.value)}
                            placeholder="Add a todo…"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                            disabled={addingTodo}
                        />
                        <button
                            type="submit"
                            disabled={addingTodo || !newTodoText.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                rounded-lg transition-colors disabled:opacity-50"
                        >
                            Add
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
