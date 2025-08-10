'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import Column from './Column';
import TaskCard from './TaskCard';
import type { Task, TaskColumn } from '@/lib/types';

interface BoardProps {
  tasks: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskAiClick?: (taskId: string) => void;
  onAddTask?: (columnId: TaskColumn) => void;
  className?: string;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const columns: { id: TaskColumn; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
];

const Board: React.FC<BoardProps> = ({
  tasks,
  onTasksChange,
  onTaskEdit,
  onTaskAiClick,
  onAddTask,
  className = '',
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Debounced state writes (300ms as specified)
  const debouncedTasks = useDebounce(localTasks, 300);

  // Sync local tasks with prop changes
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Call onTasksChange when debounced tasks change
  useEffect(() => {
    if (JSON.stringify(debouncedTasks) !== JSON.stringify(tasks)) {
      onTasksChange?.(debouncedTasks);
    }
  }, [debouncedTasks, tasks, onTasksChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findTaskById = useCallback((id: string): Task | undefined => {
    return localTasks.find(task => task.id === id);
  }, [localTasks]);

  const getTasksByColumn = useCallback((columnId: TaskColumn): Task[] => {
    return localTasks.filter(task => task.column_id === columnId);
  }, [localTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active task
    const activeTask = findTaskById(activeId);
    if (!activeTask) return;

    // Determine what we're over
    const isOverColumn = columns.some(col => col.id === overId);
    const isOverTask = localTasks.some(task => task.id === overId);

    if (isOverColumn) {
      // Moving over a column
      const newColumnId = overId as TaskColumn;
      if (activeTask.column_id === newColumnId) return;

      setLocalTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === activeId 
            ? { ...task, column_id: newColumnId }
            : task
        )
      );
    } else if (isOverTask) {
      // Moving over another task
      const overTask = findTaskById(overId);
      if (!overTask || activeTask.column_id === overTask.column_id) return;

      setLocalTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === activeId 
            ? { ...task, column_id: overTask.column_id }
            : task
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = findTaskById(activeId);
    const overTask = findTaskById(overId);

    if (!activeTask) return;

    // If we're dropping on another task in the same column, reorder
    if (overTask && activeTask.column_id === overTask.column_id) {
      const columnTasks = getTasksByColumn(activeTask.column_id);
      const activeIndex = columnTasks.findIndex(task => task.id === activeId);
      const overIndex = columnTasks.findIndex(task => task.id === overId);

      if (activeIndex !== overIndex) {
        const reorderedTasks = arrayMove(columnTasks, activeIndex, overIndex);
        
        setLocalTasks(prevTasks => {
          const otherTasks = prevTasks.filter(task => task.column_id !== activeTask.column_id);
          return [...otherTasks, ...reorderedTasks];
        });
      }
    }
  };

  return (
    <div 
      className={`h-full ${className}`}
      role="application"
      aria-label="Kanban board for task management"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full p-6 bg-gray-50 dark:bg-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {columns.map((column) => (
            <Column
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={getTasksByColumn(column.id)}
              onTaskEdit={onTaskEdit}
              onTaskAiClick={onTaskAiClick}
              onAddTask={onAddTask}
              className="min-h-0"
            />
          ))}
        </motion.div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? (
            <div className="rotate-3 transform">
              <TaskCard
                task={activeTask}
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Accessibility instructions */}
      <div className="sr-only">
        <h2>Kanban Board Instructions</h2>
        <p>
          This is a Kanban board with three columns: To Do, Doing, and Done. 
          Use Tab to navigate between tasks and columns. 
          Press Enter or Space to edit a task.
          Use arrow keys with a screen reader to explore the board structure.
          Drag and drop tasks between columns to change their status.
        </p>
      </div>
    </div>
  );
};

export default Board;