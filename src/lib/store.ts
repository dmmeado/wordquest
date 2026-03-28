'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserProfile,
  SessionRecord,
  StreakData,
  ProgressStats,
  DailyMission,
  WeeklyChallenge,
  Achievement,
  CustomWord,
  ExerciseResult,
  ExerciseType,
} from '@/types';
import { calculatePoints } from './scoring';
import { generateDailyMission, checkWeeklyChallenge } from './missions';
import { ACHIEVEMENTS, checkAchievements } from './achievements';

function localTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function thisWeekDates(weeklyDays: string[]) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return weeklyDays.filter((d) => new Date(d + 'T00:00:00') >= monday);
}

interface AppState {
  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // User
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
  updateProfile: (p: Partial<UserProfile>) => void;

  // Sessions
  sessions: SessionRecord[];
  addSession: (s: SessionRecord) => void;

  // Streaks
  streak: StreakData;
  recordPractice: () => void;

  // Progress
  progress: ProgressStats;
  recalculateProgress: () => void;

  // Missions
  dailyMission: DailyMission | null;
  weeklyChallenge: WeeklyChallenge;
  refreshMissions: () => void;
  updateMissionProgress: (type: ExerciseType, count: number) => void;

  // Achievements
  achievements: Achievement[];
  checkAndUnlockAchievements: () => void;

  // Custom vocabulary
  customWords: CustomWord[];
  addCustomWord: (w: CustomWord) => void;
  removeCustomWord: (id: string) => void;

