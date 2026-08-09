import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorkoutStorage } from '../../lib/storage';
import { Workout } from '../../lib/types';
import { compareWorkout } from '../../lib/comparison';
import { normalizeName } from '../../lib/exerciseLibrary';
import { color, space, font, radius } from '../../lib/theme';
import ExerciseCard from '../../components/ExerciseCard';

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const all = await WorkoutStorage.loadAll();
    setAllWorkouts(all);

    const w = await WorkoutStorage.load(id);
    setWorkout(w);
  }

  async function deleteWorkout() {
    Alert.alert(
      'Delete Workout',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await WorkoutStorage.delete(id);
            router.back();
          },
        },
      ]
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const comparison = compareWorkout(allWorkouts, workout);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{workout.date}</Text>
            <Text style={styles.type}>
              {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}
              {workout.duration_minutes && ` • ${workout.duration_minutes} min`}
            </Text>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={() => router.push(`/workout/new?id=${id}`)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        {workout.exercises.map((ex, i) => {
          const key = normalizeName(ex.name);
          return <ExerciseCard key={i} exercise={ex} comparison={comparison[key]} />;
        })}

        {workout.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}

        <Pressable style={styles.deleteButton} onPress={deleteWorkout}>
          <Text style={styles.deleteButtonText}>Delete Workout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.md },
  loading: { ...font.body, color: color.textSecondary, textAlign: 'center', marginTop: space.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.lg },
  date: { ...font.display },
  type: { ...font.body, color: color.textSecondary, marginTop: space.xs },
  editButton: {
    backgroundColor: color.primary,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  editButtonText: { ...font.body, color: '#FFFFFF' },
  notesCard: { backgroundColor: color.surface, padding: space.md, borderRadius: radius.sm, marginTop: space.md },
  notesTitle: { ...font.heading, marginBottom: space.sm },
  notesText: { ...font.body, color: color.textSecondary },
  deleteButton: {
    backgroundColor: color.error,
    paddingVertical: space.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: space.xl,
  },
  deleteButtonText: { ...font.heading, color: '#FFFFFF' },
});
