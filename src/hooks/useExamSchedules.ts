import { useEffect, useState, useMemo, useRef } from 'react';
import { SubscribedExams, DEFAULT_SUBSCRIBED_EXAMS, EXAM_MASTERS } from '../types/exam';
import { subscribeToSubscribedExams, updateSubscribedExams } from '../services/examService';
import { useAuthStore } from '../stores/authStore';
import { EXAM_SCHEDULES, LocalExamSchedule } from '../data/examData';

const VALID_KEYS = new Set(EXAM_MASTERS.map((e) => e.key));

/**
 * ユーザーの購読設定をリアルタイム監視
 * 旧キーが残っていたら自動クリーンアップ
 */
export function useSubscribedExams() {
  const uid = useAuthStore((s) => s.uid);
  const [subs, setSubs] = useState<SubscribedExams>(DEFAULT_SUBSCRIBED_EXAMS);
  const cleanedRef = useRef(false);

  useEffect(() => {
    if (!uid) return;
    return subscribeToSubscribedExams(uid, (data) => {
      setSubs(data);
      // 旧キーを自動削除（1回だけ）
      if (!cleanedRef.current && data.exams.length > 0) {
        const invalidKeys = data.exams.filter((k) => !VALID_KEYS.has(k));
        if (invalidKeys.length > 0) {
          cleanedRef.current = true;
          const cleanedExams = data.exams.filter((k) => VALID_KEYS.has(k));
          updateSubscribedExams(uid, { ...data, exams: cleanedExams });
        }
      }
    });
  }, [uid]);

  return subs;
}

/**
 * 購読中の資格試験スケジュールをローカルデータから取得
 */
export function useExamSchedules(year?: number) {
  const subs = useSubscribedExams();
  const currentYear = year || new Date().getFullYear();

  const exams = useMemo(() => {
    if (subs.exams.length === 0) return [];
    return EXAM_SCHEDULES.filter(
      (e) => subs.exams.includes(e.examKey) && e.year === currentYear
    ).sort((a, b) => a.examDate.localeCompare(b.examDate));
  }, [subs.exams.join(','), currentYear]);

  return { exams, subs, isLoading: false };
}
