import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/hooks/useAuth';
import { useNotifications } from '../src/hooks/useNotifications';
import { NetworkBanner } from '../src/components/ui/NetworkBanner';
import { ToastContainer } from '../src/components/ui/Toast';
import { CelebrationOverlay } from '../src/components/ui/CelebrationOverlay';
import AuthScreen from './auth';
import OnboardingScreen from './onboarding';

function CloseButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 16 }}>
      <Ionicons name="close" size={24} color="#2c3e50" />
    </Pressable>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginLeft: 16 }}>
      <Ionicons name="chevron-back" size={24} color="#2c3e50" />
    </Pressable>
  );
}

export default function RootLayout() {
  const { isLoading, isAuthenticated, isNewUser } = useAuth();
  useNotifications();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (isNewUser) {
    return <OnboardingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NetworkBanner />
      <ToastContainer />
      <CelebrationOverlay />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#2c3e50',
          headerTitleStyle: { fontWeight: '700' },
          headerBackTitle: '',
          headerLeft: () => <BackButton />,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, headerLeft: undefined }} />
        <Stack.Screen name="settings/index" options={{ title: '設定' }} />
        <Stack.Screen name="settings/profile" options={{ title: 'プロフィール' }} />
        <Stack.Screen name="settings/periods" options={{ title: '時限設定' }} />
        <Stack.Screen name="settings/weather" options={{ title: '天気・服装提案' }} />
        <Stack.Screen name="settings/night-shift" options={{ title: '深夜割増設定' }} />
        <Stack.Screen
          name="event/new"
          options={{
            title: '予定を追加',
            presentation: 'modal',
            headerLeft: undefined,
            headerRight: () => <CloseButton />,
          }}
        />
        <Stack.Screen
          name="event/[id]"
          options={{
            title: '予定を編集',
            presentation: 'modal',
            headerLeft: undefined,
            headerRight: () => <CloseButton />,
          }}
        />
        <Stack.Screen name="calendar/index" options={{ title: 'カレンダー管理' }} />
        <Stack.Screen name="calendar/new" options={{ title: 'カレンダー作成' }} />
        <Stack.Screen name="calendar/[id]" options={{ title: 'カレンダー詳細' }} />
        <Stack.Screen
          name="calendar/join"
          options={{ title: 'カレンダーに参加' }}
        />
        <Stack.Screen name="share/[calendarId]" options={{ title: '共有' }} />
        <Stack.Screen
          name="notification-settings"
          options={{ title: '通知設定' }}
        />
        <Stack.Screen
          name="external-calendars/index"
          options={{ title: '外部カレンダー連携' }}
        />
        <Stack.Screen
          name="external-calendars/add-google"
          options={{ title: 'Google Calendar 連携' }}
        />
        <Stack.Screen
          name="external-calendars/add-apple"
          options={{ title: 'Apple Calendar 連携' }}
        />
        <Stack.Screen
          name="external-calendars/add-ical"
          options={{ title: 'iCal URL 購読' }}
        />
        <Stack.Screen
          name="task/new"
          options={{
            title: '課題を追加',
            presentation: 'modal',
            headerLeft: undefined,
            headerRight: () => <CloseButton />,
          }}
        />
        <Stack.Screen
          name="task/[id]"
          options={{
            title: '課題を編集',
            presentation: 'modal',
            headerLeft: undefined,
            headerRight: () => <CloseButton />,
          }}
        />
        <Stack.Screen
          name="study-stats"
          options={{ title: '勉強統計' }}
        />
        <Stack.Screen
          name="poll/new"
          options={{
            title: '投票を作成',
            presentation: 'modal',
            headerLeft: undefined,
            headerRight: () => <CloseButton />,
          }}
        />
        <Stack.Screen
          name="poll/[id]"
          options={{
            title: '投票',
            presentation: 'modal',
            headerLeft: undefined,
            headerRight: () => <CloseButton />,
          }}
        />
        <Stack.Screen
          name="exam/index"
          options={{ title: '試験日程' }}
        />
        <Stack.Screen
          name="exam/[id]"
          options={{ title: '試験詳細' }}
        />
        <Stack.Screen
          name="voice-assistant"
          options={{ title: '音声アシスタント' }}
        />
        <Stack.Screen
          name="calendar-groups"
          options={{ title: 'カレンダー管理' }}
        />
        <Stack.Screen
          name="privacy-settings"
          options={{ title: 'プライバシー' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
