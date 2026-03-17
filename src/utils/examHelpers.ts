import { Timestamp } from 'firebase/firestore';
import { ExamSchedule } from '../types/exam';
import { CalendarEvent } from '../types/event';
import { format } from 'date-fns';

const EXAM_COLOR = '#8e44ad';
const DEADLINE_COLOR = '#e74c3c';

/**
 * ExamSchedule を CalendarEvent に変換してカレンダーに表示
 */
export function generateExamCalendarEvents(
  exams: ExamSchedule[],
  uid: string
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const exam of exams) {
    // 試験日
    events.push({
      id: `exam_${exam.id}_date`,
      title: `📝 ${exam.name}`,
      type: 'event',
      date: formatTimestamp(exam.examDate),
      startTime: '09:00',
      endTime: '17:00',
      color: EXAM_COLOR,
      createdBy: uid,
      createdAt: Timestamp.now(),
      calendarId: '__exam__',
      members: [uid],
    });

    // 申込み開始日
    events.push({
      id: `exam_${exam.id}_appstart`,
      title: `📋 ${exam.name} 申込開始`,
      type: 'event',
      date: formatTimestamp(exam.applicationStart),
      startTime: '00:00',
      endTime: '23:59',
      color: '#3498db',
      createdBy: uid,
      createdAt: Timestamp.now(),
      calendarId: '__exam__',
      members: [uid],
    });

    // 申込み締切日
    events.push({
      id: `exam_${exam.id}_deadline`,
      title: `🔴 ${exam.name} 申込締切`,
      type: 'event',
      date: formatTimestamp(exam.applicationDeadline),
      startTime: '00:00',
      endTime: '23:59',
      color: DEADLINE_COLOR,
      createdBy: uid,
      createdAt: Timestamp.now(),
      calendarId: '__exam__',
      members: [uid],
    });
  }

  return events;
}

function formatTimestamp(ts: Timestamp): string {
  return format(ts.toDate(), 'yyyy-MM-dd');
}

/**
 * 試験日までの残り日数を計算
 */
export function getDaysUntilExam(examDate: Timestamp): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = examDate.toDate();
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
