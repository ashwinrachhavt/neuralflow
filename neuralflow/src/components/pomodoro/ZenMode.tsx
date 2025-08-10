/**
 * ZenMode - Fullscreen timer view for distraction-free focus
 * 
 * Provides a minimalist fullscreen timer interface with optional
 * animated background and keyboard controls for maximum focus.
 */

'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, SkipForward, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimerDisplay, formatTime } from './TimerDisplay';
import { useTimer, type UseTimerResult } from '@/lib/timer/timer-client';
import { TimerMode, Task } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ZenModeProps {
  /** Current task being worked on */
  currentTask?: Task;
  
  /** Whether zen mode is active */
  isActive: boolean;
  
  /** Callback to exit zen mode */
  onExit: () => void;
  
  /** Callback when timer completes */
  onComplete?: (mode: TimerMode, taskId?: string) => void;
  
  /** Callback for timer tick updates */
  onTick?: (remainingTime: number, elapsedTime: number) => void;
  
  /** Callback for errors */
  onError?: (error: string) => void;
  
  /** Feature flags */
  features?: {
    /** Enable animated star background */
    zenStars?: boolean;
  };
  
  /** Initial timer state (when entering zen mode) */
  initialTimer?: {
    remainingTime: number;
    totalTime: number;
    state: 'RUNNING' | 'PAUSED';
    mode: TimerMode;
    taskId?: string;
  };
}

/**
 * Animated Star Background Component (Three.js alternative using CSS)
 */
function AnimatedStarField() {
  const starsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const createStar = () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 2 + 0.5,
    });
    
    // Create initial stars
    const stars = Array.from({ length: 100 }, createStar);
    
    if (!starsRef.current) return;
    
    // Clear existing stars
    starsRef.current.innerHTML = '';
    
    // Add stars to DOM
    stars.forEach(star => {
      const starElement = document.createElement('div');
      starElement.className = 'absolute rounded-full bg-white transition-all duration-1000 ease-out';
      starElement.style.cssText = `
        left: ${star.x}%;
        top: ${star.y}%;
        width: ${star.size}px;
        height: ${star.size}px;
        opacity: ${star.opacity};
        animation: twinkle ${2 + Math.random() * 3}s infinite alternate;
      `;
      starsRef.current?.appendChild(starElement);
    });
    
    // Add CSS animation if not present
    if (!document.getElementById('zen-star-animations')) {
      const style = document.createElement('style');
      style.id = 'zen-star-animations';
      style.textContent = `
        @keyframes twinkle {
          0% { opacity: 0.2; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1.2); }
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      const styleElement = document.getElementById('zen-star-animations');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
  
  return (
    <div
      ref={starsRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    />
  );
}

/**
 * Zen Mode Controls
 */
interface ZenControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onPauseResume: () => void;
  onSkip: () => void;
  onExit: () => void;
  visible: boolean;
}

function ZenControls({ 
  isRunning, 
  isPaused, 
  onPauseResume, 
  onSkip, 
  onExit,
  visible 
}: ZenControlsProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-4 px-6 py-3 bg-black/70 backdrop-blur-lg rounded-full border border-white/10">
            <Button
              onClick={onPauseResume}
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10 p-3"
              aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
            >
              {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
            </Button>
            
            <Button
              onClick={onSkip}
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10 p-3"
              aria-label="Skip current session"
            >
              <SkipForward className="w-6 h-6" />
            </Button>
            
            <div className="w-px h-8 bg-white/20" />
            
            <Button
              onClick={onExit}
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10 p-3"
              aria-label="Exit zen mode"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Main ZenMode Component
 */
export function ZenMode({
  currentTask,
  isActive,
  onExit,
  onComplete,
  onTick,
  onError,
  features = { zenStars: false },
  initialTimer
}: ZenModeProps) {
  const [showControls, setShowControls] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { timer, controls }: UseTimerResult = useTimer(
    onComplete,
    onTick,
    onError
  );

  // Handle mouse movement to show/hide controls
  const handleMouseMove = useCallback(() => {
    setLastActivity(Date.now());
    setShowControls(true);
    
    // Clear existing timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    // Hide controls after 3 seconds of inactivity
    inactivityTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000) as unknown as NodeJS.Timeout;
  }, []);

  // Handle pause/resume
  const handlePauseResume = useCallback(() => {
    if (timer.state === 'RUNNING') {
      controls.pause();
    } else if (timer.state === 'PAUSED') {
      controls.resume();
    }
  }, [timer.state, controls]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handlePauseResume();
          handleMouseMove(); // Show controls when using keyboard
          break;
        case 'Escape':
          event.preventDefault();
          onExit();
          break;
        case 'Enter':
          event.preventDefault();
          controls.skip();
          handleMouseMove();
          break;
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };
  }, [isActive, handlePauseResume, handleMouseMove, controls, onExit]);

  // Prevent page scroll when zen mode is active
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isActive]);

  // Update page title with timer
  useEffect(() => {
    if (isActive && timer.remainingTime > 0) {
      const timeString = formatTime(timer.remainingTime);
      const taskName = currentTask?.title || 'Focus Session';
      document.title = `${timeString} - ${taskName}`;
    }
    
    return () => {
      document.title = 'Neural Flow';
    };
  }, [isActive, timer.remainingTime, currentTask?.title]);

  if (!isActive) return null;

  const isRunning = timer.state === 'RUNNING';
  const isPaused = timer.state === 'PAUSED';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'fixed inset-0 z-40 bg-gradient-to-br from-stone-950 via-slate-900 to-stone-950',
        'flex flex-col items-center justify-center text-white'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="zen-mode-timer"
      aria-describedby="zen-mode-description"
    >
      {/* Animated Background */}
      {features.zenStars && <AnimatedStarField />}
      
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-4">
        {/* Task Name */}
        <AnimatePresence>
          {currentTask && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-3xl"
            >
              <h1 
                id="zen-mode-timer"
                className="text-2xl md:text-3xl lg:text-4xl font-medium text-white/90 leading-tight"
              >
                {currentTask.title}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Timer Display */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center"
        >
          <TimerDisplay
            remainingTime={timer.remainingTime}
            totalTime={timer.totalTime}
            state={timer.state}
            mode={timer.mode}
            size="xl"
            className="text-white"
          />
        </motion.div>
        
        {/* Mode Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              isRunning && !isPaused && 'bg-green-400 animate-pulse',
              isPaused && 'bg-yellow-400',
              !isRunning && !isPaused && 'bg-white/30'
            )}
            aria-hidden="true"
          />
          <span className="text-lg font-medium text-white/80">
            {timer.mode === 'FOCUS' ? 'Focus Session' : 'Break Time'}
            {isPaused && ' • Paused'}
          </span>
        </motion.div>
      </div>
      
      {/* Controls */}
      <ZenControls
        isRunning={isRunning}
        isPaused={isPaused}
        onPauseResume={handlePauseResume}
        onSkip={controls.skip}
        onExit={onExit}
        visible={showControls}
      />
      
      {/* Screen Reader Instructions */}
      <div id="zen-mode-description" className="sr-only">
        Zen mode timer. Press Space to pause or resume, Enter to skip, Escape to exit.
        Move your mouse to show controls.
      </div>
      
      {/* Invisible element to detect mouse movement */}
      <div 
        className="absolute inset-0 cursor-none"
        onMouseMove={handleMouseMove}
        role="presentation"
      />
    </motion.div>
  );
}

export default ZenMode;