import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EventType } from '../../types';
import { EVENT_TYPE_LABELS, EVENT_COLORS } from '../../utils/constants';

interface Props {
  selected: EventType;
  onSelect: (type: EventType) => void;
}

const types: EventType[] = ['event', 'class', 'shift'];

export function TypeSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {types.map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.option,
            selected === type && {
              backgroundColor: EVENT_COLORS[type],
            },
          ]}
          onPress={() => onSelect(type)}
        >
          <Text
            style={[
              styles.text,
              selected === type && styles.selectedText,
            ]}
          >
            {EVENT_TYPE_LABELS[type]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  selectedText: {
    color: '#fff',
  },
});
