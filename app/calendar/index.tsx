import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCalendars } from '../../src/hooks/useCalendars';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

export default function CalendarListScreen() {
  const router = useRouter();
  const { calendars } = useCalendars();

  return (
    <View style={styles.container}>
      <FlatList
        data={calendars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/calendar/${item.id}`)}>
            <Card>
              <Text style={styles.calName}>{item.name}</Text>
              <Text style={styles.calMembers}>
                {item.members.length}人のメンバー
              </Text>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>カレンダーがありません</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
      <View style={styles.actions}>
        <Button
          title="カレンダーを作成"
          onPress={() => router.push('/calendar/new')}
        />
        <Button
          title="カレンダーに参加"
          variant="secondary"
          onPress={() => router.push('/calendar/join')}
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  calName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  calMembers: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#95a5a6',
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
});
