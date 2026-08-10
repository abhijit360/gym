import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'GymTune' }} />
      <Stack.Screen name="workout/[id]" options={{ title: 'Workout Details' }} />
      <Stack.Screen name="workout/new" options={{ title: 'Log Workout' }} />
      <Stack.Screen name="coach" options={{ title: 'AI Coach' }} />
      <Stack.Screen name="progress" options={{ title: 'Progress' }} />
    </Stack>
  );
}
