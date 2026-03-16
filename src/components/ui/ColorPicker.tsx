import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { CALENDAR_COLORS } from '../../utils/constants';

interface Props {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selectedColor, onSelect }: Props) {
  const [customColor, setCustomColor] = useState('');
  const isCustom = !CALENDAR_COLORS.includes(selectedColor);

  const handleCustomSubmit = () => {
    const hex = customColor.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onSelect(hex);
    }
  };

  return (
    <View>
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
      <View style={styles.customRow}>
        <View
          style={[
            styles.customPreview,
            {
              backgroundColor:
                isCustom ? selectedColor : customColor || '#ccc',
            },
          ]}
        />
        <TextInput
          style={styles.customInput}
          value={isCustom ? selectedColor : customColor}
          onChangeText={setCustomColor}
          onSubmitEditing={handleCustomSubmit}
          placeholder="#FF5733"
          placeholderTextColor="#bdc3c7"
          maxLength={7}
          autoCapitalize="characters"
        />
      </View>
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
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  customPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  customInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: 'monospace',
  },
});
