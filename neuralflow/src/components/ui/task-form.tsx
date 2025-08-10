'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, notes?: string) => void;
  initialTitle?: string;
  initialNotes?: string;
  mode: 'create' | 'edit';
}

export function TaskForm({ isOpen, onClose, onSubmit, initialTitle = '', initialNotes = '', mode }: TaskFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), notes.trim() || undefined);
    onClose();
    setTitle('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md border-slate-600/50 bg-slate-800/90 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white">
              {mode === 'create' ? 'Create New Task' : 'Edit Task'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-200 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                maxLength={50}
                className="w-full h-11 px-3 rounded-lg border border-slate-600/50 bg-slate-700/50 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                autoFocus
                required
              />
              <p className="text-xs text-slate-400 mt-1">{title.length}/50 characters</p>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-200 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details..."
                maxLength={2000}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-slate-600/50 bg-slate-700/50 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">{notes.length}/2000 characters</p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={!title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-400"
              >
                {mode === 'create' ? 'Create Task' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
