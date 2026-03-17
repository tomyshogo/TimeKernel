import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Platform, PanResponder, Text } from 'react-native';
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

/** カレンダータブアイコン - 上下スワイプでカレンダー切り替え */
function CalendarTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { calendars } = useCalendars();
  const { selectedCalendarIds, setSelectedCalendarIds } = useCalendarStore();
  const swipeHandled = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dy) > 10 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      onPanResponderGrant: () => {
        swipeHandled.current = false;
      },
      onPanResponderRelease: (_, gs) => {
        if (swipeHandled.current || calendars.length < 2) return;
        if (Math.abs(gs.dy) < 30) return;
        swipeHandled.current = true;

        const currentId = selectedCalendarIds[0];
        const currentIdx = calendars.findIndex((c) => c.id === currentId);
        let nextIdx: number;

        if (gs.dy < 0) {
          // スワイプアップ → 次のカレンダー
          nextIdx = (currentIdx + 1) % calendars.length;
        } else {
          // スワイプダウン → 前のカレンダー
          nextIdx = (currentIdx - 1 + calendars.length) % calendars.length;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCalendarIds([calendars[nextIdx].id]);
      },
    })
  ).current;

  return (
    <View {...panResponder.panHandlers} style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons
        name={focused ? 'calendar' : 'calendar-outline'}
        size={22}
        color={color}
      />
    </View>
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
  iconContainerActive: {
    // active state placeholder
  },
});
