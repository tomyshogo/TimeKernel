import { Timestamp } from 'firebase/firestore';

export type ExamCategory = 'language' | 'it' | 'business' | 'law' | 'civil_service' | 'medical' | 'construction' | 'education';

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  language: '語学',
  it: 'IT',
  business: 'ビジネス・会計',
  law: '法律',
  civil_service: '公務員',
  medical: '医療・福祉',
  construction: '建築・不動産',
  education: '教育',
};

export interface ExamSchedule {
  id: string;
  name: string;
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
  categories: ExamCategory[];
  exams: string[];
}

export const DEFAULT_SUBSCRIBED_EXAMS: SubscribedExams = {
  categories: [],
  exams: [],
};

export interface ExamMaster {
  key: string;
  name: string;
  category: ExamCategory;
}

export const EXAM_MASTERS: ExamMaster[] = [
  // ── 語学 ──
  { key: 'toeic_lr', name: 'TOEIC L&R', category: 'language' },
  { key: 'toeic_sw', name: 'TOEIC S&W', category: 'language' },
  { key: 'toefl', name: 'TOEFL iBT', category: 'language' },
  { key: 'ielts', name: 'IELTS', category: 'language' },
  { key: 'eiken_1', name: '英検1級', category: 'language' },
  { key: 'eiken_pre1', name: '英検準1級', category: 'language' },
  { key: 'eiken_2', name: '英検2級', category: 'language' },
  { key: 'eiken_pre2', name: '英検準2級', category: 'language' },
  { key: 'eiken_3', name: '英検3級', category: 'language' },
  { key: 'jlpt_n1', name: 'JLPT N1', category: 'language' },
  { key: 'jlpt_n2', name: 'JLPT N2', category: 'language' },
  { key: 'jlpt_n3', name: 'JLPT N3', category: 'language' },
  { key: 'chuken', name: '中国語検定', category: 'language' },
  { key: 'hsk', name: 'HSK', category: 'language' },
  { key: 'topik', name: 'TOPIK（韓国語）', category: 'language' },
  { key: 'doken', name: '独検（ドイツ語）', category: 'language' },
  { key: 'futsuken', name: '仏検（フランス語）', category: 'language' },
  { key: 'niken', name: '日本語検定', category: 'language' },

  // ── IT ──
  { key: 'it_passport', name: 'ITパスポート', category: 'it' },
  { key: 'sg', name: '情報セキュリティマネジメント', category: 'it' },
  { key: 'fe', name: '基本情報技術者', category: 'it' },
  { key: 'ap', name: '応用情報技術者', category: 'it' },
  { key: 'nw', name: 'ネットワークスペシャリスト', category: 'it' },
  { key: 'db', name: 'データベーススペシャリスト', category: 'it' },
  { key: 'sc', name: '情報処理安全確保支援士', category: 'it' },
  { key: 'pm', name: 'プロジェクトマネージャ', category: 'it' },
  { key: 'aws_saa', name: 'AWS SAA', category: 'it' },
  { key: 'aws_sap', name: 'AWS SAP', category: 'it' },
  { key: 'gcp_ace', name: 'Google Cloud ACE', category: 'it' },
  { key: 'az900', name: 'Azure AZ-900', category: 'it' },
  { key: 'lpic1', name: 'LPIC-1 / LinuC', category: 'it' },
  { key: 'ccna', name: 'CCNA', category: 'it' },
  { key: 'mos', name: 'MOS (Microsoft Office)', category: 'it' },
  { key: 'g_kentei', name: 'G検定（AI）', category: 'it' },
  { key: 'e_kentei', name: 'E資格（AI）', category: 'it' },

  // ── ビジネス・会計 ──
  { key: 'boki1', name: '簿記1級', category: 'business' },
  { key: 'boki2', name: '簿記2級', category: 'business' },
  { key: 'boki3', name: '簿記3級', category: 'business' },
  { key: 'fp1', name: 'FP1級', category: 'business' },
  { key: 'fp2', name: 'FP2級', category: 'business' },
  { key: 'fp3', name: 'FP3級', category: 'business' },
  { key: 'cpa', name: '公認会計士', category: 'business' },
  { key: 'tax', name: '税理士', category: 'business' },
  { key: 'smec', name: '中小企業診断士', category: 'business' },
  { key: 'sharoushi', name: '社会保険労務士', category: 'business' },
  { key: 'hisho_1', name: '秘書検定1級', category: 'business' },
  { key: 'hisho_2', name: '秘書検定2級', category: 'business' },
  { key: 'hisho_3', name: '秘書検定3級', category: 'business' },
  { key: 'biz_law2', name: 'ビジネス実務法務2級', category: 'business' },
  { key: 'biz_law3', name: 'ビジネス実務法務3級', category: 'business' },
  { key: 'color', name: '色彩検定', category: 'business' },

  // ── 法律 ──
  { key: 'shihou', name: '司法試験', category: 'law' },
  { key: 'shihou_yobi', name: '司法試験予備試験', category: 'law' },
  { key: 'shihoshoshi', name: '司法書士', category: 'law' },
  { key: 'takken', name: '宅建', category: 'law' },
  { key: 'gyosei', name: '行政書士', category: 'law' },
  { key: 'benrishi', name: '弁理士', category: 'law' },
  { key: 'tsukan', name: '通関士', category: 'law' },

  // ── 公務員 ──
  { key: 'kokka_sogo', name: '国家総合職', category: 'civil_service' },
  { key: 'kokka_ippan', name: '国家一般職', category: 'civil_service' },
  { key: 'kokka_senmmon', name: '国家専門職', category: 'civil_service' },
  { key: 'chihou_jokyu', name: '地方上級', category: 'civil_service' },
  { key: 'shi_yakusho', name: '市役所（教養型）', category: 'civil_service' },
  { key: 'keisatsu', name: '警察官', category: 'civil_service' },
  { key: 'shoubou', name: '消防士', category: 'civil_service' },

  // ── 医療・福祉 ──
  { key: 'kangoshi', name: '看護師', category: 'medical' },
  { key: 'yakuzaishi', name: '薬剤師', category: 'medical' },
  { key: 'ishi', name: '医師国家試験', category: 'medical' },
  { key: 'kaigo', name: '介護福祉士', category: 'medical' },
  { key: 'shakai_fukushi', name: '社会福祉士', category: 'medical' },
  { key: 'seishin_hoken', name: '精神保健福祉士', category: 'medical' },
  { key: 'rinsho_shinri', name: '公認心理師', category: 'medical' },
  { key: 'eiyo', name: '管理栄養士', category: 'medical' },
  { key: 'rigaku', name: '理学療法士', category: 'medical' },
  { key: 'sagyo', name: '作業療法士', category: 'medical' },

  // ── 建築・不動産 ──
  { key: 'ikkyu_kenchiku', name: '一級建築士', category: 'construction' },
  { key: 'nikyu_kenchiku', name: '二級建築士', category: 'construction' },
  { key: 'kanri_gyomu', name: '管理業務主任者', category: 'construction' },
  { key: 'mansion', name: 'マンション管理士', category: 'construction' },
  { key: 'doboku1', name: '1級土木施工管理技士', category: 'construction' },
  { key: 'kenchiku_sekoh1', name: '1級建築施工管理技士', category: 'construction' },

  // ── 教育 ──
  { key: 'kyouin', name: '教員採用試験', category: 'education' },
  { key: 'hoikushi', name: '保育士', category: 'education' },
  { key: 'nihongo_kyoushi', name: '日本語教育能力検定', category: 'education' },
];
