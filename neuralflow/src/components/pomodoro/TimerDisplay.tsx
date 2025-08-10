/**
 * TimerDisplay - Shared timer display logic and formatting
 * 
 * Provides consistent timer display across different components with
 * support for progress indication and different display modes.
 */

'use client';

import React from 'react';
import { TimerState, TimerMode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  /** Current remaining time in milliseconds */
  remainingTime: number;
  
  /** Total session time in milliseconds */
  totalTime: number;
  
  /** Current timer state */
  state: TimerState;
  
  /** Current timer mode */
  mode: TimerMode;
  
  /** Display size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Show progress indication */
  showProgress?: boolean;
  
  /** Progress display type */
  progressType?: 'ring' | 'bar' | 'none';
  
  /** Additional CSS classes */
  className?: string;
  
  /** Show mode indicator */
  showMode?: boolean;
}

/**
 * Format time from milliseconds to MM:SS format
 */
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate progress percentage
 */
function calculateProgress(remainingTime: number, totalTime: number): number {
  if (totalTime === 0) return 0;
  const elapsed = totalTime - remainingTime;
  return Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
}

/**
 * Progress Ring Component
 */
interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  className?: string;
}

function ProgressRing({ progress, size, strokeWidth, className }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={cn('transform -rotate-90', className)}
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        className="text-muted/20"
      />
      
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="text-primary transition-all duration-300 ease-out"
      />
    </svg>
  );
}

/**
 * Progress Bar Component
 */
interface ProgressBarProps {
  progress: number;
  className?: string;
}

function ProgressBar({ progress, className }: ProgressBarProps) {
  return (
    <div
      className={cn(
        'w-full bg-muted/20 rounded-full overflow-hidden',
        className
      )}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * Mode Indicator Component
 */
interface ModeIndicatorProps {
  mode: TimerMode;
  state: TimerState;
  size?: 'sm' | 'md' | 'lg';
}

function ModeIndicator({ mode, state, size = 'md' }: ModeIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const modeColors = {
    FOCUS: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    BREAK: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  };

  const stateIndicator = state === 'RUNNING' ? '●' : state === 'PAUSED' ? '⏸' : '';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-medium border',
        sizeClasses[size],
        modeColors[mode]
      )}
      aria-label={`${mode.toLowerCase()} mode, ${state.toLowerCase()}`}
    >
      {stateIndicator && (
        <span className="text-xs" aria-hidden="true">
          {stateIndicator}
        </span>
      )}
      {mode}
    </div>
  );
}

/**
 * Main TimerDisplay Component
 */
export function TimerDisplay({
  remainingTime,
  totalTime,
  state,
  mode,
  size = 'md',
  showProgress = false,
  progressType = 'none',
  className,
  showMode = false
}: TimerDisplayProps) {
  const progress = calculateProgress(remainingTime, totalTime);
  const formattedTime = formatTime(remainingTime);
  
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  };

  const containerSizeClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6'
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        containerSizeClasses[size],
        className
      )}
    >
      {/* Mode Indicator */}
      {showMode && (
        <ModeIndicator 
          mode={mode} 
          state={state} 
          size={size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'} 
        />
      )}

      {/* Timer Display with Progress Ring */}
      {progressType === 'ring' ? (
        <div className="relative flex items-center justify-center">
          <ProgressRing
            progress={progress}
            size={size === 'xl' ? 240 : size === 'lg' ? 180 : size === 'md' ? 120 : 80}
            strokeWidth={size === 'xl' ? 8 : size === 'lg' ? 6 : 4}
          />
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center font-mono font-bold tabular-nums',
              sizeClasses[size]
            )}
            role="timer"
            aria-live="polite"
            aria-label={`${formattedTime} remaining`}
          >
            {formattedTime}
          </div>
        </div>
      ) : (
        /* Simple Timer Display */
        <div
          className={cn(
            'font-mono font-bold tabular-nums',
            sizeClasses[size]
          )}
          role="timer"
          aria-live="polite"
          aria-label={`${formattedTime} remaining`}
        >
          {formattedTime}
        </div>
      )}

      {/* Progress Bar */}
      {progressType === 'bar' && (
        <ProgressBar
          progress={progress}
          className={cn(
            'h-2',
            size === 'xl' ? 'w-80' : size === 'lg' ? 'w-60' : size === 'md' ? 'w-40' : 'w-32'
          )}
        />
      )}

      {/* Simple Progress Text */}
      {showProgress && progressType === 'none' && (
        <div className="text-sm text-muted-foreground">
          {Math.round(progress)}% complete
        </div>
      )}
    </div>
  );
}

export default TimerDisplay;