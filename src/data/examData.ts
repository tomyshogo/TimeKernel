/**
 * 資格試験のスケジュールマスターデータ（ローカル）
 * Firestoreに依存せず、アプリに組み込み。
 * 年度更新時にこのファイルを更新する。
 */

export interface LocalExamSchedule {
  id: string;
  name: string;
  examKey: string;
  category: string;
  examDate: string; // YYYY-MM-DD
  applicationStart: string;
  applicationDeadline: string;
  resultDate?: string;
  fee: string;
  notes?: string;
  officialUrl?: string;
  year: number;
}

/** 資格名からGoogle検索URLを生成 */
export function getExamSearchUrl(examName: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(examName + ' 公式')}`;
}

export const EXAM_SCHEDULES: LocalExamSchedule[] = [
  // ── 2026年 ──

  // TOEIC L&R
  { id: 'toeic_2026_01', name: 'TOEIC L&R 第368回', examKey: 'toeic', category: 'language', examDate: '2026-01-25', applicationStart: '2025-11-01', applicationDeadline: '2025-12-15', fee: '7,810円', year: 2026 },
  { id: 'toeic_2026_03', name: 'TOEIC L&R 第369回', examKey: 'toeic', category: 'language', examDate: '2026-03-15', applicationStart: '2026-01-05', applicationDeadline: '2026-02-08', fee: '7,810円', year: 2026 },
  { id: 'toeic_2026_05', name: 'TOEIC L&R 第370回', examKey: 'toeic', category: 'language', examDate: '2026-05-24', applicationStart: '2026-03-10', applicationDeadline: '2026-04-12', fee: '7,810円', year: 2026 },
  { id: 'toeic_2026_06', name: 'TOEIC L&R 第371回', examKey: 'toeic', category: 'language', examDate: '2026-06-28', applicationStart: '2026-04-15', applicationDeadline: '2026-05-17', fee: '7,810円', year: 2026 },
  { id: 'toeic_2026_09', name: 'TOEIC L&R 第372回', examKey: 'toeic', category: 'language', examDate: '2026-09-13', applicationStart: '2026-07-01', applicationDeadline: '2026-08-02', fee: '7,810円', year: 2026 },
  { id: 'toeic_2026_10', name: 'TOEIC L&R 第373回', examKey: 'toeic', category: 'language', examDate: '2026-10-25', applicationStart: '2026-08-10', applicationDeadline: '2026-09-13', fee: '7,810円', year: 2026 },
  { id: 'toeic_2026_11', name: 'TOEIC L&R 第374回', examKey: 'toeic', category: 'language', examDate: '2026-11-15', applicationStart: '2026-09-01', applicationDeadline: '2026-10-04', fee: '7,810円', year: 2026 },

  // 英検
  { id: 'eiken_2026_1_1', name: '英検 2025年度第3回', examKey: 'eiken', category: 'language', examDate: '2026-01-25', applicationStart: '2025-11-01', applicationDeadline: '2025-12-15', fee: '級により異なる', year: 2026 },
  { id: 'eiken_2026_1_2', name: '英検 2026年度第1回', examKey: 'eiken', category: 'language', examDate: '2026-06-07', applicationStart: '2026-03-15', applicationDeadline: '2026-05-01', fee: '級により異なる', year: 2026 },
  { id: 'eiken_2026_2', name: '英検 2026年度第2回', examKey: 'eiken', category: 'language', examDate: '2026-10-11', applicationStart: '2026-07-15', applicationDeadline: '2026-09-05', fee: '級により異なる', year: 2026 },

  // ITパスポート（CBT 随時）
  { id: 'it_passport_2026', name: 'ITパスポート（CBT随時）', examKey: 'it_passport', category: 'it', examDate: '2026-04-01', applicationStart: '2026-01-01', applicationDeadline: '2026-12-31', fee: '7,500円', notes: 'CBT方式で随時受験可能', year: 2026 },

  // 基本情報技術者（CBT 随時）
  { id: 'fe_2026', name: '基本情報技術者（CBT随時）', examKey: 'fe', category: 'it', examDate: '2026-04-01', applicationStart: '2026-01-01', applicationDeadline: '2026-12-31', fee: '7,500円', notes: 'CBT方式で随時受験可能', year: 2026 },

  // 応用情報技術者
  { id: 'ap_2026_spring', name: '応用情報技術者 春期', examKey: 'ap', category: 'it', examDate: '2026-04-19', applicationStart: '2026-01-15', applicationDeadline: '2026-02-15', fee: '7,500円', year: 2026 },
  { id: 'ap_2026_fall', name: '応用情報技術者 秋期', examKey: 'ap', category: 'it', examDate: '2026-10-18', applicationStart: '2026-07-15', applicationDeadline: '2026-08-15', fee: '7,500円', year: 2026 },

  // 簿記2級・3級
  { id: 'boki2_2026_02', name: '簿記2級 第167回', examKey: 'boki2', category: 'business', examDate: '2026-02-22', applicationStart: '2025-12-15', applicationDeadline: '2026-01-20', fee: '5,500円', year: 2026 },
  { id: 'boki2_2026_06', name: '簿記2級 第168回', examKey: 'boki2', category: 'business', examDate: '2026-06-14', applicationStart: '2026-04-01', applicationDeadline: '2026-05-10', fee: '5,500円', year: 2026 },
  { id: 'boki2_2026_11', name: '簿記2級 第169回', examKey: 'boki2', category: 'business', examDate: '2026-11-15', applicationStart: '2026-09-01', applicationDeadline: '2026-10-05', fee: '5,500円', year: 2026 },
  { id: 'boki3_2026_02', name: '簿記3級 第167回', examKey: 'boki3', category: 'business', examDate: '2026-02-22', applicationStart: '2025-12-15', applicationDeadline: '2026-01-20', fee: '3,300円', year: 2026 },
  { id: 'boki3_2026_06', name: '簿記3級 第168回', examKey: 'boki3', category: 'business', examDate: '2026-06-14', applicationStart: '2026-04-01', applicationDeadline: '2026-05-10', fee: '3,300円', year: 2026 },
  { id: 'boki3_2026_11', name: '簿記3級 第169回', examKey: 'boki3', category: 'business', examDate: '2026-11-15', applicationStart: '2026-09-01', applicationDeadline: '2026-10-05', fee: '3,300円', year: 2026 },

  // FP2級・3級
  { id: 'fp2_2026_01', name: 'FP2級 2026年1月', examKey: 'fp2', category: 'business', examDate: '2026-01-25', applicationStart: '2025-11-01', applicationDeadline: '2025-12-01', fee: '11,700円', year: 2026 },
  { id: 'fp2_2026_05', name: 'FP2級 2026年5月', examKey: 'fp2', category: 'business', examDate: '2026-05-24', applicationStart: '2026-03-10', applicationDeadline: '2026-04-05', fee: '11,700円', year: 2026 },
  { id: 'fp2_2026_09', name: 'FP2級 2026年9月', examKey: 'fp2', category: 'business', examDate: '2026-09-13', applicationStart: '2026-07-01', applicationDeadline: '2026-08-01', fee: '11,700円', year: 2026 },
  { id: 'fp3_2026_01', name: 'FP3級（CBT随時）', examKey: 'fp3', category: 'business', examDate: '2026-01-01', applicationStart: '2026-01-01', applicationDeadline: '2026-12-31', fee: '8,000円', notes: 'CBT方式で随時受験可能', year: 2026 },

  // 宅建
  { id: 'takken_2026', name: '宅建 2026年', examKey: 'takken', category: 'law', examDate: '2026-10-18', applicationStart: '2026-07-01', applicationDeadline: '2026-07-31', fee: '8,200円', year: 2026 },

  // 行政書士
  { id: 'gyosei_2026', name: '行政書士 2026年', examKey: 'gyosei', category: 'law', examDate: '2026-11-08', applicationStart: '2026-07-28', applicationDeadline: '2026-08-28', fee: '10,400円', year: 2026 },

  // 秘書検定
  { id: 'hisho_2026_02', name: '秘書検定 第132回', examKey: 'hisho', category: 'business', examDate: '2026-02-08', applicationStart: '2025-12-01', applicationDeadline: '2026-01-13', fee: '級により異なる', year: 2026 },
  { id: 'hisho_2026_06', name: '秘書検定 第133回', examKey: 'hisho', category: 'business', examDate: '2026-06-14', applicationStart: '2026-04-06', applicationDeadline: '2026-05-12', fee: '級により異なる', year: 2026 },
  { id: 'hisho_2026_11', name: '秘書検定 第134回', examKey: 'hisho', category: 'business', examDate: '2026-11-08', applicationStart: '2026-09-01', applicationDeadline: '2026-10-06', fee: '級により異なる', year: 2026 },

  // 国家一般職
  { id: 'kokka_ippan_2026', name: '国家一般職 2026年', examKey: 'kokka_ippan', category: 'civil_service', examDate: '2026-06-14', applicationStart: '2026-03-20', applicationDeadline: '2026-04-06', fee: '無料', year: 2026 },

  // 地方上級
  { id: 'chihou_jokyu_2026', name: '地方上級 2026年', examKey: 'chihou_jokyu', category: 'civil_service', examDate: '2026-06-28', applicationStart: '2026-04-01', applicationDeadline: '2026-05-15', fee: '自治体により異なる', notes: '日程は自治体により異なる場合あり', year: 2026 },
];
