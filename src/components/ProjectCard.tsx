import { Project } from '@/types';
import { languageColors, defaultLanguageColor, dragColors, cardColors } from '@/lib/theme';

interface ProjectCardProps {
  project: Project;
  todoCount: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  fontSizeLevel: number;
  getFontSizeClass: (baseClass: string) => string;
}

export default function ProjectCard({
  project,
  todoCount,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onClick,
  onDelete,
  onEdit,
  fontSizeLevel,
  getFontSizeClass,
}: ProjectCardProps) {
  const langKey = project.language?.toLowerCase().split(',')[0]?.trim() || '';
  const langClass = languageColors[langKey] || defaultLanguageColor;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', project.id.toString());
        e.dataTransfer.effectAllowed = 'move';

        // Create a custom drag ghost with clean styling
        const dragGhost = (e.currentTarget as HTMLElement).cloneNode(true) as HTMLElement;
        dragGhost.style.position = 'absolute';
        dragGhost.style.top = '-9999px';
        dragGhost.style.left = '-9999px';
        dragGhost.style.width = (e.currentTarget as HTMLElement).offsetWidth + 'px';
        dragGhost.style.border = `2px solid ${dragColors.ghostBorder}`;
        dragGhost.style.borderRadius = '0.5rem';
        dragGhost.style.transform = 'none';
        dragGhost.style.backgroundColor = 'black';
        document.body.appendChild(dragGhost);
        e.dataTransfer.setDragImage(dragGhost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setTimeout(() => document.body.removeChild(dragGhost), 0);

        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { onDragOver(e); }}
      onClick={onClick}
      className={`group relative ${cardColors.background} rounded-lg border ${cardColors.border}
        p-3 cursor-grab active:cursor-grabbing
        ${cardColors.hoverBorder}
        ${cardColors.shadow}
        hover:-translate-y-0.5
        transition-all duration-150 select-none
        ${isDragging ? dragColors.draggingCard : ''}`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className={`font-semibold ${getFontSizeClass('text-sm')} text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
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
        <p className={`${getFontSizeClass('text-xs')} text-gray-500 dark:text-gray-400 line-clamp-2 mb-2`}>
          {project.description}
        </p>
      )}

      {/* Footer tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {project.language && (
          <span className={`${getFontSizeClass('text-[10px]')} font-medium px-1.5 py-0.5 rounded ${langClass}`}>
            {project.language}
          </span>
        )}

        {project.priority > 0 && (
          <span className={`${getFontSizeClass('text-[10px]')} font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300`}>
            P{project.priority}
          </span>
        )}

        {todoCount > 0 && (
          <span className={`${getFontSizeClass('text-[10px]')} font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300`}>
            {todoCount} todo{todoCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
