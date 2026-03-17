import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { subscribeToTasks, updateTaskStatus } from '../../src/services/taskService';
import {
  Task,
  TaskStatus,
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from '../../src/types';
import { TaskListSkeleton } from '../../src/components/ui/Skeleton';
import { SwipeableRow } from '../../src/components/ui/SwipeableRow';
import { deleteTask } from '../../src/services/taskService';
import { toast } from '../../src/components/ui/Toast';
import { celebrate } from '../../src/components/ui/CelebrationOverlay';
import * as Haptics from 'expo-haptics';

type FilterStatus = 'all' | TaskStatus;

export default function TasksScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToTasks(uid, (t) => {
      setTasks(t);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  // Todoist風グルーピング
  const groupTasks = (taskList: Task[]) => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const threeDaysLater = new Date(todayEnd.getTime() + 3 * 24 * 60 * 60 * 1000);

    const groups: { title: string; color: string; tasks: Task[] }[] = [
      { title: '期限超過', color: '#e74c3c', tasks: [] },
      { title: '今日', color: '#e67e22', tasks: [] },
      { title: '近日中（3日以内）', color: '#f39c12', tasks: [] },
      { title: 'それ以降', color: '#7f8c8d', tasks: [] },
    ];

    for (const task of taskList) {
      const d = task.deadline?.toDate?.() || new Date(task.deadline);
      if (d.getTime() < now.getTime()) {
        groups[0].tasks.push(task);
      } else if (d.getTime() <= todayEnd.getTime()) {
        groups[1].tasks.push(task);
      } else if (d.getTime() <= threeDaysLater.getTime()) {
        groups[2].tasks.push(task);
      } else {
        groups[3].tasks.push(task);
      }
    }

    return groups.filter((g) => g.tasks.length > 0);
  };

  const taskGroups = groupTasks(filteredTasks);

  const handleStatusToggle = async (task: Task) => {
    if (!uid) return;
    const nextStatus: TaskStatus =
      task.status === 'todo'
        ? 'in_progress'
        : task.status === 'in_progress'
          ? 'done'
          : 'todo';
    await updateTaskStatus(uid, task.id, nextStatus);
    if (nextStatus === 'done') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      celebrate();
      toast.success('課題を完了しました！');
    }
  };

  const getDeadlineText = (deadline: any) => {
    const d = deadline?.toDate?.() || new Date(deadline);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (diff < 0) return '期限切れ';
    if (days > 0) return `あと${days}日`;
    if (hours > 0) return `あと${hours}時間`;
    return 'まもなく';
  };

  const getDeadlineColor = (deadline: any) => {
    const d = deadline?.toDate?.() || new Date(deadline);
    const diff = d.getTime() - new Date().getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 0) return '#e74c3c';
    if (hours < 24) return '#e67e22';
    if (hours < 72) return '#f39c12';
    return '#7f8c8d';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TaskListSkeleton count={4} />
      </View>
    );
  }

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'todo', label: '未着手' },
    { key: 'in_progress', label: '進行中' },
    { key: 'done', label: '完了' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[styles.filterText, filter === f.key && styles.filterTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredTasks.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              {filter === 'all' ? '課題がありません' : `${filters.find((f) => f.key === filter)?.label}の課題はありません`}
            </Text>
          </Card>
        ) : (
          taskGroups.map((group) => (
            <View key={group.title}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupDot, { backgroundColor: group.color }]} />
                <Text style={[styles.groupTitle, { color: group.color }]}>
                  {group.title}
                </Text>
                <Text style={styles.groupCount}>{group.tasks.length}</Text>
              </View>
              {group.tasks.map((task) => (
                <SwipeableRow
                  key={task.id}
                  leftAction={
                    task.status !== 'done'
                      ? {
                          label: '完了',
                          color: '#2ecc71',
                          onPress: () => {
                            if (uid) {
                              updateTaskStatus(uid, task.id, 'done');
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              celebrate();
                              toast.success('課題を完了しました！');
                            }
                          },
                        }
                      : undefined
                  }
                  rightAction={{
                    label: '削除',
                    color: '#e74c3c',
                    onPress: () => {
                      if (uid) {
                        deleteTask(uid, task.id).then(() =>
                          toast.success('課題を削除しました')
                        );
                      }
                    },
                  }}
                >
                  <Card>
                    <TouchableOpacity
                      onPress={() => router.push(`/task/${task.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.taskHeader}>
                        <View style={styles.taskTitleRow}>
                          <TouchableOpacity
                            onPress={() => handleStatusToggle(task)}
                            style={[
                              styles.statusDot,
                              { backgroundColor: TASK_STATUS_COLORS[task.status] },
                            ]}
                          />
                          <Text
                            style={[
                              styles.taskTitle,
                              task.status === 'done' && styles.taskTitleDone,
                            ]}
                          >
                            {task.title}
                          </Text>
                        </View>
                        <Text style={styles.taskType}>
                          {TASK_TYPE_LABELS[task.type]}
                        </Text>
                      </View>

                      <View style={styles.taskMeta}>
                        <Text style={styles.subjectLabel}>{task.subject}</Text>
                        <Text
                          style={[
                            styles.deadlineText,
                            { color: getDeadlineColor(task.deadline) },
                          ]}
                        >
                          {getDeadlineText(task.deadline)}
                        </Text>
                      </View>

                      <Text style={styles.statusLabel}>
                        {TASK_STATUS_LABELS[task.status]}
                      </Text>
                    </TouchableOpacity>
                  </Card>
                </SwipeableRow>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.fab}>
        <Button title="+ 課題を追加" onPress={() => router.push('/task/new')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterChipActive: {
    backgroundColor: '#3498db',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#95a5a6',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingVertical: 24,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
  taskType: {
    fontSize: 12,
    color: '#7f8c8d',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectLabel: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '600',
  },
  deadlineText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 12,
    color: '#95a5a6',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
});
