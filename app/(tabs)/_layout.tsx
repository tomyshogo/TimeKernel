import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
        },
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#2c3e50',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'カレンダー',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'📅'}</Text>,
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: '時間割',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'📚'}</Text>,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: '課題',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'✅'}</Text>,
        }}
      />
      <Tabs.Screen
        name="pomodoro"
        options={{
          title: 'タイマー',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'🍅'}</Text>,
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          title: 'バイト',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'💰'}</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'⚙️'}</Text>,
        }}
      />
    </Tabs>
  );
}
