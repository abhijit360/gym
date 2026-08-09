import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { color, space, radius, font, touchTarget } from '../lib/theme';

export default function ChatCTA() {
  const router = useRouter();

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push('/coach')}
    >
      <Text style={styles.emoji}>💬</Text>
      <Text style={styles.text}>Ask your AI Coach</Text>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.primaryLight,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.sm,
    minHeight: touchTarget,
  },
  emoji: { fontSize: 24, marginRight: space.sm },
  text: { ...font.heading, color: color.textPrimary, flex: 1 },
  arrow: { ...font.heading, color: color.textPrimary },
});
