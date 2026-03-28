import type { DailyMission, ExerciseType, WeeklyChallenge } from '@/types';

const EXERCISE_TYPES: ExerciseType[] = [
  'category-naming',
  'sentence-completion',
  'picture-naming',
  'responsive-naming',
  'script-practice',
];

const EXERCISE_LABELS: Record<ExerciseType, string> = {
  'category-naming': 'Category Naming',
  'sentence-completion': 'Sentence Completion',
  'picture-naming': 'Picture Naming',
  'responsive-naming': 'Responsive Naming',
  'script-practice': 'Script Practice',
};

export function generateDailyMission(userThemes: string[]): DailyMission {
  const d = new Date();
  const seed = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hash = simpleHash(seed);
  const type = EXERCISE_TYPES[hash % EXERCISE_TYPES.length];
  const theme = userThemes[hash % userThemes.length] || 'home';
  const targetCount = 5 + (hash % 6); // 5-10 items

  return {
    id: `mission-${seed}`,
    description: `Complete ${targetCount} ${EXERCISE_LABELS[type]} items in ${theme}`,
    exerciseType: type,
    theme,
    targetCount,
    completedCount: 0,
    completed: false,
  };
}

export function checkWeeklyChallenge(daysThisWeek: number): WeeklyChallenge {
  return {
    targetDays: 4,
    completedDays: daysThisWeek,
    completed: daysThisWeek >= 4,
  };
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}
