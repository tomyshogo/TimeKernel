import { Timestamp } from 'firebase/firestore';

export type ExamCategory = 'language' | 'it' | 'business' | 'law' | 'civil_service';

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  language: '語学',
  it: 'IT',
  business: 'ビジネス',
  law: '法律',
  civil_service: '公務員',
};

export interface ExamSchedule {
  id: string;
  /** 試験名 (e.g. "TOEIC L&R 第XXX回") */
  name: string;
  /** 資格の短縮名 (e.g. "toeic") — 購読キーに使用 */
  examKey: string;
  category: ExamCategory;
  examDate: Timestamp;
  applicationStart: Timestamp;
  applicationDeadline: Timestamp;
  resultDate?: Timestamp;
  officialUrl: string;
  fee: string;
  notes?: string;
  year: number;
  tags: string[];
}

export interface SubscribedExams {
  /** 購読カテゴリ */
  categories: ExamCategory[];
  /** 購読している資格のキー */
  exams: string[];
}

export const DEFAULT_SUBSCRIBED_EXAMS: SubscribedExams = {
  categories: [],
  exams: [],
};

/** 資格マスターデータ（UI表示用） */
export interface ExamMaster {
  key: string;
  name: string;
  category: ExamCategory;
}

/** 初期リリースの資格一覧 */
export const EXAM_MASTERS: ExamMaster[] = [
  // 語学
  { key: 'toeic', name: 'TOEIC L&R', category: 'language' },
  { key: 'toefl', name: 'TOEFL iBT', category: 'language' },
  { key: 'eiken', name: '英検', category: 'language' },
  { key: 'ielts', name: 'IELTS', category: 'language' },
  // IT
  { key: 'it_passport', name: 'ITパスポート', category: 'it' },
  { key: 'fe', name: '基本情報技術者', category: 'it' },
  { key: 'ap', name: '応用情報技術者', category: 'it' },
  // ビジネス
  { key: 'boki2', name: '簿記2級', category: 'business' },
  { key: 'boki3', name: '簿記3級', category: 'business' },
  { key: 'fp2', name: 'FP2級', category: 'business' },
  { key: 'fp3', name: 'FP3級', category: 'business' },
  { key: 'hisho', name: '秘書検定', category: 'business' },
  // 法律
  { key: 'takken', name: '宅建', category: 'law' },
  { key: 'gyosei', name: '行政書士', category: 'law' },
  // 公務員
  { key: 'kokka_ippan', name: '国家一般職', category: 'civil_service' },
  { key: 'chihou_jokyu', name: '地方上級', category: 'civil_service' },
];
