'use client';

import { useState, useMemo, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { sentences } from '@/lib/content';
import { calculateSessionPoints, calculateTimeBonus, calculatePoints, getEncouragingMessage } from '@/lib/scoring';
import type { ExerciseResult, SessionRecord, SentenceCompletionItem } from '@/types';
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

export default function SentenceCompletionPage() {
  const { addSession, streak, profile } = useAppStore();
  const sessionStart = useRef(Date.now());

  const items = useMemo(() => shuffle(sentences).slice(0, 10), []);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'play' | 'cue' | 'feedback' | 'summary'>('play');
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const pendingResults = useRef<ExerciseResult[]>([]);
  const [cueUsed, setCueUsed] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ points: number; timeBonus: number; message: string; correct: boolean; cueLevel: number } | null>(null);
  const itemStart = useRef(Date.now());

  const item = items[index] as SentenceCompletionItem | undefined;

  if (!item && phase !== 'summary') return null;

  const choices = useMemo(
    () => (item ? shuffle([item.answer, ...item.distractors]) : []),
    [item]
  );

  const handleSelect = (choice: string) => {
    if (!item) return;
    const isCorrect = choice.toLowerCase() === item.answer.toLowerCase();
    const cueLevel = cueUsed ? 3 : 0;

    if (!isCorrect && !cueUsed) {
      setCueUsed(true);
      setPhase('cue');
      return;
    }

    const result: ExerciseResult = {
      itemId: item.id,
      type: 'sentence-completion',
      correct: isCorrect,
      cueLevel: cueLevel as 0 | 1 | 2 | 3 | 4,
      timeMs: Date.now() - itemStart.current,
      skipped: false,
    };

    const points = calculatePoints(result);
    const timeBonus = isCorrect ? calculateTimeBonus(result.timeMs) : 0;
    const message = getEncouragingMessage(result);
    setResults((prev) => {
      const updated = [...prev, result];
      pendingResults.current = updated;
      return updated;
    });
    setLastFeedback({ points, timeBonus, message, correct: isCorrect, cueLevel });
    setPhase('feedback');
  };

  const handleNext = () => {
    const currentResults = pendingResults.current;
    if (index >= items.length - 1) {
      const session: SessionRecord = {
        id: crypto.randomUUID(),
        startedAt: sessionStart.current,
        completedAt: Date.now(),
        exerciseType: 'sentence-completion',
        results: currentResults,
        totalPoints: calculateSessionPoints(currentResults),
        isQuickWin: false,
      };
      addSession(session);
      setPhase('summary');
      return;
    }
    setIndex((i) => i + 1);
    setCueUsed(false);
    setLastFeedback(null);
    setPhase('play');
    itemStart.current = Date.now();
  };

  const handleSkip = () => {
    if (!item) return;
    const result: ExerciseResult = {
      itemId: item.id,
      type: 'sentence-completion',
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
  };

  if (phase === 'summary') {
    return <SessionSummary results={results} streakCount={streak.currentStreak} userGoal={profile?.goals?.[0]} />;
  }

  // Render the sentence with blank highlighted
  const sentenceParts = item!.sentence.split('___');

  return (
    <ExerciseShell
      title="Sentence Completion"
      progress={(index / items.length) * 100}
      currentIndex={index}
      totalItems={items.length}
      timerStart={itemStart.current}
      timerRunning={phase !== 'feedback'}
      currentScore={calculateSessionPoints(results)}
    >
      <div className="text-center mb-8">
        <p className="text-xl leading-relaxed text-text">
          {sentenceParts[0]}
          <span className="inline-block mx-1 px-4 py-1 bg-primary/10 border-b-2 border-primary rounded text-primary font-semibold">
            {phase === 'feedback' && lastFeedback?.correct ? item!.answer : '?'}
          </span>
          {sentenceParts[1]}
        </p>
      </div>

      {phase === 'cue' && (
        <div className="bg-primary/5 rounded-xl p-4 mb-6 text-center animate-fade-in">
          <p className="text-sm text-text-light mb-1">Here&apos;s a hint:</p>
          <p className="text-lg font-semibold text-primary">
            The word starts with &ldquo;{item!.firstLetterCue}&rdquo;
          </p>
        </div>
      )}

      {phase !== 'feedback' && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {choices.map((choice, i) => {
              const colorStyles = [
                'bg-primary/8 border-primary/30 hover:bg-primary/15 hover:border-primary/50',
                'bg-accent/8 border-accent/30 hover:bg-accent/15 hover:border-accent/50',
                'bg-success/8 border-success/30 hover:bg-success/15 hover:border-success/50',
                'bg-warning/8 border-warning/30 hover:bg-warning/15 hover:border-warning/50',
              ];
              return (
                <button
                  key={choice}
                  onClick={() => handleSelect(choice)}
                  className={`border-2 rounded-xl py-4 px-4 text-center font-semibold text-text transition-all duration-200 min-h-[56px] text-lg active:scale-95 ${colorStyles[i % 4]}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          <Button onClick={handleSkip} variant="ghost" size="sm" className="w-full">
            Skip
          </Button>
        </>
      )}

      {phase === 'feedback' && lastFeedback && (
        <FeedbackOverlay
          message={lastFeedback.message}
          points={lastFeedback.points}
          timeBonus={lastFeedback.timeBonus}
          isCorrect={lastFeedback.correct}
          cueLevel={lastFeedback.cueLevel}
          onNext={handleNext}
          isLast={index >= items.length - 1}
        />
      )}
    </ExerciseShell>
  );
}
