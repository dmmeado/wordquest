'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CelebrationEffect from './CelebrationEffect';
import type { ExerciseResult } from '@/types';
import { calculateSessionPoints } from '@/lib/scoring';

interface SessionSummaryProps {
  results: ExerciseResult[];
  streakCount: number;
  userGoal?: string;
}

export default function SessionSummary({ results, streakCount, userGoal }: SessionSummaryProps) {
  const router = useRouter();
  const triggerRef = useRef(Date.now());
  const totalPoints = calculateSessionPoints(results);
  const correct = results.filter((r) => r.correct).length;
  const independent = results.filter((r) => r.correct && r.cueLevel === 0).length;
  const recovered = results.filter((r) => r.correct && r.cueLevel > 0).length;
  const total = results.length;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <CelebrationEffect type="celebration" trigger={triggerRef.current} />

      <div className="max-w-lg w-full animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 animate-bounce-in">🎉</div>
          <h1 className="text-2xl font-bold text-text mb-2">Great Work!</h1>
          <p className="text-text-light">
            {userGoal
              ? `Every session brings you closer to: ${userGoal}`
              : "You're building strength with every practice."}
          </p>
        </div>

        <Card className="mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="animate-count-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl font-bold text-primary">{totalPoints}</div>
              <div className="text-xs text-text-muted mt-1">Points Earned</div>
            </div>
            <div className="animate-count-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl font-bold text-success">{correct}/{total}</div>
              <div className="text-xs text-text-muted mt-1">Correct</div>
            </div>
            <div className="animate-count-up" style={{ animationDelay: '0.6s' }}>
              <div className="text-3xl font-bold text-accent">{streakCount}</div>
              <div className="text-xs text-text-muted mt-1">Day Streak</div>
            </div>
          </div>
        </Card>

        {(independent > 0 || recovered > 0) && (
          <Card className="mb-4">
            <div className="space-y-3">
              {independent > 0 && (
                <div className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: '0.5s' }}>
                  <span className="text-xl">🎯</span>
                  <span className="text-text">
                    <strong>{independent}</strong> words retrieved independently
                  </span>
                </div>
              )}
              {recovered > 0 && (
                <div className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: '0.7s' }}>
                  <span className="text-xl">💪</span>
                  <span className="text-text">
                    <strong>{recovered}</strong> successful recoveries with hints
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="mb-6 bg-primary/5 border-primary/20">
          <p className="text-sm text-primary font-medium text-center">
            Come back tomorrow for your next mission!
          </p>
        </Card>

        <div className="space-y-3">
          <Button onClick={() => router.push('/dashboard')} variant="primary" size="lg" className="w-full">
            Back to Dashboard
          </Button>
          <Button onClick={() => router.push('/review')} variant="ghost" size="md" className="w-full">
            Review Missed Words
          </Button>
        </div>
      </div>
    </div>
  );
}
