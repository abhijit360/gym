import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MuscleGroup } from '../lib/types';
import { color, space, radius, font } from '../lib/theme';

interface MuscleChipProps {
  group: MuscleGroup;
  count: number;
}

export default function MuscleChip({ group, count }: MuscleChipProps) {
  const label = group.charAt(0).toUpperCase() + group.slice(1);
  const intensity = Math.min(count / 3, 1);
  const bgColor = count >= 3 ? color.primaryLight : color.surface;

  return (
    <View style={[styles.chip, { backgroundColor: bgColor, opacity: 0.6 + intensity * 0.4 }]}>
      <Text style={styles.label}>{label} ×{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.sm },
  label: { ...font.caption, color: color.textPrimary },
});
