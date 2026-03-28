'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import HydrationGuard from '@/components/ui/HydrationGuard';
import type { ExerciseType } from '@/types';

const EXERCISE_ROUTES: Record<ExerciseType, { path: string; label: string; icon: string; desc: string }> = {
  'category-naming': { path: '/exercise/category-naming', label: 'Category Naming', icon: '📋', desc: 'Name items in a category' },
  'sentence-completion': { path: '/exercise/sentence-completion', label: 'Sentence Completion', icon: '📝', desc: 'Fill in the missing word' },
  'picture-naming': { path: '/exercise/picture-naming', label: 'Picture Naming', icon: '🖼️', desc: 'Name what you see' },
  'responsive-naming': { path: '/exercise/responsive-naming', label: 'Responsive Naming', icon: '💬', desc: 'Answer functional prompts' },
  'script-practice': { path: '/exercise/script-practice', label: 'Script Practice', icon: '🎭', desc: 'Practice real conversations' },
};

export default function DashboardPage() {
  return (
    <HydrationGuard>
      <DashboardContent />
    </HydrationGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const {
    profile,
    streak,
    progress,
    dailyMission,
    weeklyChallenge,
    achievements,
    refreshMissions,
    sessions,
  } = useAppStore();

  useEffect(() => {
    if (!profile?.onboardingComplete) {
      router.push('/onboarding');
      return;
    }
    refreshMissions();
  }, [profile, router, refreshMissions]);

  if (!profile?.onboardingComplete) return null;

  const recentAchievements = achievements
    .filter((a) => a.unlockedAt)
    .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
    .slice(0, 3);

  const todaysSessions = sessions.filter(
    (s) => new Date(s.startedAt).toDateString() === new Date().toDateString()
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary text-white px-4 pt-8 pb-6 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-primary-light text-sm">Welcome back,</p>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              aria-label="Settings"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="3" />
                <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" />
              </svg>
            </button>
          </div>

          {/* Streak & momentum */}
          <div className="flex gap-4">
            <div className="bg-white/15 rounded-xl px-4 py-3 flex-1 text-center">
              <div className={`text-2xl font-bold ${streak.currentStreak >= 3 ? 'animate-wiggle' : ''}`}>{streak.currentStreak}</div>
              <div className="text-xs text-primary-light">Day Streak</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-3 flex-1 text-center">
              <div className="text-2xl font-bold">{streak.weeklyDays.length}/7</div>
              <div className="text-xs text-primary-light">This Week</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-3 flex-1 text-center">
              <div className="text-2xl font-bold">{progress.totalPoints}</div>
              <div className="text-xs text-primary-light">Total Points</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Quick Win */}
        <Card
          className="bg-accent/5 border-accent/20 animate-pulse-glow"
          hover
          onClick={() => router.push('/exercise/sentence-completion?quick=1')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text">Quick Win</h3>
              <p className="text-sm text-text-light">1-minute session — every bit counts</p>
            </div>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
              <path d="M8 4l6 6-6 6" />
            </svg>
          </div>
        </Card>

        {/* Daily Mission */}
        {dailyMission && (
          <Card>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xl">🎯</span>
              <div className="flex-1">
                <h3 className="font-semibold text-text text-sm">Today&apos;s Mission</h3>
                <p className="text-text-light text-sm">{dailyMission.description}</p>
              </div>
              {dailyMission.completed && <Badge variant="success">Done!</Badge>}
            </div>
            <ProgressBar
              value={dailyMission.targetCount > 0 ? (dailyMission.completedCount / dailyMission.targetCount) * 100 : 0}
              height="h-2"
              color="bg-accent"
            />
            {!dailyMission.completed && (
              <Button
                onClick={() => {
                  const route = EXERCISE_ROUTES[dailyMission.exerciseType];
                  if (route) router.push(route.path);
                }}
                variant="primary"
                size="sm"
                className="mt-3 w-full"
              >
                Start Mission
              </Button>
            )}
          </Card>
        )}

        {/* Weekly Challenge */}
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">📅</span>
            <h3 className="font-semibold text-text text-sm">Weekly Challenge</h3>
            <span className="ml-auto text-sm text-text-muted">
              {weeklyChallenge.completedDays}/{weeklyChallenge.targetDays} days
            </span>
          </div>
          <ProgressBar
            value={weeklyChallenge.targetDays > 0 ? (weeklyChallenge.completedDays / weeklyChallenge.targetDays) * 100 : 0}
            height="h-2"
            color="bg-success"
          />
        </Card>

        {/* Exercise Types */}
        <div>
          <h2 className="text-lg font-semibold text-text mb-3">Practice</h2>
          <div className="space-y-2">
            {Object.entries(EXERCISE_ROUTES).map(([type, info]) => (
              <Card key={type} hover onClick={() => router.push(info.path)}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{info.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-text">{info.label}</h3>
                    <p className="text-xs text-text-muted">{info.desc}</p>
                  </div>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                    <path d="M6 3l5 5-5 5" />
                  </svg>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-text mb-3">Recent Achievements</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentAchievements.map((a) => (
                <div
                  key={a.id}
                  className="flex-shrink-0 bg-card rounded-xl p-4 border border-border text-center w-28"
                >
                  <div className="text-3xl mb-1">{a.icon}</div>
                  <p className="text-xs font-medium text-text">{a.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Summary */}
        {progress.totalSessions > 0 && (
          <Card>
            <h3 className="font-semibold text-text text-sm mb-3">Your Progress</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-primary">{progress.totalSessions}</div>
                <div className="text-xs text-text-muted">Sessions</div>
              </div>
              <div>
                <div className="text-xl font-bold text-success">
                  {Math.round(progress.averageAccuracy * 100)}%
                </div>
                <div className="text-xs text-text-muted">Accuracy</div>
              </div>
              <div>
                <div className="text-xl font-bold text-accent">
                  {progress.independentCorrectCount}
                </div>
                <div className="text-xs text-text-muted">Independent</div>
              </div>
              <div>
                <div className="text-xl font-bold text-primary-light">
                  {progress.recoveryCount}
                </div>
                <div className="text-xs text-text-muted">Recoveries</div>
              </div>
            </div>
          </Card>
        )}

        {/* Today's Activity */}
        {todaysSessions.length > 0 && (
          <p className="text-center text-sm text-text-muted">
            You&apos;ve practiced {todaysSessions.length} time{todaysSessions.length > 1 ? 's' : ''} today. Keep it up!
          </p>
        )}

        {/* Review link */}
        {sessions.length > 0 && (
          <Button onClick={() => router.push('/review')} variant="ghost" size="sm" className="w-full">
            Review missed words
          </Button>
        )}
      </div>
    </div>
  );
}
