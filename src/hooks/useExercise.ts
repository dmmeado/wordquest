'use client';

import { useState, useCallback, useRef } from 'react';
import type { AnyExerciseItem, ExerciseResult, CueLevel, ExerciseType } from '@/types';
import { calculatePoints, getEncouragingMessage } from '@/lib/scoring';

export type ExercisePhase = 'prompt' | 'response' | 'cue' | 'feedback' | 'complete';

interface UseExerciseOptions {
  items: AnyExerciseItem[];
  onComplete: (results: ExerciseResult[]) => void;
}

export function useExercise({ items, onComplete }: UseExerciseOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<ExercisePhase>('prompt');
  const [cueLevel, setCueLevel] = useState<CueLevel>(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [lastPoints, setLastPoints] = useState(0);
  const [lastMessage, setLastMessage] = useState('');
  const startTime = useRef(Date.now());

  const currentItem = items[currentIndex] || null;
  const progress = items.length > 0 ? ((currentIndex) / items.length) * 100 : 0;
  const isLast = currentIndex >= items.length - 1;

  const recordResult = useCallback(
    (correct: boolean, skipped: boolean = false) => {
      const result: ExerciseResult = {
        itemId: currentItem?.id || '',
        type: currentItem?.type as ExerciseType,
        correct,
        cueLevel,
        timeMs: Date.now() - startTime.current,
        skipped,
      };
      const points = calculatePoints(result);
      const message = getEncouragingMessage(result);
      setLastPoints(points);
      setLastMessage(message);
      setResults((prev) => [...prev, result]);
      setPhase('feedback');

      return { points, message };
    },
    [currentItem, cueLevel]
  );

  const submitAnswer = useCallback(
    (answer: string, correctAnswer: string) => {
      const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      if (isCorrect) {
        return recordResult(true);
      }
      // If wrong and no cue used yet, offer first cue
      if (cueLevel === 0) {
        setCueLevel(1);
        setPhase('cue');
        return null;
      }
      // Wrong after cue
      return recordResult(false);
    },
    [cueLevel, recordResult]
  );

  const selectAnswer = useCallback(
    (answer: string, correctAnswer: string) => {
      const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      return recordResult(isCorrect);
    },
    [recordResult]
  );

  const useCue = useCallback(() => {
    const nextCue = Math.min(cueLevel + 1, 4) as CueLevel;
    setCueLevel(nextCue);
    setPhase('cue');
  }, [cueLevel]);

  const skipItem = useCallback(() => {
    recordResult(false, true);
  }, [recordResult]);

  const nextItem = useCallback(() => {
    if (isLast) {
      setPhase('complete');
      onComplete(results);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setPhase('prompt');
    setCueLevel(0);
    startTime.current = Date.now();
  }, [isLast, onComplete, results]);

  const answerWithCue = useCallback(
    (answer: string, correctAnswer: string) => {
      const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      if (isCorrect) {
        return recordResult(true);
      }
      // Advance cue level
      if (cueLevel < 4) {
        const nextCue = (cueLevel + 1) as CueLevel;
        setCueLevel(nextCue);
        setPhase('cue');
        return null;
      }
      // Max cues used, record incorrect
      return recordResult(false);
    },
    [cueLevel, recordResult]
  );

  return {
    currentItem,
    currentIndex,
    phase,
    setPhase,
    cueLevel,
    setCueLevel,
    results,
    lastPoints,
    lastMessage,
    progress,
    isLast,
    submitAnswer,
    selectAnswer,
    useCue,
    skipItem,
    nextItem,
    answerWithCue,
    recordResult,
    totalItems: items.length,
  };
}
