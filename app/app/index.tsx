import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { WorkoutStorage } from '../lib/storage';
import type { Workout } from '../lib/types';

export default function HomeScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    const loaded = await WorkoutStorage.loadAll();
    setWorkouts(loaded);
  }

  async function handleQuickLog() {
    if (!input.trim()) return;
    
    // TODO: Send to LLM for parsing
    // For now, create a simple workout
    const workout: Workout = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: 'strength',
      exercises: [],
      notes: input,
    };
    
    await WorkoutStorage.save(workout);
    setInput('');
    loadWorkouts();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏋️ GymTune</Text>
      
      {/* Quick log input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Log workout: 'Bench 185x5x3' or ask anything..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={handleQuickLog}>
          <Text style={styles.buttonText}>Log</Text>
        </TouchableOpacity>
      </View>

      {/* Recent workouts */}
      <Text style={styles.sectionTitle}>Recent Workouts</Text>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.workoutCard}
            onPress={() => router.push(`/workout/${item.id}`)}
          >
            <Text style={styles.workoutDate}>{item.date}</Text>
            <Text style={styles.workoutType}>{item.type}</Text>
            {item.notes && (
              <Text style={styles.workoutNotes} numberOfLines={2}>
                {item.notes}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Quick actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/progress')}
        >
          <Text style={styles.actionText}>📊 Progress</Text>
        </TouchableOpacity>
      </View>
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
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minHeight: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    minWidth: 60,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
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
  },
  workoutNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  actions: {
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
