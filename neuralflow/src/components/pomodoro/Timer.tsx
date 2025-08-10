/**
 * Timer - Compact timer component for dashboard
 * 
 * Provides a compact timer interface with progress indication and 
 * essential controls for use in the main dashboard view.
 */

'use client';

import React, { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, SkipForward, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TimerDisplay } from './TimerDisplay';
import { useTimer, type UseTimerResult } from '@/lib/timer/timer-client';
import { TimerMode, Task } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TimerProps {
  /** Current task being worked on */
  currentTask?: Task;
  
  /** Callback when entering zen mode */
  onEnterZenMode?: () => void;
  
  /** Callback when timer completes */
  onComplete?: (mode: TimerMode, taskId?: string) => void;
  
  /** Callback for timer tick updates */
  onTick?: (remainingTime: number, elapsedTime: number) => void;
  
  /** Callback for errors */
  onError?: (error: string) => void;
  
  /** Timer configuration */
  config?: {
    focusDuration: number; // minutes
    shortBreakDuration: number; // minutes
    longBreakDuration: number; // minutes
    longBreakInterval: number; // number of focus sessions
  };
  
  /** Compact mode for smaller displays */
  compact?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

const DEFAULT_CONFIG = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4
};

/**
 * Control Button Component
 */
interface ControlButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'secondary' | 'destructive';
  disabled?: boolean;
  size?: 'sm' | 'default';
}

function ControlButton({ 
  onClick, 
  icon, 
  label, 
  variant = 'default',
  disabled = false,
  size = 'default'
}: ControlButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 transition-all duration-200',
        size === 'sm' && 'px-2 py-1'
      )}
      aria-label={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

/**
 * Timer Status Indicator
 */
interface StatusIndicatorProps {
  isRunning: boolean;
  isPaused: boolean;
  mode: TimerMode;
}

function StatusIndicator({ isRunning, isPaused, mode }: StatusIndicatorProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="flex items-center gap-2"
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isRunning && !isPaused && 'bg-green-500 animate-pulse',
          isPaused && 'bg-yellow-500',
          !isRunning && !isPaused && 'bg-muted-foreground/30'
        )}
        aria-hidden="true"
      />
      <span className="text-sm text-muted-foreground">
        {isRunning && !isPaused && `${mode.toLowerCase()} active`}
        {isPaused && 'paused'}
        {!isRunning && !isPaused && 'ready'}
      </span>
    </motion.div>
  );
}

/**
 * Main Timer Component
 */
export function Timer({
  currentTask,
  onEnterZenMode,
  onComplete,
  onTick,
  onError,
  config = DEFAULT_CONFIG,
  compact = false,
  className
}: TimerProps) {
  
  const { timer, controls, isWorkerReady }: UseTimerResult = useTimer(
    onComplete,
    onTick,
    onError
  );

  // Convert minutes to milliseconds for timer
  const getDurationMs = useCallback((minutes: number) => minutes * 60 * 1000, []);

  // Handle start timer
  const handleStart = useCallback(async () => {
    try {
      const duration = getDurationMs(
        timer.mode === 'FOCUS' ? config.focusDuration : config.shortBreakDuration
      );
      await controls.start(duration, timer.mode, currentTask?.id);
    } catch (error) {
      console.error('Failed to start timer:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to start timer');
    }
  }, [timer.mode, config, currentTask?.id, controls, getDurationMs, onError]);

  // Handle pause/resume toggle
  const handlePauseResume = useCallback(() => {
    if (timer.state === 'RUNNING') {
      controls.pause();
    } else if (timer.state === 'PAUSED') {
      controls.resume();
    }
  }, [timer.state, controls]);

  // Control button configurations
  const isRunning = timer.state === 'RUNNING';
  const isPaused = timer.state === 'PAUSED';
  const isIdle = timer.state === 'IDLE';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isIdle) {
            handleStart();
          } else {
            handlePauseResume();
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (!isIdle) {
            controls.stop();
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (!isIdle) {
            controls.skip();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isIdle, handleStart, handlePauseResume, controls]);

  return (
    <Card className={cn('p-6', compact && 'p-4', className)}>
      <div className="space-y-4">
        {/* Current Task Info */}
        <AnimatePresence>
          {currentTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-center"
            >
              <h3 className="font-medium text-sm text-muted-foreground mb-1">
                Current Task
              </h3>
              <p className="font-semibold text-lg leading-tight">
                {currentTask.title}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer Display */}
        <div className="text-center">
          <TimerDisplay
            remainingTime={timer.remainingTime}
            totalTime={timer.totalTime}
            state={timer.state}
            mode={timer.mode}
            size={compact ? 'md' : 'lg'}
            showProgress={true}
            progressType="ring"
            showMode={true}
          />
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center">
          <StatusIndicator
            isRunning={isRunning}
            isPaused={isPaused}
            mode={timer.mode}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2">
          {isIdle ? (
            <ControlButton
              onClick={handleStart}
              icon={<Play className="w-4 h-4" />}
              label="Start"
              disabled={!isWorkerReady}
              size={compact ? 'sm' : 'default'}
            />
          ) : (
            <ControlButton
              onClick={handlePauseResume}
              icon={isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              label={isPaused ? 'Resume' : 'Pause'}
              size={compact ? 'sm' : 'default'}
            />
          )}

          {!isIdle && (
            <>
              <ControlButton
                onClick={controls.stop}
                icon={<Square className="w-4 h-4" />}
                label="Stop"
                variant="secondary"
                size={compact ? 'sm' : 'default'}
              />
              
              <ControlButton
                onClick={controls.skip}
                icon={<SkipForward className="w-4 h-4" />}
                label="Skip"
                variant="secondary"
                size={compact ? 'sm' : 'default'}
              />
            </>
          )}

          {/* Zen Mode Button */}
          {onEnterZenMode && !isIdle && (
            <ControlButton
              onClick={onEnterZenMode}
              icon={<Zap className="w-4 h-4" />}
              label="Zen"
              variant="secondary"
              size={compact ? 'sm' : 'default'}
            />
          )}
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {timer.error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center"
            >
              <p className="text-sm text-destructive">{timer.error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Shortcuts Help */}
        {!compact && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p className="font-medium">Keyboard Shortcuts:</p>
            <p>Space: Start/Pause • ESC: Stop • Enter: Skip</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default Timer;