import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { parseNaturalLanguage, ParsedEvent } from '../../utils/naturalLanguageParser';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface QuickInputBarProps {
  onParsed: (parsed: ParsedEvent) => void;
}

export function QuickInputBar({ onParsed }: QuickInputBarProps) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedEvent | null>(null);
  const btnScale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        <View style={styles.inputWrapper}>
          <Ionicons name="flash-outline" size={18} color="#bdc3c7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleChangeText}
            placeholder="来週火曜14時に歯医者"
            placeholderTextColor="#bdc3c7"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>
        <AnimatedPressable
          style={[
            styles.addButton,
            !preview && styles.addButtonDisabled,
            btnStyle,
          ]}
          onPress={handleSubmit}
          onPressIn={() => { btnScale.value = withSpring(0.9, { damping: 12, stiffness: 200 }); }}
          onPressOut={() => { btnScale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
          disabled={!preview}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </AnimatedPressable>
      </View>

      {preview && (
        <Animated.View
          entering={FadeInDown.duration(200).springify()}
          exiting={FadeOut.duration(150)}
          style={styles.previewRow}
        >
          <Ionicons name="checkmark-circle" size={14} color="#3498db" />
          <Text style={styles.previewText}>{formatPreview(preview)}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8ecf0',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 11,
    fontSize: 15,
    color: '#1a1a2e',
  },
  addButton: {
    backgroundColor: '#3498db',
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDisabled: {
    backgroundColor: '#d5d8dc',
    shadowOpacity: 0,
    elevation: 0,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  previewText: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '600',
  },
});
