import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { ShiftList } from '../../src/components/shift/ShiftList';
import { useEvents } from '../../src/hooks/useEvents';
import { useShiftSummary } from '../../src/hooks/useShiftSummary';
import { useUIStore } from '../../src/stores/uiStore';
import { useAuthStore } from '../../src/stores/authStore';
import { addMonths, subMonths, formatDisplayMonth } from '../../src/utils/dateHelpers';
import { deleteEvent } from '../../src/services/eventService';
import { CalendarEvent } from '../../src/types';

const JOB_SITES = [
  { name: 'タウンワーク', icon: '📋', color: '#e74c3c', tag: '定番', url: process.env.EXPO_PUBLIC_AFF_TOWNWORK || 'https://townwork.net/' },
  { name: 'バイトル', icon: '💼', color: '#3498db', tag: '動画あり', url: process.env.EXPO_PUBLIC_AFF_BAITORU || 'https://www.baitoru.com/' },
  { name: 'マッハバイト', icon: '⚡', color: '#f39c12', tag: '祝い金', url: process.env.EXPO_PUBLIC_AFF_MACH || 'https://j-sen.jp/' },
  { name: 'シフトワークス', icon: '🕐', color: '#2ecc71', tag: 'シフト重視', url: process.env.EXPO_PUBLIC_AFF_SHIFTWORKS || 'https://sw.shiftworks.jp/' },
  { name: 'タイミー', icon: '⏰', color: '#9b59b6', tag: 'スキマ時間', url: process.env.EXPO_PUBLIC_AFF_TIMEE || 'https://timee.co.jp/' },
  { name: 'マイナビバイト', icon: '📱', color: '#1abc9c', tag: '大学生向け', url: process.env.EXPO_PUBLIC_AFF_MYNAVI || 'https://baito.mynavi.jp/' },
];

