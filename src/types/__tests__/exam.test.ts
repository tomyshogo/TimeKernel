import {
  EXAM_CATEGORY_LABELS,
  EXAM_MASTERS,
  ExamCategory,
  DEFAULT_SUBSCRIBED_EXAMS,
} from '../exam';

describe('EXAM_MASTERS', () => {
  it('全16資格が定義されている', () => {
    expect(EXAM_MASTERS).toHaveLength(16);
  });

  it('全資格にkey, name, categoryが設定されている', () => {
    for (const exam of EXAM_MASTERS) {
      expect(exam.key).toBeTruthy();
      expect(exam.name).toBeTruthy();
      expect(exam.category).toBeTruthy();
    }
  });

  it('keyが全てユニーク', () => {
    const keys = EXAM_MASTERS.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('全カテゴリが少なくとも1つの資格を持つ', () => {
    const categories: ExamCategory[] = ['language', 'it', 'business', 'law', 'civil_service'];
    for (const cat of categories) {
      const count = EXAM_MASTERS.filter((e) => e.category === cat).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it('語学カテゴリに4資格', () => {
    const language = EXAM_MASTERS.filter((e) => e.category === 'language');
    expect(language).toHaveLength(4);
  });

  it('ITカテゴリに3資格', () => {
    const it = EXAM_MASTERS.filter((e) => e.category === 'it');
    expect(it).toHaveLength(3);
  });
});

describe('EXAM_CATEGORY_LABELS', () => {
  it('全カテゴリにラベルが定義されている', () => {
    const categories: ExamCategory[] = ['language', 'it', 'business', 'law', 'civil_service'];
    for (const cat of categories) {
      expect(EXAM_CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it('ラベルが日本語', () => {
    expect(EXAM_CATEGORY_LABELS.language).toBe('語学');
    expect(EXAM_CATEGORY_LABELS.it).toBe('IT');
    expect(EXAM_CATEGORY_LABELS.business).toBe('ビジネス');
    expect(EXAM_CATEGORY_LABELS.law).toBe('法律');
    expect(EXAM_CATEGORY_LABELS.civil_service).toBe('公務員');
  });
});

describe('DEFAULT_SUBSCRIBED_EXAMS', () => {
  it('初期値は空', () => {
    expect(DEFAULT_SUBSCRIBED_EXAMS.categories).toHaveLength(0);
    expect(DEFAULT_SUBSCRIBED_EXAMS.exams).toHaveLength(0);
  });
});
