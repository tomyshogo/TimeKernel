import React, { useRef } from 'react';
import { View, StyleSheet, Text, PanResponder } from 'react-native';
import { DayCell, DayEventItem } from './DayCell';
import { CalendarHeader } from './CalendarHeader';
import { getDaysInMonthGrid } from '../../utils/dateHelpers';
import { CalendarEvent } from '../../types';

interface Props {
  currentMonth: Date;
  selectedDate: string;
  events: CalendarEvent[];
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onChangeMonth?: (date: Date) => void;
  showTimetable?: boolean;
  onToggleTimetable?: () => void;
}

interface MultiDayBar {
  event: CalendarEvent;
  startCol: number;
  endCol: number;
  isEventStart: boolean;
  isEventEnd: boolean;
  lane: number;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const SWIPE_THRESHOLD = 50;
const MAX_BARS = 2;
const BAR_HEIGHT = 13;
const BAR_GAP = 1;

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function MonthView({
  currentMonth,
  selectedDate,
  events,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onChangeMonth,
  showTimetable,
  onToggleTimetable,
}: Props) {
  const days = getDaysInMonthGrid(currentMonth);
  const swipeHandled = useRef(false);
  const onPrevRef = useRef(onPrevMonth);
  const onNextRef = useRef(onNextMonth);
  onPrevRef.current = onPrevMonth;
  onNextRef.current = onNextMonth;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onShouldBlockNativeResponder: () => false,
      onPanResponderGrant: () => {
        swipeHandled.current = false;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (swipeHandled.current) return;
        if (gestureState.dx > SWIPE_THRESHOLD) {
          swipeHandled.current = true;
          onPrevRef.current();
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          swipeHandled.current = true;
          onNextRef.current();
        }
      },
    })
  ).current;

  const gridDateStrs = days.map(toDateStr);

  // Separate multi-day and single-day events
  const multiDayEvents = events.filter((e) => e.endDate && e.endDate > e.date);
  const singleDayEvents = events.filter((e) => !e.endDate || e.endDate <= e.date);

  // Single-day events by date
  const singleByDate = new Map<string, DayEventItem[]>();
  for (const event of singleDayEvents) {
    const list = singleByDate.get(event.date) || [];
    list.push({ event, span: 'single' });
    singleByDate.set(event.date, list);
  }

  // Split grid into weeks
  const weeks: string[][] = [];
  for (let i = 0; i < gridDateStrs.length; i += 7) {
    weeks.push(gridDateStrs.slice(i, i + 7));
  }

  // Compute multi-day bars for each week row
  const barsByWeek: MultiDayBar[][] = weeks.map((weekDates) => {
    const rowStart = weekDates[0];
    const rowEnd = weekDates[6];
    const bars: MultiDayBar[] = [];

    for (const event of multiDayEvents) {
      const evStart = event.date;
      const evEnd = event.endDate!;
      // Does this event overlap with this week?
      if (evStart > rowEnd || evEnd < rowStart) continue;

      const startCol = evStart <= rowStart ? 0 : weekDates.indexOf(evStart);
      const endCol = evEnd >= rowEnd ? 6 : weekDates.indexOf(evEnd);
      if (startCol < 0 || endCol < 0) continue;

      bars.push({
        event,
        startCol,
        endCol,
        isEventStart: evStart >= rowStart && evStart <= rowEnd,
        isEventEnd: evEnd >= rowStart && evEnd <= rowEnd,
        lane: 0,
      });
    }

    // Assign lanes (simple greedy)
    bars.sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol));
    const laneEnds: number[] = [];
    for (const bar of bars) {
      let assigned = false;
      for (let lane = 0; lane < laneEnds.length; lane++) {
        if (laneEnds[lane] < bar.startCol) {
          bar.lane = lane;
          laneEnds[lane] = bar.endCol;
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        bar.lane = laneEnds.length;
        laneEnds.push(bar.endCol);
      }
    }

    return bars;
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <CalendarHeader
        month={currentMonth}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
        onChangeMonth={onChangeMonth}
        showTimetable={showTimetable}
        onToggleTimetable={onToggleTimetable}
      />
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                i === 0 && { color: '#e74c3c' },
                i === 6 && { color: '#3498db' },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {weeks.map((weekDates, weekIndex) => {
          const bars = barsByWeek[weekIndex];
          const visibleBars = bars.filter((b) => b.lane < MAX_BARS);
          const barAreaHeight = Math.min(bars.length, MAX_BARS) * (BAR_HEIGHT + BAR_GAP);
          const hasOverflow = bars.length > MAX_BARS;

          return (
            <View key={weekIndex} style={styles.weekRow}>
              {/* Day cells */}
              <View style={styles.weekCells}>
                {weekDates.map((dateStr, colIndex) => {
                  const dayIndex = weekIndex * 7 + colIndex;
                  const day = days[dayIndex];
                  return (
                    <DayCell
                      key={dayIndex}
                      date={day}
                      currentMonth={currentMonth}
                      isSelected={dateStr === selectedDate}
                      events={singleByDate.get(dateStr) || []}
                      onPress={() => onSelectDate(dateStr)}
                      multiDayBarHeight={barAreaHeight}
                    />
                  );
                })}
              </View>
              {/* Multi-day bars overlay */}
              {visibleBars.map((bar, bi) => {
                const leftPct = (bar.startCol / 7) * 100;
                const widthPct = ((bar.endCol - bar.startCol + 1) / 7) * 100;
                const top = 28 + bar.lane * (BAR_HEIGHT + BAR_GAP);
                const color = bar.event.color;

                return (
                  <View
                    key={`${bar.event.id}-${bi}`}
                    style={[
                      styles.multiDayBar,
                      {
                        left: `${leftPct}%` as any,
                        width: `${widthPct}%` as any,
                        top,
                        height: BAR_HEIGHT,
                        backgroundColor: color + '30',
                        borderLeftWidth: bar.isEventStart ? 2.5 : 0,
                        borderLeftColor: color,
                        borderRightWidth: bar.isEventEnd ? 2.5 : 0,
                        borderRightColor: color,
                        borderTopLeftRadius: bar.isEventStart ? 4 : 0,
                        borderBottomLeftRadius: bar.isEventStart ? 4 : 0,
                        borderTopRightRadius: bar.isEventEnd ? 4 : 0,
                        borderBottomRightRadius: bar.isEventEnd ? 4 : 0,
                        paddingLeft: bar.isEventStart ? 3 : 2,
                        paddingRight: bar.isEventEnd ? 3 : 2,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.multiDayTitle, { color }]}
                      numberOfLines={1}
                    >
                      {bar.event.title}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  grid: {
    flex: 1,
    paddingHorizontal: 8,
  },
  weekRow: {
    flex: 1,
    position: 'relative',
  },
  weekCells: {
    flexDirection: 'row',
  },
  multiDayBar: {
    position: 'absolute',
    justifyContent: 'center',
    zIndex: 1,
  },
  multiDayTitle: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
});
