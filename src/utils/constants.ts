export const EVENT_COLORS = {
  class: '#3498db',
  event: '#e74c3c',
  shift: '#2ecc71',
} as const;

export const CALENDAR_COLORS = [
  // Row 1: 基本色
  '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
  // Row 2: ライト
  '#85c1e9', '#f1948a', '#82e0aa', '#f9e79f',
  '#c39bd3', '#76d7c4', '#f0b27a', '#aeb6bf',
  // Row 3: ダーク・アクセント
  '#2471a3', '#c0392b', '#1e8449', '#d4ac0d',
  '#7d3c98', '#148f77', '#ca6f1e', '#2c3e50',
];

export const EVENT_TYPE_LABELS = {
  class: '授業',
  event: '予定',
  shift: 'バイト',
} as const;
