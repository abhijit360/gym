import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { WorkoutStorage } from '../lib/storage';
import type { Workout } from '../lib/types';

export default function ProgressScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    const loaded = await WorkoutStorage.loadAll();
    setWorkouts(loaded);
  }

  // Calculate workout frequency over last 30 days
  const getWorkoutFrequency = () => {
    const last30Days = workouts.filter(w => {
      const date = new Date(w.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    });

    // Group by week
    const weeks = [0, 0, 0, 0];
    last30Days.forEach(w => {
      const date = new Date(w.date);
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.min(Math.floor(daysAgo / 7), 3);
      weeks[3 - weekIndex]++;
    });

    return weeks;
  };

  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      data: getWorkoutFrequency(),
    }],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Progress & Stats</Text>

      {/* Summary stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{workouts.length}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {workouts.filter(w => {
              const date = new Date(w.date);
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              return date >= sevenDaysAgo;
            }).length}
          </Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>

      {/* Workout frequency chart */}
      <Text style={styles.chartTitle}>Workout Frequency</Text>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 32}
        height={220}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#007AFF',
          },
        }}
        bezier
        style={styles.chart}
      />

      {/* Workout type breakdown */}
      <Text style={styles.chartTitle}>Workout Types</Text>
      <View style={styles.typeBreakdown}>
        {Object.entries(
          workouts.reduce((acc, w) => {
            acc[w.type] = (acc[w.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([type, count]) => (
          <View key={type} style={styles.typeRow}>
            <Text style={styles.typeName}>{type}</Text>
            <Text style={styles.typeCount}>{count}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  typeBreakdown: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  typeName: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
  typeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
