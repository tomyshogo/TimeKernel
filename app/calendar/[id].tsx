import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { MemberList } from '../../src/components/share/MemberList';
import { useAuthStore } from '../../src/stores/authStore';
import {
  getCalendar,
  deleteCalendar,
  leaveCalendar,
  removeMember,
} from '../../src/services/calendarService';
import { getOrCreateUser } from '../../src/services/userService';
import { Calendar } from '../../src/types';

export default function CalendarDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useAuthStore((s) => s.uid);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [calendar, setCalendar] = useState<Calendar | null>(null);

  useEffect(() => {
    if (id) {
      getCalendar(id).then(setCalendar);
    }
  }, [id]);

  if (!calendar || !uid) return null;

  const isCreator = calendar.createdBy === uid;

  const handleDelete = () => {
    Alert.alert('確認', 'このカレンダーを削除しますか？', [
      { text: 'キャンセル' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deleteCalendar(id!, uid);
          const { profile: updatedProfile } = await getOrCreateUser(uid);
          setProfile(updatedProfile);
          router.back();
        },
      },
    ]);
  };

  const handleLeave = () => {
    Alert.alert('確認', 'このカレンダーから脱退しますか？', [
      { text: 'キャンセル' },
      {
        text: '脱退',
        style: 'destructive',
        onPress: async () => {
          await leaveCalendar(id!, uid);
          const { profile: updatedProfile } = await getOrCreateUser(uid);
          setProfile(updatedProfile);
          router.back();
        },
      },
    ]);
  };

  const handleRemoveMember = (memberUid: string) => {
    Alert.alert('確認', 'このメンバーを削除しますか？', [
      { text: 'キャンセル' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await removeMember(id!, memberUid, uid);
          const updated = await getCalendar(id!);
          setCalendar(updated);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{calendar.name}</Text>
      <Text style={styles.sectionTitle}>メンバー</Text>
      <MemberList
        memberUids={calendar.members}
        creatorUid={calendar.createdBy}
        currentUid={uid}
        onRemoveMember={isCreator ? handleRemoveMember : undefined}
      />
      <View style={styles.actions}>
        <Button
          title="共有"
          onPress={() => router.push(`/share/${id}`)}
        />
        {isCreator ? (
          <Button
            title="カレンダーを削除"
            variant="danger"
            onPress={handleDelete}
            style={{ marginTop: 8 }}
          />
        ) : (
          <Button
            title="カレンダーから脱退"
            variant="danger"
            onPress={handleLeave}
            style={{ marginTop: 8 }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  actions: {
    marginTop: 24,
  },
});
