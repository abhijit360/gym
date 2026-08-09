import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Set } from '../lib/types';
import { ExerciseComparison } from '../lib/comparison';
import { color, space, font, radius } from '../lib/theme';
import SetRow from './SetRow';

interface SetTrackerProps {
  sets: Set[];
  onSetsChange: (sets: Set[]) => void;
  comparison?: ExerciseComparison;
  isCardio?: boolean;
}

export default function SetTracker({ sets, onSetsChange, comparison, isCardio = false }: SetTrackerProps) {
  function addSet() {
    const lastSet = sets[sets.length - 1];
    const newSet: Set = lastSet ? { ...lastSet } : {};
    onSetsChange([...sets, newSet]);
  }

  function updateSet(index: number, updated: Set) {
    const newSets = [...sets];
    newSets[index] = updated;
    onSetsChange(newSets);
  }

  function removeSet(index: number) {
    onSetsChange(sets.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.container}>
      {sets.map((set, i) => (
        <SetRow
          key={i}
          setNumber={i + 1}
          set={set}
          comparison={comparison?.perSet[i]}
          isCardio={isCardio}
          onChange={(updated) => updateSet(i, updated)}
          onRemove={() => removeSet(i)}
        />
      ))}
      <Pressable style={styles.addButton} onPress={addSet}>
        <Text style={styles.addButtonText}>+ Add Set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.sm },
  addButton: {
    backgroundColor: color.surface,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: color.border,
    borderStyle: 'dashed',
  },
  addButtonText: { ...font.body, color: color.primary },
});
