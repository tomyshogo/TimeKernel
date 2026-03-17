/**
 * 資格試験データの初期シード
 *
 * 使い方:
 *   npx ts-node scripts/seedExamData.ts
 *
 * 注: Firebase Admin SDK が必要。
 *     GOOGLE_APPLICATION_CREDENTIALS 環境変数にサービスアカウントキーのパスを設定してください。
 */

import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

interface SeedExam {
  name: string;
  examKey: string;
  category: string;
  examDate: string;          // YYYY-MM-DD
  applicationStart: string;  // YYYY-MM-DD
  applicationDeadline: string; // YYYY-MM-DD
  resultDate?: string;       // YYYY-MM-DD
  officialUrl: string;
  fee: string;
  notes?: string;
  year: number;
  tags: string[];
}

const EXAMS_2026: SeedExam[] = [
  // ── TOEIC L&R ──
  {
    name: 'TOEIC L&R 第371回',
    examKey: 'toeic',
    category: 'language',
    examDate: '2026-05-24',
    applicationStart: '2026-03-01',
    applicationDeadline: '2026-04-14',
    resultDate: '2026-06-23',
    officialUrl: 'https://www.iibc-global.org/toeic.html',
    fee: '7,810円',
    notes: '写真付き身分証明書必要',
    year: 2026,
    tags: ['toeic', 'language', 'english'],
  },
  {
    name: 'TOEIC L&R 第373回',
    examKey: 'toeic',
    category: 'language',
    examDate: '2026-07-12',
    applicationStart: '2026-04-20',
    applicationDeadline: '2026-06-01',
    resultDate: '2026-08-11',
    officialUrl: 'https://www.iibc-global.org/toeic.html',
    fee: '7,810円',
    notes: '写真付き身分証明書必要',
    year: 2026,
    tags: ['toeic', 'language', 'english'],
  },
  // ── 英検 ──
  {
    name: '英検 2026年度第1回',
    examKey: 'eiken',
    category: 'language',
    examDate: '2026-06-07',
    applicationStart: '2026-03-15',
    applicationDeadline: '2026-04-30',
    resultDate: '2026-07-06',
    officialUrl: 'https://www.eiken.or.jp/',
    fee: '級により異なる',
    year: 2026,
    tags: ['eiken', 'language', 'english'],
  },
  // ── ITパスポート ──
  {
    name: 'ITパスポート 2026年4月',
    examKey: 'it_passport',
    category: 'it',
    examDate: '2026-04-12',
    applicationStart: '2026-02-01',
    applicationDeadline: '2026-03-20',
    officialUrl: 'https://www3.jitec.ipa.go.jp/JitesCbt/',
    fee: '7,500円',
    notes: 'CBT方式。全国のテストセンターで受験可',
    year: 2026,
    tags: ['it_passport', 'it', 'ipa'],
  },
  // ── 基本情報技術者 ──
  {
    name: '基本情報技術者 2026年春期',
    examKey: 'fe',
    category: 'it',
    examDate: '2026-04-19',
    applicationStart: '2026-01-10',
    applicationDeadline: '2026-02-20',
    officialUrl: 'https://www.ipa.go.jp/shiken/',
    fee: '7,500円',
    year: 2026,
    tags: ['fe', 'it', 'ipa'],
  },
  // ── 応用情報技術者 ──
  {
    name: '応用情報技術者 2026年春期',
    examKey: 'ap',
    category: 'it',
    examDate: '2026-04-19',
    applicationStart: '2026-01-10',
    applicationDeadline: '2026-02-20',
    officialUrl: 'https://www.ipa.go.jp/shiken/',
    fee: '7,500円',
    year: 2026,
    tags: ['ap', 'it', 'ipa'],
  },
  // ── 簿記2級 ──
  {
    name: '簿記2級 第168回',
    examKey: 'boki2',
    category: 'business',
    examDate: '2026-06-14',
    applicationStart: '2026-03-20',
    applicationDeadline: '2026-05-08',
    resultDate: '2026-07-14',
    officialUrl: 'https://www.kentei.ne.jp/bookkeeping',
    fee: '5,500円',
    year: 2026,
    tags: ['boki', 'business', 'bookkeeping'],
  },
  // ── 簿記3級 ──
  {
    name: '簿記3級 第168回',
    examKey: 'boki3',
    category: 'business',
    examDate: '2026-06-14',
    applicationStart: '2026-03-20',
    applicationDeadline: '2026-05-08',
    resultDate: '2026-07-14',
    officialUrl: 'https://www.kentei.ne.jp/bookkeeping',
    fee: '3,300円',
    year: 2026,
    tags: ['boki', 'business', 'bookkeeping'],
  },
  // ── FP2級 ──
  {
    name: 'FP2級 2026年5月',
    examKey: 'fp2',
    category: 'business',
    examDate: '2026-05-24',
    applicationStart: '2026-03-10',
    applicationDeadline: '2026-04-03',
    resultDate: '2026-07-01',
    officialUrl: 'https://www.jafp.or.jp/',
    fee: '11,700円',
    year: 2026,
    tags: ['fp', 'business', 'financial_planner'],
  },
  // ── FP3級 ──
  {
    name: 'FP3級 2026年5月',
    examKey: 'fp3',
    category: 'business',
    examDate: '2026-05-24',
    applicationStart: '2026-03-10',
    applicationDeadline: '2026-04-03',
    resultDate: '2026-07-01',
    officialUrl: 'https://www.jafp.or.jp/',
    fee: '8,000円',
    year: 2026,
    tags: ['fp', 'business', 'financial_planner'],
  },
  // ── 宅建 ──
  {
    name: '宅建 令和8年度',
    examKey: 'takken',
    category: 'law',
    examDate: '2026-10-18',
    applicationStart: '2026-07-01',
    applicationDeadline: '2026-07-31',
    resultDate: '2026-12-02',
    officialUrl: 'https://www.retio.or.jp/',
    fee: '8,200円',
    year: 2026,
    tags: ['takken', 'law', 'real_estate'],
  },
  // ── 行政書士 ──
  {
    name: '行政書士 令和8年度',
    examKey: 'gyosei',
    category: 'law',
    examDate: '2026-11-08',
    applicationStart: '2026-07-28',
    applicationDeadline: '2026-08-28',
    resultDate: '2027-01-27',
    officialUrl: 'https://gyosei-shiken.or.jp/',
    fee: '10,400円',
    year: 2026,
    tags: ['gyosei', 'law', 'administrative'],
  },
];

async function seed() {
  const batch = db.batch();

  for (const exam of EXAMS_2026) {
    const ref = db.collection('examSchedules').doc();
    batch.set(ref, {
      ...exam,
      examDate: admin.firestore.Timestamp.fromDate(new Date(exam.examDate)),
      applicationStart: admin.firestore.Timestamp.fromDate(new Date(exam.applicationStart)),
      applicationDeadline: admin.firestore.Timestamp.fromDate(new Date(exam.applicationDeadline)),
      ...(exam.resultDate
        ? { resultDate: admin.firestore.Timestamp.fromDate(new Date(exam.resultDate)) }
        : {}),
    });
  }

  await batch.commit();
  console.log(`Seeded ${EXAMS_2026.length} exam schedules.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
