import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform, PanResponder, Text, Modal, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCalendars } from '../../src/hooks/useCalendars';
import { useCalendarStore } from '../../src/stores/calendarStore';

function SettingsButton() {
  const router = useRouter();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/settings');
      }}
      onPressIn={() => { scale.value = withSpring(0.85, { damping: 12, stiffness: 200 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
      style={{ marginRight: 16 }}
      hitSlop={8}
    >
      <Animated.View style={[styles.settingsBtn, animStyle]}>
        <Ionicons name="settings-outline" size={20} color="#2c3e50" />
      </Animated.View>
    </Pressable>
  );
}

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons
        name={(focused ? name.replace('-outline', '') : name) as any}
        size={22}
        color={color}
      />
    </View>
  );
}

/** カレンダータブアイコン - 長押しでカレンダー切り替え */
function CalendarTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { calendars } = useCalendars();
  const { selectedCalendarIds, setSelectedCalendarIds } = useCalendarStore();
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleLongPress = () => {
    if (calendars.length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPickerVisible(true);
  };

  const handleToggle = (calendarId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isSelected = selectedCalendarIds.includes(calendarId);
    if (isSelected && selectedCalendarIds.length === 1) return; // 最低1つは選択
    if (isSelected) {
      setSelectedCalendarIds(selectedCalendarIds.filter((id) => id !== calendarId));
    } else {
      setSelectedCalendarIds([...selectedCalendarIds, calendarId]);
    }
  };

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCalendarIds(calendars.map((c) => c.id));
  };

  const hasMultiple = calendars.length > 1;

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    if (!hasMultiple) return;
    longPressTimer.current = setTimeout(() => {
      handleLongPress();
      longPressTimer.current = null;
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <>
      <View
        style={[styles.iconContainer, focused && styles.iconContainerActive]}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <Ionicons
          name={focused ? 'calendar' : 'calendar-outline'}
          size={22}
          color={color}
        />
        {hasMultiple && (
          <View style={styles.longPressHint}>
            <Ionicons name="swap-vertical" size={14} color={focused ? '#3498db' : '#b0b8c8'} />
            <Text style={[styles.longPressText, { color: focused ? '#3498db' : '#b0b8c8' }]}>長押し</Text>
          </View>
        )}
      </View>

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.pickerTitle}>表示するカレンダー</Text>
            {calendars.map((cal) => {
              const isSelected = selectedCalendarIds.includes(cal.id);
              return (
                <TouchableOpacity
                  key={cal.id}
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                  onPress={() => handleToggle(cal.id)}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={isSelected ? '#3498db' : '#b0b8c8'}
                  />
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                    {cal.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {calendars.length > 1 && selectedCalendarIds.length < calendars.length && (
              <TouchableOpacity style={styles.pickerSelectAll} onPress={handleSelectAll}>
                <Text style={styles.pickerSelectAllText}>すべて表示</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function CalendarHeaderTitle() {
  const { calendars } = useCalendars();
  const { selectedCalendarIds } = useCalendarStore();

  const selectedCals = calendars.filter((c) => selectedCalendarIds.includes(c.id));
  const calendarName = selectedCals.length === 0
    ? 'カレンダー'
    : selectedCals.length === calendars.length && calendars.length > 1
      ? 'すべてのカレンダー'
      : selectedCals.map((c) => c.name).join(' / ');

  return (
    <Text style={styles.headerTitleText} numberOfLines={1}>{calendarName}</Text>
  );
}

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#b0b8c1',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: -2,
        },
        headerStyle: {
          backgroundColor: '#fff',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#1a1a2e',
        headerTitleStyle: { fontWeight: '800', fontSize: 18, letterSpacing: -0.3 },
        headerRight: () => <SettingsButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'カレンダー',
          headerTitle: () => <CalendarHeaderTitle />,
          tabBarIcon: ({ color, focused }) => (
            <CalendarTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: '時間割',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="grid-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: '課題',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="checkbox-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="pomodoro"
        options={{
          title: 'ポモドーロ',
          headerTitle: 'ポモドーロタイマー',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="timer-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          title: 'バイト',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="wallet-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f5f7fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 28,
  },
  calendarTabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 36,
  },
  iconContainerActive: {},
  longPressHint: {
    position: 'absolute',
    top: -6,
    right: -14,
    alignItems: 'center',
  },
  longPressText: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: -1,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -0.3,
    maxWidth: 220,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 120 : 90,
    paddingHorizontal: 16,
  },
  pickerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerItemActive: {
    backgroundColor: '#f0f7ff',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
  },
  pickerItemTextActive: {
    color: '#3498db',
    fontWeight: '700',
  },
  pickerSelectAll: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  pickerSelectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
});
