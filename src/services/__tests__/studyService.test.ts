import { summarizeStudyRecords } from '../studyService';
import { StudyRecord } from '../../types';
import { Timestamp } from 'firebase/firestore';

describe('summarizeStudyRecords', () => {
  const makeRecord = (
    subject: string,
    durationMinutes: number,
    date: string
  ): StudyRecord => ({
    id: `test-${Math.random()}`,
    subject,
    slotKey: 'mon_1',
    timetableId: 'tt1',
    durationMinutes,
    date,
    startedAt: Timestamp.now(),
    completedAt: Timestamp.now(),
  });

  it('空配列なら total=0', () => {
    const result = summarizeStudyRecords([]);
    expect(result.totalMinutes).toBe(0);
    expect(Object.keys(result.bySubject)).toHaveLength(0);
  });

  it('科目別に集計される', () => {
    const records = [
      makeRecord('数学', 25, '2026-03-16'),
      makeRecord('英語', 50, '2026-03-16'),
      makeRecord('数学', 25, '2026-03-17'),
    ];
    const result = summarizeStudyRecords(records);
    expect(result.totalMinutes).toBe(100);
    expect(result.bySubject['数学']).toBe(50);
    expect(result.bySubject['英語']).toBe(50);
  });

  it('同一科目が正しく合算される', () => {
    const records = [
      makeRecord('物理', 25, '2026-03-16'),
      makeRecord('物理', 25, '2026-03-16'),
      makeRecord('物理', 25, '2026-03-17'),
    ];
    const result = summarizeStudyRecords(records);
    expect(result.totalMinutes).toBe(75);
    expect(result.bySubject['物理']).toBe(75);
  });
});
