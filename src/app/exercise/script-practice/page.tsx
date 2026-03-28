'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { scripts } from '@/lib/content';
import { calculateSessionPoints } from '@/lib/scoring';
import type { ExerciseResult, SessionRecord, ScriptPracticeItem } from '@/types';
import ExerciseShell from '@/components/exercise/ExerciseShell';
import SessionSummary from '@/components/exercise/SessionSummary';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

function shuffle<T>(arr: T[]): T[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

type ScriptPhase = 'read' | 'wait' | 'recall' | 'reveal' | 'rate' | 'summary';

export default function ScriptPracticePage() {
  const { addSession, streak, profile } = useAppStore();
  const sessionStart = useRef(Date.now());

  const items = useMemo(() => shuffle(scripts).slice(0, 8), []);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<ScriptPhase>('read');
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const pendingResults = useRef<ExerciseResult[]>([]);
  const [countdown, setCountdown] = useState(3);
  const itemStart = useRef(Date.now());

  const item = items[index] as ScriptPracticeItem | undefined;

  // Countdown timer for wait phase
  useEffect(() => {
    if (phase !== 'wait') return;
    if (countdown <= 0) {
      setPhase('recall');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  if (!item && phase !== 'summary') return null;

  const handleReadComplete = () => {
    setCountdown(3);
    setPhase('wait');
  };

  const handleRecallDone = () => {
    setPhase('reveal');
  };

  const handleRate = (rating: 'got-it' | 'close' | 'missed') => {
    const correct = rating !== 'missed';
    const cueLevel = rating === 'got-it' ? 0 : rating === 'close' ? 1 : 3;
    const result: ExerciseResult = {
      itemId: item!.id,
      type: 'script-practice',
      correct,
      cueLevel: cueLevel as 0 | 1 | 2 | 3 | 4,
      timeMs: Date.now() - itemStart.current,
      skipped: false,
    };
    const allResults = [...pendingResults.current, result];
    pendingResults.current = allResults;
    setResults(allResults);

    if (index >= items.length - 1) {
      const session: SessionRecord = {
        id: crypto.randomUUID(),
        startedAt: sessionStart.current,
        completedAt: Date.now(),
        exerciseType: 'script-practice',
        results: allResults,
        totalPoints: calculateSessionPoints(allResults),
        isQuickWin: false,
      };
      addSession(session);
      setPhase('summary');
      return;
    }
    setIndex((i) => i + 1);
    setPhase('read');
    itemStart.current = Date.now();
  };

  if (phase === 'summary') {
    return <SessionSummary results={results} streakCount={streak.currentStreak} userGoal={profile?.goals?.[0]} />;
  }

  return (
    <ExerciseShell
      title="Script Practice"
      progress={(index / items.length) * 100}
      currentIndex={index}
      totalItems={items.length}
      timerStart={itemStart.current}
      timerRunning={phase !== 'reveal' && phase !== 'rate'}
    >
      <div className="text-center mb-4">
        <span className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
          {item!.scenario}
        </span>
        <p className="text-text-light text-sm mt-2">{item!.context}</p>
      </div>

      {/* Read phase */}
      {phase === 'read' && (
        <div className="animate-fade-in">
          <Card className="mb-6 bg-surface-warm">
            <p className="text-center text-xl font-medium text-text leading-relaxed">
              &ldquo;{item!.script}&rdquo;
            </p>
          </Card>
          <p className="text-center text-text-light text-sm mb-4">
            Read this phrase out loud, then tap when ready
          </p>
          <Button onClick={handleReadComplete} variant="primary" size="lg" className="w-full">
            I&apos;ve said it
          </Button>
          <Button
            onClick={() => {
              const result: ExerciseResult = {
                itemId: item!.id,
                type: 'script-practice',
                correct: false,
                cueLevel: 0,
                timeMs: Date.now() - itemStart.current,
                skipped: true,
              };
              const allResults = [...pendingResults.current, result];
              pendingResults.current = allResults;
              setResults(allResults);
              if (index >= items.length - 1) {
                const session: SessionRecord = {
                  id: crypto.randomUUID(),
                  startedAt: sessionStart.current,
                  completedAt: Date.now(),
                  exerciseType: 'script-practice',
                  results: allResults,
                  totalPoints: calculateSessionPoints(allResults),
                  isQuickWin: false,
                };
                addSession(session);
                setPhase('summary');
              } else {
                setIndex((i) => i + 1);
                setPhase('read');
                itemStart.current = Date.now();
              }
            }}
            variant="ghost"
            size="sm"
            className="w-full mt-2"
          >
            Skip
          </Button>
        </div>
      )}

      {/* Wait phase */}
      {phase === 'wait' && (
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-primary">{countdown}</span>
          </div>
          <p className="text-text-light">Hold on... get ready to recall</p>
        </div>
      )}

      {/* Recall phase */}
      {phase === 'recall' && (
        <div className="animate-fade-in">
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <p className="text-center text-lg text-primary font-medium">
              Now say the phrase from memory!
            </p>
          </Card>
          <Button onClick={handleRecallDone} variant="primary" size="lg" className="w-full">
            Show me the phrase
          </Button>
        </div>
      )}

      {/* Reveal + rate phase */}
      {phase === 'reveal' && (
        <div className="animate-fade-in">
          <Card className="mb-6 bg-surface-warm">
            <p className="text-center text-xl font-medium text-text leading-relaxed">
              &ldquo;{item!.script}&rdquo;
            </p>
          </Card>
          <p className="text-center text-text-light text-sm mb-4">How did you do?</p>
          <div className="space-y-3">
            <Button onClick={() => handleRate('got-it')} variant="success" size="lg" className="w-full">
              Got it right!
            </Button>
            <Button onClick={() => handleRate('close')} variant="secondary" size="lg" className="w-full">
              Close, but missed a bit
            </Button>
            <Button onClick={() => handleRate('missed')} variant="ghost" size="lg" className="w-full">
              Need more practice
            </Button>
          </div>
        </div>
      )}
    </ExerciseShell>
  );
}
