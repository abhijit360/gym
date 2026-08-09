import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, space, font } from '../lib/theme';

export default function CoachScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>💬 AI Coach</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
        <Text style={styles.description}>
          Your AI coach will help you analyze your workouts, suggest improvements, and answer training questions.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.xl, alignItems: 'center', justifyContent: 'center', flex: 1 },
  title: { ...font.display, marginBottom: space.md },
  subtitle: { ...font.heading, color: color.textSecondary, marginBottom: space.lg },
  description: { ...font.body, color: color.textSecondary, textAlign: 'center', maxWidth: 300 },
});
