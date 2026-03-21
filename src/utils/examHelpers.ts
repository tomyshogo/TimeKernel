import { LocalExamSchedule, getExamSearchUrl } from '../data/examData';
import { CalendarEvent } from '../types/event';

const EXAM_COLOR = '#8e44ad';
const DEADLINE_COLOR = '#e74c3c';

/**
 * LocalExamSchedule を CalendarEvent に変換してカレンダーに表示
 */
export function generateExamCalendarEvents(
  exams: LocalExamSchedule[],
  uid: string
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const exam of exams) {
    const url = getExamSearchUrl(exam.name);

    // 試験日
    events.push({
      id: `exam_${exam.id}_date`,
      title: `${exam.name}`,
      type: 'event',
      date: exam.examDate,
      startTime: '09:00',
      endTime: '17:00',
      isAllDay: true,
      color: EXAM_COLOR,
      createdBy: uid,
      createdAt: null,
      calendarId: '__exam__',
      members: [uid],
      url,
    });

    // 申込み締切日
    events.push({
      id: `exam_${exam.id}_deadline`,
      title: `${exam.name} 申込締切`,
      type: 'event',
      date: exam.applicationDeadline,
      startTime: '00:00',
      endTime: '23:59',
      isAllDay: true,
      color: DEADLINE_COLOR,
      createdBy: uid,
      createdAt: null,
      calendarId: '__exam__',
      members: [uid],
      url,
    });
  }

  return events;
}

/**
 * 試験日までの残り日数を計算
 */
export function getDaysUntilExam(examDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(examDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 残り日数のラベルを返す
 */
export function getDaysLabel(days: number): string {
  if (days < 0) return '終了';
  if (days === 0) return '今日';
  if (days === 1) return '明日';
  return `あと${days}日`;
}
