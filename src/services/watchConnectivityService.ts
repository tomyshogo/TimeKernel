/**
 * Apple Watch 連携サービス
 * WatchConnectivity を利用して iPhone ↔ Watch 間でデータ転送を行う
 *
 * v2 追加機能:
 * - 通知連携（UNNotification 自動転送 + カスタム通知UI）
 * - オフラインキャッシュ（今日〜3日分の予定 + 今月のバイト集計）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent } from '../types';

const WATCH_CACHE_KEY = 'watch:cachedData';

export interface WatchPayload {
  events: WatchEventData[];
  shiftSummary: { totalHours: number; totalWage: number };
  lastUpdated: string;
}

export interface WatchEventData {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  type: string;
}

/**
 * Watch に送信するためのイベントデータを構築
 * 今日〜3日分の予定のみ
 */
export function buildWatchPayload(
  events: CalendarEvent[],
  shiftTotalHours: number,
  shiftTotalWage: number
): WatchPayload {
  const now = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const filtered = events
    .filter((e) => dates.includes(e.date))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    })
    .map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      color: e.color,
      type: e.type,
    }));

  return {
    events: filtered,
    shiftSummary: { totalHours: shiftTotalHours, totalWage: shiftTotalWage },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * ローカルキャッシュにWatch用データを保存
 * (実際の WatchConnectivity 転送はネイティブモジュール経由)
 */
export async function cacheWatchPayload(payload: WatchPayload): Promise<void> {
  await AsyncStorage.setItem(WATCH_CACHE_KEY, JSON.stringify(payload));
}

/**
 * キャッシュからWatch用データを取得
 */
export async function getCachedWatchPayload(): Promise<WatchPayload | null> {
  const raw = await AsyncStorage.getItem(WATCH_CACHE_KEY);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Watch通知アクションの定義
 */
export const WATCH_NOTIFICATION_ACTIONS = {
  snooze5min: {
    identifier: 'SNOOZE_5MIN',
    title: '5分後にリマインド',
  },
  confirm: {
    identifier: 'CONFIRM',
    title: '確認済み',
  },
} as const;
