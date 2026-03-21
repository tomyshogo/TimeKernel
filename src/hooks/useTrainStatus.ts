import { useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainStatus, LINE_MASTERS } from '../types/train';
import { fetchTrainStatus } from '../services/trainService';

const STORAGE_KEY = 'train_subscribed_lines';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5分

export function useTrainStatus() {
  const [subscribedLines, setSubscribedLines] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<TrainStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 登録路線を読み込み
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setSubscribedLines(JSON.parse(val));
    });
  }, []);

  // 路線を追加
  const addLine = useCallback(async (lineId: string) => {
    const updated = [...subscribedLines, lineId];
    setSubscribedLines(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [subscribedLines]);

  // 路線を削除
  const removeLine = useCallback(async (lineId: string) => {
    const updated = subscribedLines.filter((id) => id !== lineId);
    setSubscribedLines(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [subscribedLines]);

  // 運行情報を取得
  const refresh = useCallback(async () => {
    if (subscribedLines.length === 0) {
      setStatuses([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchTrainStatus(subscribedLines);
      setStatuses(data);
    } catch {
      // エラー時は前回のデータを維持
    } finally {
      setIsLoading(false);
    }
  }, [subscribedLines]);

  // 定期更新
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  // フォアグラウンド復帰時に更新
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // 遅延中の路線のみ
  const delayedLines = statuses.filter((s) => s.status !== 'normal');

  return { subscribedLines, statuses, delayedLines, isLoading, addLine, removeLine, refresh };
}
