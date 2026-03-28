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
  currentScore: number;
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
  currentScore,
  children,
}: ExerciseShellProps) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [displayScore, setDisplayScore] = useState(currentScore);
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

  // Animate score counting up
  useEffect(() => {
    if (currentScore === displayScore) return;
    const diff = currentScore - displayScore;
    const steps = Math.min(Math.abs(diff), 15);
    const stepSize = diff / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayScore(currentScore);
        clearInterval(timer);
      } else {
        setDisplayScore((prev) => Math.round(prev + stepSize));
      }
    }, 40);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScore]);

  const timerColor = elapsed < 5000
    ? 'text-success'
    : elapsed < 10000
      ? 'text-primary'
      : elapsed < 15000
        ? 'text-accent'
        : 'text-text-muted';

  const timerBg = elapsed < 5000
    ? 'bg-success/10'
    : elapsed < 10000
      ? 'bg-primary/10'
      : elapsed < 15000
        ? 'bg-accent/10'
        : 'bg-border/30';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 pt-4 pb-3 border-b border-border">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
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

          {/* Score bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 bg-border/30 rounded-full h-7 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min((displayScore / Math.max(totalItems * 13, 1)) * 100, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-text drop-shadow-sm">
                  {displayScore} pts
                </span>
              </div>
            </div>
          </div>

          <ProgressBar value={progress} height="h-2" />
        </div>
      </div>

      {/* Big centered timer */}
      <div className="flex justify-center pt-4 pb-2">
        <div className={`${timerBg} rounded-2xl px-6 py-3 inline-flex items-center gap-2`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={timerColor}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className={`text-3xl font-mono font-bold tabular-nums ${timerColor}`}>
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        <div className="max-w-lg w-full animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
