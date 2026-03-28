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

  // Score tier thresholds: max ~13pts per item (10 base + 3 time bonus)
  const maxScore = totalItems * 13 + 6; // + completion bonus
  const bronzeThreshold = Math.round(maxScore * 0.3);
  const silverThreshold = Math.round(maxScore * 0.6);
  const goldThreshold = Math.round(maxScore * 0.85);

  const tier = displayScore >= goldThreshold
    ? 'gold'
    : displayScore >= silverThreshold
      ? 'silver'
      : displayScore >= bronzeThreshold
        ? 'bronze'
        : 'none';

  const tierConfig = {
    none: {
      gradient: 'from-border to-text-muted',
      bg: 'bg-border/20',
      label: '',
      icon: '',
      textColor: 'text-text-muted',
    },
    bronze: {
      gradient: 'from-amber-600 to-amber-500',
      bg: 'bg-amber-50',
      label: 'Bronze',
      icon: '🥉',
      textColor: 'text-amber-800',
    },
    silver: {
      gradient: 'from-slate-400 to-slate-300',
      bg: 'bg-slate-50',
      label: 'Silver',
      icon: '🥈',
      textColor: 'text-slate-700',
    },
    gold: {
      gradient: 'from-yellow-500 to-amber-400',
      bg: 'bg-yellow-50',
      label: 'Gold',
      icon: '🥇',
      textColor: 'text-yellow-800',
    },
  };

  const currentTier = tierConfig[tier];

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

          {/* Score bar with tier colors */}
          <div className={`${currentTier.bg} rounded-xl p-2 mb-3 transition-colors duration-500`}>
            <div className="flex items-center justify-between mb-1 px-1">
              <div className="flex items-center gap-1.5">
                {currentTier.icon && (
                  <span className="text-sm animate-bounce-in">{currentTier.icon}</span>
                )}
                <span className={`text-xs font-bold ${currentTier.textColor}`}>
                  {currentTier.label || 'Keep going!'}
                </span>
              </div>
              <span className={`text-sm font-bold tabular-nums ${currentTier.textColor}`}>
                {displayScore} pts
              </span>
            </div>
            <div className="bg-white/60 rounded-full h-3 relative overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${currentTier.gradient} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.min((displayScore / Math.max(maxScore, 1)) * 100, 100)}%` }}
              />
              {/* Tier markers */}
              <div className="absolute inset-0 flex items-center">
                <div className="absolute h-full w-px bg-white/50" style={{ left: `${(bronzeThreshold / maxScore) * 100}%` }} />
                <div className="absolute h-full w-px bg-white/50" style={{ left: `${(silverThreshold / maxScore) * 100}%` }} />
                <div className="absolute h-full w-px bg-white/50" style={{ left: `${(goldThreshold / maxScore) * 100}%` }} />
              </div>
            </div>
            <div className="flex justify-between mt-1 px-0.5">
              <span className="text-[10px] text-text-muted" style={{ marginLeft: `${(bronzeThreshold / maxScore) * 100 - 3}%` }}>🥉</span>
              <span className="text-[10px] text-text-muted" style={{ marginLeft: '0' }}>🥈</span>
              <span className="text-[10px] text-text-muted">🥇</span>
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
