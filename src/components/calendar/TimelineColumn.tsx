import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarEvent } from '../../types';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface Props {
  date: Date;
  events: CalendarEvent[];
  columnWidth: number;
  showTimeLabels: boolean;
  onEventPress: (event: CalendarEvent) => void;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function TimelineColumn({
  date,
  events,
  columnWidth,
  showTimeLabels,
  onEventPress,
}: Props) {
  const TIME_LABEL_WIDTH = showTimeLabels ? 44 : 0;

  return (
    <View style={[styles.column, { width: columnWidth }]}>
      {/* 時間グリッド */}
      {HOURS.map((hour) => (
        <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
          {showTimeLabels && (
            <Text style={styles.timeLabel}>
              {String(hour).padStart(2, '0')}
            </Text>
          )}
          <View style={styles.hourLine} />
        </View>
      ))}

      {/* イベントブロック */}
      {events.map((event) => {
        const startMin = timeToMinutes(event.startTime);
        const endMin = timeToMinutes(event.endTime);
        const duration = Math.max(endMin - startMin, 15);
        const top = (startMin / 60) * HOUR_HEIGHT;
        const height = (duration / 60) * HOUR_HEIGHT;

        return (
          <TouchableOpacity
            key={event.id}
            style={[
              styles.eventBlock,
              {
                top,
                height: Math.max(height, 20),
                left: TIME_LABEL_WIDTH + 2,
                right: 2,
                backgroundColor: event.color + 'DD',
              },
            ]}
            onPress={() => onEventPress(event)}
            activeOpacity={0.7}
          >
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
            {height > 28 && (
              <Text style={styles.eventTime}>
                {event.startTime}-{event.endTime}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    position: 'relative',
  },
  hourRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  timeLabel: {
    width: 44,
    fontSize: 11,
    color: '#95a5a6',
    textAlign: 'right',
    paddingRight: 6,
    paddingTop: 2,
  },
  hourLine: {
    flex: 1,
  },
  eventBlock: {
    position: 'absolute',
    borderRadius: 4,
    padding: 4,
    overflow: 'hidden',
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  eventTime: {
    fontSize: 10,
    color: '#ffffffCC',
  },
});
