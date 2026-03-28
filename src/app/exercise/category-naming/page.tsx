'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { categories } from '@/lib/content';
import { useAppStore } from '@/lib/store';
import { calculateSessionPoints, calculateTimeBonus } from '@/lib/scoring';
import type { ExerciseResult, SessionRecord } from '@/types';
import ExerciseShell from '@/components/exercise/ExerciseShell';
import FeedbackOverlay from '@/components/exercise/FeedbackOverlay';
import SessionSummary from '@/components/exercise/SessionSummary';
import Button from '@/components/ui/Button';

function shuffle<T>(arr: T[]): T[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

export default function CategoryNamingPage() {
  const router = useRouter();
  const { addSession, streak, profile } = useAppStore();
  const sessionStart = useRef(Date.now());

  const items = useMemo(() => shuffle(categories).slice(0, 8), []);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'play' | 'feedback' | 'summary'>('play');
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const pendingResults = useRef<ExerciseResult[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [lastResult, setLastResult] = useState<{ points: number; timeBonus: number; message: string; correct: boolean } | null>(null);
  const itemStart = useRef(Date.now());

  const item = items[index];
  const grid = useMemo(
    () => (item ? shuffle([...item.correctWords, ...item.distractors]) : []),
    [item]
  );

  if (!item && phase !== 'summary') {
    return null;
  }

  const toggleWord = (word: string) => {
    if (revealed) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!item) return;
    const correctSet = new Set(item.correctWords.map((w) => w.toLowerCase()));
    const selectedCorrect = [...selected].filter((w) => correctSet.has(w.toLowerCase())).length;
    const wrongSelections = [...selected].filter((w) => !correctSet.has(w.toLowerCase())).length;
    const isCorrect = selectedCorrect >= Math.ceil(correctSet.size * 0.6) && wrongSelections <= 2;

    const result: ExerciseResult = {
      itemId: item.id,
      type: 'category-naming',
      correct: isCorrect,
      cueLevel: 0,
      timeMs: Date.now() - itemStart.current,
      skipped: false,
    };

    const timeMs = Date.now() - itemStart.current;
    const timeBonus = isCorrect ? calculateTimeBonus(timeMs) : 0;
    const points = (isCorrect ? 10 : selected.size > 0 ? 1 : 0) + timeBonus;
    const message = isCorrect
      ? selectedCorrect === correctSet.size
        ? 'Perfect! You got them all!'
        : 'Nice work! You found most of them.'
      : 'Good try! Let\'s see the answers.';

    setResults((prev) => {
      const updated = [...prev, result];
      pendingResults.current = updated;
      return updated;
    });
    setRevealed(true);
    setLastResult({ points, timeBonus, message, correct: isCorrect });
    setPhase('feedback');
  };

  const handleNext = () => {
    const currentResults = pendingResults.current;
    if (index >= items.length - 1) {
      const session: SessionRecord = {
        id: crypto.randomUUID(),
        startedAt: sessionStart.current,
        completedAt: Date.now(),
        exerciseType: 'category-naming',
        results: currentResults,
        totalPoints: calculateSessionPoints(currentResults),
        isQuickWin: false,
      };
      addSession(session);
      setPhase('summary');
      return;
    }
    setIndex((i) => i + 1);
    setSelected(new Set());
    setRevealed(false);
    setLastResult(null);
    setPhase('play');
    itemStart.current = Date.now();
  };

  if (phase === 'summary') {
    return (
      <SessionSummary
        results={results}
        streakCount={streak.currentStreak}
        userGoal={profile?.goals?.[0]}
      />
    );
  }

  const correctSet = new Set(item.correctWords.map((w) => w.toLowerCase()));

  return (
    <ExerciseShell
      title="Category Naming"
      progress={((index) / items.length) * 100}
      currentIndex={index}
      totalItems={items.length}
      timerStart={itemStart.current}
      timerRunning={phase === 'play'}
    >
      <div className="text-center mb-6">
        <p className="text-text-light text-sm mb-1">Find all the words that belong to:</p>
        <h2 className="text-2xl font-bold text-primary">{item.category}</h2>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {grid.map((word) => {
          const isSelected = selected.has(word);
          const isCorrectWord = correctSet.has(word.toLowerCase());
          let classes = 'border-2 rounded-xl py-3 px-2 text-center font-medium transition-all duration-200 min-h-[48px] text-sm';

          if (revealed) {
            if (isSelected && isCorrectWord) {
              classes += ' bg-success-light border-success text-text';
            } else if (isSelected && !isCorrectWord) {
              classes += ' bg-warning-light border-warning text-text';
            } else if (!isSelected && isCorrectWord) {
              classes += ' bg-border/30 border-success/50 text-text-muted';
            } else {
              classes += ' bg-surface border-border text-text-muted';
            }
          } else if (isSelected) {
            classes += ' bg-primary border-primary text-white';
          } else {
            classes += ' bg-white border-border text-text hover:border-primary/40';
          }

          return (
            <button
              key={word}
              onClick={() => toggleWord(word)}
              className={classes}
              disabled={revealed}
            >
              {word}
            </button>
          );
        })}
      </div>

      {phase === 'play' && (
        <div className="space-y-3">
          <Button onClick={handleSubmit} variant="primary" size="lg" className="w-full" disabled={selected.size === 0}>
            Check Answers
          </Button>
          <Button
            onClick={() => {
              const result: ExerciseResult = {
                itemId: item.id,
                type: 'category-naming',
                correct: false,
                cueLevel: 0,
                timeMs: Date.now() - itemStart.current,
                skipped: true,
              };
              setResults((prev) => {
                const updated = [...prev, result];
                pendingResults.current = updated;
                return updated;
              });
              handleNext();
            }}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Skip
          </Button>
        </div>
      )}

      {phase === 'feedback' && lastResult && (
        <FeedbackOverlay
          message={lastResult.message}
          points={lastResult.points}
          timeBonus={lastResult.timeBonus}
          isCorrect={lastResult.correct}
          cueLevel={0}
          onNext={handleNext}
          isLast={index >= items.length - 1}
        />
      )}
    </ExerciseShell>
  );
}
