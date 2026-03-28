import categoriesData from './categories.json';
import sentencesData from './sentences.json';
import picturesData from './pictures.json';
import responsiveData from './responsive-prompts.json';
import scriptsData from './scripts.json';
import type {
  CategoryNamingItem,
  SentenceCompletionItem,
  PictureNamingItem,
  ResponsiveNamingItem,
  ScriptPracticeItem,
  AnyExerciseItem,
  ExerciseType,
} from '@/types';

export const categories = categoriesData as unknown as CategoryNamingItem[];
export const sentences = sentencesData as unknown as SentenceCompletionItem[];
export const pictures = picturesData as unknown as (PictureNamingItem & { imageEmoji: string })[];
export const responsivePrompts = responsiveData as unknown as ResponsiveNamingItem[];
export const scripts = scriptsData as unknown as ScriptPracticeItem[];

export function getItemsByType(type: ExerciseType, themes?: string[], difficulty?: number): AnyExerciseItem[] {
  let items: AnyExerciseItem[];
  switch (type) {
    case 'category-naming':
      items = categories;
      break;
    case 'sentence-completion':
      items = sentences;
      break;
    case 'picture-naming':
      items = pictures;
      break;
    case 'responsive-naming':
      items = responsivePrompts;
      break;
    case 'script-practice':
      items = scripts;
      break;
    default:
      items = [];
  }

  if (themes && themes.length > 0) {
    const themeSet = new Set(themes);
    const filtered = items.filter((i) => themeSet.has(i.theme));
    if (filtered.length >= 3) items = filtered;
  }

  if (difficulty) {
    const filtered = items.filter((i) => i.difficulty <= difficulty);
    if (filtered.length >= 3) items = filtered;
  }

  return shuffleArray(items);
}

export function getQuickWinItems(themes?: string[]): AnyExerciseItem[] {
  // Mix of easy items from different types for a 1-minute session
  const types: ExerciseType[] = ['sentence-completion', 'responsive-naming', 'picture-naming'];
  const items: AnyExerciseItem[] = [];

  for (const type of types) {
    const typeItems = getItemsByType(type, themes, 1);
    items.push(...typeItems.slice(0, 2));
  }

  return shuffleArray(items).slice(0, 5);
}

/**
 * Filter out items already seen today, then shuffle.
 * Falls back to full pool (shuffled) if too few unseen items remain.
 */
export function excludeSeenToday<T extends { id: string }>(
  items: T[],
  todaySeenIds: Set<string>,
  minRequired: number,
): T[] {
  const unseen = items.filter((item) => !todaySeenIds.has(item.id));
  // If enough unseen items, use those; otherwise fall back to full pool
  if (unseen.length >= minRequired) {
    return shuffleArray(unseen);
  }
  return shuffleArray(items);
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
