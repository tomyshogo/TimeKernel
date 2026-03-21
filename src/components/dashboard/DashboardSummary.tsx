import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent, Task } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import { subscribeToTasks } from '../../services/taskService';
import { useWeather } from '../../hooks/useWeather';
import { useAuthStore } from '../../stores/authStore';
import { getWeatherEmoji, getSmartClothingSuggestion, formatTemp } from '../../utils/weatherClothing';
import { ForecastEntry } from '../../types/weather';
import { useTrainStatus } from '../../hooks/useTrainStatus';

interface Props {
  uid: string | null;
  events: CalendarEvent[];
  selectedDate: string;
}

export function DashboardSummary({ uid, events, selectedDate }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weatherModalVisible, setWeatherModalVisible] = useState(false);
  const weatherSettings = useAuthStore((s) => s.settings.weather);
  const { weather, refresh } = useWeather(weatherSettings);
  const { subscribedLines, delayedLines, addLine, removeLine } = useTrainStatus();

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToTasks(uid, setTasks);
    return () => unsub();
  }, [uid]);

  const summary = useMemo(() => {
    const todayStr = formatDate(new Date());
    const todayEvents = events.filter((e) => e.date === todayStr && !e.id.startsWith('timetable_'));
    const pendingTasks = tasks.filter((t) => t.status !== 'done');
    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nextEvent = todayEvents
      .filter((e) => e.startTime > nowTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null;

    return {
      todayEventCount: todayEvents.length,
      pendingTaskCount: pendingTasks.length,
      nextEvent,
    };
  }, [events, tasks]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {weather && (
          <TouchableOpacity style={styles.chip} onPress={() => setWeatherModalVisible(true)}>
            <Text style={styles.weatherEmoji}>{getWeatherEmoji(weather.icon)}</Text>
            <Text style={styles.chipBold}>{Math.round(weather.temp)}°</Text>
          </TouchableOpacity>
        )}

        <View style={styles.chip}>
          <Ionicons name="calendar" size={13} color="#3498db" />
          <Text style={styles.chipText}>
            今日 <Text style={styles.chipBold}>{summary.todayEventCount}</Text>件
          </Text>
        </View>

        <TouchableOpacity
          style={styles.chip}
          onPress={() => router.push('/(tabs)/tasks')}
        >
          <Ionicons name="checkbox" size={13} color={summary.pendingTaskCount > 0 ? '#e67e22' : '#2ecc71'} />
          <Text style={styles.chipText}>
            タスク <Text style={styles.chipBold}>{summary.pendingTaskCount}</Text>
          </Text>
        </TouchableOpacity>

        {delayedLines.map((line) => (
          <TouchableOpacity
            key={line.lineId}
            style={[styles.chip, line.status === 'suspended' ? styles.chipSuspended : styles.chipDelay]}
            onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(line.operator + ' ' + line.lineName + ' 運行情報')}`)}
          >
            <Ionicons name="train" size={13} color={line.status === 'suspended' ? '#e74c3c' : '#e67e22'} />
            <Text style={[styles.chipText, { color: line.status === 'suspended' ? '#e74c3c' : '#e67e22', fontWeight: '700' }]} numberOfLines={1}>
              {line.lineName} {line.status === 'suspended' ? '運休' : '遅延'}
            </Text>
          </TouchableOpacity>
        ))}


        {summary.nextEvent && (
          <TouchableOpacity
            style={[styles.chip, styles.nextChip]}
            onPress={() => {
              const e = summary.nextEvent!;
              if (!e.id.startsWith('exam_')) {
                router.push(`/event/${e.id}?calendarId=${e.calendarId}`);
              }
            }}
          >
            <View style={[styles.dot, { backgroundColor: summary.nextEvent.color }]} />
            <Text style={styles.chipText} numberOfLines={1}>
              {summary.nextEvent.startTime} {summary.nextEvent.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {weather && (() => {
        const todayStr = formatDate(new Date());
        const todayEvents = events.filter((e) => e.date === todayStr);
        const suggestion = getSmartClothingSuggestion(weather, todayEvents);
        return (
          <View style={styles.clothingRow}>
            <Text style={styles.clothingIcon}>{suggestion.icon}</Text>
            <View style={styles.clothingContent}>
              <Text style={styles.clothingText}>{suggestion.message}</Text>
              {suggestion.context && (
                <Text style={styles.clothingContext}>{suggestion.context}</Text>
              )}
            </View>
            {suggestion.rainWarning && (
              <Text style={styles.rainWarning}>{suggestion.rainWarning}</Text>
            )}
          </View>
        );
      })()}

      {weather && (
        <Modal visible={weatherModalVisible} transparent animationType="fade" onRequestClose={() => setWeatherModalVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setWeatherModalVisible(false)}>
            <View style={styles.weatherModal} onStartShouldSetResponder={() => true}>
              {/* ヘッダー */}
              <View style={styles.wmHeader}>
                <Text style={styles.wmEmoji}>{getWeatherEmoji(weather.icon)}</Text>
                <View>
                  <Text style={styles.wmTemp}>{Math.round(weather.temp)}℃</Text>
                  <Text style={styles.wmDesc}>{weather.description}</Text>
                </View>
                <View style={styles.wmLocation}>
                  <Ionicons name="location-outline" size={14} color="#95a5a6" />
                  <Text style={styles.wmCityText}>現在地</Text>
                </View>
              </View>

              {/* 気温・降水 */}
              <View style={styles.wmDetailsRow}>
                <View style={styles.wmDetailItem}>
                  <Ionicons name="arrow-up" size={16} color="#e74c3c" />
                  <Text style={styles.wmDetailLabel}>最高</Text>
                  <Text style={styles.wmDetailValue}>{Math.round(weather.tempMax)}℃</Text>
                </View>
                <View style={styles.wmDetailItem}>
                  <Ionicons name="arrow-down" size={16} color="#3498db" />
                  <Text style={styles.wmDetailLabel}>最低</Text>
                  <Text style={styles.wmDetailValue}>{Math.round(weather.tempMin)}℃</Text>
                </View>
                <View style={styles.wmDetailItem}>
                  <Ionicons name="water" size={16} color="#2ecc71" />
                  <Text style={styles.wmDetailLabel}>降水</Text>
                  <Text style={styles.wmDetailValue}>{weather.pop}%</Text>
                </View>
              </View>

              {/* 3時間ごと予報 */}
              {weather.forecast && weather.forecast.length > 0 && (() => {
                const nowTs = Date.now();
                const upcoming = weather.forecast!.filter((f) => new Date(f.dt.replace(' ', 'T')).getTime() > nowTs);
                if (upcoming.length === 0) return null;
                return (
                <View style={styles.wmForecastSection}>
                  <Text style={styles.wmSectionTitle}>今後の天気</Text>
                  <View style={styles.wmForecastRow}>
                    {upcoming.map((f, i) => {
                      const parts = f.dt.split(' ');
                      const time = parts[1]?.substring(0, 5) || '';
                      const date = parts[0] || '';
                      const today = new Date().toISOString().split('T')[0];
                      const isNextDay = date !== today;
                      return (
                        <View key={i} style={styles.wmForecastItem}>
                          <Text style={[styles.wmForecastDate, !isNextDay && { color: 'transparent' }]}>
                            {isNextDay ? '翌日' : '　　'}
                          </Text>
                          <Text style={styles.wmForecastTime}>{time}</Text>
                          <Text style={styles.wmForecastEmoji}>{getWeatherEmoji(f.icon)}</Text>
                          <Text style={styles.wmForecastTemp}>{Math.round(f.temp)}°</Text>
                          <View style={styles.wmForecastPopRow}>
                            <Ionicons name="water" size={8} color="#3498db" />
                            <Text style={styles.wmForecastPop}>{f.pop}%</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
                );
              })()}

              {/* 服装提案 */}
              {(() => {
                const todayStr = formatDate(new Date());
                const todayEvents = events.filter((e) => e.date === todayStr);
                const suggestion = getSmartClothingSuggestion(weather, todayEvents);
                return (
                  <View style={styles.wmClothing}>
                    <Text style={styles.wmSectionTitle}>服装提案</Text>
                    <View style={styles.wmClothingRow}>
                      <Text style={styles.wmClothingIcon}>{suggestion.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wmClothingText}>{suggestion.message}</Text>
                        {suggestion.context && (
                          <Text style={styles.wmClothingContext}>{suggestion.context}</Text>
                        )}
                      </View>
                    </View>
                    {suggestion.rainWarning && (
                      <Text style={styles.wmRainWarning}>{suggestion.rainWarning}</Text>
                    )}
                  </View>
                );
              })()}

              <TouchableOpacity style={styles.wmCloseBtn} onPress={() => setWeatherModalVisible(false)}>
                <Text style={styles.wmCloseBtnText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  nextChip: {
    flex: 1,
  },
  weatherEmoji: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  chipBold: {
    fontWeight: '700',
    color: '#2c3e50',
    fontSize: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  clothingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  clothingIcon: {
    fontSize: 13,
  },
  clothingContent: {
    flex: 1,
  },
  clothingText: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  clothingContext: {
    fontSize: 10,
    color: '#b0b8c8',
    marginTop: 1,
  },
  rainWarning: {
    fontSize: 11,
    color: '#3498db',
    fontWeight: '700',
  },
  chipDelay: {
    backgroundColor: '#fef3e6',
    borderColor: '#e67e2233',
  },
  chipSuspended: {
    backgroundColor: '#fde8e8',
    borderColor: '#e74c3c33',
  },
  // Weather modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '88%',
    maxWidth: 360,
  },
  wmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  wmEmoji: {
    fontSize: 40,
  },
  wmTemp: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
  },
  wmDesc: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  wmLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  wmCityText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  wmDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  wmDetailItem: {
    alignItems: 'center',
    gap: 4,
  },
  wmDetailLabel: {
    fontSize: 11,
    color: '#95a5a6',
    fontWeight: '600',
  },
  wmDetailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  wmForecastSection: {
    marginBottom: 16,
  },
  wmSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  wmForecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  wmForecastItem: {
    alignItems: 'center',
    gap: 2,
  },
  wmForecastTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  wmForecastEmoji: {
    fontSize: 20,
  },
  wmForecastTemp: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2c3e50',
  },
  wmForecastDate: {
    fontSize: 9,
    color: '#e67e22',
    fontWeight: '700',
  },
  wmForecastPopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  wmForecastPop: {
    fontSize: 10,
    color: '#3498db',
    fontWeight: '600',
  },
  wmClothing: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  wmClothingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wmClothingIcon: {
    fontSize: 20,
  },
  wmClothingText: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600',
  },
  wmClothingContext: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 2,
  },
  wmRainWarning: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '700',
    marginTop: 8,
  },
  wmCloseBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f7fa',
  },
  wmCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
});
