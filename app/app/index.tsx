import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorkoutStorage } from '../lib/storage';
import { Workout } from '../lib/types';
import { color, space, font, radius } from '../lib/theme';
import WeekGrid from '../components/WeekGrid';
import MuscleGroupSummary from '../components/MuscleGroupSummary';
import ChatCTA from '../components/ChatCTA';
import WorkoutCard from '../components/WorkoutCard';

export default function HomeScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    const loaded = await WorkoutStorage.loadAll();
    setWorkouts(loaded.sort((a, b) => b.date.localeCompare(a.date)));
  }

  function handleSelectDay(dateISO: string, dayWorkouts: Workout[]) {
    if (dayWorkouts.length === 1) {
      router.push(`/workout/${dayWorkouts[0].id}`);
    } else if (dayWorkouts.length > 1) {
      router.push(`/workout/${dayWorkouts[0].id}`);
    } else {
      router.push(`/workout/new?date=${dateISO}`);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🏋️ GymTune</Text>

        <Text style={styles.sectionTitle}>This Week</Text>
        <WeekGrid workouts={workouts} onSelectDay={handleSelectDay} />

        <Text style={styles.sectionTitle}>Muscle Groups This Week</Text>
        <MuscleGroupSummary workouts={workouts} />

        <View style={{ marginTop: space.md }}>
          <ChatCTA />
        </View>

        <Pressable
          style={styles.logButton}
          onPress={() => router.push('/workout/new')}
        >
          <Text style={styles.logButtonText}>+ Log Workout</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        <FlatList
          data={workouts.slice(0, 20)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onPress={() => router.push(`/workout/${item.id}`)}
            />
          )}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.empty}>No workouts logged yet.</Text>}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.md },
  title: { ...font.display, marginBottom: space.lg },
  sectionTitle: { ...font.heading, marginTop: space.lg, marginBottom: space.md },
  logButton: {
    backgroundColor: color.primary,
    paddingVertical: space.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: space.md,
    marginBottom: space.md,
  },
  logButtonText: { ...font.heading, color: '#FFFFFF' },
  empty: { ...font.body, color: color.textSecondary, textAlign: 'center', marginTop: space.lg },
});
