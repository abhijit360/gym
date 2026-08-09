import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { weekDays, toISODate } from '../lib/dateUtils';
import { resolveMuscleGroups } from '../lib/exerciseLibrary';
import { Workout, MuscleGroup } from '../lib/types';
import { color, space, font } from '../lib/theme';
import MuscleChip from './MuscleChip';

interface MuscleGroupSummaryProps {
  workouts: Workout[];
  weekStartsOn?: 0 | 1;
}

export default function MuscleGroupSummary({ workouts, weekStartsOn = 1 }: MuscleGroupSummaryProps) {
  const thisWeekDates = weekDays(new Date(), weekStartsOn).map(d => toISODate(d));
  const thisWeekWorkouts = workouts.filter(w => thisWeekDates.includes(w.date));

  const counts = new Map<MuscleGroup, number>();
  for (const w of thisWeekWorkouts) {
    const groupsHit = new Set<MuscleGroup>();
    for (const ex of w.exercises) {
      for (const g of resolveMuscleGroups(ex)) {
        groupsHit.add(g);
      }
    }
    for (const g of groupsHit) {
      counts.set(g, (counts.get(g) || 0) + 1);
    }
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  if (!sorted.length) {
    return <Text style={styles.empty}>No muscle groups logged yet this week.</Text>;
  }

  return (
    <View style={styles.container}>
      {sorted.map(([group, count]) => (
        <MuscleChip key={group} group={group} count={count} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  empty: { ...font.body, color: color.textSecondary },
});
