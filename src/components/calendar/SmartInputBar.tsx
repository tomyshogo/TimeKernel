import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { parseNaturalLanguage, ParsedEvent, ParsedAction } from '../../services/naturalLanguageParser';

const PLACEHOLDER_EXAMPLES = [
  '例: 明日 14時 歯医者',
  '例: 来週の金曜 9時から11時 会議',
  '例: 今月の火曜 9時から18時 バイト',
  '例: 毎週水曜 10時半 授業',
  '例: 一週間後 15時半 面接',
  '例: 来月10日 午前10時 健康診断',
  '例: 今月の火曜 バイト 削除',
];

const DISPLAY_DURATION = 10000;
const SLIDE_DURATION = 1500;

interface Props {
  onSubmit: (parsed: ParsedEvent) => void;
  onDelete?: (parsed: ParsedEvent) => void;
}

export function SmartInputBar({ onSubmit, onDelete }: Props) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedEvent | null>(null);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const indexRef = useRef(0);

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const advancePlaceholder = useCallback(() => {
    // Phase 1: slide down + fade out
    translateY.value = withTiming(20, {
      duration: SLIDE_DURATION,
      easing: Easing.inOut(Easing.ease),
    });
    opacity.value = withTiming(0, {
      duration: SLIDE_DURATION,
      easing: Easing.inOut(Easing.ease),
    });

    // Phase 2: after exit, swap text, then slide in from above
    const nextIndex = (indexRef.current + 1) % PLACEHOLDER_EXAMPLES.length;
    indexRef.current = nextIndex;

    setTimeout(() => {
      setDisplayedIndex(nextIndex);
      translateY.value = -20;
      opacity.value = 0;

      translateY.value = withTiming(0, {
        duration: SLIDE_DURATION,
        easing: Easing.inOut(Easing.ease),
      });
      opacity.value = withTiming(1, {
        duration: SLIDE_DURATION,
        easing: Easing.inOut(Easing.ease),
      });
    }, SLIDE_DURATION + 100);
  }, []);

  useEffect(() => {
    if (text.length > 0 || isFocused) return;
    const interval = setInterval(advancePlaceholder, DISPLAY_DURATION);
    return () => clearInterval(interval);
  }, [text, isFocused, advancePlaceholder]);

  const handleChangeText = (value: string) => {
    setText(value);
    if (value.trim().length > 1) {
      setPreview(parseNaturalLanguage(value));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = () => {
    const parsed = parseNaturalLanguage(text);
    if (!parsed) {
      Alert.alert('入力エラー', '予定の内容を入力してください\n例：「来週の金曜 14時 歯医者」');
      return;
    }
    if (parsed.action === 'delete' && onDelete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onDelete(parsed);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSubmit(parsed);
    }
    setText('');
    setPreview(null);
    Keyboard.dismiss();
  };

  const TYPE_LABELS: Record<string, string> = { shift: 'バイト', class: '授業', event: '予定' };

  const formatPreview = (p: ParsedEvent): string => {
    const parts: string[] = [];
    if (p.action === 'delete') {
      parts.push('🗑 削除');
    }
    if (p.dates && p.dates.length > 1) {
      parts.push(`${p.dates.length}日分`);
    } else {
      parts.push(p.date);
    }
    if (p.startTime) {
      parts.push(p.startTime + (p.endTime ? `〜${p.endTime}` : ''));
    }
    if (p.type && p.type !== 'event') {
      parts.push(`[${TYPE_LABELS[p.type]}]`);
    }
    if (p.recurrence) {
      parts.push('(毎週)');
    }
    parts.push(`「${p.title}」`);
    return parts.join('  ');
  };

  const showPlaceholder = text.length === 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Ionicons name="mic-outline" size={20} color="#9aa5b4" style={styles.micIcon} />
        <View style={styles.inputWrapper}>
          {showPlaceholder && (
            <View style={styles.placeholderContainer} pointerEvents="none">
              <Animated.Text style={[styles.placeholderText, animatedStyle]}>
                {PLACEHOLDER_EXAMPLES[displayedIndex]}
              </Animated.Text>
            </View>
          )}
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={handleChangeText}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            blurOnSubmit={false}
          />
        </View>
        {text.length > 0 && (
          <Pressable onPress={handleSubmit} hitSlop={8}>
            <Animated.View entering={FadeIn.duration(150)} style={styles.sendBtn}>
              <Ionicons name="arrow-up" size={16} color="#fff" />
            </Animated.View>
          </Pressable>
        )}
      </View>
      {preview && (
        <Animated.View entering={SlideInUp.duration(200)} exiting={FadeOut.duration(100)} style={styles.preview}>
          <Ionicons name="calendar-outline" size={13} color="#3498db" />
          <Text style={styles.previewText}>{formatPreview(preview)}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 4,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: 8,
  },
  micIcon: {
    opacity: 0.6,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    height: 20,
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholderText: {
    fontSize: 14,
    color: '#b0b8c8',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    paddingVertical: 0,
  },
  sendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 2,
  },
  previewText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});
