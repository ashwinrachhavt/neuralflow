'use client';

import { forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onAiClick?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  isDragging?: boolean;
}

const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, onAiClick, onEdit, isDragging }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: sortableIsDragging,
    } = useSortable({
      id: task.id,
      data: {
        type: 'task',
        task,
      },
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const isCurrentlyDragging = isDragging || sortableIsDragging;

    // Truncate notes to 100 characters for display
    const truncatedNotes = task.notes && task.notes.length > 100 
      ? `${task.notes.substring(0, 100)}...` 
      : task.notes;

    const handleCardClick = (e: React.MouseEvent) => {
      // Don't trigger edit when clicking AI button or drag handle
      if ((e.target as HTMLElement).closest('button')) return;
      onEdit?.(task);
    };

    const handleAiClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onAiClick?.(task.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onEdit?.(task);
      }
    };

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className={`
          ${isCurrentlyDragging ? 'opacity-80 outline outline-2 outline-indigo-500' : ''}
          cursor-pointer
        `}
        {...attributes}
        {...listeners}
      >
        <Card 
          ref={ref}
          className="group hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 bg-slate-800/60 border-slate-600/50 hover:border-blue-500/30 hover:bg-slate-800/80 cursor-pointer"
          onClick={handleCardClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={`Task: ${task.title}. ${task.pom_count} pomodoros completed. Click to edit.`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2 flex-1">
                {task.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-md"
                onClick={handleAiClick}
                aria-label="AI assistance for this task"
                tabIndex={-1}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0 space-y-3">
            {truncatedNotes && (
              <div className="p-2 rounded-md bg-slate-700/30 border border-slate-600/30">
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {truncatedNotes}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Badge 
                variant="secondary" 
                className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30 font-medium"
              >
                🍅 {task.pom_count}
              </Badge>
              
              <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                {task.column_id.replace('_', ' ')}
              </div>
              
              {/* Accessibility: Show column status for screen readers */}
              <span className="sr-only">
                Status: {task.column_id}
              </span>
            </div>
            
            {/* Click hint */}
            <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100">
              Click to edit • AI assist available
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

TaskCard.displayName = 'TaskCard';

export default TaskCard;