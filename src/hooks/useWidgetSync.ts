import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { CalendarEvent } from '../types';
import { updateTodayWidget, updateNextEventWidget } from '../services/widgetService';

/**
 * ウィジェット同期フック
 * イベント変更時・フォアグラウンド復帰時にウィジェットデータを更新
 */
export function useWidgetSync(events: CalendarEvent[]) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    updateTodayWidget(events, todayStr);
    updateNextEventWidget(events, now);
  }, [events]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        updateTodayWidget(events, todayStr);
        updateNextEventWidget(events, now);
      }
      appState.current = nextAppState;
    });
    return () => sub.remove();
  }, [events]);
}
