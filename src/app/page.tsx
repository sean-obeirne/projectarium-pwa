'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Project, Todo, KANBAN_COLUMNS, KanbanStatus, normalizeStatus } from '@/types';
import { kanbanColors, dragColors, pageColors, buttonColors, modalColors } from '@/lib/theme';
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
  const [fontSize, setFontSize] = useState(16);

  // Drag state – draggedId is only for visual styling; actual ID is read from dataTransfer in drop handlers
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<{
    column: KanbanStatus;
    cardId: number | null;
    position: 'before' | 'after';
  } | null>(null);

  // Client-side column ordering (array of project IDs)
  const [colOrder, setColOrder] = useState<Record<string, number[]>>({});

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

      // Initialize column ordering from API data
      const initialOrder: Record<string, number[]> = {};
      KANBAN_COLUMNS.forEach(({ key }) => {
        initialOrder[key] = (projectsData || [])
          .filter(p => normalizeStatus(p.status) === key)
          .sort((a, b) => b.priority - a.priority)
          .map(p => p.id);
      });
      setColOrder(initialOrder);

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

  const handleDragStart = (projectId: number) => {
    setDraggedId(projectId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOver(null);
  };

  // Called by each card's onDragOver
  const handleCardDragOver = (e: React.DragEvent, cardId: number, column: KanbanStatus) => {
    e.preventDefault();
    e.stopPropagation(); // prevent column handler from overriding cardId
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position: 'before' | 'after' = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    setDragOver({ column, cardId, position });
  };

  // Single drop handler – handles both card-level (insert before/after) and column-level (append) drops
  const handleDrop = (column: KanbanStatus, draggedId: number) => {
    const id = draggedId;
    if (!id) { setDragOver(null); return; }
    const sourceProject = projects.find(p => p.id === id);
    if (!sourceProject) { setDraggedId(null); setDragOver(null); return; }

    const sourceColumn = normalizeStatus(sourceProject.status);

    setColOrder(prev => {
      const next = { ...prev };
      next[sourceColumn] = (next[sourceColumn] || []).filter(x => x !== id);
      const targetArr = [...(next[column] || []).filter(x => x !== id)];

      // If dragOver points at a specific card in this column, insert relative to it
      const snap = dragOver;
      if (snap && snap.column === column && snap.cardId !== null) {
        const idx = targetArr.indexOf(snap.cardId);
        const insertAt = idx < 0 ? targetArr.length : (snap.position === 'before' ? idx : idx + 1);
        targetArr.splice(insertAt, 0, id);
      } else {
        targetArr.push(id);
      }

      next[column] = targetArr;
      return next;
    });

    if (sourceColumn !== column) {
      const optimistic = { ...sourceProject, status: column };
      setProjects(prev => prev.map(p => p.id === id ? optimistic : p));
      updateProjectStatus(id, column).catch(() => {
        setProjects(prev => prev.map(p => p.id === id ? sourceProject : p));
      });
    }

    setDraggedId(null);
    setDragOver(null);
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

  const getColumnProjects = (column: KanbanStatus): Project[] => {
    const colProjects = projects.filter(p => normalizeStatus(p.status) === column);
    const order = colOrder[column];
    if (!order || order.length === 0) {
      return [...colProjects].sort((a, b) => b.priority - a.priority);
    }
    const indexMap = new Map(order.map((id, i) => [id, i]));
    return [...colProjects].sort((a, b) => {
      const ai = indexMap.has(a.id) ? indexMap.get(a.id)! : 999;
      const bi = indexMap.has(b.id) ? indexMap.get(b.id)! : 999;
      return ai - bi;
    });
  };

  // ── Render ──

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${pageColors.loadingSpinner}`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <p className={`${pageColors.errorText} text-lg`}>{error}</p>
        <button
          onClick={loadData}
          className={`${buttonColors.primary} font-medium py-2 px-6 rounded-lg transition-colors`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontSize: `${fontSize}px` }}>
      {/* Header */}
      <div className="flex mb-6 px-4 items-center">
        <div className="flex-1">
          <p className={`text-lg font-bold ${pageColors.headerSubtitle} mt-1`}>
            {projects.length} projects
          </p>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          {/* Text Size Slider */}
          <div className="flex items-center gap-2">
            <label htmlFor="font-size-slider" className="text-sm font-bold">Text Size</label>
            <input
              id="font-size-slider"
              type="range"
              min={12}
              max={32}
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              className={`w-32 ${pageColors.sliderAccent}`}
              style={{ accentColor: pageColors.sliderAccent }}
            />
            <span className="text-xs">{fontSize}px</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`text-lg font-bold ${buttonColors.primary} py-2 px-5 rounded-lg transition-colors flex items-center gap-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4 px-4 h-[calc(100vh-12rem)] min-h-0">
        {KANBAN_COLUMNS.map(({ key, label }) => {
          const colProjects = getColumnProjects(key);
          const colors = kanbanColors[key];
          const isDropTarget = dragOver?.column === key;

          return (
            <div
              key={key}
              className={`flex flex-col rounded-xl border-2 transition-all duration-200 ${isDropTarget
                ? `${colors.dropzone} border-dashed scale-[1.01]`
                : `${colors.bg} ${colors.border}`
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(prev => {
                  if (prev?.column === key && prev?.cardId !== null) return prev;
                  return { column: key, cardId: null, position: 'after' };
                });
              }}
              onDragLeave={(e) => {
                // Only clear when truly leaving the column (not moving to a child)
                if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
                setDragOver(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = parseInt(e.dataTransfer.getData('text/plain'));
                if (!isNaN(id)) handleDrop(key, id);
              }}
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
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                {colProjects.map((project) => {
                  const isTarget = dragOver?.column === key && dragOver?.cardId === project.id;
                  const isDragging = draggedId === project.id;
                  return (
                    <Fragment key={project.id}>
                      {isTarget && dragOver!.position === 'before' && (
                        <div className={`h-0.5 ${dragColors.dropIndicator} rounded-full shadow-sm shadow-blue-400`} />
                      )}
                      <ProjectCard
                        project={project}
                        todoCount={todos[project.id]?.length || 0}
                        isDragging={isDragging}
                        onDragStart={() => handleDragStart(project.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleCardDragOver(e, project.id, key)}
                        onClick={() => { if (!isDragging) setSelectedProject(project); }}
                        onDelete={() => handleDelete(project.id)}
                        onEdit={() => setEditingProject(project)}
                      />
                      {isTarget && dragOver!.position === 'after' && (
                        <div className={`h-0.5 ${dragColors.dropIndicator} rounded-full shadow-sm shadow-blue-400`} />
                      )}
                    </Fragment>
                  );
                })}

                {colProjects.length === 0 && (
                  <div className={`flex items-center justify-center h-24 ${pageColors.emptyText} text-sm italic`}>
                    Drop projects here
                  </div>
                )}

                {/* End-of-column drop indicator */}
                {isDropTarget && dragOver?.cardId === null && colProjects.length > 0 && (
                  <div className={`h-0.5 ${dragColors.dropIndicator} rounded-full shadow-sm shadow-blue-400`} />
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
    </div>
  );
}
