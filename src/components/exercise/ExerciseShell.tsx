'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/ui/ProgressBar';

interface ExerciseShellProps {
  title: string;
  progress: number;
  currentIndex: number;
  totalItems: number;
  timerStart: number;
  timerRunning: boolean;
  children: React.ReactNode;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
  }
  return `${seconds}.${tenths}`;
}

export default function ExerciseShell({
  title,
  progress,
  currentIndex,
  totalItems,
  timerStart,
  timerRunning,
  children,
}: ExerciseShellProps) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      setElapsed(Date.now() - timerStart);
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - timerStart);
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, timerStart]);

  // Reset on new item
  useEffect(() => {
    setElapsed(0);
  }, [timerStart]);

  const timerColor = elapsed < 5000
    ? 'text-success'
    : elapsed < 10000
      ? 'text-primary'
      : elapsed < 15000
        ? 'text-accent'
        : 'text-text-muted';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 pt-4 pb-2 border-b border-border">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-text-light hover:text-text p-2 -ml-2 min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label="Back to dashboard"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-text">{title}</h1>
            <span className="text-sm text-text-muted min-w-[48px] text-right">
              {currentIndex + 1}/{totalItems}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={progress} height="h-2" />
            </div>
            <div className={`text-sm font-mono font-medium tabular-nums min-w-[48px] text-right ${timerColor}`}>
              {formatTime(elapsed)}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
