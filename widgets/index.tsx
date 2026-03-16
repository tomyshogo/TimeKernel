/**
 * ウィジェット定義ファイル
 *
 * expo-widgets を使用してネイティブウィジェットを定義する。
 * iOS: WidgetKit (SwiftUI)
 * Android: Glance (Jetpack Compose)
 *
 * データは widgetService から SharedPreferences/UserDefaults 経由で受け渡す。
 */

export const widgets = {
  todaySchedule: {
    name: 'TodayScheduleWidget',
    description: '今日の予定を表示',
    sizes: ['small', 'medium'] as const,
    dataKey: 'widget:todayEvents',
  },
  nextEvent: {
    name: 'NextEventWidget',
    description: '次の予定を表示',
    sizes: ['small'] as const,
    dataKey: 'widget:nextEvent',
  },
  monthlyShift: {
    name: 'MonthlyShiftWidget',
    description: '今月のバイト代を表示',
    sizes: ['small'] as const,
    dataKey: 'widget:monthlyShiftSummary',
  },
  weekCalendar: {
    name: 'WeekCalendarWidget',
    description: '今週の予定を簡易表示',
    sizes: ['medium'] as const,
    dataKey: 'widget:weekEvents',
  },
} as const;

export type WidgetType = keyof typeof widgets;
