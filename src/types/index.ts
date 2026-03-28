// === User & Profile ===
export interface UserProfile {
  uid: string;
  name: string;
  goals: string[];
  themes: string[];
  tone: 'encouraging' | 'neutral' | 'energetic';
  sessionLength: number; // minutes
  reminderTime: string | null;
  onboardingComplete: boolean;
  createdAt: number;
}

// === Exercise Types ===
export type ExerciseType =
  | 'category-naming'
  | 'sentence-completion'
  | 'picture-naming'
  | 'responsive-naming'
  | 'script-practice';

export interface ExerciseItem {
  id: string;
  type: ExerciseType;
  theme: string;
  difficulty: 1 | 2 | 3;
}

export interface CategoryNamingItem extends ExerciseItem {
  type: 'category-naming';
  category: string;
  correctWords: string[];
  distractors: string[];
}

export interface SentenceCompletionItem extends ExerciseItem {
  type: 'sentence-completion';
  sentence: string; // with ___ for blank
  answer: string;
  distractors: string[];
  firstLetterCue: string;
}

export interface PictureNamingItem extends ExerciseItem {
  type: 'picture-naming';
  imageUrl: string;
  answer: string;
  semanticCue: string;
  functionCue: string;
  firstLetterCue: string;
  forcedChoices: string[];
}

export interface ResponsiveNamingItem extends ExerciseItem {
  type: 'responsive-naming';
  prompt: string;
  answer: string;
  categoryCue: string;
  firstLetterCue: string;
  choices: string[];
}

export interface ScriptPracticeItem extends ExerciseItem {
  type: 'script-practice';
  scenario: string;
  script: string;
  context: string;
}

export type AnyExerciseItem =
  | CategoryNamingItem
  | SentenceCompletionItem
  | PictureNamingItem
  | ResponsiveNamingItem
  | ScriptPracticeItem;

// === Exercise State ===
export type CueLevel = 0 | 1 | 2 | 3 | 4; // 0=none, 1=semantic, 2=function, 3=first letter, 4=forced choice

export interface ExerciseResult {
  itemId: string;
  type: ExerciseType;
  correct: boolean;
  cueLevel: CueLevel;
  timeMs: number;
  skipped: boolean;
}

// === Session ===
export interface SessionRecord {
  id: string;
  startedAt: number;
  completedAt: number | null;
  exerciseType: ExerciseType;
  results: ExerciseResult[];
  totalPoints: number;
  isQuickWin: boolean;
}

// === Progress & Gamification ===
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string; // YYYY-MM-DD
  graceUsedThisWeek: boolean;
  weeklyDays: string[]; // dates practiced this week
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
}

export interface DailyMission {
  id: string;
  description: string;
  exerciseType: ExerciseType;
  theme: string;
  targetCount: number;
  completedCount: number;
  completed: boolean;
}

export interface WeeklyChallenge {
  targetDays: number;
  completedDays: number;
  completed: boolean;
}

export interface ProgressStats {
  totalSessions: number;
  totalPoints: number;
  totalTimePracticed: number; // ms
  averageAccuracy: number;
  averageCueLevel: number;
  strongestExercise: ExerciseType | null;
  weakestExercise: ExerciseType | null;
  independentCorrectCount: number;
  cuedCorrectCount: number;
  recoveryCount: number;
}

// === Custom Vocabulary ===
export interface CustomWord {
  id: string;
  word: string;
  category: string;
  note: string;
  addedAt: number;
}
