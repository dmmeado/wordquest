'use client';

import { useState, useMemo, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { responsivePrompts, excludeSeenToday } from '@/lib/content';
import { calculateSessionPoints, calculateTimeBonus, calculatePoints, getEncouragingMessage } from '@/lib/scoring';
import type { ExerciseResult, SessionRecord, CueLevel, ResponsiveNamingItem } from '@/types';
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

export default function ResponsiveNamingPage() {
  const { addSession, streak, profile, getTodaySeenIds } = useAppStore();
  const sessionStart = useRef(Date.now());

  const items = useMemo(() => {
    const seen = getTodaySeenIds('responsive-naming');
    return excludeSeenToday(responsivePrompts, seen, 10).slice(0, 10);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'prompt' | 'cue1' | 'cue2' | 'choices' | 'feedback' | 'summary'>('prompt');
  const [cueLevel, setCueLevel] = useState<CueLevel>(0);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const pendingResults = useRef<ExerciseResult[]>([]);
  const [lastFeedback, setLastFeedback] = useState<{ points: number; timeBonus: number; message: string; correct: boolean } | null>(null);
  const itemStart = useRef(Date.now());

  const item = items[index] as ResponsiveNamingItem | undefined;
  const shuffledChoices = useMemo(
    () => item ? shuffle(item.choices) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item?.id]
  );

  if (!item && phase !== 'summary') return null;

  const checkAnswer = (answer: string) =>
    answer.toLowerCase().trim() === item!.answer.toLowerCase().trim();

  const recordResult = (correct: boolean, skipped = false) => {
    const result: ExerciseResult = {
      itemId: item!.id,
      type: 'responsive-naming',
      correct,
      cueLevel,
      timeMs: Date.now() - itemStart.current,
      skipped,
    };
    const points = calculatePoints(result);
    const timeBonus = skipped ? 0 : correct ? calculateTimeBonus(result.timeMs) : 0;
    const message = getEncouragingMessage(result);
    setResults((prev) => {
      const updated = [...prev, result];
      pendingResults.current = updated;
      return updated;
    });
    setLastFeedback({ points, timeBonus, message, correct });
    setPhase('feedback');
  };

  const handleSubmit = () => {
    if (checkAnswer(inputValue)) {
      recordResult(true);
    } else if (cueLevel === 0) {
      setCueLevel(1);
      setPhase('cue1');
      setInputValue('');
    } else if (cueLevel === 1) {
      setCueLevel(3);
      setPhase('cue2');
      setInputValue('');
    } else {
      setCueLevel(4);
      setPhase('choices');
    }
  };

  const handleNext = () => {
    const currentResults = pendingResults.current;
    if (index >= items.length - 1) {
      const session: SessionRecord = {
        id: crypto.randomUUID(),
        startedAt: sessionStart.current,
        completedAt: Date.now(),
        exerciseType: 'responsive-naming',
        results: currentResults,
        totalPoints: calculateSessionPoints(currentResults),
        isQuickWin: false,
      };
      addSession(session);
      setPhase('summary');
      return;
    }
    setIndex((i) => i + 1);
    setCueLevel(0);
    setInputValue('');
    setLastFeedback(null);
    setPhase('prompt');
    itemStart.current = Date.now();
  };

  if (phase === 'summary') {
    return <SessionSummary results={results} streakCount={streak.currentStreak} userGoal={profile?.goals?.[0]} />;
  }

  return (
    <ExerciseShell
      title="Responsive Naming"
      progress={(index / items.length) * 100}
      currentIndex={index}
      totalItems={items.length}
      timerStart={itemStart.current}
      timerRunning={phase !== 'feedback'}
      currentScore={calculateSessionPoints(results)}
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <p className="text-xl font-medium text-text leading-relaxed">{item!.prompt}</p>
      </div>

      {/* Cue displays */}
      {phase === 'cue1' && (
        <div className="bg-primary/5 rounded-xl p-4 mb-4 text-center animate-fade-in">
          <p className="text-xs text-text-muted mb-1">Category Hint</p>
          <p className="text-lg font-semibold text-primary">{item!.categoryCue}</p>
        </div>
      )}
      {phase === 'cue2' && (
        <div className="space-y-2 mb-4 animate-fade-in">
          <div className="bg-border/30 rounded-xl p-3 text-center">
            <p className="text-xs text-text-muted">Category</p>
            <p className="text-sm text-text-light">{item!.categoryCue}</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted mb-1">First Letter</p>
            <p className="text-lg font-semibold text-primary">Starts with &ldquo;{item!.firstLetterCue}&rdquo;</p>
          </div>
        </div>
      )}

      {/* Input or choices */}
      {phase !== 'choices' && phase !== 'feedback' && (
        <div className="space-y-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) handleSubmit(); }}
            placeholder="Type your answer..."
            className="w-full px-4 py-4 text-lg border-2 border-border rounded-xl bg-white focus:border-primary focus:outline-none transition-colors"
            autoFocus
          />
          <div className="flex gap-3">
            <Button onClick={handleSubmit} variant="primary" size="lg" className="flex-1" disabled={!inputValue.trim()}>
              Check
            </Button>
            {cueLevel < 3 && (
              <Button
                onClick={() => {
                  setInputValue('');
                  if (cueLevel === 0) { setCueLevel(1); setPhase('cue1'); }
                  else { setCueLevel(3); setPhase('cue2'); }
                }}
                variant="secondary"
                size="lg"
              >
                Hint
              </Button>
            )}
          </div>
          <Button onClick={() => recordResult(false, true)} variant="ghost" size="sm" className="w-full">
            Skip
          </Button>
        </div>
      )}

      {phase === 'choices' && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-center text-text-light text-sm mb-2">Choose the correct answer:</p>
          {shuffledChoices.map((choice) => (
            <button
              key={choice}
              onClick={() => recordResult(checkAnswer(choice))}
              className="w-full bg-white border-2 border-border rounded-xl py-4 px-4 text-center font-medium text-text hover:border-primary/40 transition-all min-h-[56px] text-lg"
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {phase === 'feedback' && lastFeedback && (
        <FeedbackOverlay
          message={lastFeedback.message}
          points={lastFeedback.points}
          timeBonus={lastFeedback.timeBonus}
          isCorrect={lastFeedback.correct}
          cueLevel={cueLevel}
          onNext={handleNext}
          isLast={index >= items.length - 1}
        />
      )}
    </ExerciseShell>
  );
}
