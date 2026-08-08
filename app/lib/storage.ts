import RNFS from 'react-native-fs';
import YAML from 'yaml';
import type { Workout, WorkoutMetadata } from './types';

const WORKOUTS_DIR = `${RNFS.DocumentDirectoryPath}/workouts`;

export class WorkoutStorage {
  /**
   * Initialize storage directory
   */
  static async init() {
    const exists = await RNFS.exists(WORKOUTS_DIR);
    if (!exists) {
      await RNFS.mkdir(WORKOUTS_DIR);
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
    const metadata = YAML.parse(parts[1]) as WorkoutMetadata;
    const body = parts[2]?.trim() || '';

    // Simple parsing - in production, the LLM would help here
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
    const filepath = `${WORKOUTS_DIR}/${filename}`;
    const markdown = this.toMarkdown(workout);
    await RNFS.writeFile(filepath, markdown, 'utf8');
  }

  /**
   * Load a specific workout
   */
  static async load(id: string): Promise<Workout | null> {
    await this.init();
    const files = await RNFS.readDir(WORKOUTS_DIR);
    const file = files.find(f => f.name.includes(id));
    
    if (!file) return null;
    
    const content = await RNFS.readFile(file.path, 'utf8');
    return this.fromMarkdown(id, content);
  }

  /**
   * Load all workouts
   */
  static async loadAll(): Promise<Workout[]> {
    await this.init();
    const files = await RNFS.readDir(WORKOUTS_DIR);
    const mdFiles = files.filter(f => f.name.endsWith('.md'));
    
    const workouts = await Promise.all(
      mdFiles.map(async file => {
        const content = await RNFS.readFile(file.path, 'utf8');
        const id = file.name.split('_')[1]?.replace('.md', '') || file.name;
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
    const files = await RNFS.readDir(WORKOUTS_DIR);
    const file = files.find(f => f.name.includes(id));
    if (file) {
      await RNFS.unlink(file.path);
    }
  }
}
