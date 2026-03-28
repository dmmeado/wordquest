'use client';

import { useEffect, useState, useRef } from 'react';

type EffectType = 'emoji-burst' | 'ring-pulse' | 'sparkle-shower' | 'confetti' | 'fireworks' | 'star-spin';

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  delay: number;
  duration: number;
  scale: number;
  angle: number;
  distance: number;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const CORRECT_EFFECTS: EffectType[] = ['emoji-burst', 'sparkle-shower', 'confetti', 'fireworks', 'star-spin'];
const RECOVERY_EFFECTS: EffectType[] = ['ring-pulse', 'sparkle-shower', 'star-spin'];
const CELEBRATION_EFFECTS: EffectType[] = ['emoji-burst', 'fireworks', 'confetti', 'sparkle-shower'];

const CORRECT_EMOJIS = ['🎉', '🔥', '⭐', '💥', '🌟', '✨', '🏆', '💎'];
const RECOVERY_EMOJIS = ['💪', '👏', '🙌', '✨', '💫'];
const CELEBRATION_EMOJIS = ['🎉', '🥳', '🏆', '🔥', '⭐', '💎', '🎊', '👑'];
const SPARKLES = ['✦', '✧', '★', '⋆', '✶', '✹'];

interface CelebrationEffectProps {
  type: 'correct' | 'recovery' | 'celebration';
  trigger: number; // change this to re-trigger
}

export default function CelebrationEffect({ type, trigger }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [effectType, setEffectType] = useState<EffectType>('confetti');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const effects = type === 'correct' ? CORRECT_EFFECTS : type === 'recovery' ? RECOVERY_EFFECTS : CELEBRATION_EFFECTS;
    const chosen = pick(effects);
    setEffectType(chosen);

    const emojiPool = type === 'correct' ? CORRECT_EMOJIS : type === 'recovery' ? RECOVERY_EMOJIS : CELEBRATION_EMOJIS;
    const newParticles: Particle[] = [];
    const count = chosen === 'sparkle-shower' ? 20 : chosen === 'fireworks' ? 24 : chosen === 'star-spin' ? 8 : 12;

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: randomBetween(10, 90),
        y: randomBetween(10, 90),
        emoji: chosen === 'sparkle-shower' ? pick(SPARKLES) : pick(emojiPool),
        delay: randomBetween(0, 0.4),
        duration: randomBetween(0.6, 1.2),
        scale: randomBetween(0.6, 1.4),
        angle: (360 / count) * i,
        distance: randomBetween(60, 140),
      });
    }

    setParticles(newParticles);

    const cleanup = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(cleanup);
  }, [trigger, type]);

  if (particles.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {effectType === 'emoji-burst' && particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-emoji-burst"
          style={{
            left: '50%',
            top: '50%',
            fontSize: `${24 * p.scale}px`,
            '--burst-x': `${Math.cos((p.angle * Math.PI) / 180) * p.distance}px`,
            '--burst-y': `${Math.sin((p.angle * Math.PI) / 180) * p.distance}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}

      {effectType === 'ring-pulse' && (
        <>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ring-expand">
            <div className="w-16 h-16 rounded-full border-4 border-primary" />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ring-expand" style={{ animationDelay: '0.15s' }}>
            <div className="w-16 h-16 rounded-full border-4 border-success" />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ring-expand" style={{ animationDelay: '0.3s' }}>
            <div className="w-16 h-16 rounded-full border-4 border-accent" />
          </div>
          {particles.slice(0, 6).map((p) => (
            <span
              key={p.id}
              className="absolute animate-emoji-float"
              style={{
                left: `${p.x}%`,
                top: '40%',
                fontSize: `${20 * p.scale}px`,
                animationDelay: `${p.delay + 0.3}s`,
              } as React.CSSProperties}
            >
              {p.emoji}
            </span>
          ))}
        </>
      )}

      {effectType === 'sparkle-shower' && particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-sparkle-fall text-yellow-400"
          style={{
            left: `${p.x}%`,
            top: '-5%',
            fontSize: `${18 * p.scale}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration + 0.5}s`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}

      {effectType === 'confetti' && particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-confetti-piece"
          style={{
            left: `${p.x}%`,
            top: '-5%',
            width: `${8 * p.scale}px`,
            height: `${14 * p.scale}px`,
            backgroundColor: pick(['#7BC47F', '#4F7CAC', '#E8A87C', '#FFD700', '#FF6B8A', '#A78BFA']),
            borderRadius: '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration + 0.8}s`,
            '--confetti-drift': `${randomBetween(-30, 30)}px`,
            '--confetti-spin': `${randomBetween(360, 1080)}deg`,
          } as React.CSSProperties}
        />
      ))}

      {effectType === 'fireworks' && particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-firework-particle"
          style={{
            left: '50%',
            top: '45%',
            fontSize: `${16 * p.scale}px`,
            '--fw-x': `${Math.cos((p.angle * Math.PI) / 180) * p.distance * 1.5}px`,
            '--fw-y': `${Math.sin((p.angle * Math.PI) / 180) * p.distance * 1.5 - 40}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            color: pick(['#FFD700', '#FF6B8A', '#7BC47F', '#4F7CAC', '#A78BFA']),
          } as React.CSSProperties}
        >
          ●
        </span>
      ))}

      {effectType === 'star-spin' && particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-star-spin"
          style={{
            left: '50%',
            top: '50%',
            fontSize: `${28 * p.scale}px`,
            '--orbit-radius': `${40 + p.id * 15}px`,
            '--orbit-start': `${p.angle}deg`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration + 0.3}s`,
          } as React.CSSProperties}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
