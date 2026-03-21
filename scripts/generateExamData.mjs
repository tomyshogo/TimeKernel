/**
 * Claude APIを使って資格試験スケジュールデータをカテゴリ別に生成するスクリプト
 * GitHub Actionsから実行される（リリース後は3ヶ月に1回自動実行）
 *
 * C案: カテゴリごとに個別APIコールで確実に全データ取得
 * コスト目安: Haiku使用で1回あたり約¥22（8カテゴリ合計）
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set');
  process.exit(1);
}

import { writeFileSync } from 'fs';

const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;

// CBT随時受験の資格はハードコード（API不要）
const CBT_EXAMS = [
  { id: 'toefl_cbt', name: 'TOEFL iBT（CBT随時）', examKey: 'toefl', category: 'language', fee: '約$245', notes: 'CBT方式で随時受験可能' },
  { id: 'ielts_cbt', name: 'IELTS（CBT随時）', examKey: 'ielts', category: 'language', fee: '25,380円', notes: 'CBT方式で随時受験可能' },
  { id: 'it_passport_cbt', name: 'ITパスポート（CBT随時）', examKey: 'it_passport', category: 'it', fee: '7,500円', notes: 'CBT方式で随時受験可能' },
  { id: 'sg_cbt', name: '情報セキュリティマネジメント（CBT随時）', examKey: 'sg', category: 'it', fee: '7,500円', notes: 'CBT方式で随時受験可能' },
  { id: 'fe_cbt', name: '基本情報技術者（CBT随時）', examKey: 'fe', category: 'it', fee: '7,500円', notes: 'CBT方式で随時受験可能' },
  { id: 'aws_saa_cbt', name: 'AWS SAA（CBT随時）', examKey: 'aws_saa', category: 'it', fee: '20,000円', notes: 'CBT方式で随時受験可能' },
  { id: 'aws_sap_cbt', name: 'AWS SAP（CBT随時）', examKey: 'aws_sap', category: 'it', fee: '40,000円', notes: 'CBT方式で随時受験可能' },
  { id: 'gcp_ace_cbt', name: 'Google Cloud ACE（CBT随時）', examKey: 'gcp_ace', category: 'it', fee: '$200', notes: 'CBT方式で随時受験可能' },
  { id: 'az900_cbt', name: 'Azure AZ-900（CBT随時）', examKey: 'az900', category: 'it', fee: '13,200円', notes: 'CBT方式で随時受験可能' },
  { id: 'lpic1_cbt', name: 'LPIC-1 / LinuC（CBT随時）', examKey: 'lpic1', category: 'it', fee: '16,500円', notes: 'CBT方式で随時受験可能' },
  { id: 'ccna_cbt', name: 'CCNA（CBT随時）', examKey: 'ccna', category: 'it', fee: '約$330', notes: 'CBT方式で随時受験可能' },
  { id: 'mos_cbt', name: 'MOS（CBT随時）', examKey: 'mos', category: 'it', fee: '10,780円', notes: 'CBT方式で随時受験可能' },
  { id: 'fp3_cbt', name: 'FP3級（CBT随時）', examKey: 'fp3', category: 'business', fee: '8,000円', notes: 'CBT方式で随時受験可能' },
];

// カテゴリ別の取得対象（CBT随時を除く）
const CATEGORIES = [
  {
    name: '語学',
    category: 'language',
    exams: `- TOEIC L&R (key: "toeic_lr") - 年10回程度、各回の試験日・申込期間
- TOEIC S&W (key: "toeic_sw") - 年10回程度
- 英検1級 (key: "eiken_1") - 年3回(6月/10月/1月)、一次試験日
- 英検準1級 (key: "eiken_pre1") - 年3回
- 英検2級 (key: "eiken_2") - 年3回
- 英検準2級 (key: "eiken_pre2") - 年3回
- 英検3級 (key: "eiken_3") - 年3回
- JLPT N1 (key: "jlpt_n1") - 年2回(7月/12月)
- JLPT N2 (key: "jlpt_n2") - 年2回
- JLPT N3 (key: "jlpt_n3") - 年2回
- 中国語検定 (key: "chuken") - 年3回(3月/6月/11月)
- HSK (key: "hsk") - ほぼ毎月
- TOPIK (key: "topik") - 年3回
- 独検 (key: "doken") - 年2回(6月/11月)
- 仏検 (key: "futsuken") - 年2回(6月/11月)
- 日本語検定 (key: "niken") - 年2回(6月/11月)`
  },
  {
    name: 'IT',
    category: 'it',
    exams: `- 応用情報技術者 (key: "ap") - 年2回(春4月/秋10月)
- ネットワークスペシャリスト (key: "nw") - 年1回(秋)
- データベーススペシャリスト (key: "db") - 年1回(春)
- 情報処理安全確保支援士 (key: "sc") - 年2回(春/秋)
- プロジェクトマネージャ (key: "pm") - 年1回(秋)
- G検定 (key: "g_kentei") - 年数回
- E資格 (key: "e_kentei") - 年2回`
  },
  {
    name: 'ビジネス・会計',
    category: 'business',
    exams: `- 簿記1級 (key: "boki1") - 年2回(6月/11月)
- 簿記2級 (key: "boki2") - 統一試験年3回(2月/6月/11月)
- 簿記3級 (key: "boki3") - 統一試験年3回(2月/6月/11月)
- FP1級 (key: "fp1") - 年3回(1月/5月/9月)
- FP2級 (key: "fp2") - 年3回(1月/5月/9月)
- 公認会計士 (key: "cpa") - 短答年2回(5月/12月) + 論文(8月)
- 税理士 (key: "tax") - 年1回(8月)
- 中小企業診断士 (key: "smec") - 1次(8月) + 2次(10月)
- 社会保険労務士 (key: "sharoushi") - 年1回(8月)
- 秘書検定1級 (key: "hisho_1") - 年2回(6月/11月)
- 秘書検定2級 (key: "hisho_2") - 年3回(2月/6月/11月)
- 秘書検定3級 (key: "hisho_3") - 年3回(2月/6月/11月)
- ビジネス実務法務2級 (key: "biz_law2") - 年2回(6月/12月)
- ビジネス実務法務3級 (key: "biz_law3") - 年2回(6月/12月)
- 色彩検定 (key: "color") - 年2回(6月/11月)`
  },
  {
    name: '法律',
    category: 'law',
    exams: `- 司法試験 (key: "shihou") - 年1回(7月)
- 司法試験予備試験 (key: "shihou_yobi") - 短答(5月)/論文(7月)/口述(10月)
- 司法書士 (key: "shihoshoshi") - 筆記(7月)/口述(10月)
- 宅建 (key: "takken") - 年1回(10月第3日曜)
- 行政書士 (key: "gyosei") - 年1回(11月第2日曜)
- 弁理士 (key: "benrishi") - 短答(5月)/論文(7月)/口述(10月)
- 通関士 (key: "tsukan") - 年1回(10月)`
  },
  {
    name: '公務員',
    category: 'civil_service',
    exams: `- 国家総合職 (key: "kokka_sogo") - 1次(4月)/2次(5月)
- 国家一般職 (key: "kokka_ippan") - 1次(6月)/2次(7月)
- 国家専門職 (key: "kokka_senmon") - 1次(6月)
- 地方上級 (key: "chihou_jokyu") - 6月下旬
- 市役所 (key: "shi_yakusho") - 7-9月
- 警察官 (key: "keisatsu") - 年2-3回(5月/9月/1月)
- 消防士 (key: "shoubou") - 年1-2回`
  },
  {
    name: '医療・福祉',
    category: 'medical',
    exams: `- 看護師 (key: "kangoshi") - 年1回(2月)
- 薬剤師 (key: "yakuzaishi") - 年1回(2月)
- 医師国家試験 (key: "ishi") - 年1回(2月)
- 介護福祉士 (key: "kaigo") - 筆記(1月)/実技(3月)
- 社会福祉士 (key: "shakai_fukushi") - 年1回(2月)
- 精神保健福祉士 (key: "seishin_hoken") - 年1回(2月)
- 公認心理師 (key: "rinsho_shinri") - 年1回(7月)
- 管理栄養士 (key: "eiyo") - 年1回(2月)
- 理学療法士 (key: "rigaku") - 年1回(2月)
- 作業療法士 (key: "sagyo") - 年1回(2月)`
  },
  {
    name: '建築・不動産',
    category: 'construction',
    exams: `- 一級建築士 (key: "ikkyu_kenchiku") - 学科(7月)/設計(10月)
- 二級建築士 (key: "nikyu_kenchiku") - 学科(7月)/設計(9月)
- 管理業務主任者 (key: "kanri_gyomu") - 年1回(12月)
- マンション管理士 (key: "mansion") - 年1回(11月)
- 1級土木施工管理技士 (key: "doboku1") - 1次(7月)/2次(10月)
- 1級建築施工管理技士 (key: "kenchiku_sekoh1") - 1次(6月)/2次(10月)`
  },
  {
    name: '教育',
    category: 'education',
    exams: `- 教員採用試験 (key: "kyouin") - 1次(7月)/2次(8月) ※自治体により異なる
- 保育士 (key: "hoikushi") - 前期(4月)/後期(10月)
- 日本語教育能力検定 (key: "nihongo_kyoushi") - 年1回(10月)`
  },
];

function buildPrompt(cat) {
  return `あなたは日本の資格試験スケジュールのデータベースを管理するアシスタントです。

「${cat.name}」カテゴリの以下の資格について、${currentYear}年と${nextYear}年のスケジュールデータを生成してください。
公式発表に基づく正確な日程を優先し、未発表の場合は過去のパターンから推定してください。

対象:
${cat.exams}

出力: 純粋なJSON配列のみ（説明やマークダウン不要）
各エントリ:
{"id":"key_year_XX","name":"試験名","examKey":"key","category":"${cat.category}","examDate":"YYYY-MM-DD","applicationStart":"YYYY-MM-DD","applicationDeadline":"YYYY-MM-DD","fee":"金額","year":YYYY}

ルール:
- idはユニーク（key_year_月）
- 複数回ある試験は各回を個別エントリにする
- fee は「7,810円」形式
- 推定日程にはnotesフィールドを追加: "notes":"日程は推定"
- 過去の日付も含める`;
}

async function callClaude(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json|typescript|ts|javascript|js)?\n?/gm, '').replace(/```$/gm, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // 配列部分を抽出
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse response');
  }
}

async function main() {
  console.log(`Generating exam data for ${currentYear}-${nextYear} (category-by-category)...\n`);

  const allEntries = [];

  // CBT随時をハードコード追加
  for (const cbt of CBT_EXAMS) {
    for (const year of [currentYear, nextYear]) {
      allEntries.push({
        id: `${cbt.id}_${year}`,
        name: cbt.name,
        examKey: cbt.examKey,
        category: cbt.category,
        examDate: `${year}-04-01`,
        applicationStart: `${year}-01-01`,
        applicationDeadline: `${year}-12-31`,
        fee: cbt.fee,
        notes: cbt.notes,
        year,
      });
    }
  }
  console.log(`  CBT随時: ${CBT_EXAMS.length} resources × 2 years = ${CBT_EXAMS.length * 2} entries`);

  // カテゴリ別にAPI取得
  for (const cat of CATEGORIES) {
    try {
      console.log(`  ${cat.name}...`);
      const result = await callClaude(buildPrompt(cat));
      const entries = parseResponse(result);
      allEntries.push(...entries);
      console.log(`    → ${entries.length} entries`);
    } catch (err) {
      console.error(`    ✗ Failed: ${err.message}`);
    }
    // レートリミット回避
    await new Promise((r) => setTimeout(r, 1000));
  }

  const fileContent = `/**
 * 資格試験のスケジュールマスターデータ（ローカル）
 * このファイルはGitHub Actions + Claude APIにより自動生成されます。
 * 手動編集も可能ですが、次回の自動更新で上書きされる可能性があります。
 *
 * 最終更新: ${new Date().toISOString().split('T')[0]}
 * 対象年度: ${currentYear}-${nextYear}
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
  year: number;
}

export const EXAM_SCHEDULES: LocalExamSchedule[] = ${JSON.stringify(allEntries, null, 2)};
`;

  writeFileSync('src/data/examData.ts', fileContent, 'utf-8');
  console.log(`\nDone! ${allEntries.length} total entries written to src/data/examData.ts`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
