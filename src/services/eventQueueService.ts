/**
 * MCPサーバーからの個人カレンダーイベント操作キュー
 *
 * フロー: MCP → Firestore(キュー) → アプリが検知 → SQLiteに保存 → キュー削除
 */

import {
  collection,
  doc,
  onSnapshot,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  addLocalEvent,
  updateLocalEvent,
  deleteLocalEvent,
  isLocalCalendarId,
} from './localEventService';
import { CalendarEventInput } from '../types';

const queueCol = (uid: string) => collection(db, 'users', uid, 'eventQueue');

export interface QueueItem {
  id: string;
  action: 'add' | 'update' | 'delete';
  calendarId: string;
  eventId?: string;
  eventData?: CalendarEventInput;
  createdAt: string;
}

/**
 * キューを監視し、ローカルカレンダーへの操作を処理する
 */
export function subscribeToEventQueue(uid: string): Unsubscribe {
  return onSnapshot(queueCol(uid), async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type !== 'added') continue;

      const item = { id: change.doc.id, ...change.doc.data() } as QueueItem;

      // ローカルカレンダーのみ処理
      if (!isLocalCalendarId(item.calendarId)) {
        // 共有カレンダーはMCPが直接Firestoreに書くので、キューから削除のみ
        await deleteDoc(doc(queueCol(uid), item.id));
        continue;
      }

      try {
        switch (item.action) {
          case 'add':
            if (item.eventData) {
              addLocalEvent(item.calendarId, item.eventData);
            }
            break;
          case 'update':
            if (item.eventId && item.eventData) {
              updateLocalEvent(item.calendarId, item.eventId, item.eventData);
            }
            break;
          case 'delete':
            if (item.eventId) {
              deleteLocalEvent(item.calendarId, item.eventId);
            }
            break;
        }
      } catch (error) {
        console.warn('[EventQueue] Failed to process:', item.action, error);
      }

      // 処理済みのキューアイテムを削除
      await deleteDoc(doc(queueCol(uid), item.id));
    }
  }, (error) => {
    console.warn('[EventQueue] Subscription error:', error.code, error.message);
  });
}
