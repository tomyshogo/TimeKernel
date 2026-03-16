import { Timestamp } from 'firebase/firestore';

export type TaskType = 'assignment' | 'exam' | 'report';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  description: string;
  deadline: Timestamp;
  status: TaskStatus;
  createdAt: Timestamp;
  /** 通知タイミング（分前） */
  reminderMinutes: number[];
  /** 紐づく科目名 */
  subject: string;
  /** 紐づくスロットキー (例: "mon_1") */
  slotKey: string;
  /** 紐づく時間割ID */
  timetableId: string;
}

export type TaskInput = Omit<Task, 'id' | 'createdAt'>;

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  assignment: '課題',
  exam: 'テスト',
  report: 'レポート',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '未着手',
  in_progress: '進行中',
  done: '完了',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#e74c3c',
  in_progress: '#f39c12',
  done: '#2ecc71',
};

export const DEFAULT_REMINDER_MINUTES = [1440, 180, 60]; // 1日前, 3時間前, 1時間前
