import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { WorkoutStorage } from '../lib/storage';
import type { Workout, Exercise, Set } from '../lib/types';

export default function HomeScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('3');
  const [notes, setNotes] = useState('');
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    try {
      const loaded = await WorkoutStorage.loadAll();
      setWorkouts(loaded);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  }

  function addExercise() {
    if (!exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    const numSets = parseInt(sets) || 1;
    const exerciseSets: Set[] = [];
    
    for (let i = 0; i < numSets; i++) {
      exerciseSets.push({
        weight: weight ? parseFloat(weight) : undefined,
        reps: reps ? parseInt(reps) : undefined,
      });
    }

    const exercise: Exercise = {
      name: exerciseName,
      sets: exerciseSets,
    };

    setCurrentExercises([...currentExercises, exercise]);
    
    // Clear form
    setExerciseName('');
    setWeight('');
    setReps('');
    setSets('3');
  }

  function removeExercise(index: number) {
    setCurrentExercises(currentExercises.filter((_, i) => i !== index));
  }

  async function saveWorkout() {
    if (currentExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    const workout: Workout = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: 'strength',
      exercises: currentExercises,
      notes: notes.trim() || undefined,
    };

    try {
      await WorkoutStorage.save(workout);
      setCurrentExercises([]);
      setNotes('');
      setShowForm(false);
      loadWorkouts();
      Alert.alert('Success', 'Workout saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
      console.error(error);
    }
  }

  function formatWorkoutSummary(workout: Workout): string {
    if (workout.exercises.length === 0) {
      return 'No exercises';
    }
    const exerciseNames = workout.exercises.map(e => e.name).slice(0, 3);
    const summary = exerciseNames.join(', ');
    if (workout.exercises.length > 3) {
      return `${summary} +${workout.exercises.length - 3} more`;
    }
    return summary;
  }

  if (showForm) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Log Workout</Text>

        {/* Current exercises */}
        {currentExercises.length > 0 && (
          <View style={styles.exercisesList}>
            <Text style={styles.sectionTitle}>Exercises ({currentExercises.length})</Text>
            {currentExercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <TouchableOpacity onPress={() => removeExercise(index)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.exerciseDetails}>
                  {exercise.sets.length} sets
                  {exercise.sets[0]?.weight && ` × ${exercise.sets[0].weight} lbs`}
                  {exercise.sets[0]?.reps && ` × ${exercise.sets[0].reps} reps`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Add exercise form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Add Exercise</Text>
          
          <Text style={styles.label}>Exercise Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Bench Press"
            value={exerciseName}
            onChangeText={setExerciseName}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                placeholder="135"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.label}>Reps</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Number of Sets</Text>
          <TextInput
            style={styles.input}
            placeholder="3"
            value={sets}
            onChangeText={setSets}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.addButton} onPress={addExercise}>
            <Text style={styles.buttonText}>+ Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.form}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="How did you feel? Any PRs?"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={() => {
              setShowForm(false);
              setCurrentExercises([]);
              setNotes('');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={saveWorkout}
          >
            <Text style={styles.buttonText}>Save Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏋️ GymTune</Text>
      
      <TouchableOpacity 
        style={styles.logButton} 
        onPress={() => setShowForm(true)}
      >
        <Text style={styles.logButtonText}>+ Log Workout</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Workouts</Text>
      
      {workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySubtext}>Tap "Log Workout" to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.workoutCard}
              onPress={() => Alert.alert('Workout Details', formatWorkoutSummary(item))}
            >
              <Text style={styles.workoutDate}>{item.date}</Text>
              <Text style={styles.workoutType}>{item.type}</Text>
              <Text style={styles.workoutSummary}>
                {formatWorkoutSummary(item)}
              </Text>
              {item.notes && (
                <Text style={styles.workoutNotes} numberOfLines={1}>
                  {item.notes}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.progressButton}
        onPress={() => router.push('/progress')}
      >
        <Text style={styles.progressButtonText}>📊 View Progress</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 40,
  },
  logButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  workoutCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  workoutSummary: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  workoutNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  progressButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  progressButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  exercisesList: {
    marginBottom: 24,
  },
  exerciseCard: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    fontSize: 20,
    color: '#666',
    padding: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
