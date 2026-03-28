import type { CueLevel, ExerciseResult } from '@/types';

const POINTS_BY_CUE: Record<CueLevel, number> = {
  0: 10, // independent
  1: 7,  // semantic cue
  2: 6,  // function cue
  3: 5,  // first letter
  4: 4,  // forced choice
};

const COMPLETION_BONUS = 3;
const RECOVERY_BONUS = 2; // extra points for getting it right after a cue

export function calculateTimeBonus(timeMs: number): number {
  if (timeMs < 5000) return 3;  // under 5s
  if (timeMs < 10000) return 2; // under 10s
  if (timeMs < 15000) return 1; // under 15s
  return 0;
}

export function calculatePoints(result: ExerciseResult): number {
  if (result.skipped) return 0;
  if (!result.correct) return 1; // participation point

  let points = POINTS_BY_CUE[result.cueLevel] || 4;
  if (result.cueLevel > 0 && result.correct) {
    points += RECOVERY_BONUS;
  }
  points += calculateTimeBonus(result.timeMs);
  return points;
}

export function calculateSessionPoints(results: ExerciseResult[]): number {
  const itemPoints = results.reduce((sum, r) => sum + calculatePoints(r), 0);
  const completionBonus = results.filter((r) => !r.skipped).length >= 3 ? COMPLETION_BONUS * 2 : COMPLETION_BONUS;
  return itemPoints + completionBonus;
}

export function getEncouragingMessage(result: ExerciseResult): string {
  if (result.skipped) return 'No worries — let\'s keep going!';
  if (!result.correct) return 'Good effort! That word is tricky.';
  if (result.cueLevel === 0) return getRandomItem(INDEPENDENT_MESSAGES);
  if (result.cueLevel <= 2) return getRandomItem(CUED_MESSAGES);
  return getRandomItem(RECOVERY_MESSAGES);
}

const INDEPENDENT_MESSAGES = [
  'Nice! You got it!',
  'That\'s right!',
  'Great recall!',
  'You nailed it!',
  'Excellent!',
  'Sharp thinking!',
];

const CUED_MESSAGES = [
  'Great recovery!',
  'The hint helped — well done!',
  'You worked through it!',
  'Nice — you found it!',
  'That\'s the word!',
];

const RECOVERY_MESSAGES = [
  'You got there! That counts.',
  'Every recovery builds strength.',
  'Using hints is a real skill!',
  'That\'s progress!',
  'Nice work finding it!',
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
