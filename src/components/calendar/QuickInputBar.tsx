import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { parseNaturalLanguage, ParsedEvent } from '../../utils/naturalLanguageParser';

interface QuickInputBarProps {
  onParsed: (parsed: ParsedEvent) => void;
}

export function QuickInputBar({ onParsed }: QuickInputBarProps) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedEvent | null>(null);

  const handleChangeText = useCallback((value: string) => {
    setText(value);
    if (value.trim().length >= 2) {
      const result = parseNaturalLanguage(value);
      setPreview(result);
    } else {
      setPreview(null);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!preview) return;
    onParsed(preview);
    setText('');
    setPreview(null);
    Keyboard.dismiss();
  }, [preview, onParsed]);

  const formatPreview = (p: ParsedEvent) => {
    const parts = [p.date];
    if (p.startTime) {
      parts.push(p.startTime + (p.endTime ? `〜${p.endTime}` : ''));
    }
    parts.push(`「${p.title}」`);
    return parts.join(' ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleChangeText}
          placeholder="例: 来週火曜14時に歯医者"
          placeholderTextColor="#bdc3c7"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity
          style={[styles.addButton, !preview && styles.addButtonDisabled]}
          onPress={handleSubmit}
          disabled={!preview}
        >
          <Text style={styles.addButtonText}>追加</Text>
        </TouchableOpacity>
      </View>

      {preview && (
        <View style={styles.previewRow}>
          <Text style={styles.previewText}>{formatPreview(preview)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#3498db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  previewRow: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  previewText: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '600',
  },
});
