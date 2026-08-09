import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Workout } from '../lib/types';
import { color, space, radius, font } from '../lib/theme';

interface WorkoutCardProps {
  workout: Workout;
  onPress?: () => void;
}

export default function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  const typeEmoji = { strength: '💪', cardio: '🏃', flexibility: '🧘', other: '📝' }[workout.type];
  const exerciseNames = workout.exercises.map(e => e.name).slice(0, 3).join(', ');
  const moreCount = workout.exercises.length - 3;
  const summary = exerciseNames + (moreCount > 0 ? `, +${moreCount} more` : '');

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.date}>{workout.date} • {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}</Text>
        <Text style={styles.emoji}>{typeEmoji}</Text>
      </View>
      <Text style={styles.summary} numberOfLines={1}>{summary || 'No exercises'}</Text>
      <Text style={styles.meta}>
        {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
        {workout.duration_minutes ? ` • ${workout.duration_minutes}min` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, padding: space.md, borderRadius: radius.sm, marginBottom: space.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xs },
  date: { ...font.caption, color: color.textSecondary },
  emoji: { fontSize: 20 },
  summary: { ...font.body, color: color.textPrimary, marginBottom: space.xs },
  meta: { ...font.caption, color: color.textTertiary },
});
