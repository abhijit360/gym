// Core workout types
export interface Set {
  weight?: number;
  reps?: number;
  duration?: number; // For cardio/timed exercises (minutes)
  distance?: number; // For running, etc. (miles or km)
}

export interface Exercise {
  name: string;
  sets: Set[];
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'strength' | 'cardio' | 'flexibility' | 'other';
  duration_minutes?: number;
  exercises: Exercise[];
  notes?: string;
}

// Markdown frontmatter type
export interface WorkoutMetadata {
  date: string;
  workout_type: string;
  duration_minutes?: number;
  equipment?: string[];
}

// User equipment profile
export interface EquipmentProfile {
  barbell: boolean;
  dumbbells: boolean;
  cables: boolean;
  machines: boolean;
  bodyweight: boolean;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
}
