'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import HydrationGuard from '@/components/ui/HydrationGuard';

export default function HomePage() {
  return (
    <HydrationGuard>
      <HomeContent />
    </HydrationGuard>
  );
}

function HomeContent() {
  const router = useRouter();
  const { profile } = useAppStore();

  useEffect(() => {
    if (profile?.onboardingComplete) {
      router.replace('/dashboard');
    }
  }, [profile, router]);

  if (profile?.onboardingComplete) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🗣️</span>
          </div>
          <h1 className="text-3xl font-bold text-text mb-3">WordQuest</h1>
          <p className="text-lg text-text-light leading-relaxed">
            Game-based word retrieval therapy that feels motivating, personal, and worth coming back to.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-success-light rounded-full flex items-center justify-center flex-shrink-0">
              <span>✨</span>
            </div>
            <p className="text-sm text-text">Practice word-finding with supportive, rewarding exercises</p>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span>🎯</span>
            </div>
            <p className="text-sm text-text">Personalized to your life and your goals</p>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-accent-light rounded-full flex items-center justify-center flex-shrink-0">
              <span>💪</span>
            </div>
            <p className="text-sm text-text">Recovery and strategy use count as real progress</p>
          </div>
        </div>

        <Button
          onClick={() => router.push('/onboarding')}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Get Started
        </Button>

        <p className="text-xs text-text-muted mt-4">
          Not a diagnostic tool. Designed to support home practice.
        </p>
      </div>
    </div>
  );
}
