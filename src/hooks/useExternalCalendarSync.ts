import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { syncAllExternalCalendars } from '../services/syncService';

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30分

/**
 * 外部カレンダーの自動同期。
 * アプリ起動時とフォアグラウンド復帰時に、前回同期から一定時間経過していれば自動実行。
 */
export function useExternalCalendarSync() {
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const lastSyncRef = useRef(0);

  const sync = async () => {
    if (!uid || !profile?.calendars?.length) return;
    if (Date.now() - lastSyncRef.current < SYNC_INTERVAL_MS) return;

    lastSyncRef.current = Date.now();
    try {
      const results = await syncAllExternalCalendars(uid, profile.calendars[0]);
      const total = results.reduce((s, r) => s + r.importedCount, 0);
      if (total > 0) {
        console.warn(`[AutoSync] ${total}件の外部イベントを同期`);
      }
    } catch (error) {
      console.warn('[AutoSync] error:', error);
    }
  };

  // 初回同期
  useEffect(() => {
    sync();
  }, [uid, profile?.calendars]);

  // フォアグラウンド復帰時
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [uid, profile?.calendars]);
}