  // Caregiver mode
  caregiverMode: boolean;
  setCaregiverMode: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      profile: null,
      setProfile: (p) => set({ profile: p }),
      updateProfile: (p) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, ...p } : null })),

      sessions: [],
      addSession: (s) => {
        set((state) => ({ sessions: [...state.sessions, s] }));
        get().recordPractice();
        get().recalculateProgress();
        get().checkAndUnlockAchievements();
      },

      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: '',
        graceUsedThisWeek: false,
        weeklyDays: [],
      },
      recordPractice: () =>
        set((state) => {
          const today = localTodayStr();
          const s = state.streak;
          if (s.lastPracticeDate === today) return {};

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayString = localDateStr(yesterday);

          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
          const twoDaysAgoString = localDateStr(twoDaysAgo);

          let newStreak = s.currentStreak;
          let graceUsed = s.graceUsedThisWeek;

          if (s.lastPracticeDate === yesterdayString || s.lastPracticeDate === '') {
            // Consecutive day or first ever practice
            newStreak = s.currentStreak + 1;
          } else if (
            s.lastPracticeDate === twoDaysAgoString &&
            !s.graceUsedThisWeek
          ) {
            // Missed exactly one day - use grace
            newStreak = s.currentStreak + 1;
            graceUsed = true;
          } else {
            // Streak broken
            newStreak = 1;
          }

          // Reset grace flag on Monday
          const now = new Date();
          if (now.getDay() === 1 && s.lastPracticeDate !== today) {
            graceUsed = false;
          }

          const weeklyDays = [...thisWeekDates(s.weeklyDays), today];
          return {
            streak: {
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, s.longestStreak),
              lastPracticeDate: today,
              graceUsedThisWeek: graceUsed,
              weeklyDays: [...new Set(weeklyDays)],
            },
          };
        }),

      progress: {
        totalSessions: 0,
        totalPoints: 0,
        totalTimePracticed: 0,
        averageAccuracy: 0,
        averageCueLevel: 0,
        strongestExercise: null,
        weakestExercise: null,
        independentCorrectCount: 0,
        cuedCorrectCount: 0,
        recoveryCount: 0,
      },
      recalculateProgress: () =>
        set((state) => {
          const sessions = state.sessions;
          const allResults = sessions.flatMap((s) => s.results);

          if (allResults.length === 0) {
            return {
              progress: {
                totalSessions: sessions.length,
                totalPoints: 0,
                totalTimePracticed: 0,
                averageAccuracy: 0,
                averageCueLevel: 0,
                strongestExercise: null,
                weakestExercise: null,
                independentCorrectCount: 0,
                cuedCorrectCount: 0,
                recoveryCount: 0,
              },
            };
          }

          const totalResults = allResults.length;

          const correctIndependent = allResults.filter(
            (r) => r.correct && r.cueLevel === 0 && !r.skipped
          ).length;
          const correctCued = allResults.filter(
            (r) => r.correct && r.cueLevel > 0 && !r.skipped
          ).length;

          // Accuracy by exercise type
          const typeAccuracy: Record<string, number> = {};
          const types: ExerciseType[] = [
            'category-naming',
            'sentence-completion',
            'picture-naming',
            'responsive-naming',
            'script-practice',
          ];
          for (const t of types) {
            const items = allResults.filter((r) => r.type === t && !r.skipped);
            if (items.length > 0) {
              typeAccuracy[t] =
                items.filter((r) => r.correct).length / items.length;
            }
          }

          const sorted = Object.entries(typeAccuracy).sort(
            ([, a], [, b]) => b - a
          );

          const nonSkipped = allResults.filter((r) => !r.skipped);
          const nonSkippedCount = nonSkipped.length || 1;

          return {
            progress: {
              totalSessions: sessions.length,
              totalPoints: sessions.reduce((sum, s) => sum + s.totalPoints, 0),
              totalTimePracticed: sessions.reduce(
                (sum, s) =>
                  sum + ((s.completedAt || Date.now()) - s.startedAt),
                0
              ),
              averageAccuracy:
                nonSkipped.filter((r) => r.correct).length / nonSkippedCount,
              averageCueLevel:
                nonSkipped.reduce((sum, r) => sum + r.cueLevel, 0) /
                nonSkippedCount,
              strongestExercise: (sorted[0]?.[0] as ExerciseType) || null,
              weakestExercise:
                (sorted[sorted.length - 1]?.[0] as ExerciseType) || null,
              independentCorrectCount: correctIndependent,
              cuedCorrectCount: correctCued,
              recoveryCount: correctCued, // cue-assisted correct = recovery
            },
          };
        }),

      dailyMission: null,
      weeklyChallenge: { targetDays: 4, completedDays: 0, completed: false },
      refreshMissions: () =>
        set((state) => {
          const themes = state.profile?.themes || ['home'];
          const todayMissionId = `mission-${localTodayStr()}`;
          // Preserve existing mission if it's for today (don't reset progress)
          const mission =
            state.dailyMission && state.dailyMission.id === todayMissionId
              ? state.dailyMission
              : generateDailyMission(themes);
          const wkDays = thisWeekDates(state.streak.weeklyDays).length;
          return {
            dailyMission: mission,
            weeklyChallenge: checkWeeklyChallenge(wkDays),
          };
        }),
      updateMissionProgress: (type, count) =>
        set((state) => {
          const m = state.dailyMission;
          if (!m || m.exerciseType !== type) return {};
          const newCount = m.completedCount + count;
          return {
            dailyMission: {
              ...m,
              completedCount: newCount,
              completed: newCount >= m.targetCount,
            },
          };
        }),

      achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: null })),
      checkAndUnlockAchievements: () =>
        set((state) => ({
          achievements: checkAchievements(
            state.achievements,
            state.sessions,
            state.streak,
            state.progress
          ),
        })),

      customWords: [],
      addCustomWord: (w) =>
        set((s) => ({ customWords: [...s.customWords, w] })),
      removeCustomWord: (id) =>
        set((s) => ({
          customWords: s.customWords.filter((w) => w.id !== id),
        })),

      caregiverMode: false,
      setCaregiverMode: (v) => set({ caregiverMode: v }),
    }),
    {
      name: 'wordquest-storage',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Zustand rehydration error:', error);
        }
        // Always mark as hydrated, even on error (use defaults)
        if (state) {
          state.setHasHydrated(true);
        } else {
          useAppStore.setState({ _hasHydrated: true });
        }
      },
    }
  )
);
