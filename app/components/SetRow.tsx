import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Set } from '../lib/types';
import { SetComparison } from '../lib/comparison';
import { color, space, font, radius, touchTarget } from '../lib/theme';
import ProgressBadge from './ProgressBadge';

interface SetRowProps {
  setNumber: number;
  set: Set;
  comparison?: SetComparison;
  isCardio?: boolean;
  onChange: (set: Set) => void;
  onRemove: () => void;
}

export default function SetRow({ setNumber, set, comparison, isCardio = false, onChange, onRemove }: SetRowProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.setNum}>{setNumber}</Text>

      {!isCardio ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="lbs"
            keyboardType="numeric"
            value={set.weight?.toString() || ''}
            onChangeText={(text) => onChange({ ...set, weight: text ? parseFloat(text) : undefined })}
          />
          <Text style={styles.separator}>×</Text>
          <TextInput
            style={styles.input}
            placeholder="reps"
            keyboardType="numeric"
            value={set.reps?.toString() || ''}
            onChangeText={(text) => onChange({ ...set, reps: text ? parseInt(text, 10) : undefined })}
          />
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="miles"
            keyboardType="numeric"
            value={set.distance?.toString() || ''}
            onChangeText={(text) => onChange({ ...set, distance: text ? parseFloat(text) : undefined })}
          />
          <TextInput
            style={styles.input}
            placeholder="min"
            keyboardType="numeric"
            value={set.duration?.toString() || ''}
            onChangeText={(text) => onChange({ ...set, duration: text ? parseFloat(text) : undefined })}
          />
        </>
      )}

      {comparison && <ProgressBadge comparison={comparison} />}

      <Pressable onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: color.surface,
    padding: space.sm,
    borderRadius: radius.sm,
    minHeight: touchTarget,
  },
  setNum: { ...font.body, color: color.textSecondary, width: 24 },
  input: {
    ...font.body,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    backgroundColor: color.bg,
    minWidth: 60,
  },
  separator: { ...font.body, color: color.textSecondary },
  removeButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  removeText: { ...font.heading, color: color.error },
});
