import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SetComparison } from '../lib/comparison';
import { color, space, font, radius } from '../lib/theme';

interface ProgressBadgeProps {
  comparison: SetComparison;
}

export default function ProgressBadge({ comparison }: ProgressBadgeProps) {
  if (comparison.isNew) {
    return (
      <View style={[styles.badge, { backgroundColor: color.primaryLight }]}>
        <Text style={styles.text}>NEW</Text>
      </View>
    );
  }

  const hasWeight = comparison.weightDelta != null;
  const hasReps = comparison.repsDelta != null;
  const wd = comparison.weightDelta || 0;
  const rd = comparison.repsDelta || 0;

  if (!hasWeight && !hasReps) return null;

  const isPositive = wd > 0 || rd > 0;
  const isNegative = wd < 0 || rd < 0;
  const bgColor = isPositive ? color.success : isNegative ? color.warning : color.border;
  const arrow = isPositive ? '▲' : isNegative ? '▼' : '';

  let label = '';
  if (hasWeight && wd !== 0) label += `${wd > 0 ? '+' : ''}${wd} lb`;
  if (hasReps && rd !== 0) {
    if (label) label += ' ';
    label += `${rd > 0 ? '+' : ''}${rd} rep${Math.abs(rd) !== 1 ? 's' : ''}`;
  }

  if (!label) return null;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{arrow} {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  text: { ...font.small, color: '#FFFFFF', fontWeight: '600' },
});
