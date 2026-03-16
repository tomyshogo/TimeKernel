import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { CalendarEvent, NotificationSettings } from '../types';
import { EVENT_TYPE_LABELS } from '../utils/constants';

// 通知ハンドラー設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 通知権限を要求する
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'デフォルト',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'リマインダー',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return finalStatus === 'granted';
}

/**
 * イベントに対するリマインダー通知をスケジュールする
 */
export async function scheduleEventReminder(
  event: CalendarEvent,
  reminderMinutes: number,
  notificationSettings: NotificationSettings
): Promise<string | null> {
  if (!notificationSettings.enabled) return null;
  if (!notificationSettings.eventTypes[event.type]) return null;

  const eventDateTime = new Date(`${event.date}T${event.startTime}:00`);
  const triggerDate = new Date(eventDateTime.getTime() - reminderMinutes * 60 * 1000);

  // 過去の時刻ならスキップ
  if (triggerDate <= new Date()) return null;

  // おやすみ時間チェック
  if (notificationSettings.quietHours.enabled) {
    const triggerHHMM = `${String(triggerDate.getHours()).padStart(2, '0')}:${String(triggerDate.getMinutes()).padStart(2, '0')}`;
    if (isInQuietHours(triggerHHMM, notificationSettings.quietHours.start, notificationSettings.quietHours.end)) {
      return null;
    }
  }

  const typeLabel = EVENT_TYPE_LABELS[event.type];
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${typeLabel}: ${event.title}`,
      body: `${event.startTime} - ${event.endTime}`,
      data: {
        eventId: event.id,
        calendarId: event.calendarId,
        type: 'event_reminder',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: 'reminders',
    },
  });

  return id;
}

/**
 * 特定のイベントに関連する通知をキャンセルする
 */
export async function cancelEventNotifications(eventId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.eventId === eventId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

/**
 * すべてのスケジュール済み通知をキャンセルする
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * 複数イベントの通知を一括スケジュールする
 */
export async function scheduleNotificationsForEvents(
  events: CalendarEvent[],
  notificationSettings: NotificationSettings
): Promise<void> {
  // 既存の通知をすべてクリア
  await cancelAllNotifications();

  if (!notificationSettings.enabled) return;

  for (const event of events) {
    // timetableイベントはスキップ
    if (event.id.startsWith('timetable_')) continue;
    await scheduleEventReminder(event, notificationSettings.reminderMinutes, notificationSettings);
  }
}

function isInQuietHours(time: string, start: string, end: string): boolean {
  if (start <= end) {
    // 例: 23:00-07:00 ではない場合 (09:00-17:00 とか)
    return time >= start && time < end;
  } else {
    // 日をまたぐ場合 (23:00-07:00)
    return time >= start || time < end;
  }
}
