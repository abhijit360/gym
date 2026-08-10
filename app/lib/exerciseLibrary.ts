import type { Exercise, MuscleGroup } from './types';

export function normalizeName(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '');
}

const LIBRARY: Record<string, MuscleGroup[]> = {
  'bench press': ['chest', 'triceps', 'shoulders'],
  'incline press': ['chest', 'shoulders'],
  'incline bench press': ['chest', 'shoulders'],
  'decline press': ['chest', 'triceps'],
  'overhead press': ['shoulders', 'triceps'],
  'shoulder press': ['shoulders', 'triceps'],
  'squat': ['quads', 'glutes'],
  'front squat': ['quads', 'core'],
  'back squat': ['quads', 'glutes'],
  'deadlift': ['hamstrings', 'glutes', 'back'],
  'romanian deadlift': ['hamstrings', 'glutes'],
  'sumo deadlift': ['hamstrings', 'glutes', 'back'],
  'barbell row': ['back', 'biceps'],
  'dumbbell row': ['back', 'biceps'],
  'bent over row': ['back', 'biceps'],
  'seated row': ['back', 'biceps'],
  'pull up': ['back', 'biceps'],
  'chin up': ['back', 'biceps'],
  'lat pulldown': ['back', 'biceps'],
  'curl': ['biceps'],
  'bicep curl': ['biceps'],
  'dumbbell curl': ['biceps'],
  'barbell curl': ['biceps'],
  'hammer curl': ['biceps', 'forearms'],
  'triceps extension': ['triceps'],
  'triceps pushdown': ['triceps'],
  'triceps dip': ['triceps', 'chest'],
  'leg press': ['quads', 'glutes'],
  'leg curl': ['hamstrings'],
  'leg extension': ['quads'],
  'calf raise': ['calves'],
  'standing calf raise': ['calves'],
  'plank': ['core'],
  'crunch': ['core'],
  'sit up': ['core'],
  'russian twist': ['core'],
  'leg raise': ['core', 'quads'],
  'run': ['cardio'],
  'running': ['cardio'],
  'bike': ['cardio'],
  'cycling': ['cardio'],
  'row': ['cardio'],
  'rowing': ['cardio'],
  'lunge': ['quads', 'glutes'],
  'hip thrust': ['glutes', 'hamstrings'],
  'lateral raise': ['shoulders'],
  'front raise': ['shoulders'],
  'face pull': ['shoulders', 'back'],
};

const ALIASES: Record<string, string> = {
  bench: 'bench press',
  ohp: 'overhead press',
  pullup: 'pull up',
  pullups: 'pull up',
  chinup: 'chin up',
  chinups: 'chin up',
  'lat pull down': 'lat pulldown',
  'push up': 'bench press',
  pushup: 'bench press',
  'shoulder press': 'overhead press',
  dl: 'deadlift',
  rdl: 'romanian deadlift',
  'barbell rows': 'barbell row',
  'dumbbell rows': 'dumbbell row',
  squats: 'squat',
  deads: 'deadlift',
};

export function resolveMuscleGroups(ex: Exercise): MuscleGroup[] {
  if (ex.muscleGroups) return ex.muscleGroups;
  const normalized = normalizeName(ex.name);
  const canonical = ALIASES[normalized] || normalized;
  return LIBRARY[canonical] || ['other'];
}
