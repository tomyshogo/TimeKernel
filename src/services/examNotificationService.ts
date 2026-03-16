import * as Notifications from 'expo-notifications';
import { ExamSchedule } from '../types/exam';

interface ExamReminder {
  daysBefore: number;
  titleFn: (name: string) => string;
  bodyFn: (name: string) => string;
}

const APPLICATION_REMINDERS: ExamReminder[] = [
  {
    daysBefore: 0,
    titleFn: (name) => `📋 ${name}`,
    bodyFn: (name) => `${name}の申込みが始まりました`,
  },
];

const DEADLINE_REMINDERS: ExamReminder[] = [
  {
    daysBefore: 7,
    titleFn: (name) => `⚠️ ${name}`,
    bodyFn: (name) => `${name}の申込み締切まであと7日`,
  },
  {
    daysBefore: 1,
    titleFn: (name) => `🔴 ${name}`,
    bodyFn: (name) => `${name}の申込み締切は明日！`,
  },
];

const EXAM_DAY_REMINDERS: ExamReminder[] = [
  {
    daysBefore: 3,
    titleFn: (name) => `📝 ${name}`,
    bodyFn: (name) => `${name}の試験まであと3日。持ち物を確認しよう`,
  },
  {
    daysBefore: 0,
    titleFn: (name) => `🎯 ${name}`,
    bodyFn: (name) => `今日は${name}の試験日。頑張って！`,
  },
];

/**
 * 資格試験のリマインド通知を一括スケジュール
 */
export async function scheduleExamReminders(
  exams: ExamSchedule[]
): Promise<void> {
  // 既存の試験通知をキャンセル
  await cancelExamReminders();

  const now = new Date();

  for (const exam of exams) {
    // 申込開始のリマインダー
    scheduleReminders(exam, exam.applicationStart.toDate(), APPLICATION_REMINDERS, 'appstart', now);

    // 申込締切のリマインダー
    scheduleReminders(exam, exam.applicationDeadline.toDate(), DEADLINE_REMINDERS, 'deadline', now);

    // 試験日のリマインダー
    scheduleReminders(exam, exam.examDate.toDate(), EXAM_DAY_REMINDERS, 'exam', now);
  }
}

async function scheduleReminders(
  exam: ExamSchedule,
  baseDate: Date,
  reminders: ExamReminder[],
  type: string,
  now: Date
): Promise<void> {
  for (const reminder of reminders) {
    const triggerDate = new Date(baseDate);
    triggerDate.setDate(triggerDate.getDate() - reminder.daysBefore);
    triggerDate.setHours(8, 0, 0, 0); // 朝8時に通知

    if (triggerDate <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `exam_${exam.id}_${type}_${reminder.daysBefore}`,
      content: {
        title: reminder.titleFn(exam.name),
        body: reminder.bodyFn(exam.name),
        data: {
          type: 'exam_reminder',
          examId: exam.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'reminders',
      },
    });
  }
}

/**
 * 試験関連の通知をすべてキャンセル
 */
export async function cancelExamReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier.startsWith('exam_')) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}
