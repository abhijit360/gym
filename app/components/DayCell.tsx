import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, space, font, touchTarget } from '../lib/theme';

interface DayCellProps {
  date: Date;
  dayLabel: string;
  worked: boolean;
  isToday: boolean;
  isFuture: boolean;
  count: number;
  onPress?: () => void;
}

export default function DayCell({ date, dayLabel, worked, isToday, isFuture, count, onPress }: DayCellProps) {
  const dateNum = date.getDate();
  const disabled = isFuture;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={styles.container}
      accessibilityLabel={`${dayLabel} ${dateNum}, ${worked ? count + ' workout' + (count > 1 ? 's' : '') : 'rest day'}`}
    >
      <Text style={[styles.label, isFuture && styles.dimmed]}>{dayLabel}</Text>
      <View style={[styles.dateContainer, isToday && styles.todayRing]}>
        <Text style={[styles.dateNum, isFuture && styles.dimmed]}>{dateNum}</Text>
      </View>
      <View style={[styles.dot, worked ? styles.workedDot : styles.restDot, isFuture && styles.futureDot]} />
      {count > 1 && <Text style={styles.countBadge}>×{count}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', minWidth: touchTarget, minHeight: touchTarget, paddingVertical: space.xs },
  label: { ...font.caption, color: color.textTertiary, marginBottom: 2 },
  dateContainer: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  todayRing: { borderWidth: 1.5, borderColor: color.primary },
  dateNum: { ...font.body },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  workedDot: { backgroundColor: color.success },
  restDot: { backgroundColor: color.border },
  futureDot: { backgroundColor: 'transparent' },
  dimmed: { opacity: 0.4 },
  countBadge: { ...font.small, color: color.textSecondary, marginTop: 2 },
});
