import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { useSubscribedExams } from '../../src/hooks/useExamSchedules';
import {
  ExamCategory,
  EXAM_CATEGORY_LABELS,
  EXAM_MASTERS,
} from '../../src/types/exam';
import {
  addExamSubscription,
  removeExamSubscription,
} from '../../src/services/examService';

const CATEGORIES: ExamCategory[] = ['language', 'it', 'business', 'law', 'civil_service'];

export default function ExamListScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const subs = useSubscribedExams();

  const handleToggle = async (examKey: string, category: ExamCategory, isSubscribed: boolean) => {
    if (!uid) return;
    if (isSubscribed) {
      await removeExamSubscription(uid, examKey);
    } else {
      await addExamSubscription(uid, examKey, category);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>資格試験カレンダー</Text>
      <Text style={styles.description}>
        興味のある資格をONにすると、試験日・申込締切がカレンダーに表示されます
      </Text>

      {CATEGORIES.map((category) => {
        const exams = EXAM_MASTERS.filter((e) => e.category === category);
        return (
          <Card key={category}>
            <Text style={styles.categoryTitle}>
              {EXAM_CATEGORY_LABELS[category]}
            </Text>
            {exams.map((exam) => {
              const isSubscribed = subs.exams.includes(exam.key);
              return (
                <View key={exam.key} style={styles.examRow}>
                  <Text style={styles.examName}>{exam.name}</Text>
                  <Switch
                    value={isSubscribed}
                    onValueChange={() =>
                      handleToggle(exam.key, exam.category, isSubscribed)
                    }
                  />
                </View>
              );
            })}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingVertical: 12,
    paddingBottom: 40,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  examRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ecf0f1',
  },
  examName: {
    fontSize: 15,
    color: '#34495e',
  },
});
