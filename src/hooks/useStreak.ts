import { useEffect, useState } from 'react';
import { getStudyRecords } from '../services/studyService';
import { formatDate } from '../utils/dateHelpers';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  loading: boolean;
}

/**
 * 勉強記録から連続日数(ストリーク)を計算するフック
 * Duolingo/Forest のような連続達成表示に使用
 */
export function useStreak(uid: string | null): StreakData {
  const [data, setData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    todayCompleted: false,
    loading: true,
  });

  useEffect(() => {
    if (!uid) {
      setData((d) => ({ ...d, loading: false }));
      return;
    }

    // 過去90日分の記録を取得してストリークを計算
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 90);

    getStudyRecords(uid, formatDate(start), formatDate(now))
      .then((records) => {
        // ユニークな日付のセット
        const datesWithStudy = new Set(records.map((r) => r.date));
        const todayStr = formatDate(now);
        const todayCompleted = datesWithStudy.has(todayStr);

        // 現在のストリークを計算 (今日 or 昨日から遡る)
        let currentStreak = 0;
        const checkDate = new Date(now);
        // 今日まだ未完了なら昨日から数える
        if (!todayCompleted) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        while (datesWithStudy.has(formatDate(checkDate))) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }

        // 最長ストリーク
        let longestStreak = 0;
        let tempStreak = 0;
        const sortedDates = [...datesWithStudy].sort();
        for (let i = 0; i < sortedDates.length; i++) {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const prev = new Date(sortedDates[i - 1]);
            const curr = new Date(sortedDates[i]);
            const diffDays = Math.round(
              (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
            );
            tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
          }
          longestStreak = Math.max(longestStreak, tempStreak);
        }

        setData({
          currentStreak,
          longestStreak,
          todayCompleted,
          loading: false,
        });
      })
      .catch(() => {
        setData((d) => ({ ...d, loading: false }));
      });
  }, [uid]);

  return data;
}
