import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimetableGrid } from '../../src/components/timetable/TimetableGrid';
import { ColorPicker } from '../../src/components/ui/ColorPicker';
import { Button } from '../../src/components/ui/Button';
import { useTimetables } from '../../src/hooks/useTimetables';
import { useAuthStore } from '../../src/stores/authStore';
import {
  createTimetable,
  updateSlot,
  updateTimetable,
} from '../../src/services/timetableService';
import { DayOfWeek, TimetableSlot } from '../../src/types';

const PORTAL_STORAGE_KEY = 'university_portal_links';

interface PortalLink {
  id: string;
  name: string;
  url: string;
}

export default function TimetableScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const periods = useAuthStore((s) => s.settings.periods);
  const { timetables, isLoading } = useTimetables();
  const [portalLinks, setPortalLinks] = useState<PortalLink[]>([]);

  // 画面がフォーカスされるたびにポータルリンクを読み込み
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PORTAL_STORAGE_KEY).then((val) => {
        setPortalLinks(val ? JSON.parse(val) : []);
      });
    }, [])
  );
  const [editingSlot, setEditingSlot] = useState<{
    timetableId: string;
    key: string;
    slot: TimetableSlot;
  } | null>(null);
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState('#3498db');

  const handleCreateTimetable = async () => {
    if (!uid) return;
    await createTimetable(uid, {
      calendarId: null,
      isPublic: false,
      slots: {},
    });
  };

  const handleSlotPress = (
    timetableId: string,
    dayOfWeek: DayOfWeek,
    period: number
  ) => {
    const tt = timetables.find((t) => t.id === timetableId);
    if (!tt) return;
    const key = `${dayOfWeek}_${period}`;
    const existing = tt.slots[key];
    if (existing) {
      setSubject(existing.subject);
      setRoom(existing.room);
      setColor(existing.color);
    } else {
      setSubject('');
      setRoom('');
      setColor('#3498db');
    }
    setEditingSlot({ timetableId, key, slot: existing || { subject: '', room: '', color: '#3498db' } });
  };

  const handleSaveSlot = async () => {
    if (!uid || !editingSlot) return;
    if (!subject.trim()) {
      await updateSlot(uid, editingSlot.timetableId, editingSlot.key, null);
    } else {
      await updateSlot(uid, editingSlot.timetableId, editingSlot.key, {
        subject: subject.trim(),
        room: room.trim(),
        color,
      });
    }
    setEditingSlot(null);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  if (editingSlot) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.editContent}>
        <Text style={styles.editTitle}>科目を編集</Text>
        <Text style={styles.label}>科目名</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="経済学入門"
        />
        <Text style={styles.label}>教室</Text>
        <TextInput
          style={styles.input}
          value={room}
          onChangeText={setRoom}
          placeholder="A棟301"
        />
        <Text style={styles.label}>カラー</Text>
        <ColorPicker selectedColor={color} onSelect={setColor} />
        <View style={styles.editActions}>
          <Button title="保存" onPress={handleSaveSlot} />
          <Button
            title="キャンセル"
            variant="secondary"
            onPress={() => setEditingSlot(null)}
            style={{ marginTop: 8 }}
          />
          {subject.trim() && (
            <Button
              title="この科目を削除"
              variant="danger"
              onPress={() => {
                Alert.alert('確認', 'この科目を削除しますか？', [
                  { text: 'キャンセル' },
                  {
                    text: '削除',
                    style: 'destructive',
                    onPress: async () => {
                      if (!uid) return;
                      await updateSlot(uid, editingSlot.timetableId, editingSlot.key, null);
                      setEditingSlot(null);
                    },
                  },
                ]);
              }}
              style={{ marginTop: 8 }}
            />
          )}
        </View>
      </ScrollView>
    );
  }

  const PORTAL_ICONS: Record<string, string> = {
    'manaba': 'book-outline',
    'Google Classroom': 'logo-google',
    'Microsoft Teams': 'chatbubbles-outline',
    'Moodle': 'school-outline',
    'Universal Passport': 'globe-outline',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {timetables.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="grid-outline" size={48} color="#d5d8dc" />
          <Text style={styles.emptyText}>時間割がありません</Text>
          <Button
            title="時間割を作成"
            onPress={handleCreateTimetable}
            style={{ marginTop: 16 }}
          />
        </View>
      ) : (
        timetables.map((tt) => (
          <View key={tt.id} style={styles.timetableSection}>
            <TimetableGrid
              periods={periods}
              slots={tt.slots}
              onSlotPress={(day, period) =>
                handleSlotPress(tt.id, day, period)
              }
            />
          </View>
        ))
      )}

      {/* 大学ポータルリンク */}
      <Animated.View entering={FadeInDown.delay(100).duration(300).springify()}>
        <View style={styles.portalSection}>
          <View style={styles.portalHeader}>
            <Ionicons name="school" size={18} color="#8e44ad" />
            <Text style={styles.portalTitle}>大学ポータル</Text>
            <TouchableOpacity
              onPress={() => router.push('/settings/portal')}
              hitSlop={8}
              style={styles.portalSettingsBtn}
            >
              <Ionicons name="settings-outline" size={16} color="#95a5a6" />
            </TouchableOpacity>
          </View>

          {portalLinks.length > 0 ? (
            <View style={styles.portalGrid}>
              {portalLinks.map((link) => {
                const iconName = PORTAL_ICONS[link.name] || 'open-outline';
                return (
                  <TouchableOpacity
                    key={link.id}
                    style={styles.portalCard}
                    onPress={() => Linking.openURL(link.url)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.portalIconCircle}>
                      <Ionicons name={iconName as any} size={20} color="#8e44ad" />
                    </View>
                    <Text style={styles.portalName} numberOfLines={1}>{link.name}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.portalCard, styles.portalAddCard]}
                onPress={() => router.push('/settings/portal')}
                activeOpacity={0.7}
              >
                <View style={[styles.portalIconCircle, { backgroundColor: '#f0f2f5' }]}>
                  <Ionicons name="add" size={20} color="#95a5a6" />
                </View>
                <Text style={[styles.portalName, { color: '#95a5a6' }]}>追加</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.portalEmpty}
              onPress={() => router.push('/settings/portal')}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={24} color="#8e44ad" />
              <Text style={styles.portalEmptyText}>大学のポータルサイトを登録</Text>
              <Text style={styles.portalEmptySubText}>manaba, Google Classroom など</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
  },
  timetableSection: {
    padding: 8,
  },
  editContent: {
    padding: 16,
    paddingBottom: 40,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  editActions: {
    marginTop: 24,
  },
  // Portal
  portalSection: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  portalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  portalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  portalSettingsBtn: {
    padding: 4,
  },
  portalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portalCard: {
    alignItems: 'center',
    width: 72,
    gap: 6,
  },
  portalAddCard: {
    opacity: 0.6,
  },
  portalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#8e44ad10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  portalEmpty: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8e44ad15',
    borderStyle: 'dashed',
  },
  portalEmptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e44ad',
  },
  portalEmptySubText: {
    fontSize: 11,
    color: '#95a5a6',
  },
});
