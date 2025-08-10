'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TaskCard from './TaskCard';
import type { Task, TaskColumn } from '@/lib/types';

interface ColumnProps {
  id: TaskColumn;
  title: string;
  tasks: Task[];
  onTaskEdit?: (task: Task) => void;
  onTaskAiClick?: (taskId: string) => void;
  onAddTask?: (columnId: TaskColumn) => void;
  className?: string;
}

const columnStyles = {
  todo: {
    header: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    dropzone: 'border-blue-300 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/10'
  },
  doing: {
    header: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    dropzone: 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-600 dark:bg-yellow-950/10'
  },
  done: {
    header: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    dropzone: 'border-green-300 bg-green-50/50 dark:border-green-600 dark:bg-green-950/10'
  }
};

const Column: React.FC<ColumnProps> = ({
  id,
  title,
  tasks,
  onTaskEdit,
  onTaskAiClick,
  onAddTask,
  className = '',
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      columnId: id,
    },
  });

  const styles = columnStyles[id];
  const taskIds = tasks.map(task => task.id);

  const handleAddTask = () => {
    onAddTask?.(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={`flex flex-col h-full min-w-0 ${className}`}
    >
      <Card className="flex flex-col h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className={`flex-shrink-0 pb-3 ${styles.header} rounded-t-lg border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                {title}
              </h2>
              <Badge 
                variant="secondary" 
                className={`text-sm ${styles.badge}`}
              >
                {tasks.length}
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddTask}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-white/80 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700/80"
              aria-label={`Add new task to ${title} column`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent 
          ref={setNodeRef}
          className={`
            flex-1 p-3 min-h-0 
            ${isOver ? `border-2 border-dashed ${styles.dropzone}` : ''}
            transition-all duration-200
          `}
          role="region"
          aria-label={`${title} tasks column`}
        >
          <SortableContext 
            items={taskIds} 
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 h-full">
              {tasks.length === 0 ? (
                <div 
                  className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg"
                  role="status"
                  aria-label={`No tasks in ${title} column`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📋</div>
                    <p>No tasks yet</p>
                    <p className="text-xs mt-1">Drag tasks here or click + to add</p>
                  </div>
                </div>
              ) : (
                <div 
                  className="space-y-3"
                  role="list"
                  aria-label={`${tasks.length} tasks in ${title} column`}
                >
                  {tasks.map((task) => (
                    <div key={task.id} role="listitem">
                      <TaskCard
                        task={task}
                        onEdit={onTaskEdit}
                        onAiClick={onTaskAiClick}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SortableContext>

          {/* Screen reader instructions */}
          <div className="sr-only">
            Use arrow keys to navigate between tasks. Press Enter or Space to edit a task. 
            Use Tab to access the AI assistance button.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Column;