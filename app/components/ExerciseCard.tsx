import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Exercise, Set } from '../lib/types';
import { ExerciseComparison } from '../lib/comparison';
import { resolveMuscleGroups } from '../lib/exerciseLibrary';
import { color, space, font, radius } from '../lib/theme';
import ProgressBadge from './ProgressBadge';

interface ExerciseCardProps {
  exercise: Exercise;
  comparison?: ExerciseComparison;
}

export default function ExerciseCard({ exercise, comparison }: ExerciseCardProps) {
  const groups = resolveMuscleGroups(exercise).map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ');

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{exercise.name}</Text>
      <Text style={styles.muscles}>{groups}</Text>

      {comparison?.baselineDate && (
        <Text style={styles.baseline}>
          vs {comparison.baselineDate} ({comparison.daysAgo}d ago)
        </Text>
      )}

      {exercise.sets.map((set, i) => (
        <View key={i} style={styles.setRow}>
          <Text style={styles.setLabel}>Set {i + 1}:</Text>
          <Text style={styles.setValue}>
            {formatSet(set)}
          </Text>
          {comparison?.perSet[i] && <ProgressBadge comparison={comparison.perSet[i]} />}
        </View>
      ))}
    </View>
  );
}

function formatSet(set: Set): string {
  if (set.weight != null && set.reps != null) {
    return `${set.weight} lbs × ${set.reps} reps`;
  }
  if (set.distance != null) return `${set.distance} miles`;
  if (set.duration != null) return `${set.duration} minutes`;
  return 'No data';
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, padding: space.md, borderRadius: radius.sm, marginBottom: space.md },
  name: { ...font.heading, marginBottom: space.xs },
  muscles: { ...font.caption, color: color.textSecondary, marginBottom: space.sm },
  baseline: { ...font.small, color: color.textTertiary, marginBottom: space.sm },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
  setLabel: { ...font.body, color: color.textSecondary, width: 60 },
  setValue: { ...font.body, flex: 1 },
});
