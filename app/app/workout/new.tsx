import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorkoutStorage } from '../../lib/storage';
import { Workout, Exercise } from '../../lib/types';
import { compareWorkout } from '../../lib/comparison';
import { toISODate } from '../../lib/dateUtils';
import { normalizeName } from '../../lib/exerciseLibrary';
import { color, space, font, radius } from '../../lib/theme';
import SetTracker from '../../components/SetTracker';

export default function NewWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id as string | undefined;
  const prefillDate = params.date as string | undefined;

  const [type, setType] = useState<Workout['type']>('strength');
  const [date, setDate] = useState(prefillDate || toISODate(new Date()));
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const all = await WorkoutStorage.loadAll();
    setAllWorkouts(all);

    if (editId) {
      const existing = await WorkoutStorage.load(editId);
      if (existing) {
        setType(existing.type);
        setDate(existing.date);
        setExercises(existing.exercises);
        setNotes(existing.notes || '');
        setDuration(existing.duration_minutes?.toString() || '');
      }
    }
  }

  function addExercise() {
    setExercises([...exercises, { name: '', sets: [{}] }]);
  }

  function updateExercise(index: number, updated: Exercise) {
    const newExercises = [...exercises];
    newExercises[index] = updated;
    setExercises(newExercises);
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  async function save() {
    if (!exercises.length) {
      Alert.alert('Error', 'Add at least one exercise');
      return;
    }

    const workout: Workout = {
      id: editId || Date.now().toString(),
      date,
      type,
      duration_minutes: duration ? parseFloat(duration) : undefined,
      exercises,
      notes: notes.trim() || undefined,
    };

    await WorkoutStorage.save(workout);
    router.back();
  }

  const draft: Workout = { id: 'draft', date, type, exercises, notes, duration_minutes: duration ? parseFloat(duration) : undefined };
  const comparison = compareWorkout(allWorkouts, draft);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{editId ? 'Edit Workout' : 'Log Workout'}</Text>

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {(['strength', 'cardio', 'flexibility', 'other'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.typeButton, type === t && styles.typeButtonActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Exercises</Text>
        {exercises.map((ex, i) => (
          <View key={i} style={styles.exerciseBlock}>
            <View style={styles.exerciseHeader}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={ex.name}
                onChangeText={(name) => updateExercise(i, { ...ex, name })}
                placeholder="Exercise name"
              />
              <Pressable onPress={() => removeExercise(i)} style={styles.removeButton}>
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            </View>
            <SetTracker
              sets={ex.sets}
              onSetsChange={(sets) => updateExercise(i, { ...ex, sets })}
              comparison={comparison[normalizeName(ex.name)]}
              isCardio={type === 'cardio'}
            />
          </View>
        ))}

        <Pressable style={styles.addExerciseButton} onPress={addExercise}>
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
        </Pressable>

        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="Optional"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="How did you feel?"
          multiline
        />

        <Pressable style={styles.saveButton} onPress={save}>
          <Text style={styles.saveButtonText}>Save Workout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.md },
  title: { ...font.display, marginBottom: space.lg },
  label: { ...font.heading, marginTop: space.md, marginBottom: space.sm },
  input: {
    ...font.body,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.sm,
    padding: space.sm,
    backgroundColor: color.bg,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: space.sm },
  typeButton: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: color.primary },
  typeButtonText: { ...font.body, color: color.textPrimary },
  typeButtonTextActive: { color: '#FFFFFF' },
  exerciseBlock: { marginBottom: space.md, backgroundColor: color.surface, padding: space.md, borderRadius: radius.sm },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  removeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  removeText: { ...font.heading, color: color.error },
  addExerciseButton: {
    backgroundColor: color.surface,
    paddingVertical: space.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: color.border,
    borderStyle: 'dashed',
    marginTop: space.md,
  },
  addExerciseText: { ...font.body, color: color.primary },
  saveButton: {
    backgroundColor: color.primary,
    paddingVertical: space.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: space.xl,
  },
  saveButtonText: { ...font.heading, color: '#FFFFFF' },
});
