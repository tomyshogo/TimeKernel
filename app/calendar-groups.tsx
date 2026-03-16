import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { useAuthStore } from '../src/stores/authStore';
import {
  subscribeToGroups,
  createGroup,
  deleteGroup,
  archiveCalendar,
  unarchiveCalendar,
  getAllCalendarSettings,
} from '../src/services/calendarGroupService';
import { CalendarGroup, CalendarSettings } from '../src/types';
import { useCalendars } from '../src/hooks/useCalendars';

export default function CalendarGroupsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const { calendars } = useCalendars();
  const [groups, setGroups] = useState<CalendarGroup[]>([]);
  const [settings, setSettings] = useState<CalendarSettings[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToGroups(uid, setGroups);
    getAllCalendarSettings(uid).then(setSettings);
    return unsub;
  }, [uid]);

  const handleAddGroup = async () => {
    if (!uid || !newGroupName.trim()) return;
    await createGroup(uid, {
      name: newGroupName.trim(),
      order: groups.length,
      calendarIds: [],
    });
    setNewGroupName('');
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!uid) return;
    Alert.alert('フォルダ削除', 'このフォルダを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => deleteGroup(uid, groupId) },
    ]);
  };

  const handleArchive = async (calendarId: string) => {
    if (!uid) return;
    await archiveCalendar(uid, calendarId);
    setSettings(await getAllCalendarSettings(uid));
  };

  const handleUnarchive = async (calendarId: string) => {
    if (!uid) return;
    await unarchiveCalendar(uid, calendarId);
    setSettings(await getAllCalendarSettings(uid));
  };

  const isArchived = (calendarId: string) =>
    settings.find((s) => s.calendarId === calendarId)?.archived || false;

  const filteredCalendars = searchQuery
    ? calendars.filter((c) => c.name.includes(searchQuery))
    : calendars;

  const activeCalendars = filteredCalendars.filter((c) => !isArchived(c.id));
  const archivedCalendars = filteredCalendars.filter((c) => isArchived(c.id));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 検索 */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="カレンダーを検索"
          placeholderTextColor="#bdc3c7"
        />
      </View>

      {/* フォルダ一覧 */}
      <Card>
        <Text style={styles.sectionTitle}>フォルダ</Text>
        {groups.map((g) => (
          <View key={g.id} style={styles.groupRow}>
            <Text style={styles.groupName}>{g.name}</Text>
            <Text style={styles.groupCount}>{g.calendarIds.length}件</Text>
            <TouchableOpacity onPress={() => handleDeleteGroup(g.id)}>
              <Text style={styles.deleteText}>削除</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addGroupRow}>
          <TextInput
            style={styles.groupInput}
            value={newGroupName}
            onChangeText={setNewGroupName}
            placeholder="新しいフォルダ名"
          />
          <Button title="追加" onPress={handleAddGroup} />
        </View>
      </Card>

      {/* アクティブカレンダー */}
      <Card>
        <Text style={styles.sectionTitle}>カレンダー</Text>
        {activeCalendars.map((cal) => (
          <View key={cal.id} style={styles.calendarRow}>
            <View style={[styles.colorDot, { backgroundColor: '#3498db' }]} />
            <Text style={styles.calendarName}>{cal.name}</Text>
            <TouchableOpacity onPress={() => handleArchive(cal.id)}>
              <Text style={styles.archiveText}>アーカイブ</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      {/* アーカイブ済み */}
      {archivedCalendars.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>アーカイブ済み</Text>
          {archivedCalendars.map((cal) => (
            <View key={cal.id} style={styles.calendarRow}>
              <View style={[styles.colorDot, { backgroundColor: '#bdc3c7' }]} />
              <Text style={[styles.calendarName, { color: '#95a5a6' }]}>{cal.name}</Text>
              <TouchableOpacity onPress={() => handleUnarchive(cal.id)}>
                <Text style={styles.restoreText}>復元</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  searchBar: { paddingHorizontal: 16, paddingVertical: 8 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  groupName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  groupCount: { fontSize: 13, color: '#95a5a6', marginRight: 12 },
  deleteText: { fontSize: 13, color: '#e74c3c', fontWeight: '600' },
  addGroupRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  groupInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  calendarName: { flex: 1, fontSize: 15, color: '#2c3e50' },
  archiveText: { fontSize: 13, color: '#f39c12', fontWeight: '600' },
  restoreText: { fontSize: 13, color: '#3498db', fontWeight: '600' },
});
