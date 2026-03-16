import { useEffect, useState } from 'react';
import { ExamSchedule, SubscribedExams, DEFAULT_SUBSCRIBED_EXAMS } from '../types/exam';
import {
  subscribeToExamSchedules,
  subscribeToSubscribedExams,
} from '../services/examService';
import { useAuthStore } from '../stores/authStore';

/**
 * ユーザーの購読設定をリアルタイム監視
 */
export function useSubscribedExams() {
  const uid = useAuthStore((s) => s.uid);
  const [subs, setSubs] = useState<SubscribedExams>(DEFAULT_SUBSCRIBED_EXAMS);

  useEffect(() => {
    if (!uid) return;
    return subscribeToSubscribedExams(uid, setSubs);
  }, [uid]);

  return subs;
}

/**
 * 購読中の資格試験スケジュールをリアルタイム取得
 */
export function useExamSchedules(year?: number) {
  const subs = useSubscribedExams();
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentYear = year || new Date().getFullYear();

  useEffect(() => {
    setIsLoading(true);

    if (subs.exams.length === 0) {
      setExams([]);
      setIsLoading(false);
      return;
    }

    const unsub = subscribeToExamSchedules(subs.exams, currentYear, (data) => {
      setExams(data);
      setIsLoading(false);
    });

    return unsub;
  }, [subs.exams.join(','), currentYear]);

  return { exams, subs, isLoading };
}
