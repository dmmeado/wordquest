'use client';

import { useRef } from 'react';
import Button from '@/components/ui/Button';
import CelebrationEffect from './CelebrationEffect';

interface FeedbackOverlayProps {
  message: string;
  points: number;
  timeBonus: number;
  isCorrect: boolean;
  cueLevel: number;
  onNext: () => void;
  isLast: boolean;
}

export default function FeedbackOverlay({
  message,
  points,
  timeBonus,
  isCorrect,
  cueLevel,
  onNext,
  isLast,
}: FeedbackOverlayProps) {
  // Use a ref to generate a stable trigger value per mount
  const triggerRef = useRef(Date.now());

  const bgColor = isCorrect
    ? cueLevel === 0
      ? 'bg-success-light'
      : 'bg-primary/10'
    : 'bg-surface-warm';

  const iconBg = isCorrect
    ? cueLevel === 0
      ? 'bg-success'
      : 'bg-primary'
    : 'bg-accent';

  const celebrationType = isCorrect
    ? cueLevel === 0 ? 'correct' : 'recovery'
    : null;

  return (
    <>
      {celebrationType && (
        <CelebrationEffect
          type={celebrationType as 'correct' | 'recovery'}
          trigger={triggerRef.current}
        />
      )}

      <div className={`${bgColor} rounded-2xl p-6 text-center animate-scale-in relative overflow-hidden`}>
        {/* Animated icon */}
        <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-4 ${isCorrect ? 'animate-bounce-in' : ''}`}>
          {isCorrect ? (
            <svg width="32" height="32" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 16l8 8L26 8" />
            </svg>
          ) : (
            <span className="text-2xl text-white">
              {points > 0 ? '💪' : '→'}
            </span>
          )}
        </div>

        <p className="text-lg font-semibold text-text mb-2">{message}</p>

        {points > 0 && (
          <div className="mb-4">
            <div className="animate-points-pop text-primary font-bold text-2xl">
              +{points} points
            </div>
            {timeBonus > 0 && (
              <div className="animate-points text-success font-semibold text-sm mt-1">
                +{timeBonus} speed bonus
              </div>
            )}
          </div>
        )}

        {cueLevel > 0 && isCorrect && (
          <p className="text-sm text-text-light mb-4">
            Using hints is a real skill — every recovery counts!
          </p>
        )}

        <Button onClick={onNext} variant="primary" size="lg" className="w-full">
          {isLast ? 'Finish Session' : 'Next'}
        </Button>
      </div>
    </>
  );
}
