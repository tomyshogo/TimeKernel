import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { CALENDAR_COLORS } from '../../utils/constants';

interface Props {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selectedColor, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {CALENDAR_COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.dot,
            { backgroundColor: color },
            selectedColor === color && styles.selected,
          ]}
          onPress={() => onSelect(color)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selected: {
    borderWidth: 3,
    borderColor: '#2c3e50',
  },
});
