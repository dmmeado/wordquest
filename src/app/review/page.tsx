'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ReviewPage() {
  const router = useRouter();
  const { sessions } = useAppStore();

  const missedItems = useMemo(() => {
    const missed: { itemId: string; type: string; cueLevel: number; count: number }[] = [];
    const counts = new Map<string, { type: string; cueLevel: number; count: number }>();

    for (const session of sessions) {
      for (const result of session.results) {
        if (!result.correct || result.cueLevel >= 3) {
          const key = result.itemId;
          const existing = counts.get(key);
          if (existing) {
            existing.count++;
            existing.cueLevel = Math.max(existing.cueLevel, result.cueLevel);
          } else {
            counts.set(key, { type: result.type, cueLevel: result.cueLevel, count: 1 });
          }
        }
      }
    }

    counts.forEach((val, key) => {
      missed.push({ itemId: key, ...val });
    });

    return missed.sort((a, b) => b.count - a.count).slice(0, 20);
  }, [sessions]);

  const typeLabels: Record<string, string> = {
    'category-naming': 'Category',
    'sentence-completion': 'Sentence',
    'picture-naming': 'Picture',
    'responsive-naming': 'Prompt',
    'script-practice': 'Script',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 pt-4 pb-2 border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-text-light hover:text-text p-2 -ml-2 min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-text">Review</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {missedItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🌟</div>
            <h2 className="text-xl font-semibold text-text mb-2">All clear!</h2>
            <p className="text-text-light mb-6">
              No tricky words right now. Keep practicing to stay sharp.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="primary">
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <>
            <p className="text-text-light text-sm mb-4">
              Words that needed extra practice. Tap an exercise type to practice more.
            </p>
            <div className="space-y-2">
              {missedItems.map((item) => (
                <Card key={item.itemId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-text text-sm">{item.itemId.replace(/^(cat|sent|pic|rn|scr)-/, '').replace(/-/g, ' ')}</p>
                    <p className="text-xs text-text-muted">
                      {typeLabels[item.type] || item.type} &middot; Missed {item.count}x
                    </p>
                  </div>
                  {item.cueLevel >= 3 && (
                    <span className="text-xs bg-warning-light text-warning px-2 py-0.5 rounded-full">
                      Needs practice
                    </span>
                  )}
                </Card>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <Button onClick={() => router.push('/exercise/picture-naming')} variant="primary" size="md" className="w-full">
                Practice Picture Naming
              </Button>
              <Button onClick={() => router.push('/exercise/sentence-completion')} variant="secondary" size="md" className="w-full">
                Practice Sentence Completion
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
