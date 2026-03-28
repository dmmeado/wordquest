'use client';

import { useState, useMemo, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { pictures } from '@/lib/content';
import { calculateSessionPoints, calculateTimeBonus, calculatePoints, getEncouragingMessage } from '@/lib/scoring';
import type { ExerciseResult, SessionRecord, CueLevel } from '@/types';
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

const CUE_LABELS = ['', 'Semantic Cue', 'Function Cue', 'First Letter', 'Choose One'];

export default function PictureNamingPage() {
  const { addSession, streak, profile } = useAppStore();
  const sessionStart = useRef(Date.now());

  const items = useMemo(() => shuffle(pictures).slice(0, 10), []);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'prompt' | 'input' | 'cue' | 'forced' | 'feedback' | 'summary'>('prompt');
  const [cueLevel, setCueLevel] = useState<CueLevel>(0);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const pendingResults = useRef<ExerciseResult[]>([]);
  const [lastFeedback, setLastFeedback] = useState<{ points: number; timeBonus: number; message: string; correct: boolean } | null>(null);
  const itemStart = useRef(Date.now());

  const item = items[index];
  const forcedChoices = useMemo(
    () => item ? shuffle([item.answer, ...item.forcedChoices.filter((c) => c !== item.answer)].slice(0, 3)) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item?.id]
  );
  if (!item && phase !== 'summary') return null;

  const getCueText = () => {
    if (!item) return '';
    switch (cueLevel) {
      case 1: return item.semanticCue;
      case 2: return item.functionCue;
      case 3: return `Starts with "${item.firstLetterCue}"`;
      default: return '';
    }
  };

  const checkAnswer = (answer: string) => {
    return answer.toLowerCase().trim() === item.answer.toLowerCase().trim();
  };

  const recordResult = (correct: boolean, skipped = false) => {
    const result: ExerciseResult = {
      itemId: item.id,
      type: 'picture-naming',
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

  const handleSubmitInput = () => {
    if (checkAnswer(inputValue)) {
      recordResult(true);
    } else if (cueLevel < 3) {
      setCueLevel((c) => (c + 1) as CueLevel);
      setPhase('cue');
      setInputValue('');
    } else {
      // Show forced choice
      setCueLevel(4);
      setPhase('forced');
    }
  };

  const handleForcedChoice = (choice: string) => {
    recordResult(checkAnswer(choice));
  };

  const handleNext = () => {
    const currentResults = pendingResults.current;
    if (index >= items.length - 1) {
      const session: SessionRecord = {
        id: crypto.randomUUID(),
        startedAt: sessionStart.current,
        completedAt: Date.now(),
        exerciseType: 'picture-naming',
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
      title="Picture Naming"
      progress={(index / items.length) * 100}
      currentIndex={index}
      totalItems={items.length}
      timerStart={itemStart.current}
      timerRunning={phase !== 'feedback'}
    >
      {/* Picture display */}
      <div className="text-center mb-6">
        <div className="w-32 h-32 bg-surface-warm rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-border">
          <span className="text-7xl" role="img" aria-label={item.answer}>
            {(item as unknown as { imageEmoji: string }).imageEmoji}
          </span>
        </div>

        {phase === 'prompt' && (
          <p className="text-text-light">What is this?</p>
        )}
      </div>

      {/* Cue display */}
      {(phase === 'cue' || (phase === 'input' && cueLevel > 0)) && (
        <div className="bg-primary/5 rounded-xl p-4 mb-4 text-center animate-fade-in">
          <p className="text-xs text-text-muted mb-1">{CUE_LABELS[cueLevel]}</p>
          <p className="text-lg font-semibold text-primary">{getCueText()}</p>
        </div>
      )}

      {/* Input phase */}
      {(phase === 'prompt' || phase === 'input' || phase === 'cue') && (
        <div className="space-y-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (phase === 'prompt') setPhase('input');
              if (phase === 'cue') setPhase('input');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) handleSubmitInput();
            }}
            placeholder="Type your answer..."
            className="w-full px-4 py-4 text-lg border-2 border-border rounded-xl bg-white focus:border-primary focus:outline-none transition-colors"
            autoFocus
          />
          <div className="flex gap-3">
            <Button onClick={handleSubmitInput} variant="primary" size="lg" className="flex-1" disabled={!inputValue.trim()}>
              Check
            </Button>
            {cueLevel < 3 && (
              <Button
                onClick={() => {
                  setCueLevel((c) => (c + 1) as CueLevel);
                  setPhase('cue');
                }}
                variant="secondary"
                size="lg"
              >
                Hint
              </Button>
            )}
          </div>
          <Button
            onClick={() => recordResult(false, true)}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Skip
          </Button>
        </div>
      )}

      {/* Forced choice */}
      {phase === 'forced' && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-center text-text-light text-sm mb-2">Choose the correct answer:</p>
          <div className="grid grid-cols-1 gap-3">
            {forcedChoices.map((choice) => (
              <button
                key={choice}
                onClick={() => handleForcedChoice(choice)}
                className="bg-white border-2 border-border rounded-xl py-4 px-4 text-center font-medium text-text hover:border-primary/40 transition-all min-h-[56px] text-lg"
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
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
