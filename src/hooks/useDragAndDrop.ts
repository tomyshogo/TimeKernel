import { useState, useCallback, useRef } from 'react';
import { LayoutRectangle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CalendarEvent } from '../types';

export interface DragState {
  event: CalendarEvent;
  /** 現在のドラッグ位置 (画面座標) */
  currentX: number;
  currentY: number;
  /** ドロップ先の日付 (YYYY-MM-DD) */
  targetDate: string | null;
  /** ドロップ先の時刻 (HH:mm) */
  targetTime: string | null;
  /** コピーモードか */
  isCopy: boolean;
}

interface UseDragAndDropOptions {
  onMove: (eventId: string, calendarId: string, newDate: string, newStartTime: string, newEndTime: string) => Promise<void>;
  onCopy: (event: CalendarEvent, newDate: string, newStartTime: string, newEndTime: string) => Promise<void>;
}

export function useDragAndDrop({ onMove, onCopy }: UseDragAndDropOptions) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startDrag = useCallback(
    (event: CalendarEvent) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDragState({
        event,
        currentX: 0,
        currentY: 0,
        targetDate: null,
        targetTime: null,
        isCopy: false,
      });
    },
    []
  );

  const updateDrag = useCallback(
    (x: number, y: number, targetDate: string | null, targetTime: string | null) => {
      setDragState((prev) => {
        if (!prev) return null;
        return { ...prev, currentX: x, currentY: y, targetDate, targetTime };
      });
    },
    []
  );

  const toggleCopy = useCallback(() => {
    setDragState((prev) => {
      if (!prev) return null;
      return { ...prev, isCopy: !prev.isCopy };
    });
  }, []);

  const endDrag = useCallback(async () => {
    if (!dragState || !dragState.targetDate || !dragState.targetTime) {
      setDragState(null);
      return;
    }

    const { event, targetDate, targetTime, isCopy } = dragState;
    const startMin = timeToMinutes(event.startTime);
    const endMin = timeToMinutes(event.endTime);
    const duration = endMin - startMin;
    const newStartMin = timeToMinutes(targetTime);
    const newEndMin = newStartMin + duration;
    const newEndTime = minutesToTime(Math.min(newEndMin, 24 * 60 - 1));

    if (isCopy) {
      await onCopy(event, targetDate, targetTime, newEndTime);
    } else {
      await onMove(event.id, event.calendarId, targetDate, targetTime, newEndTime);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDragState(null);
  }, [dragState, onMove, onCopy]);

  const cancelDrag = useCallback(() => {
    setDragState(null);
  }, []);

  const handleLongPress = useCallback(
    (event: CalendarEvent) => {
      if (event.id.startsWith('timetable_')) return; // 時間割はドラッグ不可
      startDrag(event);
    },
    [startDrag]
  );

  return {
    dragState,
    startDrag,
    updateDrag,
    toggleCopy,
    endDrag,
    cancelDrag,
    handleLongPress,
  };
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
