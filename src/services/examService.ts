import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  ExamSchedule,
  ExamCategory,
  SubscribedExams,
  DEFAULT_SUBSCRIBED_EXAMS,
} from '../types/exam';

const examSchedulesRef = collection(db, 'examSchedules');
const subscribedExamsRef = (uid: string) =>
  doc(db, 'users', uid, 'subscribedExams', 'config');

// ─── Exam Schedules (読み取り) ───

/**
 * 購読中の資格試験スケジュールをリアルタイムで取得
 */
export function subscribeToExamSchedules(
  examKeys: string[],
  year: number,
  callback: (exams: ExamSchedule[]) => void
): () => void {
  if (examKeys.length === 0) {
    callback([]);
    return () => {};
  }

  // Firestore 'in' クエリは最大30件
  const chunks = chunkArray(examKeys, 30);
  const results = new Map<string, ExamSchedule[]>();
  const unsubscribers: (() => void)[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const q = query(
      examSchedulesRef,
      where('examKey', 'in', chunks[i]),
      where('year', '==', year)
    );

    const unsub = onSnapshot(q, (snap) => {
      const exams = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExamSchedule));
      results.set(String(i), exams);

      // 全チャンクの結果をマージして返す
      const all = Array.from(results.values()).flat();
      all.sort((a, b) => a.examDate.toMillis() - b.examDate.toMillis());
      callback(all);
    });

    unsubscribers.push(unsub);
  }

  return () => unsubscribers.forEach((unsub) => unsub());
}

/**
 * カテゴリ別の試験スケジュールを一括取得（一覧画面用）
 */
export async function getExamSchedulesByCategory(
  category: ExamCategory,
  year: number
): Promise<ExamSchedule[]> {
  const q = query(
    examSchedulesRef,
    where('category', '==', category),
    where('year', '==', year)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExamSchedule));
}

// ─── User Subscriptions ───

/**
 * ユーザーの購読設定を取得
 */
export async function getSubscribedExams(uid: string): Promise<SubscribedExams> {
  const snap = await getDoc(subscribedExamsRef(uid));
  if (snap.exists()) {
    return snap.data() as SubscribedExams;
  }
  return DEFAULT_SUBSCRIBED_EXAMS;
}

/**
 * ユーザーの購読設定をリアルタイムで監視
 */
export function subscribeToSubscribedExams(
  uid: string,
  callback: (subs: SubscribedExams) => void
): () => void {
  return onSnapshot(subscribedExamsRef(uid), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SubscribedExams);
    } else {
      callback(DEFAULT_SUBSCRIBED_EXAMS);
    }
  });
}

/**
 * 購読設定を更新
 */
export async function updateSubscribedExams(
  uid: string,
  subs: SubscribedExams
): Promise<void> {
  await setDoc(subscribedExamsRef(uid), subs);
}

/**
 * 資格を購読に追加
 */
export async function addExamSubscription(
  uid: string,
  examKey: string,
  category: ExamCategory
): Promise<void> {
  const current = await getSubscribedExams(uid);
  const exams = current.exams.includes(examKey)
    ? current.exams
    : [...current.exams, examKey];
  const categories = current.categories.includes(category)
    ? current.categories
    : [...current.categories, category];
  await updateSubscribedExams(uid, { exams, categories });
}

/**
 * 資格を購読から削除
 */
export async function removeExamSubscription(
  uid: string,
  examKey: string
): Promise<void> {
  const current = await getSubscribedExams(uid);
  const exams = current.exams.filter((k) => k !== examKey);
  await updateSubscribedExams(uid, { ...current, exams });
}

// ─── Helpers ───

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
