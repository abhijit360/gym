import type { Workout, Exercise, Set } from './types';
import { normalizeName } from './exerciseLibrary';
import { daysBetween } from './dateUtils';

export interface SetComparison {
  weightDelta?: number;
  repsDelta?: number;
  volumeDelta?: number;
  volumePct?: number;
  isNew: boolean;
}

export interface ExerciseComparison {
  baselineDate?: string;
  daysAgo?: number;
  perSet: SetComparison[];
  totalVolumeDelta?: number;
  totalVolumePct?: number;
}

export interface WorkoutComparison {
  [exerciseKey: string]: ExerciseComparison;
}

interface Occurrence {
  date: string;
  sets: Set[];
}

type OccurrenceIndex = Record<string, Occurrence[]>;

function buildIndex(allWorkouts: Workout[]): OccurrenceIndex {
  const index: OccurrenceIndex = {};
  const sorted = [...allWorkouts].sort((a, b) => b.date.localeCompare(a.date));
  for (const w of sorted) {
    for (const ex of w.exercises) {
      const key = normalizeName(ex.name);
      if (!index[key]) index[key] = [];
      index[key].push({ date: w.date, sets: ex.sets });
    }
  }
  return index;
}

function findBaseline(
  index: OccurrenceIndex,
  exerciseKey: string,
  currentDate: string
): Occurrence | undefined {
  const candidates = (index[exerciseKey] || []).filter((o) => o.date < currentDate);
  if (!candidates.length) return undefined;

  const windowed = candidates.filter((o) => {
    const days = daysBetween(o.date, currentDate);
    return days >= 4 && days <= 10;
  });

  if (windowed.length) {
    return windowed.reduce((best, curr) => {
      const bestDiff = Math.abs(daysBetween(best.date, currentDate) - 7);
      const currDiff = Math.abs(daysBetween(curr.date, currentDate) - 7);
      return currDiff < bestDiff ? curr : best;
    });
  }

  return candidates[0];
}

function compareExercise(
  index: OccurrenceIndex,
  exercise: Exercise,
  currentDate: string
): ExerciseComparison {
  const base = findBaseline(index, normalizeName(exercise.name), currentDate);

  if (!base) {
    return {
      perSet: exercise.sets.map(() => ({ isNew: true })),
    };
  }

  const perSet: SetComparison[] = [];
  let totalCur = 0;
  let totalPrev = 0;

  for (let i = 0; i < exercise.sets.length; i++) {
    const cur = exercise.sets[i];
    const prev = base.sets[i];

    if (!prev) {
      perSet.push({ isNew: true });
      continue;
    }

    if (cur.weight != null && prev.weight != null) {
      const wd = cur.weight - prev.weight;
      const rd = (cur.reps ?? 0) - (prev.reps ?? 0);
      const cv = cur.weight * (cur.reps ?? 0);
      const pv = prev.weight * (prev.reps ?? 0);
      const vd = cv - pv;
      const vpct = pv ? (vd / pv) * 100 : undefined;

      totalCur += cv;
      totalPrev += pv;

      perSet.push({
        weightDelta: wd,
        repsDelta: rd,
        volumeDelta: vd,
        volumePct: vpct,
        isNew: false,
      });
    } else {
      const vd = (cur.distance ?? cur.duration ?? 0) - (prev.distance ?? prev.duration ?? 0);
      perSet.push({ volumeDelta: vd, isNew: false });
    }
  }

  return {
    baselineDate: base.date,
    daysAgo: daysBetween(base.date, currentDate),
    perSet,
    totalVolumeDelta: totalCur - totalPrev,
    totalVolumePct: totalPrev ? ((totalCur - totalPrev) / totalPrev) * 100 : undefined,
  };
}

export function compareWorkout(allWorkouts: Workout[], workout: Workout): WorkoutComparison {
  const index = buildIndex(allWorkouts);
  const result: WorkoutComparison = {};

  const counts: Record<string, number> = {};
  for (const ex of workout.exercises) {
    const key = normalizeName(ex.name);
    counts[key] = (counts[key] || 0) + 1;
    const finalKey = counts[key] > 1 ? `${key}_${counts[key]}` : key;
    result[finalKey] = compareExercise(index, ex, workout.date);
  }

  return result;
}
