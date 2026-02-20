'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project, Todo, KANBAN_COLUMNS, KanbanStatus, normalizeStatus } from '@/types';
import {
  getProjects,
  getTodos,
  deleteProject,
  updateProjectStatus,
  createProject,
  updateProject,
  createTodo,
  updateTodo,
  deleteTodo,
} from '@/lib/api';
import ProjectCard from '@/components/ProjectCard';
import ProjectModal from '@/components/ProjectModal';
import ProjectForm from '@/components/ProjectForm';

export default function KanbanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Record<number, Todo[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag state
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null);

  // Modal state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await getProjects();
      setProjects(projectsData || []);

      // Load todos for all projects
      const todoMap: Record<number, Todo[]> = {};
      await Promise.all(
        (projectsData || []).map(async (p) => {
          try {
            const projectTodos = await getTodos(p.id);
            todoMap[p.id] = projectTodos || [];
          } catch {
            todoMap[p.id] = [];
          }
        })
      );
      setTodos(todoMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Drag and Drop ──

  const handleDragStart = (project: Project) => {
    setDraggedProject(project);
  };

  const handleDragOver = (e: React.DragEvent, column: KanbanStatus) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (column: KanbanStatus) => {
    setDragOverColumn(null);
    if (!draggedProject) return;

    const currentStatus = normalizeStatus(draggedProject.status);
    if (currentStatus === column) {
      setDraggedProject(null);
      return;
    }

    // Optimistic update
    const updated = { ...draggedProject, status: column };
    setProjects((prev) =>
      prev.map((p) => (p.id === draggedProject.id ? updated : p))
    );
    setDraggedProject(null);

    try {
      await updateProjectStatus(draggedProject.id, column);
    } catch {
      // Revert on failure
      setProjects((prev) =>
        prev.map((p) => (p.id === draggedProject.id ? draggedProject : p))
      );
    }
  };

  // ── Project CRUD ──

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this project and all its todos?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setSelectedProject(null);
    } catch {
      alert('Failed to delete project');
    }
  };

  const handleCreate = async (data: Partial<Project>) => {
    try {
      const created = await createProject(data);
      setProjects((prev) => [...prev, created]);
      setTodos((prev) => ({ ...prev, [created.id]: [] }));
      setShowCreateModal(false);
    } catch (err) {
      alert('Failed to create project: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUpdate = async (data: Partial<Project>) => {
    if (!editingProject) return;
    try {
      const updated = await updateProject(editingProject.id, {
        ...editingProject,
        ...data,
      });
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedProject?.id === updated.id) {
        setSelectedProject(updated);
      }
      setEditingProject(null);
    } catch (err) {
      alert('Failed to update project: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // ── Todo CRUD ──

  const handleAddTodo = async (projectId: number, description: string) => {
    try {
      const created = await createTodo({
        description,
        priority: 0,
        project_id: projectId,
      });
      setTodos((prev) => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), created],
      }));
    } catch {
      alert('Failed to create todo');
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      const updated = await updateTodo(todo.id, {
        ...todo,
        deleted: !todo.deleted,
      });
      setTodos((prev) => ({
        ...prev,
        [todo.project_id!]: (prev[todo.project_id!] || []).map((t) =>
          t.id === todo.id ? updated : t
        ),
      }));
    } catch {
      alert('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todo: Todo) => {
    try {
      await deleteTodo(todo.id);
      setTodos((prev) => ({
        ...prev,
        [todo.project_id!]: (prev[todo.project_id!] || []).filter(
          (t) => t.id !== todo.id
        ),
      }));
    } catch {
      alert('Failed to delete todo');
    }
  };

  // ── Column helpers ──

  const getColumnProjects = (column: KanbanStatus) =>
    projects
      .filter((p) => normalizeStatus(p.status) === column)
      .sort((a, b) => b.priority - a.priority);

  const columnColors: Record<KanbanStatus, { bg: string; border: string; header: string; count: string; dropzone: string }> = {
    abandoned: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      header: 'text-red-700 dark:text-red-400',
      count: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      dropzone: 'bg-red-100/50 dark:bg-red-900/30 border-red-400 dark:border-red-600',
    },
    backlog: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      header: 'text-amber-700 dark:text-amber-400',
      count: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      dropzone: 'bg-amber-100/50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600',
    },
    active: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      header: 'text-blue-700 dark:text-blue-400',
      count: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      dropzone: 'bg-blue-100/50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600',
    },
    completed: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      header: 'text-emerald-700 dark:text-emerald-400',
      count: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      dropzone: 'bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600',
    },
  };

  // ── Render ──

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <p className="text-red-500 dark:text-red-400 text-lg">{error}</p>
        <button
          onClick={loadData}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} across {KANBAN_COLUMNS.length} columns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4 px-4 h-[calc(100vh-12rem)] min-h-0">
        {KANBAN_COLUMNS.map(({ key, label }) => {
          const colProjects = getColumnProjects(key);
          const colors = columnColors[key];
          const isDropTarget = dragOverColumn === key;

          return (
            <div
              key={key}
              className={`flex flex-col rounded-xl border-2 transition-all duration-200 ${isDropTarget
                  ? `${colors.dropzone} border-dashed scale-[1.01]`
                  : `${colors.bg} ${colors.border}`
                }`}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(key)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
                <h2 className={`font-semibold text-sm uppercase tracking-wider ${colors.header}`}>
                  {label}
                </h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.count}`}>
                  {colProjects.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {colProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    todoCount={todos[project.id]?.length || 0}
                    onDragStart={() => handleDragStart(project)}
                    onClick={() => setSelectedProject(project)}
                    onDelete={() => handleDelete(project.id)}
                    onEdit={() => setEditingProject(project)}
                  />
                ))}

                {colProjects.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-gray-400 dark:text-gray-600 text-sm italic">
                    Drop projects here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          todos={todos[selectedProject.id] || []}
          onClose={() => setSelectedProject(null)}
          onEdit={() => {
            setEditingProject(selectedProject);
            setSelectedProject(null);
          }}
          onDelete={() => handleDelete(selectedProject.id)}
          onAddTodo={(desc) => handleAddTodo(selectedProject.id, desc)}
          onToggleTodo={handleToggleTodo}
          onDeleteTodo={handleDeleteTodo}
        />
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ProjectForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setEditingProject(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Project</h2>
              <button onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ProjectForm
                project={editingProject}
                onSubmit={handleUpdate}
                onCancel={() => setEditingProject(null)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
