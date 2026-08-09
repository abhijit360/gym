import * as FileSystem from 'expo-file-system/legacy';
import YAML from 'yaml';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Workout, WorkoutMetadata, EquipmentProfile } from './types';

const WORKOUTS_DIR = `${FileSystem.documentDirectory}workouts/`;

export class WorkoutStorage {
  /**
   * Initialize storage directory
   */
  static async init() {
    const info = await FileSystem.getInfoAsync(WORKOUTS_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(WORKOUTS_DIR, { intermediates: true });
    }
  }

  /**
   * Convert workout to markdown with YAML frontmatter
   */
  static toMarkdown(workout: Workout): string {
    const metadata: WorkoutMetadata = {
      date: workout.date,
      workout_type: workout.type,
      duration_minutes: workout.duration_minutes,
    };

    let markdown = '---\n';
    markdown += YAML.stringify(metadata);
    markdown += '---\n\n';
    markdown += `# Workout - ${workout.date}\n\n`;

    for (const exercise of workout.exercises) {
      markdown += `## ${exercise.name}\n`;
      exercise.sets.forEach((set, i) => {
        markdown += `- Set ${i + 1}: `;
        if (set.weight && set.reps) {
          markdown += `${set.weight} lbs × ${set.reps} reps`;
        } else if (set.duration) {
          markdown += `${set.duration} minutes`;
        } else if (set.distance) {
          markdown += `${set.distance} miles`;
        }
        markdown += '\n';
      });
      markdown += '\n';
    }

    if (workout.notes) {
      markdown += `## Notes\n${workout.notes}\n`;
    }

    return markdown;
  }

  /**
   * Parse markdown back to workout object
   */
  static fromMarkdown(id: string, content: string): Workout {
    const parts = content.split('---');
    if (parts.length < 3) {
      // Invalid format, return minimal workout
      return {
        id,
        date: new Date().toISOString().split('T')[0],
        type: 'other',
        exercises: [],
      };
    }

    const metadata = YAML.parse(parts[1]) as WorkoutMetadata;
    const body = parts[2]?.trim() || '';

    // Basic parsing - for Phase 0, just preserve the body as notes
    const workout: Workout = {
      id,
      date: metadata.date,
      type: metadata.workout_type as Workout['type'],
      duration_minutes: metadata.duration_minutes,
      exercises: [],
      notes: body,
    };

    return workout;
  }

  /**
   * Save workout to markdown file
   */
  static async save(workout: Workout): Promise<void> {
    await this.init();
    const filename = `${workout.date}_${workout.id}.md`;
    const filepath = `${WORKOUTS_DIR}${filename}`;
    const markdown = this.toMarkdown(workout);
    await FileSystem.writeAsStringAsync(filepath, markdown);
  }

  /**
   * Load a specific workout
   */
  static async load(id: string): Promise<Workout | null> {
    await this.init();
    const files = await FileSystem.readDirectoryAsync(WORKOUTS_DIR);
    const file = files.find(f => f.includes(id));
    
    if (!file) return null;
    
    const filepath = `${WORKOUTS_DIR}${file}`;
    const content = await FileSystem.readAsStringAsync(filepath);
    return this.fromMarkdown(id, content);
  }

  /**
   * Load all workouts
   */
  static async loadAll(): Promise<Workout[]> {
    await this.init();
    const files = await FileSystem.readDirectoryAsync(WORKOUTS_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const workouts = await Promise.all(
      mdFiles.map(async file => {
        const filepath = `${WORKOUTS_DIR}${file}`;
        const content = await FileSystem.readAsStringAsync(filepath);
        const id = file.split('_')[1]?.replace('.md', '') || file;
        return this.fromMarkdown(id, content);
      })
    );

    return workouts.sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Delete a workout
   */
  static async delete(id: string): Promise<void> {
    await this.init();
    const files = await FileSystem.readDirectoryAsync(WORKOUTS_DIR);
    const file = files.find(f => f.includes(id));
    if (file) {
      const filepath = `${WORKOUTS_DIR}${file}`;
      await FileSystem.deleteAsync(filepath);
    }
  }
}

/**
 * Equipment profile storage (AsyncStorage)
 */
export class EquipmentStorage {
  private static STORAGE_KEY = '@gymtune:equipment';

  static async save(profile: EquipmentProfile): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
  }

  static async load(): Promise<EquipmentProfile> {
    const data = await AsyncStorage.getItem(this.STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Default: all equipment available
    return {
      barbell: true,
      dumbbells: true,
      cables: true,
      machines: true,
      bodyweight: true,
    };
  }
}
