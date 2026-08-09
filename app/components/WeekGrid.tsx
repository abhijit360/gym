import React from 'react';
import { View, StyleSheet } from 'react-native';
import { weekDays, toISODate } from '../lib/dateUtils';
import { Workout } from '../lib/types';
import { space } from '../lib/theme';
import DayCell from './DayCell';

interface WeekGridProps {
  workouts: Workout[];
  weekStartsOn?: 0 | 1;
  onSelectDay?: (dateISO: string, dayWorkouts: Workout[]) => void;
}

export default function WeekGrid({ workouts, weekStartsOn = 1, onSelectDay }: WeekGridProps) {
  const days = weekDays(new Date(), weekStartsOn);
  const today = new Date();
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      {days.map((date, i) => {
        const dateISO = toISODate(date);
        const dayWorkouts = workouts.filter(w => w.date === dateISO);
        const worked = dayWorkouts.length > 0;
        const isToday = date.toDateString() === today.toDateString();
        const isFuture = date > today;
        const startDay = weekStartsOn;
        const labelIndex = (i + startDay) % 7;

        return (
          <DayCell
            key={dateISO}
            date={date}
            dayLabel={dayLabels[labelIndex]}
            worked={worked}
            isToday={isToday}
            isFuture={isFuture}
            count={dayWorkouts.length}
            onPress={() => onSelectDay?.(dateISO, dayWorkouts)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: space.sm, justifyContent: 'space-between' },
});
