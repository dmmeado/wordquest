import type { Achievement, SessionRecord, StreakData, ProgressStats } from '@/types';

export const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first-session', name: 'First Steps', description: 'Complete your first session', icon: '🌟' },
  { id: 'three-sessions-week', name: 'Building Momentum', description: 'Complete 3 sessions in one week', icon: '🔥' },
  { id: 'ten-recoveries', name: 'Recovery Champion', description: 'Successfully recover 10 words with cues', icon: '💪' },
  { id: 'seven-day-streak', name: 'Week Warrior', description: 'Practice 7 days in a row', icon: '⭐' },
  { id: 'fifty-independent', name: 'Sharp Recall', description: 'Get 50 independent correct answers', icon: '🎯' },
  { id: 'quick-win-3', name: 'Quick Starter', description: 'Use Quick Win mode 3 times', icon: '⚡' },
  { id: 'twenty-sessions', name: 'Dedicated Learner', description: 'Complete 20 sessions', icon: '📚' },
  { id: 'hundred-points', name: 'Point Collector', description: 'Earn 100 total points', icon: '💎' },
  { id: 'five-hundred-points', name: 'Word Master', description: 'Earn 500 total points', icon: '👑' },
  { id: 'all-types', name: 'Explorer', description: 'Try all 5 exercise types', icon: '🗺️' },
];

export function checkAchievements(
  current: Achievement[],
  sessions: SessionRecord[],
  streak: StreakData,
  progress: ProgressStats
): Achievement[] {
  const now = Date.now();
  return current.map((a) => {
    if (a.unlockedAt) return a;
    if (shouldUnlock(a.id, sessions, streak, progress)) {
      return { ...a, unlockedAt: now };
    }
    return a;
  });
}

function shouldUnlock(
  id: string,
  sessions: SessionRecord[],
  streak: StreakData,
  progress: ProgressStats
): boolean {
  switch (id) {
    case 'first-session':
      return sessions.length >= 1;
    case 'three-sessions-week': {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return sessions.filter((s) => s.startedAt > weekAgo).length >= 3;
    }
    case 'ten-recoveries':
      return progress.recoveryCount >= 10;
    case 'seven-day-streak':
      return streak.currentStreak >= 7;
    case 'fifty-independent':
      return progress.independentCorrectCount >= 50;
    case 'quick-win-3':
      return sessions.filter((s) => s.isQuickWin).length >= 3;
    case 'twenty-sessions':
      return sessions.length >= 20;
    case 'hundred-points':
      return progress.totalPoints >= 100;
    case 'five-hundred-points':
      return progress.totalPoints >= 500;
    case 'all-types': {
      const types = new Set(sessions.map((s) => s.exerciseType));
      return types.size >= 5;
    }
    default:
      return false;
  }
}
