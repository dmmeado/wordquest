'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';

export default function HydrationGuard({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const [mounted, setMounted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Safety fallback: if hydration never completes, render anyway after 2s
    const timer = setTimeout(() => setTimedOut(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || (!hasHydrated && !timedOut)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🗣️</span>
          </div>
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