export default function ShiftsScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const currentMonth = useUIStore((s) => s.currentMonth);
  const setCurrentMonth = useUIStore((s) => s.setCurrentMonth);
  const nightShift = useAuthStore((s) => s.settings.nightShift);
  const { events } = useEvents(uid, currentMonth);

  const shiftEvents = events.filter((e) => e.type === 'shift');
  const { totalHours, totalPay } = useShiftSummary(events);

  const shiftCount = shiftEvents.length;
  const avgPayPerShift = shiftCount > 0 ? Math.round(totalPay / shiftCount) : 0;
  const avgHoursPerShift = shiftCount > 0 ? Math.round((totalHours / shiftCount) * 10) / 10 : 0;

  // 曜日別の勤務回数
  const dayStats = useMemo(() => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const counts = new Array(7).fill(0);
    for (const s of shiftEvents) {
      const d = new Date(s.date);
      counts[d.getDay()]++;
    }
    const max = Math.max(...counts, 1);
    return days.map((label, i) => ({ label, count: counts[i], ratio: counts[i] / max }));
  }, [shiftEvents]);

  const handleDeleteShift = async (shift: CalendarEvent) => {
    await deleteEvent(shift.calendarId, shift.id);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 月切替 */}
      <Animated.View entering={FadeInDown.duration(300).springify()}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color="#3498db" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{formatDisplayMonth(currentMonth)}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color="#3498db" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* メインサマリー */}
      <Animated.View entering={FadeInDown.delay(60).duration(300).springify()}>
        <Card>
          <View style={styles.mainSummary}>
            <View style={styles.paySection}>
              <Text style={styles.payLabel}>見込み給料</Text>
              <Text style={styles.payAmount}>¥{totalPay.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color="#3498db" />
              <Text style={styles.statValue}>{totalHours}h</Text>
              <Text style={styles.statLabel}>勤務時間</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={16} color="#e67e22" />
              <Text style={styles.statValue}>{shiftCount}回</Text>
              <Text style={styles.statLabel}>出勤日数</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="trending-up-outline" size={16} color="#2ecc71" />
              <Text style={styles.statValue}>{avgHoursPerShift}h</Text>
              <Text style={styles.statLabel}>平均/回</Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* 曜日別 */}
      {shiftCount > 0 && (
        <Animated.View entering={FadeInDown.delay(120).duration(300).springify()}>
          <Card>
            <Text style={styles.sectionTitle}>曜日別の出勤</Text>
            <View style={styles.dayChart}>
              {dayStats.map((d, i) => (
                <View key={i} style={styles.dayChartItem}>
                  <View style={styles.dayBarContainer}>
                    <View style={[
                      styles.dayBar,
                      { height: `${d.ratio * 100}%` },
                      i === 0 && { backgroundColor: '#e74c3c55' },
                      i === 6 && { backgroundColor: '#3498db55' },
                    ]} />
                  </View>
                  <Text style={[
                    styles.dayLabel,
                    i === 0 && { color: '#e74c3c' },
                    i === 6 && { color: '#3498db' },
                  ]}>{d.label}</Text>
                  <Text style={styles.dayCount}>{d.count}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>
      )}

      {/* シフト一覧 */}
      <Animated.View entering={FadeInDown.delay(180).duration(300).springify()}>
        <Card>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>シフト一覧</Text>
            <TouchableOpacity onPress={() => router.push(`/event/new?date=${new Date().toISOString().split('T')[0]}&type=shift`)}>
              <Ionicons name="add-circle" size={24} color="#2ecc71" />
            </TouchableOpacity>
          </View>
          <ShiftList shifts={shiftEvents} nightShift={nightShift} onDelete={handleDeleteShift} />
        </Card>
      </Animated.View>

      {/* 空の場合のヒント */}
      {shiftCount === 0 && (
        <Animated.View entering={FadeInDown.delay(240).duration(300).springify()}>
          <View style={styles.emptyHint}>
            <Ionicons name="wallet-outline" size={40} color="#d5d8dc" />
            <Text style={styles.emptyText}>今月のシフトはまだありません</Text>
            <Text style={styles.emptySubText}>予定追加でタイプ「バイト」を選んで登録できます</Text>
          </View>
        </Animated.View>
      )}

      {/* バイト求人リンク */}
      <Animated.View entering={FadeInDown.delay(300).duration(300).springify()}>
        <Card>
          <View style={styles.jobHeader}>
            <Ionicons name="briefcase-outline" size={18} color="#e67e22" />
            <Text style={styles.sectionTitle}>バイトを探す</Text>
          </View>
          <Text style={styles.jobDesc}>掛け持ちや新しいバイト探しに</Text>
          <View style={styles.jobGrid}>
            {JOB_SITES.map((site) => (
              <TouchableOpacity
                key={site.name}
                style={[styles.jobCard, { borderColor: site.color + '30' }]}
                onPress={() => Linking.openURL(site.url)}
                activeOpacity={0.7}
              >
                <View style={[styles.jobIcon, { backgroundColor: site.color + '12' }]}>
                  <Text style={styles.jobIconText}>{site.icon}</Text>
                </View>
                <Text style={styles.jobName}>{site.name}</Text>
                <Text style={styles.jobTag}>{site.tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  // Main summary
  mainSummary: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  paySection: {
    alignItems: 'center',
  },
  payLabel: {
    fontSize: 13,
    color: '#95a5a6',
    fontWeight: '600',
  },
  payAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2ecc71',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0f2f5',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#f0f2f5',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 11,
    color: '#95a5a6',
    fontWeight: '600',
  },
  // Section
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Day chart
  dayChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
  },
  dayChartItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  dayBarContainer: {
    width: 20,
    height: 50,
    justifyContent: 'flex-end',
  },
  dayBar: {
    width: '100%',
    backgroundColor: '#2ecc7155',
    borderRadius: 4,
    minHeight: 2,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  dayCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2c3e50',
  },
  // Empty
  emptyHint: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
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
  // Job sites
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  jobDesc: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 12,
    marginLeft: 26,
  },
  jobGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  jobCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fafbfc',
  },
  jobIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  jobIconText: {
    fontSize: 18,
  },
  jobName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  },
  jobTag: {
    fontSize: 9,
    fontWeight: '600',
    color: '#95a5a6',
    marginTop: 2,
  },
});
