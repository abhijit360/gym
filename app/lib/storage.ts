import * as FileSystem from 'expo-file-system/legacy';
import YAML from 'yaml';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Workout, WorkoutMetadata, EquipmentProfile, MuscleGroup } from './types';


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
      ...(workout.location ? { location: workout.location } : {}),
    };

    let markdown = '---\n';
    markdown += YAML.stringify(metadata);
    markdown += '---\n\n';
    markdown += `# Workout - ${workout.date}\n\n`;

    for (const exercise of workout.exercises) {
      const tagSuffix =
        exercise.muscleGroups && exercise.muscleGroups.length
          ? ' #' + exercise.muscleGroups.join(' #')
          : '';
      markdown += `## ${exercise.name}${tagSuffix}\n`;
      exercise.sets.forEach((set, i) => {
        markdown += `- Set ${i + 1}: `;
        if (set.weight != null && set.reps != null) {
          markdown += `${set.weight} lbs × ${set.reps} reps`;
        } else if (set.weight != null) {
          markdown += `${set.weight} lbs`;
        } else if (set.distance != null) {
          markdown += `${set.distance} miles`;
        } else if (set.duration != null) {
          markdown += `${set.duration} minutes`;
        } else if (set.note) {
          // no metric, note only — will be appended below
        }
        if (set.note) {
          markdown += ` (${set.note})`;
        }
        // if set has no metric and no note, still emit a placeholder set line
        if (
          set.weight == null &&
          set.reps == null &&
          set.distance == null &&
          set.duration == null &&
          !set.note
        ) {
          markdown += '';
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
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    let metadata: WorkoutMetadata = {} as WorkoutMetadata;
    let body: string;
    if (fmMatch) {
      try {
        metadata = (YAML.parse(fmMatch[1]) as WorkoutMetadata) || ({} as WorkoutMetadata);
      } catch {
        metadata = {} as WorkoutMetadata;
      }
      body = content.slice(fmMatch[0].length);
    } else {
      // No frontmatter — treat entire content as body with fallback metadata
      if (!content.trim()) {
        return {
          id,
          date: new Date().toISOString().split('T')[0],
          type: 'other',
          exercises: [],
        };
      }
      body = content;
    }

    const exercises: Workout['exercises'] = [];
    let cur: Workout['exercises'][number] | null = null;
    const notesLines: string[] = [];
    let inNotes = false;

    const validGroups: Record<string, true> = {
      chest: true,
      back: true,
      shoulders: true,
      biceps: true,
      triceps: true,
      forearms: true,
      quads: true,
      hamstrings: true,
      glutes: true,
      calves: true,
      core: true,
      cardio: true,
      other: true,
    };

    const splitTrailingHashtags = (title: string): { name: string; tags: MuscleGroup[] } => {
      // Match trailing hashtags at end of title: "Bench Press #chest #triceps"
      const tagMatch = title.match(/^(.*?)\s*((?:#\w+(?:\s+)?)+)\s*$/);
      if (!tagMatch) return { name: title.trim(), tags: [] };
      const namePart = tagMatch[1].trim();
      const tagPart = tagMatch[2];
      const rawTags = [...tagPart.matchAll(/#(\w+)/g)].map((m) => m[1].toLowerCase());
      const filtered = rawTags.filter((t) => validGroups[t]) as MuscleGroup[];
      // If no valid tags, treat hashtags as part of name
      if (filtered.length === 0) return { name: title.trim(), tags: [] };
      return { name: namePart, tags: filtered };
    };


    const parseSetBody = (raw: string): Workout['exercises'][number]['sets'][number] => {
      let s = raw.trim();
      let note: string | undefined;
      const noteMatch = s.match(/\(([^)]*)\)\s*$/);
      if (noteMatch) {
        note = noteMatch[1].trim() || undefined;
        s = s.slice(0, noteMatch.index).trim();
      }

      // weight × reps
      const wrMatch = s.match(/([\d.]+)\s*lbs?\s*[×x]\s*(\d+)\s*reps?/i);
      if (wrMatch) {
        return {
          weight: parseFloat(wrMatch[1]),
          reps: parseInt(wrMatch[2], 10),
          ...(note ? { note } : {}),
        };
      }
      // weight only
      const wOnly = s.match(/([\d.]+)\s*lbs?/i);
      if (wOnly && !s.match(/miles|minutes|min/i)) {
        return { weight: parseFloat(wOnly[1]), ...(note ? { note } : {}) };
      }
      const durMatch = s.match(/([\d.]+)\s*min(?:utes)?\b/i);
      if (durMatch) {
        return { duration: parseFloat(durMatch[1]), ...(note ? { note } : {}) };
      }
      const distMatch = s.match(/([\d.]+)\s*miles?\b/i);
      if (distMatch) {
        return { distance: parseFloat(distMatch[1]), ...(note ? { note } : {}) };
      }
      // unparseable: keep raw as note if present, otherwise preserve note
      if (s) {
        return { ...(note ? { note } : { note: s }) };
      }
      return { ...(note ? { note } : {}) };
    };

    const lines = body.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (line.startsWith('## ')) {
        const title = line.slice(3).trim();
        if (title.toLowerCase() === 'notes') {
          inNotes = true;
          cur = null;
          continue;
        }
        inNotes = false;
        const { name, tags } = splitTrailingHashtags(title);
        cur = {
          name,
          sets: [],
          ...(tags.length ? { muscleGroups: tags } : {}),
        };
        exercises.push(cur);
        continue;
      }
      if (line.startsWith('# ')) {
        continue;
      }
      if (inNotes) {
        notesLines.push(rawLine);
        continue;
      }
      if (cur) {
        const setMatch = line.match(/^-\s*(?:set\s*\d+\s*:)?\s*(.+)$/i);
        if (setMatch) {
          const bodyContent = setMatch[1].trim();
          if (bodyContent) {
            cur.sets.push(parseSetBody(bodyContent));
          } else {
            cur.sets.push({});
          }
        }
      }
    }

    const notes = notesLines.join('\n').trim() || undefined;

    return {
      id,
      date: metadata.date || new Date().toISOString().split('T')[0],
      type: (metadata.workout_type as Workout['type']) || 'other',
      duration_minutes: metadata.duration_minutes,
      ...(metadata.location ? { location: metadata.location } : {}),
      exercises,
      ...(notes ? { notes } : {}),
    };
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
