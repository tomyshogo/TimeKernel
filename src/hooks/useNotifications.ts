import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { requestNotificationPermissions } from '../services/notificationService';

/**
 * 通知の権限要求 + ディープリンク（タップ時の画面遷移）を管理
 */
export function useNotifications() {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // 通知タップ時のハンドリング
  useEffect(() => {
    if (!lastResponse) return;
    const data = lastResponse.notification.request.content.data;
    if (data?.type === 'event_reminder' && data.eventId && data.calendarId) {
      router.push(`/event/${data.eventId}?calendarId=${data.calendarId}`);
    }
  }, [lastResponse]);
}
