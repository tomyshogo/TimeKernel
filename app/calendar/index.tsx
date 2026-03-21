import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useCalendars } from '../../src/hooks/useCalendars';
import { useAuthStore } from '../../src/stores/authStore';
import { Card } from '../../src/components/ui/Card';

const CAL_COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

export default function CalendarListScreen() {
  const router = useRouter();
  const { calendars } = useCalendars();
  const uid = useAuthStore((s) => s.uid);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* カレンダー一覧 */}
        <Animated.View entering={FadeInDown.duration(300).springify()}>
          <Card>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={18} color="#3498db" />
              <Text style={styles.sectionTitle}>マイカレンダー</Text>
              <Text style={styles.sectionCount}>{calendars.length}件</Text>
            </View>

            {calendars.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={40} color="#d5d8dc" />
                <Text style={styles.emptyText}>カレンダーがありません</Text>
                <Text style={styles.emptySubText}>新しいカレンダーを作成しましょう</Text>
              </View>
            ) : (
              calendars.map((cal, i) => {
                const color = CAL_COLORS[i % CAL_COLORS.length];
                const isOwner = cal.createdBy === uid;
                const isShared = cal.members.length > 1;
                return (
                  <TouchableOpacity
                    key={cal.id}
                    style={[styles.calendarRow, i < calendars.length - 1 && styles.calendarRowBorder]}
                    onPress={() => router.push(`/calendar/${cal.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.calIcon, { backgroundColor: color + '15' }]}>
                      <Ionicons
                        name={isShared ? 'people' : 'calendar'}
                        size={20}
                        color={color}
                      />
                    </View>
                    <View style={styles.calInfo}>
                      <Text style={styles.calName}>{cal.name}</Text>
                      <View style={styles.calMeta}>
                        {isShared && (
                          <View style={styles.calBadge}>
                            <Ionicons name="people-outline" size={11} color="#3498db" />
                            <Text style={styles.calBadgeText}>{cal.members.length}人</Text>
                          </View>
                        )}
                        {isOwner && (
                          <View style={[styles.calBadge, { backgroundColor: '#2ecc7115' }]}>
                            <Text style={[styles.calBadgeText, { color: '#2ecc71' }]}>オーナー</Text>
                          </View>
                        )}
                        {!isOwner && (
                          <View style={[styles.calBadge, { backgroundColor: '#95a5a615' }]}>
                            <Text style={[styles.calBadgeText, { color: '#95a5a6' }]}>メンバー</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
                  </TouchableOpacity>
                );
              })
            )}
          </Card>
        </Animated.View>

        {/* アクション */}
        <Animated.View entering={FadeInDown.delay(60).duration(300).springify()}>
          <Card>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => router.push('/calendar/new')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3498db15' }]}>
                <Ionicons name="add-circle" size={22} color="#3498db" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>カレンダーを作成</Text>
                <Text style={styles.actionDesc}>新しいカレンダーを作成します</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => router.push('/calendar/join')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#2ecc7115' }]}>
                <Ionicons name="enter-outline" size={22} color="#2ecc71" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>カレンダーに参加</Text>
                <Text style={styles.actionDesc}>共有リンクやQRコードで参加</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
            </TouchableOpacity>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#95a5a6',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyText: {
    fontSize: 15,
    color: '#95a5a6',
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 12,
    color: '#b0b8c8',
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  calendarRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f2f5',
  },
  calIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calInfo: {
    flex: 1,
  },
  calName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
  },
  calMeta: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  calBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#3498db10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  calBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3498db',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#f0f2f5',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  actionDesc: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
});
