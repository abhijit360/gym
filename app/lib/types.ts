export interface Exercise {
  name: string;
  sets: Set[];
}

export interface Set {
  weight?: number;
  reps?: number;
  duration?: number; // For cardio/timed exercises
  distance?: number; // For running, etc.
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'strength' | 'cardio' | 'flexibility' | 'other';
  duration_minutes?: number;
  exercises: Exercise[];
  notes?: string;
}

export interface WorkoutMetadata {
  date: string;
  workout_type: string;
  duration_minutes?: number;
}
